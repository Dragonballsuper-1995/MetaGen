"use client";

import { useCallback } from "react";
import {
  parseJsonDataLineBuffer,
  parseNamedSSEBuffer,
  type ParseResult,
} from "@/lib/sse";

interface ConsumeStreamOptions<TEvent> {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  parseBuffer: (buffer: string) => ParseResult<TEvent>;
  onEvent: (event: TEvent) => void;
  firstActivityTimeoutMs?: number;
  onFirstActivityTimeout?: () => void;
}

export function useStreamParser() {
  const consumeStream = useCallback(async <TEvent>({
    reader,
    parseBuffer,
    onEvent,
    firstActivityTimeoutMs,
    onFirstActivityTimeout,
  }: ConsumeStreamOptions<TEvent>) => {
    const decoder = new TextDecoder();
    let buffer = "";
    let sawFirstActivity = false;
    let activityTimer: ReturnType<typeof setTimeout> | null = null;

    if (firstActivityTimeoutMs && onFirstActivityTimeout) {
      activityTimer = setTimeout(() => {
        if (!sawFirstActivity) {
          onFirstActivityTimeout();
        }
      }, firstActivityTimeoutMs);
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const parsed = parseBuffer(buffer);
        buffer = parsed.remainder;

        if (!sawFirstActivity && parsed.events.length > 0) {
          sawFirstActivity = true;
          if (activityTimer) {
            clearTimeout(activityTimer);
            activityTimer = null;
          }
        }

        for (const event of parsed.events) {
          onEvent(event);
        }
      }
    } finally {
      if (activityTimer) {
        clearTimeout(activityTimer);
      }
    }
  }, []);

  return {
    consumeStream,
    parseJsonDataLineBuffer,
    parseNamedSSEBuffer,
  };
}
