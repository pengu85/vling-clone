import { NextResponse } from "next/server"
import { auth } from "@/auth"

/**
 * Check if the current request has an authenticated session.
 * Returns the session if valid, or a 401 NextResponse.
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      ),
    }
  }
  return { authorized: true as const, session }
}

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter (per IP, sliding window)
// For production, use Upstash Rate Limit or similar.
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

interface RateLimitOptions {
  /** Max requests per window */
  limit?: number
  /** Window size in seconds */
  windowSeconds?: number
}

/**
 * Check rate limit for a given identifier (typically IP address).
 * Returns null if within limit, or a 429 NextResponse if exceeded.
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): NextResponse | null {
  const { limit = 60, windowSeconds = 60 } = options
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  const entry = rateLimitStore.get(identifier)

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + windowMs })
    return null
  }

  entry.count++

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    )
  }

  return null
}

/**
 * Extract client IP from request headers (works with Vercel, Cloudflare, etc.)
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  const real = request.headers.get("x-real-ip")
  if (real) return real
  return "unknown"
}
