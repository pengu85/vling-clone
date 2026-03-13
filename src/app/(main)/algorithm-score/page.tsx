"use client";

import { useState, useCallback } from "react";
import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchBar } from "@/components/search/SearchBar";
import { useAlgorithmSearch } from "@/hooks/useAlgorithmSearch";
import { formatNumber, formatCurrency, formatDate } from "@/lib/formatters";
import { CATEGORIES } from "@/domain/categories";
import type { ChannelSearchResult } from "@/types";

const MIN_SCORE_OPTIONS = [
  { value: "0", label: "전체" },
  { value: "50", label: "50+ 이상" },
  { value: "60", label: "60+ 이상" },
  { value: "70", label: "70+ 이상" },
  { value: "80", label: "80+ 이상" },
  { value: "90", label: "90+ 이상" },
];

const LIMIT = 20;

function getScoreColor(score: number) {
  if (score >= 90) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (score >= 70) return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  if (score >= 50) return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
  return "bg-slate-500/15 text-slate-400 border-slate-500/30";
}

function getScoreBarColor(score: number) {
  if (score >= 90) return "bg-emerald-500";
  if (score >= 70) return "bg-blue-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-slate-500";
}

function AlgoScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${getScoreBarColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <Badge
        variant="outline"
        className={`text-[10px] h-4 px-1.5 font-semibold border ${getScoreColor(score)}`}
      >
        {score}
      </Badge>
    </div>
  );
}

function ChannelTableRow({
  channel,
  rank,
}: {
  channel: ChannelSearchResult;
  rank: number;
}) {
  const categoryLabel =
    CATEGORIES.find((c) => c.value === channel.category)?.label ?? channel.category;

  return (
    <div className="grid grid-cols-[40px_minmax(180px,1fr)_80px_100px_110px_130px_minmax(120px,1fr)] items-center gap-3 px-4 py-3 hover:bg-slate-800/60 transition-colors border-b border-slate-800 last:border-0 min-w-[900px]">
      {/* 순위 */}
      <div className="text-center">
        <span className="text-sm font-semibold text-slate-400">{rank}</span>
      </div>

      {/* 채널 */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-700">
          {channel.thumbnailUrl ? (
            <img
              src={channel.thumbnailUrl}
              alt={channel.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs text-slate-500 font-medium">
              {channel.title.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-100">
            {channel.title}
          </p>
          <Badge
            variant="secondary"
            className="mt-0.5 h-4 px-1.5 text-[10px] bg-slate-700 text-slate-400 border-0"
          >
            {categoryLabel}
          </Badge>
        </div>
      </div>

      {/* 알고리즘 스코어 */}
      <div>
        <AlgoScoreBar score={channel.algoScore} />
      </div>

      {/* 구독자 */}
      <div className="text-right">
        <p className="text-sm font-medium text-slate-200">
          {formatNumber(channel.subscriberCount)}
        </p>
        <p className="text-[10px] text-slate-500">구독자</p>
      </div>

      {/* 일 평균 조회수 */}
      <div className="text-right">
        <p className="text-sm font-medium text-slate-200">
          {formatNumber(channel.dailyAvgViews)}
        </p>
        <p className="text-[10px] text-slate-500">일 조회수</p>
      </div>

      {/* 예상 수익 */}
      <div className="text-right">
        <p className="text-sm font-medium text-slate-200">
          {formatCurrency(channel.estimatedRevenue)}
        </p>
        <p className="text-[10px] text-slate-500">예상 수익</p>
      </div>

      {/* 최신 영상 */}
      <div className="min-w-0">
        {channel.latestVideo ? (
          <>
            <p className="truncate text-xs text-slate-300">
              {channel.latestVideo.title}
            </p>
            <p className="text-[10px] text-slate-500">
              {formatDate(channel.latestVideo.publishedAt)}
            </p>
          </>
        ) : (
          <p className="text-xs text-slate-600">-</p>
        )}
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[40px_minmax(180px,1fr)_80px_100px_110px_130px_minmax(120px,1fr)] items-center gap-3 px-4 py-3 border-b border-slate-800 min-w-[900px] animate-pulse">
      <div className="h-4 w-6 rounded bg-slate-800 mx-auto" />
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-slate-800 shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 w-28 rounded bg-slate-800" />
          <div className="h-3 w-14 rounded bg-slate-800" />
        </div>
      </div>
      <div className="h-3 w-20 rounded bg-slate-800" />
      <div className="h-3 w-16 rounded bg-slate-800 ml-auto" />
      <div className="h-3 w-16 rounded bg-slate-800 ml-auto" />
      <div className="h-3 w-16 rounded bg-slate-800 ml-auto" />
      <div className="h-3 w-24 rounded bg-slate-800" />
    </div>
  );
}

export default function AlgorithmScorePage() {
  const [q, setQ] = useState("");
  const [minScore, setMinScore] = useState("0");
  const [page, setPage] = useState(1);

  const handleSearch = useCallback((query: string) => {
    setQ(query);
    setPage(1);
  }, []);

  const handleMinScore = useCallback((val: string | null) => {
    if (val) {
      setMinScore(val);
      setPage(1);
    }
  }, []);

  const { data, isLoading, isError } = useAlgorithmSearch({
    q: q || undefined,
    minScore: parseInt(minScore) || undefined,
    page,
    limit: LIMIT,
  });

  const channels = data?.data ?? [];
  const pagination = data?.pagination;
  const hasMore = pagination ? page < pagination.totalPages : false;

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-5 w-5 text-blue-400" />
          <h1 className="text-xl font-bold text-slate-100">알고리즘 영상 검색</h1>
        </div>
        <p className="text-sm text-slate-400">
          알고리즘 스코어가 높은 채널을 찾아보세요
        </p>
      </div>

      {/* 필터 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 max-w-md">
          <SearchBar onSearch={handleSearch} defaultValue={q} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 shrink-0">최소 스코어</span>
          <Select value={minScore} onValueChange={handleMinScore}>
            <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-slate-200 h-9 text-sm focus:ring-violet-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {MIN_SCORE_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-slate-200 focus:bg-slate-700 focus:text-slate-100"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {pagination && (
          <span className="text-xs text-slate-500 shrink-0">
            총 {pagination.total}개
          </span>
        )}
      </div>

      {/* 테이블 헤더 */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        {/* 헤더 행 */}
        <div className="grid grid-cols-[40px_minmax(180px,1fr)_80px_100px_110px_130px_minmax(120px,1fr)] gap-3 px-4 py-2.5 border-b border-slate-800 bg-slate-800/50 min-w-[900px]">
          <div className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            #
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            채널
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            알고리즘
          </div>
          <div className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            구독자
          </div>
          <div className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            일 조회수
          </div>
          <div className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            예상 수익
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            최신 영상
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="overflow-x-auto">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          ) : isError ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              데이터를 불러오지 못했습니다. 잠시 후 다시 시도하세요.
            </div>
          ) : channels.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              조건에 맞는 채널이 없습니다
            </div>
          ) : (
            channels.map((channel, idx) => (
              <ChannelTableRow
                key={channel.id}
                channel={channel}
                rank={(page - 1) * LIMIT + idx + 1}
              />
            ))
          )}
        </div>
      </Card>

      {/* 더보기 */}
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
          >
            더보기 ({pagination!.total - page * LIMIT > 0 ? pagination!.total - page * LIMIT : 0}개 더)
          </Button>
        </div>
      )}

      {/* 스코어 범례 */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "90+ 최고", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
          { label: "70-89 높음", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
          { label: "50-69 보통", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
          { label: "50 미만", color: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
        ].map(({ label, color }) => (
          <Badge
            key={label}
            variant="outline"
            className={`text-[11px] border ${color}`}
          >
            {label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
