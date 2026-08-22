import { resolveApiUrl } from "./constants";
import { getHeaders } from "./api";
import { TelemetryData } from "./types";

export async function fetchLiveTelemetry(): Promise<TelemetryData | null> {
  try {
    const base = await resolveApiUrl();
    const res = await fetch(`${base}/api/diagnostics/inference`, {
      headers: getHeaders(),
      cache: "no-store", // Don't cache this request so it's always the latest
    });
    
    if (!res.ok) return null;
    const data = await res.json();
    
    // Extract stream_last
    const streamLast = data.stream_last;
    if (!streamLast || !streamLast.timings_s || !streamLast.stream_observations) {
      return null;
    }
    
    const total_s = streamLast.timings_s.total_s;
    const first_token_s = streamLast.stream_observations.first_token_s;
    const token_chunks = streamLast.stream_observations.token_chunks || 0;
    
    const tps = total_s > 0 ? token_chunks / total_s : 0;
    
    return {
      latency_s: total_s,
      ttft_s: first_token_s,
      tokens_per_second: tps
    };
  } catch (err) {
    console.error("Failed to fetch live telemetry on load", err);
    return null;
  }
}
