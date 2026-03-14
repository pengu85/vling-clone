"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Microscope,
  Search,
  Loader2,
  Clock,
  Hash,
  BarChart2,
  Gauge,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ---------- Types ---------- */

interface TrafficSource {
  name: string;
  value: number;
  color: string;
}

interface HeatmapCell {
  day: number;
  hour: number;
  avgViews: number;
  intensity: number;
  isBest: boolean;
}

interface KeywordStat {
  keyword: string;
  count: number;
  avgViews: number;
  performance: "high" | "medium" | "low";
}

interface UploadPatternDay {
  day: string;
  uploads: number;
  avgViews: number;
}

interface AlgorithmScoreItem {
  label: string;
  score: number;
  maxScore: number;
}

interface AlgorithmAnatomyResponse {
  channelName: string;
  channelThumbnail: string;
  subscribers: number;
  trafficSources: TrafficSource[];
  heatmap: HeatmapCell[];
  bestTimes: { day: string; hour: number }[];
  keywords: KeywordStat[];
  uploadPattern: UploadPatternDay[];
  algorithmScore: number;
  algorithmFactors: AlgorithmScoreItem[];
}

/* ---------- API call ---------- */

async function analyzeChannel(channelId: string): Promise<AlgorithmAnatomyResponse> {
  const res = await fetch("/api/tools/algorithm-anatomy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channelId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || "분석에 실패했습니다");
  return json.data;
}

/* ---------- Helpers ---------- */

function formatCompactNumber(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}천`;
  return n.toLocaleString();
}

function getScoreColor(score: number) {
  if (score >= 80) return { ring: "#10b981", text: "text-emerald-400", label: "최적화됨" };
  if (score >= 60) return { ring: "#3b82f6", text: "text-blue-400", label: "양호" };
  if (score >= 40) return { ring: "#f59e0b", text: "text-amber-400", label: "보통" };
  return { ring: "#ef4444", text: "text-red-400", label: "개선 필요" };
}

const DAY_NAMES = ["월", "화", "수", "목", "금", "토", "일"];

/* ---------- Sub-components ---------- */

function TrafficDonutChart({ sources }: { sources: TrafficSource[] }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <BarChart2 className="size-4 text-blue-400" />
          유입 경로 추정
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={sources}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={100}
                dataKey="value"
                nameKey="name"
                strokeWidth={2}
                stroke="#0f172a"
              >
                {sources.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #334155",
                  backgroundColor: "#1e293b",
                  color: "#e2e8f0",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.4)",
                }}
                formatter={(value) => [`${Number(value ?? 0)}%`, ""]}
              />
              {/* Center label */}
              <text
                x="50%"
                y="48%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-slate-400 text-xs"
              >
                유입
              </text>
              <text
                x="50%"
                y="56%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-slate-300 text-sm font-semibold"
              >
                분석
              </text>
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {sources.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-xs text-slate-400">
                  {s.name} {s.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ViewsHeatmap({
  heatmap,
  bestTimes,
}: {
  heatmap: HeatmapCell[];
  bestTimes: { day: string; hour: number }[];
}) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Clock className="size-4 text-emerald-400" />
          시간대별 조회수 히트맵
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Best times summary */}
        {bestTimes.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="text-xs text-slate-500">최적 시간:</span>
            {bestTimes.map((bt, i) => (
              <span
                key={i}
                className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5"
              >
                {bt.day} {bt.hour}시
              </span>
            ))}
          </div>
        )}

        {/* Hour labels */}
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[40px_repeat(24,1fr)] gap-0.5 mb-1">
              <div />
              {Array.from({ length: 24 }, (_, h) => (
                <div
                  key={h}
                  className="text-center text-[10px] text-slate-600"
                >
                  {h % 3 === 0 ? h : ""}
                </div>
              ))}
            </div>

            {/* Grid rows */}
            {DAY_NAMES.map((dayName, d) => (
              <div
                key={d}
                className="grid grid-cols-[40px_repeat(24,1fr)] gap-0.5 mb-0.5"
              >
                <div className="text-xs text-slate-500 flex items-center justify-end pr-1.5">
                  {dayName}
                </div>
                {Array.from({ length: 24 }, (_, h) => {
                  const cell = heatmap[d * 24 + h];
                  if (!cell) return <div key={h} className="w-4 h-4 rounded-sm bg-slate-800/50" />;

                  return (
                    <div
                      key={h}
                      title={`${dayName} ${h}시 - 평균 ${formatCompactNumber(cell.avgViews)}회`}
                      className={`w-4 h-4 rounded-sm transition-colors ${
                        cell.isBest ? "ring-2 ring-emerald-400" : ""
                      }`}
                      style={{
                        backgroundColor:
                          cell.intensity > 0
                            ? `rgba(59, 130, 246, ${Math.max(0.08, cell.intensity * 0.9)})`
                            : "rgba(30, 41, 59, 0.5)",
                      }}
                    />
                  );
                })}
              </div>
            ))}

            {/* Intensity legend */}
            <div className="flex items-center gap-1.5 mt-3 justify-end">
              <span className="text-[10px] text-slate-600">적음</span>
              {[0.1, 0.25, 0.45, 0.65, 0.85].map((opacity, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: `rgba(59, 130, 246, ${opacity})` }}
                />
              ))}
              <span className="text-[10px] text-slate-600">많음</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KeywordTable({ keywords }: { keywords: KeywordStat[] }) {
  if (keywords.length === 0) return null;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Hash className="size-4 text-amber-400" />
          제목/태그 성과 분석
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-2 px-2 text-xs font-medium text-slate-500">
                  키워드
                </th>
                <th className="text-center py-2 px-2 text-xs font-medium text-slate-500">
                  사용 횟수
                </th>
                <th className="text-right py-2 px-2 text-xs font-medium text-slate-500">
                  평균 조회수
                </th>
                <th className="text-center py-2 px-2 text-xs font-medium text-slate-500">
                  성과
                </th>
              </tr>
            </thead>
            <tbody>
              {keywords.map((kw) => (
                <tr key={kw.keyword} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="py-2 px-2 text-slate-200 font-medium">
                    {kw.keyword}
                  </td>
                  <td className="py-2 px-2 text-center text-slate-400">
                    {kw.count}회
                  </td>
                  <td className="py-2 px-2 text-right text-slate-300">
                    {formatCompactNumber(kw.avgViews)}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        kw.performance === "high"
                          ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                          : kw.performance === "low"
                            ? "text-red-400 bg-red-500/10 border border-red-500/20"
                            : "text-slate-400 bg-slate-500/10 border border-slate-500/20"
                      }`}
                    >
                      {kw.performance === "high"
                        ? "높음"
                        : kw.performance === "low"
                          ? "낮음"
                          : "보통"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function UploadPatternChart({ pattern }: { pattern: UploadPatternDay[] }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <BarChart2 className="size-4 text-purple-400" />
          업로드 패턴
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={pattern}
            margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              label={{
                value: "업로드 수",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 10, fill: "#64748b" },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCompactNumber(v)}
              label={{
                value: "평균 조회수",
                angle: 90,
                position: "insideRight",
                style: { fontSize: 10, fill: "#64748b" },
              }}
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
              formatter={(value, name) => {
                const n = Number(value ?? 0);
                const labels: Record<string, string> = {
                  uploads: "업로드 수",
                  avgViews: "평균 조회수",
                };
                return [
                  String(name) === "avgViews"
                    ? formatCompactNumber(n)
                    : n,
                  labels[String(name)] || String(name),
                ];
              }}
            />
            <Legend
              verticalAlign="top"
              height={30}
              formatter={(value: string) => {
                const labels: Record<string, string> = {
                  uploads: "업로드 수",
                  avgViews: "평균 조회수",
                };
                return labels[value] || value;
              }}
              wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
            />
            <Bar
              yAxisId="left"
              dataKey="uploads"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
              barSize={24}
            />
            <Bar
              yAxisId="right"
              dataKey="avgViews"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              barSize={24}
              opacity={0.7}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function AlgorithmGauge({
  score,
  factors,
}: {
  score: number;
  factors: AlgorithmScoreItem[];
}) {
  const { ring, text, label } = getScoreColor(score);
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Gauge className="size-4 text-emerald-400" />
          알고리즘 추천 지수
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Gauge */}
          <div className="relative size-40 shrink-0">
            <svg viewBox="0 0 120 120" className="size-full -rotate-90">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="#1e293b"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={ring}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${text}`}>{score}</span>
              <span className="text-xs text-slate-500 mt-0.5">{label}</span>
            </div>
          </div>

          {/* Factors */}
          <div className="flex-1 w-full space-y-3">
            {factors.map((f) => (
              <div key={f.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">{f.label}</span>
                  <span className="text-xs font-medium text-slate-300">
                    {f.score}/{f.maxScore}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(f.score / f.maxScore) * 100}%`,
                      backgroundColor:
                        f.score / f.maxScore >= 0.7
                          ? "#10b981"
                          : f.score / f.maxScore >= 0.4
                            ? "#f59e0b"
                            : "#ef4444",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Main Page ---------- */

export default function AlgorithmAnatomyPage() {
  const [input, setInput] = useState("");

  const mutation = useMutation({
    mutationFn: analyzeChannel,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    mutation.mutate(trimmed);
  };

  const data = mutation.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Microscope className="h-5 w-5 text-emerald-400" />
          <h1 className="text-xl font-bold text-slate-100">알고리즘 해부도</h1>
        </div>
        <p className="text-sm text-slate-400">
          채널의 유입 경로와 알고리즘 패턴을 역추정하여 성장 전략을 분석합니다
        </p>
      </div>

      {/* Channel Input */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="채널 URL, @핸들, 채널 ID 또는 이름을 입력하세요"
                className="pl-10 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500"
              />
            </div>
            <Button
              type="submit"
              disabled={mutation.isPending || !input.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  분석 중
                </>
              ) : (
                "분석"
              )}
            </Button>
          </form>
          {mutation.isError && (
            <p className="text-xs text-red-400 mt-2">
              {mutation.error.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {data && (
        <>
          {/* Channel Info Banner */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative size-12 rounded-full overflow-hidden bg-slate-800 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.channelThumbnail}
                    alt={data.channelName}
                    className="size-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-100">
                    {data.channelName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    구독자 {formatCompactNumber(data.subscribers)}명
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Traffic Sources + Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TrafficDonutChart sources={data.trafficSources} />
            <ViewsHeatmap heatmap={data.heatmap} bestTimes={data.bestTimes} />
          </div>

          {/* Keyword Table */}
          <KeywordTable keywords={data.keywords} />

          {/* Upload Pattern + Algorithm Score */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <UploadPatternChart pattern={data.uploadPattern} />
            <AlgorithmGauge
              score={data.algorithmScore}
              factors={data.algorithmFactors}
            />
          </div>
        </>
      )}

      {/* Empty State */}
      {!data && !mutation.isPending && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <Microscope className="size-10 text-slate-700 mb-3" />
            <p className="text-sm text-slate-400">
              채널을 입력하면 알고리즘 패턴을 분석합니다
            </p>
            <p className="text-xs text-slate-600 mt-1">
              유입 경로, 최적 업로드 시간, 키워드 성과를 한눈에 확인하세요
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
