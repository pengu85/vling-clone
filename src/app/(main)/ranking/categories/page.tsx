"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, DollarSign, Users, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";

interface CategoryItem {
  name: string;
  cpm: number;
  growth: number;
  channels: number;
  color: string;
}

async function fetchCategoryTrends(): Promise<CategoryItem[]> {
  const res = await fetch("/api/ranking/categories");
  if (!res.ok) throw new Error("카테고리 트렌드 로딩 실패");
  const json = await res.json();
  return json.data;
}

type SortKey = "cpm" | "growth" | "channels";

export default function CategoryTrendsPage() {
  const [sortBy, setSortBy] = useState<SortKey>("cpm");

  const { data: categories, isLoading, isError, refetch } = useQuery({
    queryKey: ["category-trends"],
    queryFn: fetchCategoryTrends,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  const sorted = categories ? [...categories].sort((a, b) => b[sortBy] - a[sortBy]) : [];

  const avgCpm = categories ? Math.round(categories.reduce((s, c) => s + c.cpm, 0) / categories.length) : 0;
  const avgGrowth = categories ? (categories.reduce((s, c) => s + c.growth, 0) / categories.length).toFixed(1) : "0";
  const totalChannels = categories ? categories.reduce((s, c) => s + c.channels, 0) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <BarChart3 className="h-6 w-6 text-violet-400" />
            <h1 className="text-2xl font-bold text-white">카테고리별 트렌드</h1>
          </div>
          <p className="text-sm text-slate-400">카테고리별 CPM, 성장률, 채널 규모를 한눈에 비교하세요</p>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-slate-800" />
              ))}
            </div>
            <div className="h-72 rounded-xl bg-slate-800" />
            <div className="h-96 rounded-xl bg-slate-800" />
          </div>
        )}

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

        {/* 요약 카드 */}
        {!isLoading && !isError && categories && (<>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-violet-400 mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs font-medium">평균 CPM</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(avgCpm)}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">평균 성장률</span>
              </div>
              <p className="text-2xl font-bold text-white">+{avgGrowth}%</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">총 분석 채널</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalChannels.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* CPM 차트 */}
        <Card className="bg-slate-900 border-slate-800 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-slate-200">카테고리별 CPM 비교</CardTitle>
              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">추정치</span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sorted} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₩${(v / 1000).toFixed(0)}K`}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "8px",
                    color: "#e2e8f0",
                    fontSize: 12,
                  }}
                  formatter={(value: unknown) => [formatCurrency(Number(value)), "CPM"]}
                />
                <Bar dataKey="cpm" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {sorted.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 카테고리 테이블 */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-slate-200">카테고리 상세</CardTitle>
              <div className="flex gap-1">
                {([
                  { key: "cpm" as SortKey, label: "CPM순" },
                  { key: "growth" as SortKey, label: "성장률순" },
                  { key: "channels" as SortKey, label: "채널수순" },
                ]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key)}
                    aria-pressed={sortBy === key}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      sortBy === key
                        ? "bg-violet-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-800">
              {sorted.map((cat, i) => (
                <div key={cat.name} className="flex items-center py-3 gap-4">
                  <span className="w-6 text-center text-sm font-semibold text-slate-500">{i + 1}</span>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm font-medium text-slate-200">{cat.name}</span>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className="text-sm font-medium text-slate-200">{formatCurrency(cat.cpm)}</p>
                    <p className="text-[10px] text-slate-500">CPM</p>
                  </div>
                  <div className="text-right min-w-[70px]">
                    <p className={`text-sm font-medium ${cat.growth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {cat.growth >= 0 ? "+" : ""}{cat.growth}%
                    </p>
                    <p className="text-[10px] text-slate-500">성장률</p>
                  </div>
                  <div className="text-right min-w-[70px]">
                    <p className="text-sm font-medium text-slate-200">{cat.channels.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500">채널</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </>)}
      </div>
    </div>
  );
}
