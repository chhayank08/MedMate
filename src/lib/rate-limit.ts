/**
 * Lightweight in-memory sliding-window rate limiter for AI routes.
 *
 * Good enough for a single serverless instance / local dev. For production on
 * Vercel with multiple instances, swap the Map for Upstash Redis
 * (@upstash/ratelimit) — the call sites only depend on `rateLimit()`'s shape.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  { limit = 20, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {},
): RateLimitResult {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    const resetAt = now + windowMs;
    bucket = { count: 1, resetAt };
    buckets.set(key, bucket);
    return { success: true, remaining: limit - 1, resetAt };
  }

  bucket.count += 1;
  const success = bucket.count <= limit;
  return {
    success,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

// Opportunistically drop stale buckets so the Map doesn't grow unbounded.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, b] of buckets) if (b.resetAt < now) buckets.delete(key);
  }, 5 * 60_000).unref?.();
}
