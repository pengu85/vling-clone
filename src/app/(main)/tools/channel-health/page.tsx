"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  HeartPulse,
  Search,
  Loader2,
  Clock,
  BarChart3,
  TrendingUp,
  ThumbsUp,
  Clapperboard,
  Palette,
  ShieldCheck,
  AlertTriangle,
  OctagonAlert,
  CheckCircle2,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Breadcrumb } from "@/components/ui/breadcrumb";

/* ---------- Types ---------- */

interface HealthItem {
  key: string;
  label: string;
  score: number;
  status: "good" | "warning" | "danger";
  description: string;
}

interface DiagnosisSummary {
  strengths: string[];
  improvements: string[];
  warnings: string[];
}

interface HealthResponse {
  channelId: string;
  channelName: string;
  thumbnail: string;
  subscribers: number;
  totalScore: number;
  grade: string;
  gradeComment: string;
  items: HealthItem[];
  diagnosis: DiagnosisSummary;
  categoryAverage: Record<string, number>;
  radarData: Array<{
    axis: string;
    channel: number;
    average: number;
  }>;
}

/* ---------- Helpers ---------- */

const ITEM_ICONS: Record<string, React.ElementType> = {
  uploadConsistency: Clock,
  viewStability: BarChart3,
  growthMomentum: TrendingUp,
  engagementHealth: ThumbsUp,
  shortsDependency: Clapperboard,
  contentDiversity: Palette,
};

function getGradeColor(grade: string): string {
  if (grade === "A+" || grade === "A") return "#34d399"; // emerald-400
  if (grade === "B+" || grade === "B") return "#fbbf24"; // amber-400
  return "#f87171"; // red-400
}

function getScoreBarColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 45) return "bg-amber-500";
  return "bg-red-500";
}

function getStatusDot(status: "good" | "warning" | "danger") {
  if (status === "good") return "bg-emerald-500";
  if (status === "warning") return "bg-amber-500";
  return "bg-red-500";
}

function getStatusLabel(status: "good" | "warning" | "danger") {
  if (status === "good") return "양호";
  if (status === "warning") return "주의";
  return "위험";
}

/* ---------- Score Gauge ---------- */

function ScoreGauge({ score, grade, comment }: { score: number; grade: string; comment: string }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = getGradeColor(grade);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#334155"
            strokeWidth="12"
          />
          {/* Score arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-slate-100">{score}</span>
          <span
            className="text-2xl font-bold mt-0.5"
            style={{ color }}
          >
            {grade}
          </span>
        </div>
      </div>
      <p className="text-sm text-slate-400 mt-2 text-center">{comment}</p>
    </div>
  );
}

/* ---------- Health Item Card ---------- */

function HealthItemCard({ item }: { item: HealthItem }) {
  const Icon = ITEM_ICONS[item.key] || HeartPulse;
  const dotClass = getStatusDot(item.status);
  const barClass = getScoreBarColor(item.score);

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Left: icon + status */}
          <div className="flex flex-col items-center gap-1.5 pt-0.5">
            <Icon className="size-5 text-slate-400" />
            <div className={`size-2.5 rounded-full ${dotClass}`} />
          </div>

          {/* Right: content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-slate-200">{item.label}</h3>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">{getStatusLabel(item.status)}</span>
                <span className="text-sm font-bold text-slate-100">{item.score}</span>
              </div>
            </div>

            {/* Score bar */}
            <div className="h-1.5 w-full rounded-full bg-slate-700 overflow-hidden mb-2">
              <div
                className={`h-full rounded-full ${barClass} transition-all duration-700 ease-out`}
                style={{ width: `${item.score}%` }}
              />
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Comparison Radar Chart ---------- */

function ComparisonRadarChart({
  data,
}: {
  data: Array<{ axis: string; channel: number; average: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fill: "#94a3b8", fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: "#475569", fontSize: 10 }}
          tickCount={5}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            color: "#e2e8f0",
            fontSize: "12px",
          }}
          formatter={(value, name) => [
            `${value}점`,
            name === "channel" ? "내 채널" : "카테고리 평균",
          ]}
        />
        <Legend
          formatter={(value: string) =>
            value === "channel" ? "내 채널" : "카테고리 평균"
          }
          wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
        />
        <Radar
          name="channel"
          dataKey="channel"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Radar
          name="average"
          dataKey="average"
          stroke="#64748b"
          fill="#64748b"
          fillOpacity={0.15}
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/* ---------- Diagnosis Section ---------- */

function DiagnosisSection({ diagnosis }: { diagnosis: DiagnosisSummary }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-200">진단 요약</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Strengths */}
        {diagnosis.strengths.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">강점</span>
            </div>
            <ul className="space-y-1.5 pl-5">
              {diagnosis.strengths.map((s, i) => (
                <li key={i} className="text-xs text-slate-400 list-disc leading-relaxed">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvements */}
        {diagnosis.improvements.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="size-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">개선 필요</span>
            </div>
            <ul className="space-y-1.5 pl-5">
              {diagnosis.improvements.map((s, i) => (
                <li key={i} className="text-xs text-slate-400 list-disc leading-relaxed">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {diagnosis.warnings.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <OctagonAlert className="size-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">위험 신호</span>
            </div>
            <ul className="space-y-1.5 pl-5">
              {diagnosis.warnings.map((s, i) => (
                <li key={i} className="text-xs text-slate-400 list-disc leading-relaxed">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {diagnosis.strengths.length === 0 &&
          diagnosis.improvements.length === 0 &&
          diagnosis.warnings.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">
              진단 데이터가 충분하지 않습니다
            </p>
          )}
      </CardContent>
    </Card>
  );
}

/* ---------- Main Page ---------- */

export default function ChannelHealthPage() {
  const [input, setInput] = useState("");

  const mutation = useMutation<{ data: HealthResponse }, Error, string>({
    mutationFn: async (channelId: string) => {
      const res = await fetch("/api/tools/channel-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || "건강검진에 실패했습니다");
      }
      return res.json();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    mutation.mutate(input.trim());
  };

  const result = mutation.data?.data;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "도구", href: "/tools/channel-health" }, { label: "채널 건강검진" }]} />
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <HeartPulse className="h-5 w-5 text-emerald-400" />
          <h1 className="text-xl font-bold text-slate-100">채널 건강검진</h1>
        </div>
        <p className="text-sm text-slate-400">
          채널의 종합 건강 상태를 진단하고 개선 포인트를 확인하세요
        </p>
      </div>

      {/* Input */}
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  검진 중
                </>
              ) : (
                <>
                  <HeartPulse className="size-4 mr-1.5" />
                  검진 시작
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error */}
      {mutation.isError && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-5">
            <p className="text-sm text-red-400">{mutation.error.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* 1. Total Score Gauge */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="py-8">
              <ScoreGauge
                score={result.totalScore}
                grade={result.grade}
                comment={result.gradeComment}
              />
            </CardContent>
          </Card>

          {/* 2. Health Item Cards */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="size-4 text-slate-400" />
              <h2 className="text-base font-semibold text-slate-200">검진 항목</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {result.items.map((item) => (
                <HealthItemCard key={item.key} item={item} />
              ))}
            </div>
          </div>

          {/* 3. Diagnosis Summary */}
          <DiagnosisSection diagnosis={result.diagnosis} />

          {/* 4. Radar Chart: Channel vs Category Average */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-200">
                동일 카테고리 평균 대비
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ComparisonRadarChart data={result.radarData} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state */}
      {!result && !mutation.isPending && !mutation.isError && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-16 text-center space-y-3">
            <HeartPulse className="size-12 text-slate-700 mx-auto" />
            <div>
              <p className="text-sm font-medium text-slate-400">
                채널을 입력하면 건강검진이 시작됩니다
              </p>
              <p className="text-xs text-slate-600 mt-1">
                업로드 일관성, 조회수 안정성, 성장 모멘텀, 참여도, 쇼츠 의존도, 콘텐츠 다양성을 종합 진단합니다
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
