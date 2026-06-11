"use client";

import { useEffect, useRef, useState } from "react";
import { getDepsHealth, getWarmupHealth } from "@/lib/api";
import type { GenerationMode, WarmupHealthResponse } from "@/lib/types";

const WARMUP_FALLBACK: WarmupHealthResponse = {
  status: "unknown",
  ready: false,
  last_attempt_utc: null,
  completed_at_utc: null,
  warmup_duration_s: null,
  error: "Warmup status unavailable",
};

export function useWarmupAndDepsHealth(mode: GenerationMode) {
  const [pollReady, setPollReady] = useState<boolean | null>(null);
  const [warmupHealth, setWarmupHealth] = useState<WarmupHealthResponse | null>(null);
  const [warmupDetailsOpen, setWarmupDetailsOpen] = useState(false);
  const warmupBadgeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;

    const checkWarmupSafe = async () => {
      try {
        const warmupResult = await getWarmupHealth();
        if (!active) {
          return;
        }
        setWarmupHealth(warmupResult);
      } catch {
        if (!active) {
          return;
        }
        setWarmupHealth(WARMUP_FALLBACK);
      }
    };

    void checkWarmupSafe();
    const timer = window.setInterval(checkWarmupSafe, 10000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const checkDepsSafe = async () => {
      try {
        const depsResult = await getDepsHealth();
        if (!active) {
          return;
        }
        setPollReady(depsResult.poll_ready);
      } catch {
        if (!active) {
          return;
        }
        setPollReady(false);
      }
    };

    void checkDepsSafe();

    if (mode !== "poll") {
      return () => {
        active = false;
      };
    }

    const timer = window.setInterval(checkDepsSafe, 10000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [mode]);

  useEffect(() => {
    if (!warmupDetailsOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!warmupBadgeRef.current) {
        return;
      }
      if (warmupBadgeRef.current.contains(event.target as Node)) {
        return;
      }
      setWarmupDetailsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setWarmupDetailsOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [warmupDetailsOpen]);

  const warmupBadge = (() => {
    if (!warmupHealth) {
      return {
        text: "Model status checking",
        tone: "border-slate-400/40 bg-slate-500/10 text-slate-200",
        title: "Checking model warmup state",
      };
    }

    if (warmupHealth.ready || warmupHealth.status === "ready") {
      const durationText =
        typeof warmupHealth.warmup_duration_s === "number"
          ? ` (${warmupHealth.warmup_duration_s.toFixed(1)}s)`
          : "";

      return {
        text: `Model warm${durationText}`,
        tone: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
        title: "Model is warmed and ready",
      };
    }

    if (warmupHealth.status === "warming") {
      return {
        text: "Model warming",
        tone: "border-amber-300/40 bg-amber-500/15 text-amber-100",
        title: "Model warmup in progress; first response may be slower",
      };
    }

    if (warmupHealth.status === "error") {
      return {
        text: "Model warmup issue",
        tone: "border-rose-300/45 bg-rose-500/20 text-rose-100",
        title: warmupHealth.error || "Model warmup reported an error",
      };
    }

    return {
      text: "Model status unknown",
      tone: "border-slate-300/35 bg-slate-500/10 text-slate-100",
      title: "Model warmup status is currently unknown",
    };
  })();

  const lastAttemptText = warmupHealth?.last_attempt_utc ?? "n/a";
  const lastCompletedText = warmupHealth?.completed_at_utc ?? "n/a";
  const lastDurationText =
    typeof warmupHealth?.warmup_duration_s === "number"
      ? `${warmupHealth.warmup_duration_s.toFixed(1)}s`
      : "n/a";

  return {
    pollReady,
    warmupHealth,
    warmupBadge,
    warmupDetailsOpen,
    setWarmupDetailsOpen,
    warmupBadgeRef,
    lastAttemptText,
    lastCompletedText,
    lastDurationText,
  };
}
