"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  TrendingUp,
  Target,
  AlertTriangle,
  Lightbulb,
  Users,
  BarChart2,
  Info,
} from "lucide-react";
import type { InsightResponse } from "@/lib/ai";

interface Props {
  channelId: string;
}

function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <Card className="bg-slate-800 border-slate-700 animate-pulse">
      <CardHeader className="pb-2">
        <div className="h-4 w-32 bg-slate-700 rounded" />
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-700 rounded" style={{ width: `${80 - i * 10}%` }} />
        ))}
      </CardContent>
    </Card>
  );
}

function SWOTItem({
  label,
  icon,
  items,
  colorClass,
  borderClass,
  iconColorClass,
}: {
  label: string;
  icon: React.ReactNode;
  items: string[];
  colorClass: string;
  borderClass: string;
  iconColorClass: string;
}) {
  return (
    <div className={`rounded-xl border ${borderClass} p-4 space-y-2`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={iconColorClass}>{icon}</span>
        <span className={`text-sm font-semibold ${colorClass}`}>{label}</span>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${iconColorClass.replace("text-", "bg-")}`} />
            <span className="text-xs text-slate-300 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AIInsightPanel({ channelId }: Props) {
  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  async function fetchInsight() {
    setLoading(true);
    setError(null);
    setStarted(true);

    try {
      const res = await fetch(`/api/ai/insight/${encodeURIComponent(channelId)}`, {
        method: "POST",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? "AI 분석 요청에 실패했습니다");
      }

      const json = await res.json();
      setInsight(json.data as InsightResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  // Landing state — before user starts analysis
  if (!started) {
    return (
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-10 flex flex-col items-center gap-6 text-center">
        <div className="size-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Sparkles className="size-8 text-indigo-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-100">AI 채널 인사이트</h2>
          <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
            AI가 채널의 강점·약점·성장 기회를 분석하고 맞춤 콘텐츠 전략을 제안합니다.
          </p>
        </div>
        <Button
          onClick={fetchInsight}
          size="lg"
          className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white border-none px-6 h-10"
        >
          <Sparkles className="size-4" />
          AI 분석 시작
        </Button>
      </div>
    );
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard lines={3} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
        <SkeletonCard lines={4} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={2} />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-2xl bg-slate-900 border border-red-800/40 p-8 flex flex-col items-center gap-4 text-center">
        <AlertTriangle className="size-8 text-red-400" />
        <p className="text-sm text-red-400">{error}</p>
        <Button
          onClick={fetchInsight}
          variant="outline"
          size="sm"
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          다시 시도
        </Button>
      </div>
    );
  }

  if (!insight) return null;

  return (
    <div className="space-y-4">
      {/* Mock data banner */}
      {insight.isMock && (
        <div className="flex items-center gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <Info className="h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-sm text-amber-300">
            AI API 키가 설정되지 않아 샘플 데이터입니다
          </p>
        </div>
      )}

      {/* Channel Summary */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-slate-100 text-sm font-semibold">
            <Sparkles className="size-4 text-indigo-400" />
            채널 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-300 leading-relaxed">{insight.channelSummary}</p>
        </CardContent>
      </Card>

      {/* SWOT Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SWOTItem
          label="강점 (Strengths)"
          icon={<TrendingUp className="size-4" />}
          items={insight.strengths}
          colorClass="text-emerald-300"
          borderClass="border-emerald-800/40 bg-emerald-950/30"
          iconColorClass="text-emerald-400"
        />
        <SWOTItem
          label="약점 (Weaknesses)"
          icon={<AlertTriangle className="size-4" />}
          items={insight.weaknesses}
          colorClass="text-red-300"
          borderClass="border-red-800/40 bg-red-950/30"
          iconColorClass="text-red-400"
        />
        <SWOTItem
          label="기회 (Opportunities)"
          icon={<Target className="size-4" />}
          items={insight.opportunities}
          colorClass="text-blue-300"
          borderClass="border-blue-800/40 bg-blue-950/30"
          iconColorClass="text-blue-400"
        />
      </div>

      {/* Content Strategy */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-slate-100 text-sm font-semibold">
            <Lightbulb className="size-4 text-amber-400" />
            콘텐츠 전략
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {insight.contentStrategy.map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-300 leading-relaxed">{tip}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Audience Insight + Growth Prediction */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Audience Insight */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-slate-100 text-sm font-semibold">
              <Users className="size-4 text-violet-400" />
              시청자 인사이트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-300 leading-relaxed">{insight.audienceInsight}</p>
          </CardContent>
        </Card>

        {/* Growth Prediction */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-slate-100 text-sm font-semibold">
              <BarChart2 className="size-4 text-emerald-400" />
              성장 예측
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-300 leading-relaxed">{insight.growthPrediction}</p>
            {/* Visual bar hint */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-16 shrink-0">현재</span>
                <div className="flex-1 h-2 rounded-full bg-slate-700">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: "50%" }} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-16 shrink-0">6개월 후</span>
                <div className="flex-1 h-2 rounded-full bg-slate-700">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: "70%" }} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-16 shrink-0">최대치</span>
                <div className="flex-1 h-2 rounded-full bg-slate-700">
                  <div className="h-2 rounded-full bg-amber-400" style={{ width: "85%" }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competitor Channels */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-slate-100 text-sm font-semibold">
            <Target className="size-4 text-slate-400" />
            경쟁 채널
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {insight.competitorChannels.map((ch) => (
              <Badge
                key={ch}
                variant="outline"
                className="border-slate-700 text-slate-300 bg-slate-800"
              >
                {ch}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Re-run button */}
      <div className="flex justify-end">
        <Button
          onClick={fetchInsight}
          variant="outline"
          size="sm"
          className="gap-1.5 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
        >
          <Sparkles className="size-3.5" />
          다시 분석
        </Button>
      </div>
    </div>
  );
}
