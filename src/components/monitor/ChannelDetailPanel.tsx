"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MonitorTrendChart } from "./MonitorTrendChart";
import { formatNumber, formatGrowthRate } from "@/lib/formatters";

interface ChannelDetailPanelProps {
  channel: {
    channelId: string;
    title: string;
    thumbnailUrl: string;
    category: string;
    memo?: string;
  };
  history: Array<{
    date: string;
    subscribers: number;
    dailyViews: number;
    totalViews: number;
    algoScore: number;
    videoCount: number;
  }>;
  onClose: () => void;
  onMemoChange: (channelId: string, memo: string) => void;
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5"
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
}

function StatCard({ label, value, delta, deltaLabel }: StatCardProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-800/50 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-base font-bold text-slate-100">{value}</p>
      {delta !== undefined && (
        <p
          className={`mt-0.5 text-xs font-medium ${
            delta > 0
              ? "text-emerald-400"
              : delta < 0
                ? "text-red-400"
                : "text-slate-500"
          }`}
        >
          {delta > 0 ? "+" : ""}
          {deltaLabel ?? formatNumber(delta)}
        </p>
      )}
    </div>
  );
}

export function ChannelDetailPanel({
  channel,
  history,
  onClose,
  onMemoChange,
}: ChannelDetailPanelProps) {
  const [memo, setMemo] = useState(channel.memo ?? "");

  const chartData = useMemo(() => {
    return history.map((h) => ({
      date: h.date,
      subscribers: h.subscribers,
      dailyViews: h.dailyViews,
      algoScore: h.algoScore,
    }));
  }, [history]);

  const stats = useMemo(() => {
    if (history.length < 2) {
      const latest = history[0];
      return {
        subscribers: latest?.subscribers ?? 0,
        subscriberDelta: 0,
        dailyViews: latest?.dailyViews ?? 0,
        viewDelta: 0,
        algoScore: latest?.algoScore ?? 0,
        algoDelta: 0,
        growthRate: 0,
      };
    }

    const latest = history[history.length - 1];
    const prev = history[history.length - 2];
    const oldest = history[0];

    const subscriberDelta = latest.subscribers - prev.subscribers;
    const viewDelta = latest.dailyViews - prev.dailyViews;
    const algoDelta = latest.algoScore - prev.algoScore;

    const totalGrowth =
      oldest.subscribers > 0
        ? ((latest.subscribers - oldest.subscribers) / oldest.subscribers) * 100
        : 0;

    return {
      subscribers: latest.subscribers,
      subscriberDelta,
      dailyViews: latest.dailyViews,
      viewDelta,
      algoScore: latest.algoScore,
      algoDelta,
      growthRate: totalGrowth,
    };
  }, [history]);

  function handleMemoBlur() {
    onMemoChange(channel.channelId, memo);
  }

  function handleMemoKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      onMemoChange(channel.channelId, memo);
    }
  }

  return (
    <Card className="border-slate-800 bg-slate-900 overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-full border border-slate-700">
              <Image
                src={channel.thumbnailUrl}
                alt={channel.title}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-100 truncate">
                {channel.title}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant="secondary"
                  className="bg-slate-800 text-slate-300 text-xs"
                >
                  {channel.category}
                </Badge>
                <span className="text-xs text-slate-400">
                  {formatNumber(stats.subscribers)}명
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 shrink-0"
            onClick={onClose}
          >
            <CloseIcon />
          </Button>
        </div>

        {/* Chart */}
        <div className="p-4 pb-2">
          <MonitorTrendChart data={chartData} channelTitle={channel.title} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 px-4 sm:grid-cols-4">
          <StatCard
            label="구독자"
            value={formatNumber(stats.subscribers)}
            delta={stats.subscriberDelta}
          />
          <StatCard
            label="일 조회수"
            value={formatNumber(stats.dailyViews)}
            delta={stats.viewDelta}
          />
          <StatCard
            label="알고 점수"
            value={String(stats.algoScore)}
            delta={stats.algoDelta}
          />
          <StatCard
            label="성장률"
            value={formatGrowthRate(stats.growthRate)}
            delta={stats.growthRate}
            deltaLabel={formatGrowthRate(stats.growthRate)}
          />
        </div>

        {/* Memo */}
        <div className="px-4 pt-4">
          <label className="text-xs text-slate-400 mb-1 block">메모</label>
          <Input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            onBlur={handleMemoBlur}
            onKeyDown={handleMemoKeyDown}
            placeholder="채널에 대한 메모를 입력하세요..."
            className="border-slate-700 bg-slate-800 text-slate-200 placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
          />
        </div>

        {/* Action */}
        <div className="p-4">
          <Link
            href={`/channel/${channel.channelId}`}
            className="flex items-center justify-center gap-2 w-full rounded-md border border-slate-700 bg-slate-800 px-3 h-8 text-sm font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <span>채널 상세 보기</span>
            <ExternalLinkIcon />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
