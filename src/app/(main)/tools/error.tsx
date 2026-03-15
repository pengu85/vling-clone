"use client";

import { AlertTriangle } from "lucide-react";

export default function ToolsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
        <h2 className="text-lg font-semibold text-slate-200">도구를 불러올 수 없습니다</h2>
        <p className="text-sm text-slate-400">잠시 후 다시 시도해주세요</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors text-sm"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
