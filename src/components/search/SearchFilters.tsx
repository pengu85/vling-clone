"use client";

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
  SORT_OPTIONS,
} from "@/domain/categories";
import type { SearchFilters } from "@/hooks/useChannelSearch";

interface SearchFiltersProps {
  filters: SearchFilters;
  onFilterChange: (filters: Partial<SearchFilters>) => void;
}

export function SearchFilters({ filters, onFilterChange }: SearchFiltersProps) {
  function handleReset() {
    onFilterChange({
      category: "all",
      country: undefined,
      subscriberMin: undefined,
      subscriberMax: undefined,
      sort: "subscriber",
      page: 1,
    });
  }

  function handleSubscriberRange(value: string | null) {
    if (!value || value === "all") {
      onFilterChange({ subscriberMin: undefined, subscriberMax: undefined });
      return;
    }
    const range = SUBSCRIBER_RANGES.find((r) => r.value === value);
    if (range) {
      onFilterChange({
        subscriberMin: range.min,
        subscriberMax: range.max === Infinity ? undefined : range.max,
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 카테고리 */}
      <Select
        value={filters.category ?? "all"}
        onValueChange={(val) => onFilterChange({ category: val ?? "all", page: 1 })}
      >
        <SelectTrigger className="h-8 min-w-[110px] border-slate-700 bg-slate-800 text-slate-200 text-xs">
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

      {/* 국가 */}
      <Select
        value={filters.country ?? "all"}
        onValueChange={(val) =>
          onFilterChange({ country: !val || val === "all" ? undefined : val, page: 1 })
        }
      >
        <SelectTrigger className="h-8 min-w-[100px] border-slate-700 bg-slate-800 text-slate-200 text-xs">
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

      {/* 구독자 범위 */}
      <Select
        value={getSubscriberRangeValue()}
        onValueChange={handleSubscriberRange}
      >
        <SelectTrigger className="h-8 min-w-[120px] border-slate-700 bg-slate-800 text-slate-200 text-xs">
          <SelectValue placeholder="구독자 범위" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
          <SelectItem value="all">구독자 전체</SelectItem>
          {SUBSCRIBER_RANGES.map((r) => (
            <SelectItem key={r.value} value={r.value}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 정렬 */}
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
      <Button
        variant="ghost"
        size="sm"
        onClick={handleReset}
        className="h-8 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-3"
      >
        필터 초기화
      </Button>
    </div>
  );
}
