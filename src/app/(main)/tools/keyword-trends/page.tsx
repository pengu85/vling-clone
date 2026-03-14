"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  TrendingUp,
  Search,
  Loader2,
  Plus,
  X,
  Video,
  Eye,
  BarChart3,
  Lightbulb,
  Hash,
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ---------- Types ---------- */

interface KeywordDetail {
  keyword: string;
  totalVideos: number;
  avgViews: number;
  competition: "높음" | "중간" | "낮음";
  suggestedTitles: string[];
  timeline: Array<{ label: string; videos: number; views: number }>;
}

interface RelatedKeyword {
  keyword: string;
  score: number;
}

interface KeywordTrendsData {
  keywords: KeywordDetail[];
  relatedKeywords: RelatedKeyword[];
}

/* ---------- Constants ---------- */

const LINE_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b"];
const PERIOD_OPTIONS = [
  { value: "7d" as const, label: "7일" },
  { value: "30d" as const, label: "30일" },
  { value: "90d" as const, label: "90일" },
];

/* ---------- API ---------- */

async function fetchKeywordTrends(
  keywords: string[],
  period: "7d" | "30d" | "90d"
): Promise<KeywordTrendsData> {
  const res = await fetch("/api/tools/keyword-trends", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keywords, period }),
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(json.error?.message || "데이터를 불러올 수 없습니다");
  return json.data;
}

/* ---------- Helpers ---------- */

function formatNumber(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천`;
  return n.toLocaleString();
}

function getCompetitionBadge(level: "높음" | "중간" | "낮음") {
  const styles = {
    높음: "bg-red-500/15 text-red-400",
    중간: "bg-amber-500/15 text-amber-400",
    낮음: "bg-emerald-500/15 text-emerald-400",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[level]}`}
    >
      {level}
    </span>
  );
}

/* ---------- Page ---------- */

export default function KeywordTrendsPage() {
  const [keywordInputs, setKeywordInputs] = useState<string[]>([""]);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  const mutation = useMutation({
    mutationFn: () => {
      const validKeywords = keywordInputs
        .map((k) => k.trim())
        .filter(Boolean);
      return fetchKeywordTrends(validKeywords, period);
    },
  });

  const data = mutation.data;

  const addKeywordInput = () => {
    if (keywordInputs.length < 3) {
      setKeywordInputs([...keywordInputs, ""]);
    }
  };

  const removeKeywordInput = (index: number) => {
    if (keywordInputs.length > 1) {
      setKeywordInputs(keywordInputs.filter((_, i) => i !== index));
    }
  };

  const updateKeywordInput = (index: number, value: string) => {
    const updated = [...keywordInputs];
    updated[index] = value;
    setKeywordInputs(updated);
  };

  const handleAnalyze = () => {
    const validKeywords = keywordInputs.map((k) => k.trim()).filter(Boolean);
    if (validKeywords.length === 0) return;
    mutation.mutate();
  };

  const handleRelatedKeywordClick = (keyword: string) => {
    if (keywordInputs.length < 3) {
      setKeywordInputs([...keywordInputs, keyword]);
    } else {
      // Replace the last one
      const updated = [...keywordInputs];
      updated[updated.length - 1] = keyword;
      setKeywordInputs(updated);
    }
  };

  // Merge timelines for chart
  const chartData = data
    ? data.keywords[0]?.timeline.map((point, i) => {
        const row: Record<string, string | number> = { label: point.label };
        for (const kw of data.keywords) {
          row[kw.keyword] = kw.timeline[i]?.views ?? 0;
        }
        return row;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          <h1 className="text-xl font-bold text-slate-100">키워드 추이 분석</h1>
        </div>
        <p className="text-sm text-slate-400">
          키워드의 유튜브 검색 트렌드를 분석하고 최대 3개까지 비교하세요
        </p>
      </div>

      {/* 입력 섹션 */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <Search className="h-5 w-5 text-blue-400" />
            키워드 입력
          </CardTitle>
          <CardDescription className="text-slate-400">
            최대 3개 키워드를 입력하여 동시에 비교할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {keywordInputs.map((value, index) => (
              <div key={index} className="flex gap-2">
                <div className="relative flex-1">
                  <div
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: LINE_COLORS[index] }}
                  />
                  <Input
                    value={value}
                    onChange={(e) => updateKeywordInput(index, e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                    placeholder={`키워드 ${index + 1}`}
                    className="bg-slate-800 border-slate-700 text-slate-100 focus-visible:ring-blue-500 pl-8"
                  />
                </div>
                {keywordInputs.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeKeywordInput(index)}
                    className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <div className="flex items-center gap-2">
              {keywordInputs.length < 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addKeywordInput}
                  className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  키워드 추가
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
              {/* 기간 선택 */}
              <div className="flex gap-1.5">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPeriod(opt.value)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      period === opt.value
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex-1" />

              <Button
                onClick={handleAnalyze}
                disabled={
                  mutation.isPending ||
                  keywordInputs.every((k) => !k.trim())
                }
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    분석 중
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-1" />
                    분석
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {mutation.isError && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-red-400">
              {(mutation.error as Error).message}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {mutation.isPending && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-blue-400 mr-2" />
          <span className="text-sm text-slate-400">키워드 트렌드 분석 중...</span>
        </div>
      )}

      {/* Results */}
      {data && (
        <>
          {/* 트렌드 차트 */}
          {chartData.length > 0 && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-400" />
                  트렌드 차트
                </CardTitle>
                <CardDescription className="text-slate-400">
                  기간별 관련 영상 총 조회수 추이
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatNumber(v)}
                      width={56}
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
                        "조회수",
                      ]}
                    />
                    <Legend
                      verticalAlign="top"
                      height={30}
                      wrapperStyle={{ fontSize: 12, color: "#94a3b8" }}
                    />
                    {data.keywords.map((kw, i) => (
                      <Line
                        key={kw.keyword}
                        type="monotone"
                        dataKey={kw.keyword}
                        stroke={LINE_COLORS[i]}
                        strokeWidth={2}
                        dot={{ r: 3, fill: LINE_COLORS[i], strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* 키워드별 상세 카드 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {data.keywords.map((kw, i) => (
              <Card key={kw.keyword} className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: LINE_COLORS[i] }}
                    />
                    <CardTitle className="text-base font-semibold text-slate-100 truncate">
                      {kw.keyword}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Video className="h-3 w-3" />
                        관련 영상 수
                      </p>
                      <p className="text-lg font-bold text-slate-100">
                        {formatNumber(kw.totalVideos)}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        평균 조회수
                      </p>
                      <p className="text-lg font-bold text-slate-100">
                        {formatNumber(kw.avgViews)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2 border-t border-slate-800">
                    <span className="text-xs text-slate-500">경쟁도</span>
                    {getCompetitionBadge(kw.competition)}
                  </div>

                  {kw.suggestedTitles.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-slate-800">
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" />
                        추천 제목 패턴
                      </p>
                      <div className="space-y-1">
                        {kw.suggestedTitles.slice(0, 3).map((title, ti) => (
                          <p
                            key={ti}
                            className="text-xs text-slate-400 truncate leading-relaxed"
                          >
                            {title}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 관련 키워드 추천 (태그 클라우드) */}
          {data.relatedKeywords.length > 0 && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-violet-400" />
                  관련 키워드 추천
                </CardTitle>
                <CardDescription className="text-slate-400">
                  클릭하면 분석 키워드에 추가됩니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.relatedKeywords.map((rk) => (
                    <button
                      key={rk.keyword}
                      type="button"
                      onClick={() => handleRelatedKeywordClick(rk.keyword)}
                      className="group flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-300"
                    >
                      <Hash className="h-3 w-3 text-slate-500 group-hover:text-violet-400" />
                      {rk.keyword}
                      <Badge
                        variant="secondary"
                        className="bg-slate-700 text-slate-400 border-0 text-[10px] ml-1 group-hover:bg-violet-500/20 group-hover:text-violet-300"
                      >
                        {rk.score}
                      </Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
