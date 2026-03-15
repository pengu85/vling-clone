"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import {
  Zap,
  TrendingUp,
  ThumbsUp,
  MessageCircle,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Search,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Breadcrumb } from "@/components/ui/breadcrumb";

/* ---------- Types ---------- */

interface ViralFactor {
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

interface TimelinePoint {
  label: string;
  hours: number;
  optimistic: number;
  baseline: number;
  conservative: number;
  actual?: number;
}

interface ViralPrediction {
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  hoursOld: number;
  currentViews: number;
  currentLikes: number;
  currentComments: number;
  viralScore: number;
  metrics: {
    viewsPerHour: number;
    engagementRate: number;
    commentsPerHour: number;
    categoryMultiplier: number;
  };
  timeline: TimelinePoint[];
  factors: ViralFactor[];
}

/* ---------- API call ---------- */

async function predictViral(videoUrl: string): Promise<ViralPrediction> {
  const res = await fetch("/api/tools/viral-predictor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoUrl }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || "예측에 실패했습니다");
  return json.data;
}

/* ---------- Helpers ---------- */

function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function getScoreColor(score: number) {
  if (score >= 80) return { ring: "#ef4444", text: "text-red-400", label: "HOT" };
  if (score >= 60) return { ring: "#f97316", text: "text-orange-400", label: "WARM" };
  if (score >= 40) return { ring: "#eab308", text: "text-yellow-400", label: "MILD" };
  return { ring: "#3b82f6", text: "text-blue-400", label: "COLD" };
}

function getStatusIcon(status: "pass" | "warn" | "fail") {
  switch (status) {
    case "pass":
      return <CheckCircle2 className="size-4 text-green-400 shrink-0" />;
    case "warn":
      return <AlertTriangle className="size-4 text-yellow-400 shrink-0" />;
    case "fail":
      return <XCircle className="size-4 text-red-400 shrink-0" />;
  }
}

/* ---------- Sub-components ---------- */

function ViralGauge({ score }: { score: number }) {
  const { ring, text, label } = getScoreColor(score);
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="pt-6 flex flex-col items-center">
        <div className="relative size-40">
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
            <span className={`text-3xl font-bold ${text}`}>{score}%</span>
            <span className="text-xs text-slate-500 mt-0.5">{label}</span>
          </div>
        </div>
        <p className="text-sm text-slate-400 mt-3">바이럴 가능성</p>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="size-4 text-slate-500" />
          <span className="text-xs text-slate-500">{label}</span>
        </div>
        <p className="text-lg font-bold text-slate-100">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function PredictionChart({ timeline }: { timeline: TimelinePoint[] }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-300">
          예측 타임라인
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={timeline}
            margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="gradOptimistic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradBaseline" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient
                id="gradConservative"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              tickFormatter={(v) => formatCompactNumber(v)}
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
              formatter={(value, name) => {
                const labels: Record<string, string> = {
                  optimistic: "낙관적",
                  baseline: "기본",
                  conservative: "보수적",
                  actual: "실제",
                };
                const n = Number(value ?? 0);
                return [formatCompactNumber(n), labels[String(name)] || String(name)];
              }}
            />
            <Legend
              verticalAlign="top"
              height={30}
              formatter={(value: string) => {
                const labels: Record<string, string> = {
                  optimistic: "낙관적",
                  baseline: "기본",
                  conservative: "보수적",
                  actual: "실제 조회수",
                };
                return labels[value] || value;
              }}
              wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
            />
            <Area
              type="monotone"
              dataKey="optimistic"
              stroke="#22c55e"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              fill="url(#gradOptimistic)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="baseline"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#gradBaseline)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="conservative"
              stroke="#f97316"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              fill="url(#gradConservative)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#a855f7"
              strokeWidth={2}
              fill="none"
              dot={{ r: 4, fill: "#a855f7", strokeWidth: 0 }}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function ViralFactors({ factors }: { factors: ViralFactor[] }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-300">
          바이럴 요인 분석
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2.5">
          {factors.map((f) => (
            <div
              key={f.label}
              className="flex items-start gap-2.5 rounded-lg bg-slate-800/50 px-3 py-2.5"
            >
              {getStatusIcon(f.status)}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-200">{f.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{f.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Main Page ---------- */

export default function ViralPredictorPage() {
  const [url, setUrl] = useState("");

  const mutation = useMutation({
    mutationFn: predictViral,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    mutation.mutate(trimmed);
  };

  const data = mutation.data;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "도구", href: "/tools/viral-predictor" }, { label: "바이럴 예측" }]} />
      {/* 헤더 */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-5 w-5 text-yellow-400" />
          <h1 className="text-xl font-bold text-slate-100">바이럴 예측</h1>
        </div>
        <p className="text-sm text-slate-400">
          YouTube 영상의 초기 성과를 분석하여 바이럴 가능성을 예측합니다
        </p>
      </div>

      {/* 영상 입력 */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="YouTube 영상 URL을 입력하세요 (예: https://youtu.be/...)"
                className="pl-9 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>
            <Button
              type="submit"
              disabled={mutation.isPending || !url.trim()}
              className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-medium px-5"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  분석 중
                </>
              ) : (
                "예측"
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

      {/* 결과 대시보드 */}
      {data && (
        <>
          {/* 영상 정보 */}
          {(data.title || data.thumbnail) && (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-4 pb-4">
                <div className="flex gap-4 items-start">
                  {data.thumbnail && (
                    <div className="relative w-32 aspect-video rounded-md overflow-hidden shrink-0 bg-slate-800">
                      <Image
                        src={data.thumbnail}
                        alt={data.title}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold text-slate-100 line-clamp-2">
                      {data.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      업로드 {data.hoursOld < 24
                        ? `${data.hoursOld}시간`
                        : `${Math.round(data.hoursOld / 24)}일`} 전
                      {" | "}조회수 {data.currentViews.toLocaleString()}회
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 바이럴 게이지 + 핵심 지표 */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-1">
              <ViralGauge score={data.viralScore} />
            </div>
            <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard
                icon={TrendingUp}
                label="시간당 조회수"
                value={formatCompactNumber(data.metrics.viewsPerHour)}
                sub="조회수 증가율"
              />
              <MetricCard
                icon={ThumbsUp}
                label="참여도"
                value={`${(data.metrics.engagementRate * 100).toFixed(1)}%`}
                sub="좋아요+댓글/조회수"
              />
              <MetricCard
                icon={MessageCircle}
                label="댓글 속도"
                value={`${data.metrics.commentsPerHour}/h`}
                sub="시간당 댓글 수"
              />
              <MetricCard
                icon={BarChart2}
                label="카테고리 대비"
                value={`${data.metrics.categoryMultiplier}x`}
                sub="평균 대비 성과"
              />
            </div>
          </div>

          {/* 예측 타임라인 */}
          <PredictionChart timeline={data.timeline} />

          {/* 바이럴 요인 분석 */}
          <ViralFactors factors={data.factors} />
        </>
      )}

      {/* 빈 상태 */}
      {!data && !mutation.isPending && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <Zap className="size-10 text-slate-700 mb-3" />
            <p className="text-sm text-slate-400">
              YouTube 영상 URL을 입력하면 바이럴 가능성을 분석합니다
            </p>
            <p className="text-xs text-slate-600 mt-1">
              업로드 직후~48시간 이내 영상에서 가장 정확한 예측을 제공합니다
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
