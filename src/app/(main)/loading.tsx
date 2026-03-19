import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page title placeholder */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-800 bg-slate-800/30 p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="rounded-xl border border-slate-800 bg-slate-800/30 p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
        <Skeleton className="h-44 w-full rounded-lg" />
      </div>

      {/* Card list placeholder */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        {/* Table header */}
        <div className="bg-slate-900/50 border-b border-slate-800 px-4 py-3 flex items-center gap-4">
          <Skeleton className="h-3.5 w-8" />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-16 ml-auto" />
          <Skeleton className="h-3.5 w-16 hidden sm:block" />
          <Skeleton className="h-3.5 w-16 hidden md:block" />
        </div>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 last:border-0"
          >
            <Skeleton className="h-4 w-5 shrink-0" />
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32 sm:w-40" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="text-right space-y-1.5 shrink-0">
              <Skeleton className="h-3.5 w-14 ml-auto" />
              <Skeleton className="h-3 w-10 ml-auto hidden sm:block" />
            </div>
            <Skeleton className="h-3.5 w-14 hidden md:block" />
            <Skeleton className="h-3.5 w-14 hidden md:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
