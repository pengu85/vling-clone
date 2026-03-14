import { Image as ImageIcon, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ThumbnailAnalyzer } from "@/components/tools/ThumbnailAnalyzer";

export default function ThumbnailAnalyzerPage() {
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ImageIcon className="h-5 w-5 text-rose-400" />
          <h1 className="text-xl font-bold text-slate-100">
            썸네일 A/B 분석기
          </h1>
        </div>
        <p className="text-sm text-slate-400">
          유튜브 채널의 썸네일을 AI로 분석하여 클릭률 높은 패턴을 도출합니다
        </p>
      </div>

      {/* 메인 컴포넌트 */}
      <ThumbnailAnalyzer />

      {/* 안내 카드 */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">
                썸네일 분석 활용 팁
              </h3>
              <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
                <p>
                  <span className="text-slate-300">채널 URL</span>을 입력하면
                  최근 영상 12개의 썸네일을 자동으로 수집하고 AI가 패턴을
                  분석합니다.
                </p>
                <p>
                  <span className="text-slate-300">AI 점수</span>는 색상 대비,
                  텍스트 가독성, 인물 표정, 구도 등을 종합 평가한 결과입니다.
                  90점 이상이면 최상위 썸네일입니다.
                </p>
                <p>
                  <span className="text-slate-300">HIGH CTR 배지</span>는
                  조회수 대비 성과가 높은 썸네일에 자동으로 부여됩니다.
                </p>
                <p className="text-slate-500">
                  * 분석 결과는 AI 기반 추정치이며, 실제 클릭률과 다를 수
                  있습니다.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
