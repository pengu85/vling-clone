"use client";

import { useState } from "react";
import Image from "next/image";
import { useMutation } from "@tanstack/react-query";
import {
  Handshake,
  Search,
  Users,
  Loader2,
  TrendingUp,
  Eye,
  Video,
  Target,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ---------- Types ---------- */

interface ChannelStats {
  channelId: string;
  name: string;
  thumbnail: string;
  subscribers: number;
  videoCount: number;
  viewCount: number;
  category: string;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  avgDurationSeconds: number;
  uploadsPerMonth: number;
  engagementRate: number;
}

interface CollabFactor {
  label: string;
  key: string;
  score: number;
  maxScore: number;
  detail: string;
  percentage?: number;
}

interface CollabExpectedEffect {
  estimatedReach: number;
  overlapEstimate: number;
  expectedViews: number;
  viewMultiplier: number;
  recommendedFormats: string[];
}

interface CollabResponse {
  channelA: ChannelStats;
  channelB: ChannelStats;
  totalScore: number;
  grade: string;
  factors: CollabFactor[];
  expectedEffect: CollabExpectedEffect;
  similarCaseStats: {
    avgViewIncrease: number;
    successRate: number;
  };
}

/* ---------- Helpers ---------- */

function formatNumber(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}천`;
  return n.toLocaleString();
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

function getScoreColor(score: number) {
  if (score >= 90) return { stroke: "#10b981", text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
  if (score >= 70) return { stroke: "#3b82f6", text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" };
  if (score >= 50) return { stroke: "#f59e0b", text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
  return { stroke: "#ef4444", text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" };
}

/* ---------- SVG Gauge ---------- */

function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const colors = getScoreColor(score);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="180" height="180" viewBox="0 0 180 180">
          {/* Background circle */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth="10"
          />
          {/* Progress circle */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference - progress}`}
            strokeDashoffset={circumference * 0.25}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${colors.text}`}>
            {score}
          </span>
          <span className="text-sm text-slate-400">점</span>
        </div>
      </div>
      <span
        className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${colors.text} ${colors.bg} ${colors.border}`}
      >
        {grade}
      </span>
    </div>
  );
}

/* ---------- Channel Profile Card ---------- */

function ChannelProfileCard({
  channel,
  label,
}: {
  channel: ChannelStats;
  label: string;
}) {
  return (
    <Card className="bg-slate-900/50 border-slate-800 flex-1">
      <CardContent className="pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-3">
          {label}
        </p>
        <div className="flex items-center gap-3 mb-3">
          <div className="relative size-14 shrink-0 rounded-full overflow-hidden bg-slate-800">
            <Image
              src={channel.thumbnail}
              alt={channel.name}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-100 truncate">
              {channel.name}
            </h3>
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-0.5">
              <Users className="size-3" />
              {formatNumber(channel.subscribers)}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Eye className="size-3 text-slate-500" />
            <span>평균 조회 {formatNumber(channel.avgViews)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Video className="size-3 text-slate-500" />
            <span>{channel.videoCount}개</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <BarChart3 className="size-3 text-slate-500" />
            <span>{channel.category}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <TrendingUp className="size-3 text-slate-500" />
            <span>참여율 {(channel.engagementRate * 100).toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Factor Card ---------- */

function FactorCard({ factor }: { factor: CollabFactor }) {
  const pct = Math.round((factor.score / factor.maxScore) * 100);
  const barColor =
    pct >= 80
      ? "bg-emerald-500"
      : pct >= 60
        ? "bg-blue-500"
        : pct >= 40
          ? "bg-amber-500"
          : "bg-red-500";

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-slate-200">
            {factor.label}
          </h4>
          <span className="text-sm font-bold text-slate-300">
            {factor.score}/{factor.maxScore}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden mb-2">
          <div
            className={`h-full rounded-full ${barColor} transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-slate-400">{factor.detail}</p>
      </CardContent>
    </Card>
  );
}

/* ---------- Main Page ---------- */

export default function CollabScorePage() {
  const [inputA, setInputA] = useState("");
  const [inputB, setInputB] = useState("");

  const mutation = useMutation<{ data: CollabResponse }, Error, { a: string; b: string }>({
    mutationFn: async ({ a, b }) => {
      const res = await fetch("/api/tools/collab-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelA: a, channelB: b }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err.error?.message || "궁합 분석에 실패했습니다"
        );
      }
      return res.json();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputA.trim() || !inputB.trim()) return;
    mutation.mutate({ a: inputA.trim(), b: inputB.trim() });
  };

  const result = mutation.data?.data;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Handshake className="h-5 w-5 text-blue-400" />
          <h1 className="text-xl font-bold text-slate-100">콜라보 궁합 점수</h1>
        </div>
        <p className="text-sm text-slate-400">
          두 채널의 콜라보 시너지를 분석하고 궁합 점수를 확인하세요
        </p>
      </div>

      {/* 입력 영역 */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 채널 입력 */}
            <div className="flex flex-col md:flex-row items-center gap-3">
              {/* 채널 A */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <Input
                  value={inputA}
                  onChange={(e) => setInputA(e.target.value)}
                  placeholder="채널 A: URL, @핸들 또는 이름"
                  className="pl-10 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>

              {/* VS 배지 */}
              <div className="shrink-0 flex items-center justify-center size-10 rounded-full bg-slate-800 border border-slate-700">
                <span className="text-xs font-bold text-slate-400">VS</span>
              </div>

              {/* 채널 B */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <Input
                  value={inputB}
                  onChange={(e) => setInputB(e.target.value)}
                  placeholder="채널 B: URL, @핸들 또는 이름"
                  className="pl-10 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* 분석 버튼 */}
            <Button
              type="submit"
              disabled={mutation.isPending || !inputA.trim() || !inputB.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  분석 중...
                </>
              ) : (
                <>
                  <Handshake className="size-4 mr-1.5" />
                  궁합 분석
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 에러 */}
      {mutation.isError && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-5">
            <p className="text-sm text-red-400">{mutation.error.message}</p>
          </CardContent>
        </Card>
      )}

      {/* 결과 */}
      {result && (
        <div className="space-y-6">
          {/* 1. 궁합 점수 대형 표시 */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="py-8">
              <div className="flex flex-col items-center">
                <ScoreGauge score={result.totalScore} grade={result.grade} />
              </div>
            </CardContent>
          </Card>

          {/* 2. 두 채널 프로필 카드 */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            <ChannelProfileCard
              channel={result.channelA}
              label="채널 A"
            />

            {/* 연결선 + 점수 */}
            <div className="flex md:flex-col items-center justify-center gap-1 py-2 md:py-0">
              <div className="hidden md:block w-px h-full bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
              <div className="md:hidden h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
              <div
                className={`shrink-0 flex items-center justify-center size-10 rounded-full border ${getScoreColor(result.totalScore).bg} ${getScoreColor(result.totalScore).border}`}
              >
                <span
                  className={`text-xs font-bold ${getScoreColor(result.totalScore).text}`}
                >
                  {result.totalScore}
                </span>
              </div>
              <div className="hidden md:block w-px h-full bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
              <div className="md:hidden h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            </div>

            <ChannelProfileCard
              channel={result.channelB}
              label="채널 B"
            />
          </div>

          {/* 3. 궁합 요인 분석 */}
          <div>
            <h2 className="text-base font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Target className="size-4 text-blue-400" />
              궁합 요인 분석
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.factors.map((factor) => (
                <FactorCard key={factor.key} factor={factor} />
              ))}
            </div>
          </div>

          {/* 4. 콜라보 기대 효과 */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-200 flex items-center gap-2">
                <Sparkles className="size-4 text-amber-400" />
                콜라보 기대 효과
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg bg-slate-800/50 p-4 text-center">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                    예상 합산 도달 시청자
                  </p>
                  <p className="text-lg font-bold text-slate-100">
                    {formatNumber(result.expectedEffect.estimatedReach)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    겹침 제외 ({formatNumber(result.expectedEffect.overlapEstimate)} 겹침 추정)
                  </p>
                </div>
                <div className="rounded-lg bg-slate-800/50 p-4 text-center">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                    콜라보 영상 예상 조회수
                  </p>
                  <p className="text-lg font-bold text-slate-100">
                    {formatNumber(result.expectedEffect.expectedViews)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    평균 대비 {result.expectedEffect.viewMultiplier}배
                  </p>
                </div>
                <div className="rounded-lg bg-slate-800/50 p-4 text-center">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                    추천 콜라보 형식
                  </p>
                  <div className="flex flex-wrap justify-center gap-1 mt-1">
                    {result.expectedEffect.recommendedFormats.map(
                      (format) => (
                        <span
                          key={format}
                          className="inline-flex items-center rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[11px] text-blue-400"
                        >
                          {format}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* 콘텐츠 스타일 비교 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">업로드 빈도</span>
                  <span className="text-slate-300">
                    {result.channelA.uploadsPerMonth}회/월 vs{" "}
                    {result.channelB.uploadsPerMonth}회/월
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">평균 영상 길이</span>
                  <span className="text-slate-300">
                    {formatDuration(result.channelA.avgDurationSeconds)} vs{" "}
                    {formatDuration(result.channelB.avgDurationSeconds)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. 유사 성공 콜라보 사례 */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="py-5">
              <div className="flex items-center gap-3">
                <div className="shrink-0 flex items-center justify-center size-10 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <TrendingUp className="size-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    비슷한 규모의 채널 콜라보 평균 조회수 증가율:{" "}
                    <span className="text-emerald-400 font-bold">
                      +{result.similarCaseStats.avgViewIncrease}%
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    성공 확률 {result.similarCaseStats.successRate}% (유사
                    카테고리/규모 기준)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 빈 상태 */}
      {!result && !mutation.isPending && !mutation.isError && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-16 text-center space-y-3">
            <Handshake className="size-12 text-slate-700 mx-auto" />
            <div>
              <p className="text-sm font-medium text-slate-400">
                두 채널을 입력하면 콜라보 궁합 분석이 시작됩니다
              </p>
              <p className="text-xs text-slate-600 mt-1">
                채널 URL, @핸들, 채널 ID 또는 이름으로 검색할 수 있습니다
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
