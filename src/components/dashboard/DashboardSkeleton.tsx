import { Skeleton } from "@/components/ui/skeleton";

/**
 * DashboardSkeleton
 * /my/dashboard 페이지의 로딩 스켈레톤.
 *
 * 레이아웃:
 * 1. 헤더 (아이콘 + 제목)
 * 2. DashboardSummary: 통계 카드 4개 (grid-cols-2 lg:grid-cols-4)
 * 3. DashboardSummary: 빠른 액션 4개 (grid-cols-1 sm:grid-cols-2 lg:grid-cols-4)
 * 4. grid-cols-1 lg:grid-cols-2: FavoritesSummary | RecentChannels
 *    각각: 헤더 + 채널 리스트 아이템 6개
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-6 w-24" />
      </div>

      {/* 통계 카드 4개 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-700 bg-slate-800 p-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-7 w-8" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 빠른 액션 섹션 레이블 */}
      <div>
        <Skeleton className="h-3 w-20 mb-3" />

        {/* 빠른 액션 카드 4개 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 p-4"
            >
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 즐겨찾기 + 최근 본 채널 2열 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {Array.from({ length: 2 }).map((_, col) => (
          <div key={col} className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            {/* 카드 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>

            {/* 채널 리스트 아이템 6개 */}
            <div className="space-y-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-2 py-2"
                >
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <Skeleton className="h-3.5 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-3 w-12 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
