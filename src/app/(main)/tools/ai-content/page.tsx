import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Sparkles, Calculator } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AIContentMaker } from "@/components/tools/AIContentMaker";

export const metadata: Metadata = {
  title: "AI 콘텐츠",
  description: "AI로 유튜브 콘텐츠 아이디어와 스크립트를 생성하세요.",
};

export default function AIContentPage() {
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileText className="h-5 w-5 text-violet-400" />
          <h1 className="text-xl font-bold text-slate-100">AI 콘텐츠 메이커</h1>
        </div>
        <p className="text-sm text-slate-400">
          키워드를 입력하면 AI가 경쟁도 분석부터 스크립트 초안까지 자동으로 생성합니다
        </p>
      </div>

      {/* 메인 컴포넌트 */}
      <AIContentMaker />

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
          <Link href="/tools/calculator">
            <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 transition-colors cursor-pointer">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Calculator className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">수익 계산기</p>
                    <p className="text-xs text-slate-500">유튜브 예상 수익 계산</p>
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
