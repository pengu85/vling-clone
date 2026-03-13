"use client"

import { Lock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/authStore"
import type { PlanTier } from "@/types"

// ─── 플랜 순위 (낮을수록 상위 플랜) ─────────────────────────────────────────

const PLAN_RANK: Record<PlanTier, number> = {
  basic: 0,
  standard: 1,
  startup: 2,
  professional: 3,
  enterprise: 4,
}

const PLAN_DISPLAY_NAME: Record<PlanTier, string> = {
  basic: "Basic",
  standard: "Standard",
  startup: "Startup",
  professional: "Professional",
  enterprise: "Enterprise",
}

function hasSufficientPlan(userPlan: PlanTier, requiredPlan: PlanTier): boolean {
  return PLAN_RANK[userPlan] >= PLAN_RANK[requiredPlan]
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PlanGateProps {
  requiredPlan: PlanTier
  feature: string
  children: React.ReactNode
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

export function PlanGate({ requiredPlan, feature, children }: PlanGateProps) {
  const user = useAuthStore((s) => s.user)
  const userPlan: PlanTier = user?.plan ?? "basic"

  // 충분한 플랜을 가진 경우 그대로 렌더링
  if (hasSufficientPlan(userPlan, requiredPlan)) {
    return <>{children}</>
  }

  const planName = PLAN_DISPLAY_NAME[requiredPlan]

  return (
    <div className="relative">
      {/* 원본 콘텐츠 (블러 처리) */}
      <div className="pointer-events-none select-none blur-sm" aria-hidden>
        {children}
      </div>

      {/* 잠금 오버레이 */}
      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-900/80 backdrop-blur-[2px]">
        <div className="flex flex-col items-center gap-3 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600/20 ring-1 ring-violet-500/30">
            <Lock className="h-5 w-5 text-violet-400" />
          </div>

          <div>
            <p className="text-sm font-semibold text-white">
              {feature} 잠금됨
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              이 기능은{" "}
              <span className="font-medium text-violet-300">{planName}</span>{" "}
              이상에서 사용 가능합니다
            </p>
          </div>

          <Button
            className="h-8 bg-violet-600 hover:bg-violet-500 text-white border-none px-4 text-xs"
            render={<Link href="/pricing" />}
          >
            플랜 업그레이드
          </Button>
        </div>
      </div>
    </div>
  )
}
