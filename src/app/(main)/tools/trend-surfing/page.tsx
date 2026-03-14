"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Waves,
  Flame,
  Gem,
  TrendingUp,
  Loader2,
  Video,
  Search as SearchIcon,
  BarChart2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* ---------- Types ---------- */

interface TrendingKeyword {
  rank: number;
  keyword: string;
  videoCount: number;
  growth: number;
  competition: "높음" | "중간" | "낮음";
}

interface BlueOceanKeyword {
  keyword: string;
  searchVolume: number;
  videoCount: number;
  opportunityScore: number;
}

interface TrendTimelinePoint {
  day: string;
  value: number;
}

interface TrendSurfingData {
  trendingKeywords: TrendingKeyword[];
  blueOceanKeywords: BlueOceanKeyword[];
  timeline: Record<string, TrendTimelinePoint[]>;
}

/* ---------- Constants ---------- */

const categories = [
  "전체", "엔터", "교육", "게임", "뷰티", "테크", "음식", "여행", "스포츠",
] as const;

const regions = ["한국", "미국", "일본", "글로벌"] as const;

/* ---------- API Call ---------- */

async function fetchTrendSurfing(
  category: string,
  region: string
): Promise<TrendSurfingData> {
  const res = await fetch("/api/tools/trend-surfing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, region }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || "데이터를 불러올 수 없습니다");
  return json.data;
}

/* ---------- Helpers ---------- */

function formatNumber(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천`;
  return n.toLocaleString();
}

function getCompetitionBadge(level: "높음" | "중간" | "낮음") {
  switch (level) {
    case "높음":
      return (
        <span className="inline-flex items-center rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-400">
          높음
        </span>
      );
    case "중간":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
          중간
        </span>
      );
    case "낮음":
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
          낮음
        </span>
      );
  }
}

/* ---------- Sub-components ---------- */

function TrendingCard({
  item,
  isSelected,
  onSelect,
}: {
  item: TrendingKeyword;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-lg border p-3 transition-colors ${
        isSelected
          ? "border-blue-500/50 bg-blue-500/10"
          : "border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800/60"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-slate-600 w-8 text-center shrink-0">
          {item.rank}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-100 truncate">
              {item.keyword}
            </span>
            {getCompetitionBadge(item.competition)}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Video className="size-3" />
              {formatNumber(item.videoCount)}개
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <TrendingUp className="size-3" />
              +{item.growth}%
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function BlueOceanCard({
  item,
  isSelected,
  onSelect,
}: {
  item: BlueOceanKeyword;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-lg border p-3 transition-colors ${
        isSelected
          ? "border-blue-500/50 bg-blue-500/10"
          : "border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800/60"
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-slate-100 truncate">
            {item.keyword}
          </span>
          {item.opportunityScore >= 80 && (
            <span className="inline-flex items-center shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400 animate-pulse">
              지금 선점하세요!
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <SearchIcon className="size-3" />
            {formatNumber(item.searchVolume)}
          </span>
          <span className="flex items-center gap-1">
            <Video className="size-3" />
            {item.videoCount}개
          </span>
        </div>
        {/* Opportunity score progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">기회 점수</span>
            <span
              className={`text-xs font-bold ${
                item.opportunityScore >= 80
                  ? "text-emerald-400"
                  : item.opportunityScore >= 60
                    ? "text-amber-400"
                    : "text-slate-400"
              }`}
            >
              {item.opportunityScore}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                item.opportunityScore >= 80
                  ? "bg-emerald-500"
                  : item.opportunityScore >= 60
                    ? "bg-amber-500"
                    : "bg-slate-500"
              }`}
              style={{ width: `${item.opportunityScore}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

function TrendTimeline({
  timeline,
  selectedKeyword,
}: {
  timeline: Record<string, TrendTimelinePoint[]>;
  selectedKeyword: string | null;
}) {
  const keywordData = selectedKeyword ? timeline[selectedKeyword] : null;

  if (!keywordData || keywordData.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <BarChart2 className="size-4 text-slate-500" />
            트렌드 타임라인
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart2 className="size-8 text-slate-700 mb-2" />
            <p className="text-sm text-slate-500">
              위 키워드를 클릭하면 7일 트렌드를 확인할 수 있습니다
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <BarChart2 className="size-4 text-slate-500" />
          트렌드 타임라인 &mdash;{" "}
          <span className="text-blue-400">{selectedKeyword}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart
            data={keywordData}
            margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatNumber(v)}
              width={52}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #334155",
                backgroundColor: "#1e293b",
                color: "#e2e8f0",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.4)",
              }}
              formatter={(value) => [
                formatNumber(Number(value ?? 0)),
                "검색 트렌드",
              ]}
            />
            <Legend
              verticalAlign="top"
              height={30}
              formatter={() => "검색 트렌드"}
              wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#60a5fa" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/* ---------- Main Page ---------- */

export default function TrendSurfingPage() {
  const [category, setCategory] = useState<string>("전체");
  const [region, setRegion] = useState<string>("한국");
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["trend-surfing", category, region],
    queryFn: () => fetchTrendSurfing(category, region),
    staleTime: 10 * 60 * 1000,
  });

  // Reset selected keyword when data changes
  const handleKeywordSelect = (keyword: string) => {
    setSelectedKeyword((prev) => (prev === keyword ? null : keyword));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Waves className="h-5 w-5 text-blue-400" />
          <h1 className="text-xl font-bold text-slate-100">트렌드 서핑</h1>
        </div>
        <p className="text-sm text-slate-400">
          급상승 키워드와 블루오션 키워드를 탐지하여 콘텐츠 기회를 선점하세요
        </p>
      </div>

      {/* Category + Region Filters */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    setSelectedKeyword(null);
                  }}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    category === cat
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Region Dropdown */}
            <select
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                setSelectedKeyword(null);
              }}
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-blue-500 w-fit"
            >
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-blue-400 mr-2" />
          <span className="text-sm text-slate-400">트렌드 분석 중...</span>
        </div>
      )}

      {/* Error */}
      {isError && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-12 flex flex-col items-center text-center">
            <p className="text-sm text-red-400">{(error as Error).message}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {data && (
        <>
          {/* 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Trending Keywords */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <Flame className="size-5 text-orange-400" />
                  급상승 키워드
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {data.trendingKeywords.map((item) => (
                    <TrendingCard
                      key={item.rank}
                      item={item}
                      isSelected={selectedKeyword === item.keyword}
                      onSelect={() => handleKeywordSelect(item.keyword)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Right: Blue Ocean Keywords */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <Gem className="size-5 text-cyan-400" />
                  블루오션 키워드
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {data.blueOceanKeywords.map((item) => (
                    <BlueOceanCard
                      key={item.keyword}
                      item={item}
                      isSelected={selectedKeyword === item.keyword}
                      onSelect={() => handleKeywordSelect(item.keyword)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trend Timeline */}
          <TrendTimeline
            timeline={data.timeline}
            selectedKeyword={selectedKeyword}
          />
        </>
      )}
    </div>
  );
}
