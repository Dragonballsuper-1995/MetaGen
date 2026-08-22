"use client";

import { useState, useCallback, useRef } from "react";
import { API_URL_FALLBACK, resolveApiUrl } from "@/lib/constants";
import { getHeaders } from "@/lib/api";
import type { GenerationStatus, HistoryItem, MetadataResult, ModelChoice } from "@/lib/types";
import { parseJsonDataLineBuffer } from "@/lib/sse";

const FIRST_STREAM_ACTIVITY_TIMEOUT_MS = 45_000;
const FIRST_STREAM_ACTIVITY_RETRY_COUNT = 1;
const DEFAULT_STREAM_TARGET_TOKENS = 220;
const STREAM_TARGET_MIN_TOKENS = 120;
const STREAM_TARGET_MAX_TOKENS = 720;

export function useStreamGenerate() {
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [result, setResult] = useState<MetadataResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [tokens, setTokens] = useState("");
  const [streamProgress, setStreamProgress] = useState(0);
  const [streamTargetTokens, setStreamTargetTokens] = useState(DEFAULT_STREAM_TARGET_TOKENS);
  const [streamProgressPercent, setStreamProgressPercent] = useState(0);
  const [streamCompletedTokens, setStreamCompletedTokens] = useState(0);
  const [earlyTags, setEarlyTags] = useState<string[] | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const startRef = useRef(0);

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStatus("idle");
    setResult(null);
    setError(null);
    setGenerationTime(null);
    setTokens("");
    setStreamProgress(0);
    setStreamTargetTokens(DEFAULT_STREAM_TARGET_TOKENS);
    setStreamProgressPercent(0);
    setStreamCompletedTokens(0);
    setEarlyTags(null);
  }, []);

  const generate = useCallback(
    async (text: string, model: ModelChoice = "auto") => {
      // Reset active abort controller and state
      if (abortRef.current) abortRef.current.abort();
      setStatus("streaming");
      setResult(null);
      setError(null);
      setGenerationTime(null);
      setTokens("");
      setStreamProgress(0);
      setStreamTargetTokens(DEFAULT_STREAM_TARGET_TOKENS);
      setStreamProgressPercent(0);
      setStreamCompletedTokens(0);
      setEarlyTags(null);
      startRef.current = Date.now();

      try {
        const headers = getHeaders();
        const base = await resolveApiUrl().catch(() => API_URL_FALLBACK);

        for (let attempt = 0; attempt <= FIRST_STREAM_ACTIVITY_RETRY_COUNT; attempt += 1) {
          const attemptController = new AbortController();
          abortRef.current = attemptController;

          let sawFirstActivity = false;
          let streamActivityTimedOut = false;
          let observedProgress = 0;
          let observedTarget = DEFAULT_STREAM_TARGET_TOKENS;

          const timeoutTimer = setTimeout(() => {
            if (!sawFirstActivity) {
              streamActivityTimedOut = true;
              attemptController.abort();
            }
          }, FIRST_STREAM_ACTIVITY_TIMEOUT_MS);

          try {
            const response = await fetch(`${base}/api/generate/stream`, {
              method: "POST",
              headers,
              body: JSON.stringify({ text, model }),
              signal: attemptController.signal,
            });

            if (!response.ok) {
              clearTimeout(timeoutTimer);
              const data = await response.json().catch(() => ({}));
              throw new Error(data.detail || `HTTP ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
              clearTimeout(timeoutTimer);
              throw new Error("No response stream body received from backend.");
            }

            const decoder = new TextDecoder("utf-8");
            let buffer = "";
            let completed = false;

            while (true) {
              const { value, done } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;

              const { events, remainder } = parseJsonDataLineBuffer(buffer);
              buffer = remainder;

              for (const event of events) {
                if (!sawFirstActivity) {
                  sawFirstActivity = true;
                  clearTimeout(timeoutTimer);
                }

                switch (event.type) {
                  case "tags":
                    setEarlyTags(event.data);
                    break;
                  case "token":
                    observedProgress += 1;
                    observedTarget = Math.max(
                      observedTarget,
                      Math.max(
                        STREAM_TARGET_MIN_TOKENS,
                        Math.min(STREAM_TARGET_MAX_TOKENS, Math.round(observedProgress * 1.25)),
                      ),
                    );

                    setTokens((prevTokens) => prevTokens + event.data);
                    setStreamProgress(observedProgress);
                    setStreamTargetTokens(observedTarget);
                    setStreamProgressPercent((prevPercent) => {
                      const nextPercent = Math.min(99.5, (observedProgress / observedTarget) * 100);
                      return Math.max(prevPercent, nextPercent);
                    });
                    break;
                  case "done":
                    completed = true;
                    setStreamCompletedTokens(observedProgress);
                    setStreamTargetTokens((prevTarget) => Math.max(prevTarget, observedTarget));
                    setStreamProgressPercent(100);
                    setResult(event.data as MetadataResult);
                    setStatus("completed");
                    setGenerationTime((Date.now() - startRef.current) / 1000);
                    break;
                  case "error":
                    throw new Error(event.message || "Stream failed");
                }
              }
            }

            clearTimeout(timeoutTimer);

            if (completed) {
              return;
            }

            throw new Error("Stream ended before completion signal.");
          } catch (attemptErr) {
            clearTimeout(timeoutTimer);
            if (attemptErr instanceof Error && attemptErr.name === "AbortError") {
              if (!streamActivityTimedOut) {
                return;
              }

              if (attempt < FIRST_STREAM_ACTIVITY_RETRY_COUNT) {
                setTokens("");
                setStreamProgress(0);
                setStreamTargetTokens(DEFAULT_STREAM_TARGET_TOKENS);
                setStreamProgressPercent(0);
                setStreamCompletedTokens(0);
                setEarlyTags(null);
                continue;
              }

              throw new Error(
                `Backend stream activity timed out after ${FIRST_STREAM_ACTIVITY_TIMEOUT_MS / 1000}s (model may still be warming up).`,
              );
            }

            throw attemptErr;
          } finally {
            if (abortRef.current === attemptController) {
              abortRef.current = null;
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (err instanceof TypeError) {
          setError(
            `Backend is offline. Ensure API server is running on ${API_URL_FALLBACK} and try again.`,
          );
        } else {
          setError(err instanceof Error ? err.message : "Stream failed");
        }
        setStatus("error");
      }
    },
    [],
  );

  const restore = useCallback((historyItem: HistoryItem) => {
    if (abortRef.current) abortRef.current.abort();
    setStatus("completed");
    setResult({
      title: historyItem.title,
      description: historyItem.description,
      tags: historyItem.tags,
      seo_score: historyItem.seo_score,
      seo_breakdown: historyItem.seo_breakdown,
      model: historyItem.model,
      telemetry: historyItem.latency ? { latency_s: historyItem.latency } : undefined,
    });
    setError(null);
    setGenerationTime(null);
    setTokens("");
    setStreamProgress(0);
    setStreamTargetTokens(DEFAULT_STREAM_TARGET_TOKENS);
    setStreamProgressPercent(100);
    setStreamCompletedTokens(0);
    setEarlyTags(null);
  }, []);

  return {
    generate,
    reset,
    restore,
    status,
    result,
    error,
    generationTime,
    tokens,
    streamProgress,
    streamTargetTokens,
    streamProgressPercent,
    streamCompletedTokens,
    earlyTags,
  };
}