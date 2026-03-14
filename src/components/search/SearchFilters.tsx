"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORIES,
  COUNTRIES,
  SUBSCRIBER_RANGES,
  DAILY_VIEW_RANGES,
  SHORTS_OPTIONS,
  SORT_OPTIONS,
} from "@/domain/categories";
import type { SearchFilters as SearchFiltersType } from "@/hooks/useChannelSearch";
import { ChevronDown, X } from "lucide-react";

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFilterChange: (filters: Partial<SearchFiltersType>) => void;
}

export function SearchFilters({ filters, onFilterChange }: SearchFiltersProps) {
  const [open, setOpen] = useState(false);

  function handleReset() {
    onFilterChange({
      category: "all",
      country: undefined,
      subscriberMin: undefined,
      subscriberMax: undefined,
      minDailyViews: undefined,
      maxDailyViews: undefined,
      shortsChannel: "all",
      sort: "subscriber",
      page: 1,
    });
  }

  function handleSubscriberRange(value: string | null) {
    if (!value || value === "all") {
      onFilterChange({ subscriberMin: undefined, subscriberMax: undefined, page: 1 });
      return;
    }
    const range = SUBSCRIBER_RANGES.find((r) => r.value === value);
    if (range) {
      onFilterChange({
        subscriberMin: range.min,
        subscriberMax: range.max === Infinity ? undefined : range.max,
        page: 1,
      });
    }
  }

  function handleDailyViewRange(value: string | null) {
    if (!value || value === "all") {
      onFilterChange({ minDailyViews: undefined, maxDailyViews: undefined, page: 1 });
      return;
    }
    const range = DAILY_VIEW_RANGES.find((r) => r.value === value);
    if (range) {
      onFilterChange({
        minDailyViews: range.min,
        maxDailyViews: range.max === Infinity ? undefined : range.max,
        page: 1,
      });
    }
  }

  function getSubscriberRangeValue(): string {
    if (!filters.subscriberMin && !filters.subscriberMax) return "all";
    const range = SUBSCRIBER_RANGES.find(
      (r) =>
        r.min === filters.subscriberMin &&
        (r.max === Infinity
          ? filters.subscriberMax === undefined
          : r.max === filters.subscriberMax)
    );
    return range?.value ?? "all";
  }

  function getDailyViewRangeValue(): string {
    if (!filters.minDailyViews && !filters.maxDailyViews) return "all";
    const range = DAILY_VIEW_RANGES.find(
      (r) =>
        r.min === filters.minDailyViews &&
        (r.max === Infinity
          ? filters.maxDailyViews === undefined
          : r.max === filters.maxDailyViews)
    );
    return range?.value ?? "all";
  }

  // Active filter chips
  const activeFilters: { label: string; onRemove: () => void }[] = [];
  if (filters.category && filters.category !== "all") {
    const cat = CATEGORIES.find((c) => c.value === filters.category);
    activeFilters.push({
      label: `카테고리: ${cat?.label ?? filters.category}`,
      onRemove: () => onFilterChange({ category: "all", page: 1 }),
    });
  }
  if (filters.country) {
    const ctr = COUNTRIES.find((c) => c.value === filters.country);
    activeFilters.push({
      label: `국가: ${ctr?.label ?? filters.country}`,
      onRemove: () => onFilterChange({ country: undefined, page: 1 }),
    });
  }
  if (filters.subscriberMin || filters.subscriberMax) {
    const range = SUBSCRIBER_RANGES.find(
      (r) =>
        r.min === filters.subscriberMin &&
        (r.max === Infinity
          ? filters.subscriberMax === undefined
          : r.max === filters.subscriberMax)
    );
    activeFilters.push({
      label: `구독자: ${range?.label ?? "사용자 지정"}`,
      onRemove: () =>
        onFilterChange({ subscriberMin: undefined, subscriberMax: undefined, page: 1 }),
    });
  }
  if (filters.minDailyViews || filters.maxDailyViews) {
    const range = DAILY_VIEW_RANGES.find(
      (r) =>
        r.min === filters.minDailyViews &&
        (r.max === Infinity
          ? filters.maxDailyViews === undefined
          : r.max === filters.maxDailyViews)
    );
    activeFilters.push({
      label: `일 조회수: ${range?.label ?? "사용자 지정"}`,
      onRemove: () =>
        onFilterChange({ minDailyViews: undefined, maxDailyViews: undefined, page: 1 }),
    });
  }
  if (filters.shortsChannel && filters.shortsChannel !== "all") {
    const opt = SHORTS_OPTIONS.find((o) => o.value === filters.shortsChannel);
    activeFilters.push({
      label: `Shorts: ${opt?.label ?? filters.shortsChannel}`,
      onRemove: () => onFilterChange({ shortsChannel: "all", page: 1 }),
    });
  }

  return (
    <div className="space-y-2">
      {/* Toggle button + sort inline */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors"
        >
          고급 필터
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
          {activeFilters.length > 0 && (
            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
              {activeFilters.length}
            </span>
          )}
        </button>

        {/* 정렬 (always visible) */}
        <Select
          value={filters.sort ?? "subscriber"}
          onValueChange={(val) => onFilterChange({ sort: val ?? "subscriber", page: 1 })}
        >
          <SelectTrigger className="h-8 min-w-[120px] border-slate-700 bg-slate-800 text-slate-200 text-xs">
            <SelectValue placeholder="정렬" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
            {SORT_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 초기화 */}
        {activeFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-3"
          >
            필터 초기화
          </Button>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeFilters.map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-1 rounded-full bg-blue-600/20 px-2.5 py-1 text-xs font-medium text-blue-400"
            >
              {chip.label}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  chip.onRemove();
                }}
                className="ml-0.5 rounded-full p-0.5 hover:bg-blue-600/30 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Advanced filter panel */}
      {open && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Row 1: 국가 + 카테고리 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 국가 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400">국가</label>
              <Select
                value={filters.country ?? "all"}
                onValueChange={(val) =>
                  onFilterChange({ country: !val || val === "all" ? undefined : val, page: 1 })
                }
              >
                <SelectTrigger className="h-9 border-slate-700 bg-slate-800/80 text-slate-200 text-xs">
                  <SelectValue placeholder="국가" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                  <SelectItem value="all">전체 국가</SelectItem>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 카테고리 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400">카테고리</label>
              <Select
                value={filters.category ?? "all"}
                onValueChange={(val) => onFilterChange({ category: val ?? "all", page: 1 })}
              >
                <SelectTrigger className="h-9 border-slate-700 bg-slate-800/80 text-slate-200 text-xs">
                  <SelectValue placeholder="카테고리" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                  <SelectItem value="all">전체 카테고리</SelectItem>
                  {CATEGORIES.filter((c) => c.value !== "all").map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Shorts 채널 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400">Shorts 채널</label>
              <Select
                value={filters.shortsChannel ?? "all"}
                onValueChange={(val) =>
                  onFilterChange({
                    shortsChannel: (val as "all" | "yes" | "no") ?? "all",
                    page: 1,
                  })
                }
              >
                <SelectTrigger className="h-9 border-slate-700 bg-slate-800/80 text-slate-200 text-xs">
                  <SelectValue placeholder="Shorts" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                  {SHORTS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: 구독자 범위 */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-400">구독자 범위</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleSubscriberRange("all")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  getSubscriberRangeValue() === "all"
                    ? "bg-violet-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                }`}
              >
                전체
              </button>
              {SUBSCRIBER_RANGES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => handleSubscriberRange(r.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    getSubscriberRangeValue() === r.value
                      ? "bg-violet-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: 일 조회수 범위 */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-400">일 평균 조회수</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleDailyViewRange("all")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  getDailyViewRangeValue() === "all"
                    ? "bg-violet-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                }`}
              >
                전체
              </button>
              {DAILY_VIEW_RANGES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => handleDailyViewRange(r.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    getDailyViewRangeValue() === r.value
                      ? "bg-violet-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
