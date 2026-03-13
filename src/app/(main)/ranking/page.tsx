"use client";

import { useState } from "react";
import { BarChart2, Download, TrendingUp, Users, DollarSign, Gift } from "lucide-react";
import { channelsToCSV, downloadCSV } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RankingTable } from "@/components/ranking/RankingTable";
import { useRanking } from "@/hooks/useRanking";
import { CATEGORIES } from "@/domain/categories";
import { cn } from "@/lib/utils";
import type { RankType } from "@/types";

const RANK_TABS: { value: RankType; label: string; icon: React.ElementType }[] = [
  { value: "subscriber", label: "구독자", icon: Users },
  { value: "view", label: "조회수", icon: BarChart2 },
  { value: "growth", label: "성장률", icon: TrendingUp },
  { value: "revenue", label: "수익", icon: DollarSign },
  { value: "superchat", label: "슈퍼챗", icon: Gift },
];

const PERIOD_OPTIONS = [
  { value: "daily", label: "일간" },
  { value: "weekly", label: "주간" },
  { value: "monthly", label: "월간" },
];

const LIMIT = 20;

export default function RankingPage() {
  const [rankType, setRankType] = useState<RankType>("subscriber");
  const [category, setCategory] = useState("all");
  const [period, setPeriod] = useState("daily");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useRanking({
    type: rankType,
    category,
    page,
    limit: LIMIT,
  });

  const items = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  function handleTypeChange(type: RankType) {
    setRankType(type);
    setPage(1);
  }

  function handleCategoryChange(val: string | null) {
    setCategory(val ?? "all");
    setPage(1);
  }

  function handleExportCSV() {
    if (items.length === 0) return;
    const channels = items.map((item) => item.channel);
    const csv = channelsToCSV(channels);
    const filename = `블링_순위_${rankType}_${new Date().toISOString().split("T")[0]}.csv`;
    downloadCSV(csv, filename);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">유튜브 순위</h1>
          <p className="mt-1 text-sm text-slate-500">
            카테고리별, 지표별 채널 순위를 확인하세요.
          </p>
        </div>

        {/* 순위 유형 탭 */}
        <div className="mb-4 grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap">
          {RANK_TABS.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant="ghost"
              size="sm"
              onClick={() => handleTypeChange(value)}
              className={cn(
                "h-8 gap-1 rounded-lg px-2 text-xs font-medium transition-colors sm:gap-1.5 sm:px-3 sm:text-sm",
                rankType === value
                  ? "bg-blue-600 text-white hover:bg-blue-500"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </Button>
          ))}
        </div>

        {/* 필터 바 */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="h-8 w-full max-w-[144px] border-slate-700 bg-slate-800 text-slate-300 text-xs sm:w-36">
              <SelectValue placeholder="카테고리" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value} className="text-xs">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={period} onValueChange={(v) => setPeriod(v ?? "daily")}>
            <SelectTrigger className="h-8 w-24 border-slate-700 bg-slate-800 text-slate-300 text-xs">
              <SelectValue placeholder="기간" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((p) => (
                <SelectItem key={p.value} value={p.value} className="text-xs">
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={items.length === 0}
            className="h-8 text-xs border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 gap-1.5"
          >
            <Download className="h-3 w-3" />
            CSV 내보내기
          </Button>
        </div>

        {/* 테이블 */}
        <RankingTable data={items} isLoading={isLoading} />

        {/* 페이지네이션 */}
        {!isLoading && totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}

// ─── 페이지네이션 컴포넌트 ─────────────────────────────────────────────────────

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const maxVisible = 10;

  // 표시할 페이지 번호 계산
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
