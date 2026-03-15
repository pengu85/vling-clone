import Link from "next/link"
import {
  Sparkles,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Play,
  CheckCircle,
  ArrowRight,
  Zap,
  Globe,
  Target,
  Palette,
  Gamepad2,
  GraduationCap,
  UtensilsCrossed,
  Plane,
  Cpu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { HeroSearch } from "@/components/landing/HeroSearch"

// ─── 데이터 ────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Sparkles,
    title: "AI 유튜버 파인더",
    description:
      "브랜드 키워드와 타겟 오디언스를 입력하면 AI가 최적의 크리에이터를 자동 추천합니다.",
  },
  {
    icon: TrendingUp,
    title: "알고리즘 영상 검색",
    description:
      "알고리즘 스코어 기반으로 현재 급상승 중인 영상과 채널을 실시간으로 발견하세요.",
  },
  {
    icon: Users,
    title: "시청자 분석",
    description:
      "연령·성별·관심사·지역 데이터로 채널의 실제 팬층을 정밀하게 파악합니다.",
  },
  {
    icon: DollarSign,
    title: "광고 단가 측정",
    description:
      "채널 규모·카테고리·시청률을 종합해 협찬 예상 비용을 자동 산출합니다.",
  },
]

const solutions: Record<
  string,
  { headline: string; bullets: string[]; cta: string }
> = {
  advertiser: {
    headline: "광고 효율을 극대화하는 데이터 기반 집행",
    bullets: [
      "허위 구독자·뷰봇을 자동 필터링해 안전한 채널만 추천",
      "CPM·CPV 예측으로 예산 낭비 없이 캠페인 설계",
      "경쟁사 광고 집행 현황을 실시간 모니터링",
    ],
    cta: "광고주로 시작하기",
  },
  mcn: {
    headline: "소속 크리에이터 성장을 수치로 증명하세요",
    bullets: [
      "채널별 성과 대시보드로 MCN 포트폴리오 한눈에 관리",
      "유사 채널 벤치마킹으로 성장 전략 수립",
      "광고주 매칭 리포트 자동 생성",
    ],
    cta: "MCN으로 시작하기",
  },
  youtuber: {
    headline: "내 채널이 얼마나 성장했는지 정확히 알아보세요",
    bullets: [
      "구독자 성장 추이·영상 성과 트렌드 시각화",
      "경쟁 채널 대비 내 포지셔닝 확인",
      "협찬 단가 셀프 산출로 협상력 UP",
    ],
    cta: "유튜버로 시작하기",
  },
  agency: {
    headline: "클라이언트에게 근거 있는 제안을 하세요",
    bullets: [
      "브리핑 한 번으로 최적 채널 리스트 자동 생성",
      "캠페인 결과 보고서 PDF 원클릭 추출",
      "복수 브랜드 프로젝트 동시 관리",
    ],
    cta: "대행사로 시작하기",
  },
}

const stats = [
  { label: "분석 채널 수", value: "10만+" },
  { label: "누적 영상 데이터", value: "1억+" },
  { label: "광고주 파트너", value: "500+" },
]

const industryCategories = [
  { label: "뷰티", icon: Palette },
  { label: "게임", icon: Gamepad2 },
  { label: "교육", icon: GraduationCap },
  { label: "음식", icon: UtensilsCrossed },
  { label: "여행", icon: Plane },
  { label: "테크", icon: Cpu },
]

const tabItems = [
  { value: "advertiser", label: "광고주" },
  { value: "mcn", label: "MCN" },
  { value: "youtuber", label: "유튜버" },
  { value: "agency", label: "광고대행사" },
]

// ─── 컴포넌트 ──────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── 네비게이션 ── */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#0a0e2a]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500">
              <Play className="h-3.5 w-3.5 fill-white text-white" />
            </div>
            <span className="text-lg font-bold text-white">블링</span>
          </div>
          <nav className="hidden gap-6 text-sm text-slate-300 md:flex">
            <a href="#features" className="hover:text-white transition-colors">기능</a>
            <a href="#solutions" className="hover:text-white transition-colors">솔루션</a>
            <a href="#pricing" className="hover:text-white transition-colors">요금제</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md text-slate-300 hover:text-white hover:bg-white/10 text-sm h-8 px-3 transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm h-8 px-3 transition-colors"
            >
              무료 시작
            </Link>
          </div>
        </div>
      </header>

      {/* ── 히어로 섹션 ── */}
      <section className="relative overflow-hidden bg-[#0a0e2a] pt-24 pb-24 sm:pb-32">
        {/* 배경 그라데이션 오브 */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-700/20 blur-[120px]" />
          <div className="absolute top-20 right-0 h-[400px] w-[400px] rounded-full bg-violet-700/15 blur-[100px]" />
          <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-indigo-700/15 blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          {/* 배지 */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-blue-300">
            <Zap className="h-3.5 w-3.5 fill-blue-400 text-blue-400" />
            <span>AI 기반 유튜버 데이터 플랫폼</span>
          </div>

          {/* 헤드라인 */}
          <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            유튜브 데이터 분석의{" "}
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              모든 것
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-slate-400">
            채널 분석, 단가 예측, 성과 검증을 하나로. 데이터 기반 인플루언서
            마케팅을 시작하세요.
          </p>

          {/* 검색바 (client component) */}
          <HeroSearch />

          {/* 통계 배지 */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: Globe, text: "10만+ 채널 분석" },
              { icon: Target, text: "500+ 광고주" },
              { icon: Sparkles, text: "AI 기반 추천" },
            ].map(({ icon: Icon, text }) => (
              <span
                key={text}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300"
              >
                <Icon className="h-3.5 w-3.5 text-blue-400" />
                {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 주요 기능 (4열 그리드) ── */}
      <section id="features" className="bg-slate-900 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-3">주요 기능</Badge>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              마케팅에 필요한 모든 분석을 한곳에
            </h2>
            <p className="mt-3 text-slate-400">
              블링은 광고주부터 크리에이터까지 필요한 인사이트를 모두 제공합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <Card
                key={title}
                className="group border-slate-700 bg-slate-800 transition-shadow hover:shadow-lg hover:shadow-blue-900/30"
              >
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-slate-100">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400 text-sm leading-relaxed">
                    {description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── 사용자별 솔루션 (탭) ── */}
      <section id="solutions" className="bg-slate-950 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-3">맞춤 솔루션</Badge>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              누구에게나 최적화된 블링
            </h2>
            <p className="mt-3 text-slate-400">
              역할에 따라 필요한 기능이 다릅니다. 당신에게 맞는 솔루션을 찾아보세요.
            </p>
          </div>

          <Tabs defaultValue="advertiser">
            <div className="mb-8 flex justify-center">
              <TabsList className="h-auto gap-1 p-1 bg-slate-800 rounded-xl">
                {tabItems.map(({ value, label }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="rounded-lg px-5 py-2 text-sm font-medium text-slate-400 data-active:bg-slate-700 data-active:text-blue-400 data-active:shadow-sm"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {tabItems.map(({ value }) => {
              const sol = solutions[value]
              return (
                <TabsContent key={value} value={value}>
                  <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
                    {/* 텍스트 */}
                    <div>
                      <h3 className="mb-5 text-2xl font-bold text-white">
                        {sol.headline}
                      </h3>
                      <ul className="mb-7 space-y-3">
                        {sol.bullets.map((b) => (
                          <li key={b} className="flex items-start gap-3">
                            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                            <span className="text-slate-400">{b}</span>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href="/signup"
                        className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-sm font-medium gap-2 transition-colors"
                      >
                        {sol.cta}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>

                    {/* 스크린샷 플레이스홀더 */}
                    <div className="flex h-72 items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 lg:h-80">
                      <div className="text-center">
                        <BarChart3 className="mx-auto mb-3 h-12 w-12 text-slate-600" />
                        <p className="text-sm text-slate-500">대시보드 스크린샷</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )
            })}
          </Tabs>
        </div>
      </section>

      {/* ── 데이터 시각화 쇼케이스 ── */}
      <section className="bg-[#0a0e2a] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge className="mb-3 bg-blue-600/20 text-blue-300 border-blue-500/30">
              실시간 분석
            </Badge>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              실시간 트렌드 분석
            </h2>
            <p className="mt-3 text-slate-400">
              지금 이 순간 유튜브에서 일어나고 있는 모든 변화를 포착합니다.
            </p>
          </div>

          {/* 주요 수치 */}
          <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {stats.map(({ label, value }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm"
              >
                <p className="text-4xl font-bold text-white">{value}</p>
                <p className="mt-1 text-sm text-slate-400">{label}</p>
              </div>
            ))}
          </div>

          {/* 차트 플레이스홀더 */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* 메인 차트 */}
            <div className="col-span-1 flex h-64 flex-col rounded-2xl border border-white/10 bg-white/5 p-5 lg:col-span-2">
              <p className="mb-3 text-sm font-medium text-slate-300">
                월별 채널 성장 트렌드
              </p>
              <div className="flex flex-1 items-end gap-2 px-2">
                {[40, 55, 48, 70, 65, 80, 72, 90, 85, 95, 88, 100].map(
                  (h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm bg-gradient-to-t from-blue-600 to-violet-500 opacity-80 transition-all hover:opacity-100"
                      style={{ height: `${h}%` }}
                    />
                  )
                )}
              </div>
              <div className="mt-2 flex justify-between px-1 text-xs text-slate-500">
                <span>1월</span>
                <span>6월</span>
                <span>12월</span>
              </div>
            </div>

            {/* 보조 카드들 */}
            <div className="flex flex-col gap-4">
              <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="mb-3 text-sm font-medium text-slate-300">
                  카테고리별 CPM
                </p>
                <div className="space-y-2">
                  {[
                    { name: "게임", width: "75%", color: "bg-blue-500" },
                    { name: "뷰티", width: "60%", color: "bg-violet-500" },
                    { name: "금융", width: "90%", color: "bg-indigo-500" },
                    { name: "음식", width: "45%", color: "bg-blue-400" },
                  ].map(({ name, width, color }) => (
                    <div key={name} className="flex items-center gap-2 text-xs">
                      <span className="w-8 text-slate-400">{name}</span>
                      <div className="flex-1 rounded-full bg-white/10">
                        <div
                          className={`h-2 rounded-full ${color}`}
                          style={{ width }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="mb-1 text-sm font-medium text-slate-300">
                  AI 분석
                </p>
                <p className="text-xs text-slate-500">24/7 실시간 업데이트</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                  </span>
                  <span className="text-xs text-green-400">라이브 분석 중</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 활용 분야 ── */}
      <section className="border-y border-slate-800 bg-slate-900 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-8 text-center text-sm text-slate-500">
            다양한 브랜드가 블링을 활용하고 있습니다
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {industryCategories.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex h-10 items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 text-xs font-medium text-slate-400 shadow-sm"
              >
                <Icon className="h-4 w-4 text-slate-500" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA 섹션 ── */}
      <section className="bg-slate-950 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <Badge variant="secondary" className="mb-4">무료 체험</Badge>
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            지금 무료로 시작하세요
          </h2>
          <p className="mb-8 text-lg text-slate-400">
            신용카드 없이 3일 동안 모든 기능을 체험해보세요. 언제든지 취소
            가능합니다.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center h-12 w-full bg-blue-600 hover:bg-blue-500 text-white px-8 text-base font-semibold sm:w-auto gap-2 rounded-xl transition-colors"
            >
              <Zap className="h-4 w-4" />
              3일 무료 체험 시작
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center h-12 w-full border border-slate-700 text-slate-400 hover:bg-slate-800 px-8 text-base sm:w-auto rounded-xl transition-colors"
            >
              요금제 보기
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            이미 10,000+ 마케터가 블링을 신뢰합니다.
          </p>
        </div>
      </section>

      {/* ── 푸터 ── */}
      <footer className="border-t border-slate-800 bg-slate-950 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-violet-500">
                <Play className="h-3 w-3 fill-white text-white" />
              </div>
              <span className="font-bold text-slate-200">블링</span>
            </div>
            <p className="text-sm text-slate-500">
              © 2026 블링. 모든 권리 보유.
            </p>
            <div className="flex gap-4 text-sm text-slate-500">
              <Link href="/terms" className="hover:text-slate-300 transition-colors">이용약관</Link>
              <Link href="/privacy" className="hover:text-slate-300 transition-colors">개인정보처리방침</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
