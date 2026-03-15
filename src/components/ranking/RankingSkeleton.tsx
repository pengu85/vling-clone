import { Skeleton } from "@/components/ui/skeleton";

/**
 * RankingSkeleton
 * RankingTable 컴포넌트의 독립형 스켈레톤.
 * 데스크톱: 테이블 행 (순위 | 채널 | 구독자 | 성장률 | 일 조회수 | 예상 수익)
 * 모바일: 카드 리스트 (순위 + 썸네일 + 채널명/카테고리 + 구독자/성장률)
 */
export function RankingSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-slate-800 overflow-hidden">
      {/* 모바일 카드 뷰 */}
      <div className="block md:hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 last:border-0"
          >
            <Skeleton className="h-5 w-5 shrink-0" />
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="text-right space-y-1.5">
              <Skeleton className="h-3.5 w-14 ml-auto" />
              <Skeleton className="h-3 w-10 ml-auto" />
            </div>
          </div>
        ))}
      </div>

      {/* 데스크톱 테이블 뷰 */}
      <div className="hidden md:block">
        {/* 테이블 헤더 */}
        <div className="grid grid-cols-[56px_1fr_120px_130px_120px_120px] items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900/50">
          {["순위", "채널", "구독자", "성장률(30일)", "일 조회수", "예상 수익"].map((label, i) => (
            <div
              key={i}
              className={`text-xs font-semibold uppercase tracking-wider text-slate-500 ${
                i >= 2 ? "text-right" : i === 0 ? "text-center" : ""
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* 스켈레톤 행들 */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[56px_1fr_120px_130px_120px_120px] items-center gap-3 px-4 py-3 border-b border-slate-800 last:border-0"
          >
            {/* 순위 */}
            <Skeleton className="h-5 w-6 mx-auto" />

            {/* 채널 */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>

            {/* 구독자, 성장률, 일 조회수, 예상 수익 */}
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-3.5 w-16 ml-auto" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
