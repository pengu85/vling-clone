"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function PageButton({
  page,
  current,
  onPageChange,
}: {
  page: number;
  current: number;
  onPageChange: (p: number) => void;
}) {
  const isActive = page === current;
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onPageChange(page)}
      className={cn(
        "h-8 w-8 p-0 text-sm tabular-nums",
        isActive
          ? "bg-blue-600 text-white hover:bg-blue-500"
          : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
      )}
    >
      {page}
    </Button>
  );
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const maxVisible = 10;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = startPage + maxVisible - 1;
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  return (
    <div className="mt-6 flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200 disabled:opacity-30 bg-slate-800 hover:bg-slate-700"
      >
        &lt;
      </Button>

      {startPage > 1 && (
        <>
          <PageButton page={1} current={currentPage} onPageChange={onPageChange} />
          {startPage > 2 && (
            <span className="px-1 text-slate-600 text-sm">…</span>
          )}
        </>
      )}

      {pages.map((p) => (
        <PageButton key={p} page={p} current={currentPage} onPageChange={onPageChange} />
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="px-1 text-slate-600 text-sm">…</span>
          )}
          <PageButton
            page={totalPages}
            current={currentPage}
            onPageChange={onPageChange}
          />
        </>
      )}

      <Button
        variant="ghost"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="h-8 px-2 text-sm text-slate-400 hover:text-slate-200 disabled:opacity-30 bg-slate-800 hover:bg-slate-700"
      >
        다음
      </Button>
    </div>
  );
}
