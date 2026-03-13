import Link from "next/link"
import { ArrowRight, HelpCircle } from "lucide-react"
import { PricingCards } from "@/components/pricing/PricingCards"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FaqSection } from "@/components/pricing/FaqSection"

export const metadata = {
  title: "요금제 | 블링",
  description: "블링의 다양한 요금제를 비교하고 나에게 맞는 플랜을 선택하세요.",
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0a0e2a]">
      {/* ── 히어로 ── */}
      <section className="relative overflow-hidden pt-16 pb-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-violet-700/20 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Badge className="mb-4 bg-violet-600/20 text-violet-300 border-violet-500/30">
            요금제
          </Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            성장에 맞는 플랜을 선택하세요
          </h1>
          <p className="mx-auto max-w-xl text-lg text-slate-400">
            무료로 시작해 비즈니스가 커지면 업그레이드하세요. 언제든지 플랜을
            변경하거나 취소할 수 있습니다.
          </p>
        </div>
      </section>

      {/* ── 요금 카드 ── */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-screen-xl">
          <PricingCards />
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-slate-800 bg-slate-900/50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <div className="mb-3 flex justify-center">
              <HelpCircle className="h-8 w-8 text-violet-400" />
            </div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              자주 묻는 질문
            </h2>
            <p className="mt-2 text-slate-400">
              궁금한 점이 있으면 언제든지 문의해주세요.
            </p>
          </div>
          <FaqSection />
        </div>
      </section>

      {/* ── 엔터프라이즈 CTA ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-10 text-center">
          <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
            엔터프라이즈 플랜이 필요하신가요?
          </h2>
          <p className="mb-6 text-slate-400">
            대규모 팀, 커스텀 계약, 전담 매니저가 필요하다면 영업팀에 문의해주세요.
          </p>
          <Link
            href="/enterprise"
            className="inline-flex items-center justify-center rounded-md bg-white text-slate-900 hover:bg-slate-100 gap-2 px-6 h-10 text-sm font-medium transition-colors"
          >
            엔터프라이즈 문의
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
