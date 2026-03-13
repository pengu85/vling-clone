import { Skeleton } from "@/components/ui/skeleton";

/**
 * SearchResultSkeleton
 * 검색 페이지의 테이블 뷰 로딩 스켈레톤.
 * 실제 레이아웃: grid-cols-[48px_minmax(200px,1fr)_120px_100px_120px_120px_minmax(160px,1fr)_40px]
 */
export function SearchResultSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
      {/* 헤더 행 */}
      <div className="grid grid-cols-[48px_minmax(200px,1fr)_120px_100px_120px_120px_minmax(160px,1fr)_40px] items-center gap-3 border-b border-slate-800 px-4 py-2.5 min-w-[960px] bg-slate-800/50">
        {["순위", "채널", "구독자", "성장률", "일 조회수", "예상 수익", "최신 영상", ""].map(
          (label, i) => (
            <div
              key={i}
              className={`text-[10px] font-semibold uppercase tracking-wider text-slate-500 ${
                i === 0 ? "text-center" : i >= 2 && i <= 5 ? "text-right" : ""
              }`}
            >
              {label}
            </div>
          )
        )}
      </div>

      {/* 스켈레톤 행들 */}
      <div className="min-w-[960px]">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[48px_minmax(200px,1fr)_120px_100px_120px_120px_minmax(160px,1fr)_40px] items-center gap-3 border-b border-slate-800 px-4 py-3 last:border-0"
          >
            {/* 순위 */}
            <Skeleton dark className="mx-auto h-4 w-6" />

            {/* 채널 썸네일 + 이름 */}
            <div className="flex items-center gap-3">
              <Skeleton dark className="h-10 w-10 shrink-0 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton dark className="h-3 w-32" />
                <Skeleton dark className="h-3 w-16" />
              </div>
            </div>

            {/* 구독자, 성장률, 일 조회수, 예상 수익 */}
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} dark className="ml-auto h-3 w-16" />
            ))}

            {/* 최신 영상 */}
            <div className="space-y-1.5">
              <Skeleton dark className="h-3 w-28" />
              <Skeleton dark className="h-3 w-20" />
            </div>

            {/* 액션 */}
            <Skeleton dark className="h-6 w-6 rounded-full mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
