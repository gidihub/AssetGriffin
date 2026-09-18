/** Per-user requests-per-minute cap on GriffinEye endpoints (independent of monthly credits). */

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

export const GRIFFINEYE_RATE_LIMIT_RPM = parsePositiveInt(process.env.GRIFFINEYE_RATE_LIMIT_RPM, 20)
const WINDOW_MS = 60_000

type Bucket = { timestamps: number[] }

const buckets = new Map<string, Bucket>()

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterMs: number }

/**
 * In-process sliding window limiter keyed by authenticated user id.
 * Fails open if the store throws — documented in docs/ai-security-notes.md.
 */
export function checkGriffinEyeRateLimit(userId: string): RateLimitResult {
  try {
    const now = Date.now()
    const bucket = buckets.get(userId) ?? { timestamps: [] }
    bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < WINDOW_MS)

    if (bucket.timestamps.length >= GRIFFINEYE_RATE_LIMIT_RPM) {
      const oldest = bucket.timestamps[0] ?? now
      return { allowed: false, retryAfterMs: Math.max(1_000, WINDOW_MS - (now - oldest)) }
    }

    bucket.timestamps.push(now)
    buckets.set(userId, bucket)
    return { allowed: true, remaining: GRIFFINEYE_RATE_LIMIT_RPM - bucket.timestamps.length }
  } catch {
    return { allowed: true, remaining: GRIFFINEYE_RATE_LIMIT_RPM }
  }
}
