"use client";

import { useState } from "react";
import { TrendingUp, Flame, Zap, ArrowUpRight, AlertTriangle } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

const LIMIT = 20;

export default function GrowthRankingPage() {
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useRanking({
    type: "growth",
    category,
    page,
    limit: LIMIT,
  });

  const items = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  // Summary stats from the data
  const avgGrowth = items.length > 0
    ? (items.reduce((sum, i) => sum + i.channel.growthRate30d, 0) / items.length).toFixed(1)
    : "0";
  const maxGrowth = items.length > 0
    ? Math.max(...items.map((i) => i.channel.growthRate30d)).toFixed(1)
    : "0";

  return (
    <div className="text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "랭킹", href: "/ranking/subscriber" }, { label: "성장" }]} />
        {/* 히어로 헤더 */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-orange-600/20 via-red-600/20 to-pink-600/20 border border-orange-500/20 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">요즘 뜨는 채널</h1>
              <p className="text-sm text-slate-400">
                성장률과 일 조회수를 종합하여 가장 주목받는 채널을 확인하세요
              </p>
            </div>
          </div>

          {/* 요약 카드 */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-4 pb-4 text-center">
                <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium">평균 성장률</span>
                </div>
                <p className="text-2xl font-bold text-white">+{avgGrowth}%</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-4 pb-4 text-center">
                <div className="flex items-center justify-center gap-1 text-red-400 mb-1">
                  <Zap className="h-4 w-4" />
                  <span className="text-xs font-medium">최고 성장률</span>
                </div>
                <p className="text-2xl font-bold text-white">+{maxGrowth}%</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-4 pb-4 text-center">
                <div className="flex items-center justify-center gap-1 text-pink-400 mb-1">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="text-xs font-medium">분석 채널</span>
                </div>
                <p className="text-2xl font-bold text-white">{data?.pagination?.total ?? 0}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 필터 */}
        <div className="mb-5 flex items-center gap-2">
          <Select value={category} onValueChange={(v) => { setCategory(v ?? "all"); setPage(1); }}>
            <SelectTrigger className="h-8 w-36 border-slate-700 bg-slate-800 text-slate-300 text-xs">
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
          <Badge className="bg-orange-600/20 text-orange-300 border-orange-500/30 text-xs">
            성장률 + 일 조회수 종합
          </Badge>
        </div>

        {/* Error state */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <AlertTriangle className="w-12 h-12 mb-4 text-yellow-500" />
            <p className="text-lg mb-2">데이터를 불러올 수 없습니다</p>
            <p className="text-sm mb-4">잠시 후 다시 시도해주세요</p>
            <button onClick={() => refetch()} className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors">
              다시 시도
            </button>
          </div>
        )}

        {/* 테이블 */}
        {!isError && <RankingTable data={items} isLoading={isLoading} />}

        {/* 페이지네이션 */}
        {!isLoading && !isError && totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="h-8 px-3 rounded-lg bg-slate-800 text-slate-400 text-sm hover:bg-slate-700 disabled:opacity-30"
            >
              이전
            </button>
            <span className="flex items-center px-3 text-sm text-slate-500">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="h-8 px-3 rounded-lg bg-slate-800 text-slate-400 text-sm hover:bg-slate-700 disabled:opacity-30"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
