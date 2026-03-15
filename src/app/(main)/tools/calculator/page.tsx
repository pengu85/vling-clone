import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, Sparkles, GitCompare, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RevenueCalculator } from "@/components/tools/RevenueCalculator";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "수익 계산기",
  description: "유튜브 채널의 예상 광고 수익을 계산하고 분석하세요.",
};

export default function CalculatorPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "도구", href: "/tools/calculator" }, { label: "수익 계산기" }]} />
      {/* 헤더 */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="h-5 w-5 text-violet-400" />
          <h1 className="text-xl font-bold text-slate-100">유튜브 수익 계산기</h1>
        </div>
        <p className="text-sm text-slate-400">
          일 평균 조회수를 입력하면 예상 수익을 계산합니다
        </p>
      </div>

      {/* 계산기 컴포넌트 */}
      <RevenueCalculator />

      {/* 수익 계산 방법 설명 */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">
                수익 계산 방법
              </h3>
              <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
                <p>
                  유튜브 수익은 <span className="text-slate-300">CPM(Cost Per Mille)</span> 기반으로 계산됩니다. CPM은 광고 1,000회 노출당 광고주가 지불하는 금액입니다.
                </p>
                <p>
                  <span className="text-slate-300">국가별 CPM 차이</span>: 미국(US) $4.0, 영국(GB) $3.5, 한국(KR) $2.0 등 광고 시장 규모에 따라 CPM이 다릅니다.
                </p>
                <p>
                  <span className="text-slate-300">카테고리별 CPM 차이</span>: 기술/IT(1.5x), 교육(1.3x) 카테고리가 높고, 음악(0.7x), 키즈(0.6x)는 낮은 경향이 있습니다.
                </p>
                <p className="text-slate-500">
                  * 실제 수익은 광고 참여율, 광고 형태, 시즌 등에 따라 ±30% 이상 차이날 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 관련 도구 링크 */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          관련 도구
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/tools/ai-finder">
            <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 transition-colors cursor-pointer">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">AI 파인더</p>
                    <p className="text-xs text-slate-500">AI로 최적의 크리에이터 추천</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/tools/compare">
            <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 transition-colors cursor-pointer">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                    <GitCompare className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">채널 비교</p>
                    <p className="text-xs text-slate-500">복수 채널 성과 비교 분석</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
