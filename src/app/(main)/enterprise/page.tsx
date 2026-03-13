import Link from "next/link"
import {
  Building2,
  Shield,
  Headphones,
  BarChart3,
  Check,
  X,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EnterpriseContactForm } from "@/components/enterprise/EnterpriseContactForm"

export const metadata = {
  title: "엔터프라이즈 | 블링",
  description: "대기업과 MCN을 위한 블링 엔터프라이즈 플랜. 맞춤 계약과 전담 지원을 받아보세요.",
}

const ENTERPRISE_BENEFITS = [
  {
    icon: Building2,
    title: "무제한 팀 계정",
    description: "조직 규모에 맞게 제한 없이 팀원을 추가하세요.",
  },
  {
    icon: BarChart3,
    title: "고급 API 접근",
    description: "블링 데이터를 직접 내부 시스템에 연동할 수 있는 전용 API",
  },
  {
    icon: Shield,
    title: "SLA 보장",
    description: "99.9% 업타임 SLA와 전용 인프라로 안정적인 서비스를 보장합니다.",
  },
  {
    icon: Headphones,
    title: "전담 매니저",
    description: "전담 성공 매니저가 온보딩부터 운영까지 함께합니다.",
  },
]

const COMPARISON_FEATURES: Array<{
  feature: string
  professional: string | boolean
  enterprise: string | boolean
}> = [
  { feature: "일일 검색", professional: "무제한", enterprise: "무제한" },
  { feature: "시청자 분석", professional: "무제한", enterprise: "무제한" },
  { feature: "채널 비교", professional: "5개", enterprise: "10개" },
  { feature: "AI 파인더", professional: "월 50회", enterprise: "무제한" },
  { feature: "AI 콘텐츠", professional: "월 20회", enterprise: "무제한" },
  { feature: "캠페인 제안", professional: "월 500회", enterprise: "무제한" },
  { feature: "즐겨찾기", professional: "500개", enterprise: "무제한" },
  { feature: "데이터 다운로드", professional: true, enterprise: true },
  { feature: "광고 단가", professional: true, enterprise: true },
  { feature: "API 접근", professional: false, enterprise: true },
  { feature: "팀 계정", professional: false, enterprise: true },
  { feature: "SLA 99.9%", professional: false, enterprise: true },
  { feature: "전담 매니저", professional: false, enterprise: true },
  { feature: "맞춤 계약", professional: false, enterprise: true },
  { feature: "세금계산서 발행", professional: false, enterprise: true },
]

const CUSTOMER_LOGOS = [
  "브랜드 A",
  "브랜드 B",
  "브랜드 C",
  "브랜드 D",
  "브랜드 E",
  "브랜드 F",
]

function ComparisonCell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto h-4 w-4 text-violet-400" />
    ) : (
      <X className="mx-auto h-4 w-4 text-slate-600" />
    )
  }
  return <span className="text-sm font-medium text-slate-200">{value}</span>
}

export default function EnterprisePage() {
  return (
    <div className="min-h-screen bg-[#0a0e2a]">
      {/* ── 히어로 ── */}
      <section className="relative overflow-hidden pt-16 pb-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-emerald-700/15 blur-[130px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            className="mb-6 gap-2 text-slate-400 hover:text-white border-none"
            render={<Link href="/pricing" />}
          >
            <ArrowLeft className="h-4 w-4" />
            요금제로 돌아가기
          </Button>
          <Badge className="mb-4 bg-emerald-600/20 text-emerald-300 border-emerald-500/30">
            Enterprise
          </Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            엔터프라이즈를 위한
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              맞춤형 솔루션
            </span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-slate-400">
            대기업, MCN, 광고대행사를 위한 무제한 데이터 접근과 전담 지원.
            비즈니스 규모에 맞는 커스텀 계약을 제공합니다.
          </p>
        </div>
      </section>

      {/* ── 엔터프라이즈 혜택 ── */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ENTERPRISE_BENEFITS.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20">
                  <Icon className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="mb-1.5 font-semibold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 기능 비교표 ── */}
      <section className="border-t border-slate-800 py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Professional vs Enterprise
            </h2>
            <p className="mt-2 text-slate-400">
              두 플랜의 기능을 비교해보세요.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-700">
            {/* 헤더 */}
            <div className="grid grid-cols-3 border-b border-slate-700 bg-slate-800 px-5 py-3">
              <span className="text-sm font-medium text-slate-400">기능</span>
              <span className="text-center text-sm font-medium text-slate-300">
                Professional
              </span>
              <span className="text-center text-sm font-semibold text-emerald-400">
                Enterprise
              </span>
            </div>

            {/* 행 */}
            {COMPARISON_FEATURES.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 items-center px-5 py-3 ${
                  i % 2 === 0 ? "bg-slate-900" : "bg-slate-900/50"
                }`}
              >
                <span className="text-sm text-slate-300">{row.feature}</span>
                <div className="text-center">
                  <ComparisonCell value={row.professional} />
                </div>
                <div className="text-center">
                  <ComparisonCell value={row.enterprise} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 고객사 로고 ── */}
      <section className="border-t border-slate-800 py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="mb-8 text-center text-sm text-slate-500">
            이미 많은 기업이 블링 엔터프라이즈를 사용하고 있습니다
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {CUSTOMER_LOGOS.map((name) => (
              <div
                key={name}
                className="flex h-12 w-28 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-xs font-medium text-slate-500"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 문의 폼 ── */}
      <section className="border-t border-slate-800 py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              엔터프라이즈 문의
            </h2>
            <p className="mt-2 text-slate-400">
              양식을 작성하시면 영업일 기준 1일 이내에 담당자가 연락드립니다.
            </p>
          </div>
          <EnterpriseContactForm />
        </div>
      </section>
    </div>
  )
}
