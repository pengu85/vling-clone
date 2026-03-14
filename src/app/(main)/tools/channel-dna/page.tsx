"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import {
  Dna,
  Search,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Video,
  Loader2,
  ArrowRight,
  Minus,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

/* ---------- Types ---------- */

interface DNAScores {
  content: number;
  growth: number;
  influence: number;
  engagement: number;
  consistency: number;
}

interface ChannelDNA {
  channelId: string;
  name: string;
  thumbnail: string;
  subscribers: number;
  videoCount: number;
  viewCount: number;
  dna: DNAScores;
}

interface MatchedChannel extends ChannelDNA {
  similarity: number;
  growthDiff: number;
  benchmarkPoints: string[];
}

interface DNAResponse {
  target: ChannelDNA;
  matches: MatchedChannel[];
}

/* ---------- Helpers ---------- */

function formatNumber(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}천`;
  return n.toLocaleString();
}

const DNA_LABELS: Record<keyof DNAScores, string> = {
  content: "콘텐츠력",
  growth: "성장성",
  influence: "영향력",
  engagement: "참여도",
  consistency: "일관성",
};

function dnaToRadarData(dna: DNAScores) {
  return (Object.keys(DNA_LABELS) as (keyof DNAScores)[]).map((key) => ({
    axis: DNA_LABELS[key],
    value: dna[key],
    fullMark: 100,
  }));
}

/* ---------- Sub-components ---------- */

function DNARadarChart({ dna }: { dna: DNAScores }) {
  const data = dnaToRadarData(dna);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fill: "#94a3b8", fontSize: 12 }}
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
          formatter={(value) => [`${value}점`, ""]}
        />
        <Radar
          dataKey="value"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function DNAScoreList({ dna }: { dna: DNAScores }) {
  const keys = Object.keys(DNA_LABELS) as (keyof DNAScores)[];

  return (
    <div className="space-y-2">
      {keys.map((key) => (
        <div key={key} className="flex items-center justify-between">
          <span className="text-sm text-slate-400">{DNA_LABELS[key]}</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${dna[key]}%` }}
              />
            </div>
            <span className="text-sm font-medium text-slate-200 w-8 text-right">
              {dna[key]}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SimilarityBadge({ value }: { value: number }) {
  const color =
    value >= 90
      ? "text-green-400 bg-green-500/10 border-green-500/20"
      : value >= 75
        ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
        : "text-amber-400 bg-amber-500/10 border-amber-500/20";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${color}`}
    >
      {value.toFixed(1)}% 유사
    </span>
  );
}

function GrowthDiffBadge({ diff }: { diff: number }) {
  if (diff > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-green-400">
        <TrendingUp className="size-3" />+{diff}점
      </span>
    );
  }
  if (diff < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-red-400">
        <TrendingDown className="size-3" />{diff}점
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-slate-500">
      <Minus className="size-3" />동일
    </span>
  );
}

function MatchCard({ channel }: { channel: MatchedChannel }) {
  return (
    <Link href={`/channel/${channel.channelId}`}>
      <Card className="bg-slate-900/50 border-slate-800 hover:border-blue-500 transition-colors cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* 썸네일 */}
            <div className="relative size-12 shrink-0 rounded-full overflow-hidden bg-slate-800">
              <Image
                src={channel.thumbnail}
                alt={channel.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>

            {/* 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-slate-100 truncate group-hover:text-blue-400 transition-colors">
                  {channel.name}
                </h3>
                <ArrowRight className="size-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>

              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <Users className="size-3" />
                  {formatNumber(channel.subscribers)}
                </span>
                <SimilarityBadge value={channel.similarity} />
              </div>

              {/* 성장률 비교 */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-slate-500">성장성 비교:</span>
                <GrowthDiffBadge diff={channel.growthDiff} />
              </div>

              {/* 벤치마킹 포인트 */}
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  벤치마킹 포인트
                </p>
                {channel.benchmarkPoints.map((point, i) => (
                  <p key={i} className="text-xs text-slate-400 pl-2 border-l border-blue-500/30">
                    {point}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/* ---------- Main Page ---------- */

export default function ChannelDNAPage() {
  const [input, setInput] = useState("");

  const mutation = useMutation<{ data: DNAResponse }, Error, string>({
    mutationFn: async (channelId: string) => {
      const res = await fetch("/api/tools/channel-dna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || "DNA 분석에 실패했습니다");
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
      {/* 헤더 */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Dna className="h-5 w-5 text-blue-400" />
          <h1 className="text-xl font-bold text-slate-100">채널 DNA 매칭</h1>
        </div>
        <p className="text-sm text-slate-400">
          채널의 DNA를 분석하고, 성장이 빠른 유사 채널을 벤치마킹하세요
        </p>
      </div>

      {/* 입력 영역 */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="채널 URL, @핸들, 채널 ID 또는 이름을 입력하세요"
                className="pl-10 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>
            <Button
              type="submit"
              disabled={mutation.isPending || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  분석 중
                </>
              ) : (
                <>
                  <Dna className="size-4 mr-1.5" />
                  DNA 분석
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 좌측: 내 채널 DNA */}
          <div className="space-y-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-slate-200">
                  채널 DNA 프로필
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 채널 프로필 */}
                <div className="flex items-center gap-3">
                  <div className="relative size-14 rounded-full overflow-hidden bg-slate-800 shrink-0">
                    <Image
                      src={result.target.thumbnail}
                      alt={result.target.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-slate-100 truncate">
                      {result.target.name}
                    </h2>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Users className="size-3" />
                        {formatNumber(result.target.subscribers)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Eye className="size-3" />
                        {formatNumber(result.target.viewCount)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Video className="size-3" />
                        {result.target.videoCount}개
                      </span>
                    </div>
                  </div>
                </div>

                {/* 레이더 차트 */}
                <DNARadarChart dna={result.target.dna} />

                {/* 점수 리스트 */}
                <DNAScoreList dna={result.target.dna} />
              </CardContent>
            </Card>
          </div>

          {/* 우측: 매칭 채널 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-green-400" />
              <h2 className="text-base font-semibold text-slate-200">
                성장이 빠른 유사 채널
              </h2>
              <Badge
                variant="outline"
                className="border-slate-700 text-slate-400 text-[11px]"
              >
                {result.matches.length}개
              </Badge>
            </div>

            {result.matches.length === 0 ? (
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-5 text-center">
                  <p className="text-sm text-slate-500">
                    유사한 채널을 찾지 못했습니다
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {result.matches.map((match) => (
                  <MatchCard key={match.channelId} channel={match} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {!result && !mutation.isPending && !mutation.isError && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-16 text-center space-y-3">
            <Dna className="size-12 text-slate-700 mx-auto" />
            <div>
              <p className="text-sm font-medium text-slate-400">
                채널을 입력하면 DNA 분석이 시작됩니다
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
