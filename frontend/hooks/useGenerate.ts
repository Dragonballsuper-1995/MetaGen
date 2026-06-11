"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { submitGeneration, pollStatus } from "@/lib/api";
import { POLL_INTERVAL } from "@/lib/constants";
import type { GenerationStatus, MetadataResult } from "@/lib/types";

interface UseGenerateOptions {
  onPollUnavailable?: (text: string, reason: string) => void;
}

export function useGenerate(options: UseGenerateOptions = {}) {
  const { onPollUnavailable } = options;
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [result, setResult] = useState<MetadataResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setStatus("idle");
    setResult(null);
    setError(null);
    setGenerationTime(null);
  }, [cleanup]);

  const generate = useCallback(
    async (text: string) => {
      cleanup();
      setStatus("loading");
      setResult(null);
      setError(null);
      setGenerationTime(null);
      startRef.current = Date.now();

      try {
        const { task_id } = await submitGeneration(text);

        intervalRef.current = setInterval(async () => {
          try {
            const resp = await pollStatus(task_id);

            if (resp.status === "Completed" && resp.result) {
              cleanup();
              setResult(resp.result);
              setStatus("completed");
              setGenerationTime((Date.now() - startRef.current) / 1000);
            } else if (resp.status === "Failed") {
              cleanup();
              setError(resp.error || "Generation failed");
              setStatus("error");
            }
          } catch (err) {
            cleanup();
            setError(err instanceof Error ? err.message : "Polling failed");
            setStatus("error");
          }
        }, POLL_INTERVAL);
      } catch (err) {
        if (err instanceof Error) {
          const msg = err.message;
          const isPollUnavailable =
            msg.includes("Poll mode unavailable") || msg.includes("HTTP 503");

          if (isPollUnavailable) {
            cleanup();
            setStatus("idle");
            setError(null);
            onPollUnavailable?.(text, msg);
            return;
          }
        }

        if (err instanceof TypeError) {
          setError(
            "Cannot reach backend. For Poll mode, ensure API, Redis, and Celery worker are running, or switch to Stream mode.",
          );
        } else {
          setError(err instanceof Error ? err.message : "Failed to submit");
        }
        setStatus("error");
      }
    },
    [cleanup, onPollUnavailable],
  );

  const restore = useCallback((historyItem: any) => {
    cleanup();
    setStatus("completed");
    setResult({
      title: historyItem.title,
      description: historyItem.description,
      tags: historyItem.tags,
    });
    setError(null);
    setGenerationTime(null);
  }, [cleanup]);

  return { generate, reset, restore, status, result, error, generationTime };
}
