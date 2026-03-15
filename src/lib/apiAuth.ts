import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { PLAN_LIMITS } from "@/domain/planLimits"
import type { PlanTier } from "@/types"

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

// Cleanup stale entries every 5 minutes.
// Intentional for long-lived server processes — the interval is never cleared.
// Guard against duplicate intervals during hot reload.
if (!(globalThis as Record<string, unknown>).__rateLimitCleanupInterval) {
  (globalThis as Record<string, unknown>).__rateLimitCleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

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

type PlanFeature = "dailySearch" | "aiFinder" | "aiContent" | "channelCompare" | "campaignProposal" | "favorites" | "audienceAnalysis"

/**
 * Check if the user's plan allows access to a numeric-limited feature.
 * Returns null if allowed, or a 403 NextResponse if the limit is 0.
 */
export function checkPlanAccess(
  plan: PlanTier | undefined,
  feature: PlanFeature
): NextResponse | null {
  const tier = plan ?? "basic"
  const limits = PLAN_LIMITS[tier]
  const limit = limits[feature]

  if (typeof limit === "number" && limit <= 0) {
    return NextResponse.json(
      { error: `이 기능은 ${tier} 플랜에서 사용할 수 없습니다. 업그레이드가 필요합니다.` },
      { status: 403 }
    )
  }

  return null
}

/**
 * Check if the user's plan allows access to a boolean-gated feature.
 * Returns null if allowed, or a 403 NextResponse if disabled.
 */
export function checkBooleanAccess(
  plan: PlanTier | undefined,
  feature: "dataDownload" | "adPrice" | "apiAccess"
): NextResponse | null {
  const tier = plan ?? "basic"
  const limits = PLAN_LIMITS[tier]

  if (!limits[feature]) {
    return NextResponse.json(
      { error: `이 기능은 ${tier} 플랜에서 사용할 수 없습니다. 업그레이드가 필요합니다.` },
      { status: 403 }
    )
  }

  return null
}

/**
 * Extract client IP from request headers (works with Vercel, Cloudflare, etc.)
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const ip = forwarded.split(",")[0].trim()
    // Validate basic IPv4 or IPv6 format; fall back to "unknown" if invalid.
    if (/^[\d.]+$/.test(ip) || /^[0-9a-fA-F:]+$/.test(ip)) return ip
  }
  const real = request.headers.get("x-real-ip")
  if (real) return real
  return "unknown"
}
