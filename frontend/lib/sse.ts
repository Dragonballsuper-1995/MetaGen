import type { StreamEvent } from "@/lib/types";

export interface NamedSSEEvent {
  event: string;
  data: string;
}

export interface ParseResult<TEvent> {
  events: TEvent[];
  remainder: string;
}

export function parseJsonDataLineBuffer(buffer: string): ParseResult<StreamEvent> {
  const events: StreamEvent[] = [];
  const lines = buffer.split("\n");
  const remainder = lines.pop() || "";

  for (const line of lines) {
    if (!line.startsWith("data: ")) {
      continue;
    }

    const jsonStr = line.slice(6).trim();
    if (!jsonStr) {
      continue;
    }

    try {
      events.push(JSON.parse(jsonStr) as StreamEvent);
    } catch {
      // Skip malformed JSON lines and keep consuming the stream.
    }
  }

  return { events, remainder };
}

export function parseNamedSSEBuffer(buffer: string): ParseResult<NamedSSEEvent> {
  const events: NamedSSEEvent[] = [];
  const blocks = buffer.split("\n\n");
  const remainder = blocks.pop() || "";

  for (const block of blocks) {
    const lines = block.split("\n");
    let event = "";
    let data = "";

    for (const line of lines) {
      if (line.startsWith("event:")) {
        event = line.replace("event:", "").trim();
      } else if (line.startsWith("data:")) {
        data = line.replace("data:", "").trim();
      }
    }

    if (event && data) {
      events.push({ event, data });
    }
  }

  return { events, remainder };
}

export function encodeSSE(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  event: string,
  data: unknown,
): void {
  const payload = `event:${event}\ndata:${JSON.stringify(data)}\n\n`;
  controller.enqueue(encoder.encode(payload));
}
