"use client";

import { MonitorX, RefreshCw } from "lucide-react";

export default function YoutuberTrackerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 px-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10">
        <MonitorX className="w-8 h-8 text-red-400" />
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-xl font-semibold text-slate-100">
          모니터링 데이터를 불러오지 못했습니다
        </h2>
        <p className="text-sm text-slate-400 max-w-md">
          {error.message || "유튜버 모니터링 정보를 가져오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."}
        </p>
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-medium transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        다시 시도
      </button>
    </div>
  );
}
