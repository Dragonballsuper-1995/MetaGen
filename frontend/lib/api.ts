import { resolveApiUrl, API_URL_FALLBACK } from "./constants";
import type {
  TaskResponse,
  StatusResponse,
  DepsHealthResponse,
  WarmupHealthResponse,
  TitleVariantsResponse,
  ModelChoice,
} from "./types";

export function getHeaders(): Record<string, string> {
  // IMPORTANT: Do NOT read secret API keys from client-side env variables.
  // Keys prefixed with NEXT_PUBLIC_ are bundled into the client and exposed.
  // API authentication must be applied server-side (proxy or SSR).
  return { "Content-Type": "application/json" };
}

/** POST /api/generate — submit script for background processing. */
export async function submitGeneration(text: string, model: ModelChoice = "auto"): Promise<TaskResponse> {
  const base = (await resolveApiUrl().catch(() => API_URL_FALLBACK));
  const res = await fetch(`${base}/api/generate`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ text, model }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

/** GET /api/status/:id — poll for task result. */
export async function pollStatus(taskId: string): Promise<StatusResponse> {
  const base = (await resolveApiUrl().catch(() => API_URL_FALLBACK));
  const res = await fetch(`${base}/api/status/${taskId}`);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

/** GET /health/deps — check poll mode dependency readiness. */
export async function getDepsHealth(): Promise<DepsHealthResponse> {
  const base = (await resolveApiUrl().catch(() => API_URL_FALLBACK));
  const res = await fetch(`${base}/health/deps`);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

/** GET /health/warmup — check model warmup readiness for stream endpoints. */
export async function getWarmupHealth(): Promise<WarmupHealthResponse> {
  const base = (await resolveApiUrl().catch(() => API_URL_FALLBACK));
  const res = await fetch(`${base}/health/warmup`);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

/** POST /api/title-variants — generate model-based alternative titles for A/B tests. */
export async function getTitleVariants(
  text: string,
  baseTitle: string,
  count = 2,
  model: ModelChoice = "auto",
): Promise<string[]> {
  const base = (await resolveApiUrl().catch(() => API_URL_FALLBACK));
  const res = await fetch(`${base}/api/title-variants`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ text, base_title: baseTitle, count, model }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `HTTP ${res.status}`);
  }

  const data = (await res.json()) as TitleVariantsResponse;
  return Array.isArray(data.titles) ? data.titles : [];
}
