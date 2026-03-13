import { Skeleton } from "@/components/ui/skeleton";

/**
 * ChannelDetailSkeleton
 * /channel/[id] 페이지의 로딩 스켈레톤.
 *
 * 레이아웃:
 * 1. 배너 (h-48, 그라데이션 대체)
 * 2. 프로필 영역: 아바타 + 채널명 + 설명 + StatCard x4
 * 3. 탭 네비게이션
 * 4. 차트 영역 x2 (grid-cols-2)
 * 5. 지표 카드 x4 (grid-cols-4)
 * 6. 성장률 차트
 * 7. 최근 영상 그리드 x4
 */
export function ChannelDetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* 배너 */}
      <div className="bg-slate-900 border-b border-slate-800">
        <Skeleton className="h-48 w-full rounded-none bg-slate-800" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative pb-4">
            {/* 프로필 아바타 (배너에 겹침) */}
            <div className="absolute -top-12 left-0">
              <Skeleton className="h-24 w-24 rounded-full border-4 border-slate-900 bg-slate-700" />
            </div>

            {/* 액션 버튼 영역 */}
            <div className="flex justify-end pt-3 gap-2">
              <Skeleton className="h-8 w-24 bg-slate-700" />
              <Skeleton className="h-8 w-28 bg-slate-700" />
            </div>

            {/* 채널명 + 설명 */}
            <div className="mt-2 pt-10 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-40 bg-slate-700" />
                <Skeleton className="h-5 w-16 bg-slate-700" />
                <Skeleton className="h-4 w-12 bg-slate-700" />
              </div>
              <Skeleton className="h-4 w-full max-w-xl bg-slate-700" />
              <Skeleton className="h-4 w-2/3 max-w-md bg-slate-700" />
            </div>

            {/* StatCard x4 */}
            <div className="flex gap-3 mt-4 flex-wrap sm:flex-nowrap">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-0 rounded-xl border border-slate-700 bg-slate-800 py-3 px-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Skeleton className="h-4 w-4 bg-slate-700" />
                    <Skeleton className="h-3 w-12 bg-slate-700" />
                  </div>
                  <Skeleton className="h-6 w-20 bg-slate-700" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 탭 네비게이션 스켈레톤 */}
        <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 bg-slate-700" />
          ))}
        </div>

        {/* 차트 2개 (구독자 추이 / 조회수 추이) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <Skeleton className="h-4 w-24 mb-4 bg-slate-700" />
              <Skeleton className="h-40 w-full bg-slate-800" />
            </div>
          ))}
        </div>

        {/* 주요 지표 카드 4개 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-700 bg-slate-800 p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-20 bg-slate-700" />
                  <Skeleton className="h-7 w-24 bg-slate-700" />
                  <Skeleton className="h-3 w-16 bg-slate-700" />
                </div>
                <Skeleton className="h-5 w-5 bg-slate-700" />
              </div>
            </div>
          ))}
        </div>

        {/* 성장률 차트 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <Skeleton className="h-4 w-32 mb-4 bg-slate-700" />
          <Skeleton className="h-36 w-full bg-slate-800" />
        </div>

        {/* 최근 영상 그리드 (4개) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <Skeleton className="h-4 w-20 mb-4 bg-slate-700" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl bg-slate-800" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
