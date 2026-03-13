"use client";

import { LayoutDashboard, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 px-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10">
        <LayoutDashboard className="w-8 h-8 text-purple-400" />
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-xl font-semibold text-slate-100">
          대시보드를 불러오지 못했습니다
        </h2>
        <p className="text-sm text-slate-400 max-w-md">
          {error.message || "대시보드 데이터를 가져오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."}
        </p>
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-medium transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        새로고침
      </button>
    </div>
  );
}
