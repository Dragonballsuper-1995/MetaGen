export const MIN_SCRIPT_LENGTH = 20;
export const MAX_SCRIPT_LENGTH = 3000;
export const POLL_INTERVAL = 1500; // ms

let _resolvedApiUrl: string | null = null;

async function probe(url: string): Promise<boolean> {
  try {
    const res = await fetch(new URL('/health', url).toString(), { method: 'GET' });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function resolveApiUrl(): Promise<string> {
  if (_resolvedApiUrl) return _resolvedApiUrl;

  const candidates: string[] = [];
  if (process.env.NEXT_PUBLIC_API_URL) candidates.push(process.env.NEXT_PUBLIC_API_URL);
  // Common local fallbacks
  candidates.push('http://localhost:8000');
  candidates.push('http://127.0.0.1:8000');
  // Docker Desktop host alias (Windows/Mac)
  candidates.push('http://host.docker.internal:8000');

  for (const c of candidates) {
    try {
      const ok = await probe(c);
      if (ok) {
        _resolvedApiUrl = c;
        return c;
      }
    } catch (e) {
      // ignore and try next
    }
  }

  _resolvedApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return _resolvedApiUrl;
}

// Synchronous fallback used at build-time/runtime when async resolution isn't awaited
export const API_URL_FALLBACK = process.env.NEXT_PUBLIC_API_URL || 'https://sujalchhajed925-metagen.hf.space';
