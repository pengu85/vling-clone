"use client"

import { useState } from "react"
import { Check, X, Sparkles, Crown, Building2, Zap, Star } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { PLAN_LIMITS } from "@/domain/planLimits"
import type { PlanTier } from "@/types"

// ─── 플랜 메타데이터 ──────────────────────────────────────────────────────────

interface PlanMeta {
  tier: PlanTier
  name: string
  monthlyPrice: number | null
  description: string
  icon: React.ElementType
  iconColor: string
  features: Array<{ label: string; value: string | boolean | number }>
  cta: string
  highlighted: boolean
}

function formatLimit(value: number | boolean): string {
  if (typeof value === "boolean") return value ? "포함" : "미포함"
  if (value === Infinity) return "무제한"
  if (value === 0) return "-"
  return `${value.toLocaleString()}`
}

const PLAN_META: PlanMeta[] = [
  {
    tier: "basic",
    name: "Basic",
    monthlyPrice: 0,
    description: "개인 유튜버나 가볍게 탐색하는 분들을 위한 무료 플랜",
    icon: Star,
    iconColor: "text-slate-400",
    features: [
      { label: "일일 검색", value: PLAN_LIMITS.basic.dailySearch },
      { label: "랭킹 노출", value: PLAN_LIMITS.basic.rankingVisible },
      { label: "시청자 분석", value: PLAN_LIMITS.basic.audienceAnalysis },
      { label: "채널 비교", value: PLAN_LIMITS.basic.channelCompare },
      { label: "AI 파인더", value: PLAN_LIMITS.basic.aiFinder },
      { label: "AI 콘텐츠", value: PLAN_LIMITS.basic.aiContent },
      { label: "캠페인 제안", value: PLAN_LIMITS.basic.campaignProposal },
      { label: "즐겨찾기", value: PLAN_LIMITS.basic.favorites },
      { label: "데이터 다운로드", value: PLAN_LIMITS.basic.dataDownload },
      { label: "광고 단가", value: PLAN_LIMITS.basic.adPrice },
      { label: "API 접근", value: PLAN_LIMITS.basic.apiAccess },
    ],
    cta: "무료로 시작",
    highlighted: false,
  },
  {
    tier: "standard",
    name: "Standard",
    monthlyPrice: 29000,
    description: "본격적인 채널 분석과 캠페인 운영을 위한 스탠다드 플랜",
    icon: Zap,
    iconColor: "text-blue-400",
    features: [
      { label: "일일 검색", value: PLAN_LIMITS.standard.dailySearch },
      { label: "랭킹 노출", value: PLAN_LIMITS.standard.rankingVisible },
      { label: "시청자 분석", value: PLAN_LIMITS.standard.audienceAnalysis },
      { label: "채널 비교", value: PLAN_LIMITS.standard.channelCompare },
      { label: "AI 파인더", value: PLAN_LIMITS.standard.aiFinder },
      { label: "AI 콘텐츠", value: PLAN_LIMITS.standard.aiContent },
      { label: "캠페인 제안", value: PLAN_LIMITS.standard.campaignProposal },
      { label: "즐겨찾기", value: PLAN_LIMITS.standard.favorites },
      { label: "데이터 다운로드", value: PLAN_LIMITS.standard.dataDownload },
      { label: "광고 단가", value: PLAN_LIMITS.standard.adPrice },
      { label: "API 접근", value: PLAN_LIMITS.standard.apiAccess },
    ],
    cta: "Standard 시작",
    highlighted: false,
  },
  {
    tier: "startup",
    name: "Startup",
    monthlyPrice: 79000,
    description: "빠르게 성장 중인 스타트업과 소규모 마케팅팀을 위한 추천 플랜",
    icon: Sparkles,
    iconColor: "text-violet-400",
    features: [
      { label: "일일 검색", value: PLAN_LIMITS.startup.dailySearch },
      { label: "랭킹 노출", value: PLAN_LIMITS.startup.rankingVisible },
      { label: "시청자 분석", value: PLAN_LIMITS.startup.audienceAnalysis },
      { label: "채널 비교", value: PLAN_LIMITS.startup.channelCompare },
      { label: "AI 파인더", value: PLAN_LIMITS.startup.aiFinder },
      { label: "AI 콘텐츠", value: PLAN_LIMITS.startup.aiContent },
      { label: "캠페인 제안", value: PLAN_LIMITS.startup.campaignProposal },
      { label: "즐겨찾기", value: PLAN_LIMITS.startup.favorites },
      { label: "데이터 다운로드", value: PLAN_LIMITS.startup.dataDownload },
      { label: "광고 단가", value: PLAN_LIMITS.startup.adPrice },
      { label: "API 접근", value: PLAN_LIMITS.startup.apiAccess },
    ],
    cta: "Startup 시작",
    highlighted: true,
  },
  {
    tier: "professional",
    name: "Professional",
    monthlyPrice: 199000,
    description: "대규모 캠페인과 AI 기능이 필요한 전문 마케터를 위한 플랜",
    icon: Crown,
    iconColor: "text-amber-400",
    features: [
      { label: "일일 검색", value: PLAN_LIMITS.professional.dailySearch },
      { label: "랭킹 노출", value: PLAN_LIMITS.professional.rankingVisible },
      { label: "시청자 분석", value: PLAN_LIMITS.professional.audienceAnalysis },
      { label: "채널 비교", value: PLAN_LIMITS.professional.channelCompare },
      { label: "AI 파인더", value: PLAN_LIMITS.professional.aiFinder },
      { label: "AI 콘텐츠", value: PLAN_LIMITS.professional.aiContent },
      { label: "캠페인 제안", value: PLAN_LIMITS.professional.campaignProposal },
      { label: "즐겨찾기", value: PLAN_LIMITS.professional.favorites },
      { label: "데이터 다운로드", value: PLAN_LIMITS.professional.dataDownload },
      { label: "광고 단가", value: PLAN_LIMITS.professional.adPrice },
      { label: "API 접근", value: PLAN_LIMITS.professional.apiAccess },
    ],
    cta: "Professional 시작",
    highlighted: false,
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    monthlyPrice: null,
    description: "대기업과 MCN을 위한 커스텀 플랜. 전담 매니저와 맞춤 설정",
    icon: Building2,
    iconColor: "text-emerald-400",
    features: [
      { label: "일일 검색", value: PLAN_LIMITS.enterprise.dailySearch },
      { label: "랭킹 노출", value: PLAN_LIMITS.enterprise.rankingVisible },
      { label: "시청자 분석", value: PLAN_LIMITS.enterprise.audienceAnalysis },
      { label: "채널 비교", value: PLAN_LIMITS.enterprise.channelCompare },
      { label: "AI 파인더", value: PLAN_LIMITS.enterprise.aiFinder },
      { label: "AI 콘텐츠", value: PLAN_LIMITS.enterprise.aiContent },
      { label: "캠페인 제안", value: PLAN_LIMITS.enterprise.campaignProposal },
      { label: "즐겨찾기", value: PLAN_LIMITS.enterprise.favorites },
      { label: "데이터 다운로드", value: PLAN_LIMITS.enterprise.dataDownload },
      { label: "광고 단가", value: PLAN_LIMITS.enterprise.adPrice },
      { label: "API 접근", value: PLAN_LIMITS.enterprise.apiAccess },
    ],
    cta: "영업팀 문의",
    highlighted: false,
  },
]

// ─── 가격 포맷 ────────────────────────────────────────────────────────────────

function formatPrice(price: number | null, yearly: boolean): string {
  if (price === null) return "별도 문의"
  if (price === 0) return "무료"
  const discounted = yearly ? Math.round(price * 0.8) : price
  return `₩${discounted.toLocaleString()}`
}

// ─── 피처 행 ─────────────────────────────────────────────────────────────────

function FeatureRow({
  label,
  value,
}: {
  label: string
  value: string | boolean | number
}) {
  const isBoolean = typeof value === "boolean"
  const formatted =
    typeof value === "number"
      ? formatLimit(value)
      : typeof value === "boolean"
        ? formatLimit(value)
        : value
  const isZeroText = formatted === "-"

  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-slate-400">{label}</span>
      {isBoolean ? (
        value ? (
          <Check className="h-4 w-4 text-violet-400" />
        ) : (
          <X className="h-4 w-4 text-slate-600" />
        )
      ) : (
        <span
          className={
            isZeroText
              ? "text-slate-600"
              : "font-medium text-slate-200"
          }
        >
          {formatted}
        </span>
      )}
    </div>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export function PricingCards() {
  const [yearly, setYearly] = useState(false)

  return (
    <div>
      {/* 월간/연간 토글 */}
      <div className="mb-10 flex items-center justify-center gap-3">
        <span
          className={`text-sm font-medium ${!yearly ? "text-white" : "text-slate-400"}`}
        >
          월간
        </span>
        <button
          type="button"
          onClick={() => setYearly((v) => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
            yearly ? "bg-violet-600" : "bg-slate-700"
          }`}
          aria-pressed={yearly}
          aria-label="연간 결제 토글"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              yearly ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span
          className={`text-sm font-medium ${yearly ? "text-white" : "text-slate-400"}`}
        >
          연간
        </span>
        {yearly && (
          <Badge className="bg-violet-600/20 text-violet-300 border-violet-500/30 text-xs">
            20% 할인
          </Badge>
        )}
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {PLAN_META.map((plan) => {
          const Icon = plan.icon
          return (
            <Card
              key={plan.tier}
              className={`relative flex flex-col bg-slate-900 text-white ${
                plan.highlighted
                  ? "border-2 border-violet-500 shadow-lg shadow-violet-500/20"
                  : "border border-slate-800"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-violet-600 text-white border-none px-3 py-0.5 text-xs font-semibold shadow-sm">
                    추천
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-0">
                <div className="mb-3 flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${plan.iconColor}`} />
                  <span className="text-base font-semibold text-white">
                    {plan.name}
                  </span>
                </div>

                {/* 가격 */}
                <div className="mb-2">
                  <span className="text-2xl font-bold text-white">
                    {formatPrice(plan.monthlyPrice, yearly)}
                  </span>
                  {plan.monthlyPrice !== null && plan.monthlyPrice > 0 && (
                    <span className="ml-1 text-sm text-slate-400">/월</span>
                  )}
                </div>

                {/* 연간 절감 안내 */}
                {yearly && plan.monthlyPrice !== null && plan.monthlyPrice > 0 && (
                  <p className="text-xs text-slate-500">
                    연간 ₩{(Math.round(plan.monthlyPrice * 0.8) * 12).toLocaleString()} 청구
                  </p>
                )}

                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  {plan.description}
                </p>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col pt-4">
                {/* CTA 버튼 */}
                <Link
                  href={plan.tier === "enterprise" ? "/enterprise" : "/signup"}
                  className={`mb-5 flex w-full items-center justify-center rounded-md h-9 px-4 text-sm font-medium transition-colors ${
                    plan.highlighted
                      ? "bg-violet-600 hover:bg-violet-500 text-white"
                      : "bg-slate-700 hover:bg-slate-600 text-white"
                  }`}
                >
                  {plan.cta}
                </Link>

                {/* 피처 목록 */}
                <div className="flex-1 divide-y divide-slate-800">
                  {plan.features.map((f) => (
                    <FeatureRow
                      key={f.label}
                      label={f.label}
                      value={f.value}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
