import type { Metadata } from "next";
import { Sparkles, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AIFinderForm } from "@/components/tools/AIFinderForm";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "AI 파인더",
  description: "AI가 마케팅 목적에 맞는 최적의 유튜버를 추천해드립니다.",
};

export default function AIFinderPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "도구", href: "/tools/ai-finder" }, { label: "AI 파인더" }]} />
      {/* 헤더 */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-violet-400" />
          <h1 className="text-xl font-bold text-slate-100">AI 유튜버 파인더</h1>
        </div>
        <p className="text-sm text-slate-400">
          광고 목적과 타겟 오디언스를 입력하면 AI가 최적의 유튜버를 추천해 드립니다
        </p>
      </div>

      {/* 폼 */}
      <AIFinderForm />

      {/* 안내 카드 */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">AI 파인더 활용 팁</h3>
              <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
                <p>
                  <span className="text-slate-300">광고 설명을 구체적으로</span> 입력할수록 더 정확한 채널을 추천받을 수 있습니다. 제품 특징, 캠페인 목표, 원하는 콘텐츠 형식을 포함해 주세요.
                </p>
                <p>
                  <span className="text-slate-300">매칭 스코어</span>는 타겟 오디언스 일치율, 채널 참여율, 알고리즘 최적화 수준을 종합해 산출합니다. 90% 이상이면 최상위 매칭입니다.
                </p>
                <p>
                  <span className="text-slate-300">예상 광고 단가</span>는 구독자 수와 평균 조회수를 기반으로 한 추정치이며, 실제 협의 금액과 다를 수 있습니다.
                </p>
                <p className="text-slate-500">
                  * 추천 결과는 데이터 기반 AI 분석이며, 최종 채널 선정은 직접 확인 후 결정하시기 바랍니다.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
