"use client";

import { X, Trash2 } from "lucide-react";
import { useSearchHistoryStore } from "@/stores/searchHistoryStore";

interface SearchHistoryProps {
  onSelect: (q: string) => void;
}

export function SearchHistory({ onSelect }: SearchHistoryProps) {
  const { queries, removeQuery, clearAll } = useSearchHistoryStore();

  if (queries.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-xs text-slate-500">최근 검색</span>
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-0.5">
        {queries.map((q) => (
          <span
            key={q}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-slate-100 cursor-pointer transition-colors"
          >
            <button
              type="button"
              onClick={() => onSelect(q)}
              className="max-w-[140px] truncate"
            >
              {q}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeQuery(q);
              }}
              className="ml-0.5 text-slate-500 hover:text-slate-200 transition-colors"
              aria-label={`${q} 삭제`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={clearAll}
        className="shrink-0 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        aria-label="전체 삭제"
      >
        <Trash2 className="h-3 w-3" />
        전체 삭제
      </button>
    </div>
  );
}
