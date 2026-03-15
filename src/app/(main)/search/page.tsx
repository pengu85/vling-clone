"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchFilters } from "@/components/search/SearchFilters";
import { ChannelCard } from "@/components/channel/ChannelCard";
import { useChannelSearch } from "@/hooks/useChannelSearch";
import type { SearchFilters as SearchFiltersType } from "@/hooks/useChannelSearch";
import type { ChannelSearchResult } from "@/types";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download, Loader2, SearchX } from "lucide-react";
import { channelsToCSV, downloadCSV } from "@/lib/csv";
import { SearchHistory } from "@/components/search/SearchHistory";
import { useSearchHistoryStore } from "@/stores/searchHistoryStore";
import { Breadcrumb } from "@/components/ui/breadcrumb";

const LIMIT = 20;

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [filters, setFilters] = useState<SearchFiltersType>({
    q: initialQuery,
    category: "all",
    country: undefined,
    subscriberMin: undefined,
    subscriberMax: undefined,
    minDailyViews: undefined,
    maxDailyViews: undefined,
    shortsChannel: "all",
    sort: "subscriber",
    page: 1,
    limit: LIMIT,
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [allResults, setAllResults] = useState<ChannelSearchResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isFetching, isError, refetch } = useChannelSearch(filters);
  const addQuery = useSearchHistoryStore((s) => s.addQuery);

  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;

  // Reset accumulated results when search query or filters change (not page)
  useEffect(() => {
    setAllResults([]);
    setCurrentPage(1);
  }, [filters.q, filters.category, filters.country, filters.subscriberMin, filters.subscriberMax, filters.minDailyViews, filters.maxDailyViews, filters.shortsChannel, filters.sort]); // eslint-disable-line react-hooks/exhaustive-deps

  // Append new page results to accumulated list
  useEffect(() => {
    if (data?.data) {
      if (currentPage === 1) {
        setAllResults(data.data);
      } else {
        setAllResults((prev) => [...prev, ...data.data]);
      }
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const channels = allResults;

  const allResultIds = allResults.map((ch) => ch.id);
  const allPageSelected =
    allResultIds.length > 0 && allResultIds.every((id) => selectedIds.has(id));
  const somePageSelected = allResultIds.some((id) => selectedIds.has(id));

  function handleSelectAll() {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allResultIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allResultIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }

  function handleSearch(q: string) {
    setFilters((prev) => ({ ...prev, q, page: 1 }));
    if (q.trim()) addQuery(q.trim());
  }

  function handleFilterChange(changed: Partial<SearchFiltersType>) {
    setFilters((prev) => ({ ...prev, ...changed, page: 1 }));
  }

  function handleExportCSV() {
    if (channels.length === 0) return;
    const targets =
      selectedIds.size > 0
        ? channels.filter((ch) => selectedIds.has(ch.id))
        : channels;
    const csv = channelsToCSV(targets);
    const filename = `블링_검색결과_${new Date().toISOString().split("T")[0]}.csv`;
    downloadCSV(csv, filename);
  }

  const showLoadMore = currentPage < totalPages;

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = useCallback(() => {
    if (!isFetching && showLoadMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      setFilters((prev) => ({ ...prev, page: nextPage }));
    }
  }, [isFetching, showLoadMore, currentPage]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleLoadMore]);

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "채널 검색" }]} />
      {/* 검색바 */}
      <div className="w-full max-w-2xl">
        <SearchBar onSearch={handleSearch} defaultValue={filters.q ?? ""} />
      </div>

      {/* 검색 히스토리 */}
      <SearchHistory onSelect={handleSearch} />

      {/* 필터 */}
      <SearchFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* 결과 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {isLoading ? (
            <p className="text-sm text-slate-400">검색 중...</p>
          ) : (
            <p className="text-sm text-slate-400">
              총{" "}
              <span className="font-semibold text-slate-200">
                {total.toLocaleString()}
              </span>
              개 채널
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={channels.length === 0}
            className="h-7 text-xs border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 gap-1.5"
          >
            <Download className="h-3 w-3" />
            CSV
          </Button>
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-violet-500"
              checked={allPageSelected}
              ref={(el) => {
                if (el) el.indeterminate = !allPageSelected && somePageSelected;
              }}
              onChange={handleSelectAll}
            />
            {selectedIds.size > 0 ? `${selectedIds.size}개 선택됨` : "전체 선택"}
          </label>
        </div>
      </div>

      {/* 테이블 헤더 */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900" role="region" aria-label="검색 결과">
        {/* 헤더 행 */}
        <div className="grid grid-cols-[48px_minmax(180px,1fr)_110px_90px_110px_80px_110px_90px_minmax(140px,1fr)_40px] items-center gap-2 border-b border-slate-800 px-4 py-2.5 min-w-[1080px] bg-slate-800/50">
          <div className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            순위
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            채널
          </div>
          <div className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            구독자
          </div>
          <div className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            성장률
          </div>
          <div className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            일 조회수
          </div>
          <div className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            트렌드
          </div>
          <div className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            예상 수익
          </div>
          <div className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            구독자 변화
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            최신 영상
          </div>
          <div />
        </div>

        {/* 로딩 스켈레톤 */}
        {isLoading && (
          <div className="min-w-[1080px]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[48px_minmax(180px,1fr)_110px_90px_110px_80px_110px_90px_minmax(140px,1fr)_40px] items-center gap-2 border-b border-slate-800 px-4 py-3 last:border-0"
              >
                <div className="mx-auto h-4 w-6 animate-pulse rounded bg-slate-700" />
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-700" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-32 animate-pulse rounded bg-slate-700" />
                    <div className="h-3 w-16 animate-pulse rounded bg-slate-700" />
                  </div>
                </div>
                {Array.from({ length: 7 }).map((_, j) => (
                  <div
                    key={j}
                    className="ml-auto h-3 w-14 animate-pulse rounded bg-slate-700"
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* 결과 목록 */}
        {!isLoading && channels.length > 0 && (
          <div>
            {channels.map((channel, idx) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                rank={idx + 1}
              />
            ))}
          </div>
        )}

        {/* 에러 상태 */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <AlertTriangle className="mb-3 h-10 w-10 text-red-400" />
            <p className="text-sm font-medium text-slate-300">
              검색 중 오류가 발생했습니다
            </p>
            <p className="mt-1 text-xs text-slate-500">
              잠시 후 다시 시도해주세요.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-4 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              다시 시도
            </Button>
          </div>
        )}

        {/* 빈 결과 */}
        {!isLoading && !isError && channels.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <SearchX className="mb-3 h-10 w-10 text-slate-600" />
            <p className="text-sm font-medium text-slate-400">
              검색 결과가 없습니다
            </p>
            <p className="mt-1 text-xs text-slate-600">
              다른 키워드나 필터를 시도해보세요.
            </p>
          </div>
        )}
      </div>

      {/* 자동 로딩 / 더보기 */}
      {!isLoading && showLoadMore && (
        <div ref={loadMoreRef} className="flex justify-center pt-4 pb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={isFetching}
            className="min-w-[140px] border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-100 gap-2"
          >
            {isFetching ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                불러오는 중...
              </>
            ) : (
              "더보기"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
