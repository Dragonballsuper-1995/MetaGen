export const MIN_SCRIPT_LENGTH = 20;
export const MAX_SCRIPT_LENGTH = 3000;
export const POLL_INTERVAL = 1500; // ms

let _resolvedApiUrl: string | null = null;

async function probe(url: string, timeoutMs: number = 8000): Promise<boolean> {
  // Prevent browser mixed-content errors if running on HTTPS
  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    url.startsWith("http://")
  ) {
    return false;
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(new URL("/health", url).toString(), {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) return true;
    } catch {
      if (attempt === 0 && url.includes("hf.space")) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      return false;
    }
  }
  return false;
}

export async function resolveApiUrl(): Promise<string> {
  if (_resolvedApiUrl) return _resolvedApiUrl;

  const isLocalEnv =
    process.env.NODE_ENV === "development" ||
    (typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"));

  const candidates: string[] = [];
  if (process.env.NEXT_PUBLIC_API_URL) candidates.push(process.env.NEXT_PUBLIC_API_URL);

  if (isLocalEnv) {
    candidates.push("http://localhost:8000");
    candidates.push("http://127.0.0.1:8000");
    candidates.push("http://host.docker.internal:8000");
  }

  // Always include primary production cloud backend
  candidates.push("https://sujalchhajed925-metagen.hf.space");

  for (const c of candidates) {
    try {
      const ok = await probe(c);
      if (ok) {
        _resolvedApiUrl = c;
        return c;
      }
    } catch {
      // try next candidate
    }
  }

  _resolvedApiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    (isLocalEnv ? "http://localhost:8000" : "https://sujalchhajed925-metagen.hf.space");
  return _resolvedApiUrl;
}

// Synchronous fallback used at build-time/runtime when async resolution isn't awaited
export const API_URL_FALLBACK =
  process.env.NEXT_PUBLIC_API_URL || "https://sujalchhajed925-metagen.hf.space";

