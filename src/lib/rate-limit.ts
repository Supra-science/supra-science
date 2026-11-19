/**
 * Simple in-memory rate limiter.
 * For production scale, replace with Upstash Redis or similar.
 */

const store = new Map<string, number[]>();

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
}

export function isRateLimited(
  key: string,
  options: RateLimitOptions = {}
): boolean {
  const windowMs = options.windowMs ?? 60_000;
  const max = options.max ?? 10;
  const now = Date.now();
  const hits = (store.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) return true;
  hits.push(now);
  store.set(key, hits);
  if (store.size > 10_000) store.clear();
  return false;
}

/** Test-only: reset the limiter state. */
export function resetRateLimiter(): void {
  store.clear();
}
