"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  X,
  Search,
  Users,
  Eye,
  Zap,
  Activity,
  Check,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMonitorStore, type TrackedChannel } from "@/stores/monitorStore";
import { generateVideoInsights } from "@/lib/monitorMockData";
import { formatNumber, formatGrowthRate } from "@/lib/formatters";
import { CATEGORIES } from "@/domain/categories";
import type { ChannelSearchResult } from "@/types";

import { MonitorSummaryCards } from "@/components/monitor/MonitorSummaryCards";
import { FolderSelector } from "@/components/monitor/FolderSelector";
import { ChannelDetailPanel } from "@/components/monitor/ChannelDetailPanel";
import { VideoInsights } from "@/components/monitor/VideoInsights";
import { SimilarChannels, type SimilarChannel } from "@/components/monitor/SimilarChannels";

/* ---------- Mock stats (same seed-based approach) ---------- */

interface ChannelStats {
  channelId: string;
  subscribers: number;
  subscriberDelta: number;
  dailyViews: number;
  viewsDelta: number;
  algoScore: number;
  algoDelta: number;
  growthRate: number;
  updatedAt: string;
}

function generateMockStats(channelId: string): ChannelStats {
  const seed = channelId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (min: number, max: number, offset = 0) => {
    const x = Math.sin(seed + offset) * 10000;
    const frac = x - Math.floor(x);
    return Math.floor(frac * (max - min + 1)) + min;
  };

  return {
    channelId,
    subscribers: rand(10000, 5000000, 1),
    subscriberDelta: rand(-500, 3000, 2),
    dailyViews: rand(5000, 500000, 3),
    viewsDelta: rand(-10000, 50000, 4),
    algoScore: rand(30, 98, 5),
    algoDelta: rand(-5, 8, 6),
    growthRate: parseFloat(((Math.sin(seed * 0.01) * 5) + 2).toFixed(1)),
    updatedAt: new Date().toISOString(),
  };
}

function generateSimilarChannels(channelId: string): SimilarChannel[] {
  const seed = channelId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const names = [
    "테크리뷰어", "맛집탐방기", "일상브이로그", "게임마스터",
    "뮤직스튜디오", "여행의정석",
  ];
  const cats = ["technology", "food", "entertainment", "gaming", "music", "travel"];
  return names.map((name, i) => ({
    channelId: `similar_${seed}_${i}`,
    title: name,
    thumbnailUrl: "",
    subscriberCount: Math.floor(Math.sin(seed + i * 7) * 500000 + 600000),
    category: cats[i],
    similarity: Math.floor(90 - i * 8),
  }));
}

/* ---------- Channel Add Dialog (unchanged) ---------- */

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ChannelAddDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChannelSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { trackedChannels, addChannel, isTracking } = useMonitorStore();
  const isFull = trackedChannels.length >= 20;

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(q)}&limit=10`
      );
      const json = await res.json();
      setResults(json.data ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      return;
    }
    search("");
  }, [open, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleAdd = (ch: ChannelSearchResult) => {
    const channel: TrackedChannel = {
      channelId: ch.id,
      title: ch.title,
      thumbnailUrl: ch.thumbnailUrl,
      category: ch.category,
      addedAt: new Date().toISOString(),
    };
    addChannel(channel);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-slate-100">채널 추가</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <Input
            placeholder="채널명을 입력하세요"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1 max-h-80 overflow-y-auto -mx-4 px-4">
          {loading && (
            <p className="py-6 text-center text-sm text-slate-500">검색 중...</p>
          )}
          {!loading && results.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">
              검색 결과가 없습니다
            </p>
          )}
          {!loading &&
            results.map((ch) => {
              const tracked = isTracking(ch.id);
              const categoryLabel =
                CATEGORIES.find((c) => c.value === ch.category)?.label ??
                ch.category;
              return (
                <div
                  key={ch.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-800 transition-colors"
                >
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-700">
                    <Image
                      src={ch.thumbnailUrl}
                      alt={ch.title}
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-slate-100">
                      {ch.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">
                        {formatNumber(ch.subscriberCount)} 구독자
                      </span>
                      <Badge
                        variant="secondary"
                        className="h-4 px-1.5 text-[10px] bg-slate-700 text-slate-400 border-0"
                      >
                        {categoryLabel}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="icon-sm"
                    variant={tracked ? "secondary" : "default"}
                    disabled={tracked || isFull}
                    onClick={() => handleAdd(ch)}
                    className={
                      tracked
                        ? "bg-slate-700 text-slate-400"
                        : "bg-blue-600 hover:bg-blue-500 text-white border-none"
                    }
                  >
                    {tracked ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                  </Button>
                </div>
              );
            })}
        </div>

        {isFull && (
          <p className="text-xs text-amber-400 text-center">
            최대 20개까지 모니터링할 수 있습니다.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Channel Monitor Card ---------- */

interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: number;
  unit?: string;
}

function StatRow({ icon, label, value, delta, unit = "" }: StatRowProps) {
  const isPositive = delta >= 0;
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-slate-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-200">{value}</span>
        <span
          className={`flex items-center gap-0.5 text-xs font-medium ${
            isPositive ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="size-3" />
          ) : (
            <TrendingDown className="size-3" />
          )}
          {isPositive ? "+" : ""}
          {formatNumber(Math.abs(delta))}
          {unit}
        </span>
      </div>
    </div>
  );
}

interface ChannelMonitorCardProps {
  channel: TrackedChannel;
  stats: ChannelStats;
  isSelected: boolean;
  onSelect: (channelId: string) => void;
  onRemove: (channelId: string) => void;
}

function ChannelMonitorCard({ channel, stats, isSelected, onSelect, onRemove }: ChannelMonitorCardProps) {
  const categoryLabel =
    CATEGORIES.find((c) => c.value === channel.category)?.label ??
    channel.category;

  const algoColor =
    stats.algoScore >= 80
      ? "text-emerald-400"
      : stats.algoScore >= 60
      ? "text-blue-400"
      : stats.algoScore >= 40
      ? "text-amber-400"
      : "text-red-400";

  return (
    <Card
      className={`relative bg-slate-900 border-slate-800 text-slate-100 overflow-hidden cursor-pointer transition-all ${
        isSelected ? "ring-2 ring-blue-500 border-blue-500/50" : "hover:border-slate-700"
      }`}
      onClick={() => onSelect(channel.channelId)}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(channel.channelId); }}
        className="absolute top-2 right-2 flex items-center justify-center size-6 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors z-10"
        aria-label="채널 제거"
      >
        <X className="size-3.5" />
      </button>

      <CardHeader className="pb-3 pr-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-700 ring-2 ring-slate-700">
            <Image
              src={channel.thumbnailUrl}
              alt={channel.title}
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold text-slate-100 truncate">
              {channel.title}
            </CardTitle>
            <Badge
              variant="secondary"
              className="mt-1 h-4 px-1.5 text-[10px] bg-slate-800 text-slate-400 border-slate-700"
            >
              {categoryLabel}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2.5 pt-0">
        <StatRow
          icon={<Users className="size-3" />}
          label="구독자"
          value={formatNumber(stats.subscribers)}
          delta={stats.subscriberDelta}
        />
        <StatRow
          icon={<Eye className="size-3" />}
          label="일 조회수"
          value={formatNumber(stats.dailyViews)}
          delta={stats.viewsDelta}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Zap className="size-3" />
            <span className="text-xs">알고 점수</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${algoColor}`}>
              {stats.algoScore}
            </span>
            <span
              className={`flex items-center gap-0.5 text-xs font-medium ${
                stats.algoDelta >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {stats.algoDelta >= 0 ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {stats.algoDelta >= 0 ? "+" : ""}
              {stats.algoDelta}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Activity className="size-3" />
            <span className="text-xs">30일 성장률</span>
          </div>
          <span
            className={`text-xs font-medium ${
              stats.growthRate >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {formatGrowthRate(stats.growthRate)}
          </span>
        </div>

        <div className="pt-1 border-t border-slate-800 flex items-center gap-1 text-slate-600">
          <Clock className="size-3" />
          <span className="text-[10px]">방금 업데이트됨</span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Main Dashboard ---------- */

export function MonitorDashboard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const {
    trackedChannels,
    removeChannel,
    folders,
    activeFolderId,
    setActiveFolder,
    addFolder,
    removeFolder,
    renameFolder,
    getFilteredChannels,
    history,
    updateChannelMemo,
    addChannel,
  } = useMonitorStore();

  const filteredChannels = getFilteredChannels();

  const statsMap = useMemo(() => {
    const map: Record<string, ChannelStats> = {};
    for (const ch of trackedChannels) {
      map[ch.channelId] = generateMockStats(ch.channelId);
    }
    return map;
  }, [trackedChannels]);

  const summaryData = useMemo(() => {
    return filteredChannels.map((ch) => {
      const s = statsMap[ch.channelId];
      return {
        subscriberDelta: s?.subscriberDelta ?? 0,
        viewDelta: s?.viewsDelta ?? 0,
      };
    });
  }, [filteredChannels, statsMap]);

  const selectedChannel = trackedChannels.find(
    (ch) => ch.channelId === selectedChannelId
  );
  const selectedHistory = selectedChannelId ? history[selectedChannelId] ?? [] : [];
  const selectedVideos = useMemo(
    () => (selectedChannelId ? generateVideoInsights(selectedChannelId) : []),
    [selectedChannelId]
  );
  const similarChannels = useMemo(
    () => (selectedChannelId ? generateSimilarChannels(selectedChannelId) : []),
    [selectedChannelId]
  );

  const isEmpty = filteredChannels.length === 0;

  function handleSelectChannel(channelId: string) {
    setSelectedChannelId((prev) => (prev === channelId ? null : channelId));
  }

  function handleAddSimilar(similar: SimilarChannel) {
    addChannel({
      channelId: similar.channelId,
      title: similar.title,
      thumbnailUrl: similar.thumbnailUrl,
      category: similar.category,
      addedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      {trackedChannels.length > 0 && (
        <MonitorSummaryCards channels={summaryData} />
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <FolderSelector
            folders={folders}
            activeFolderId={activeFolderId}
            onSelect={setActiveFolder}
            onAdd={addFolder}
            onRemove={removeFolder}
            onRename={renameFolder}
          />
          {filteredChannels.length > 0 && (
            <Badge
              variant="secondary"
              className="bg-blue-600/20 text-blue-400 border-blue-500/30"
            >
              {filteredChannels.length}개 채널 추적 중
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => setDialogOpen(true)}
          disabled={trackedChannels.length >= 20}
          className="bg-blue-600 hover:bg-blue-500 text-white border-none gap-1.5"
        >
          <Plus className="size-3.5" />
          채널 추가
        </Button>
      </div>

      {/* Empty State */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
            <Activity className="size-8 text-slate-500" />
          </div>
          <div>
            <p className="text-base font-medium text-slate-300">
              아직 추적 중인 채널이 없습니다
            </p>
            <p className="mt-1 text-sm text-slate-500">
              관심 채널을 추가하면 구독자·조회수 변동을 실시간으로 확인할 수
              있습니다
            </p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white border-none gap-1.5"
          >
            <Plus className="size-4" />
            채널 추가
          </Button>
        </div>
      ) : (
        <>
          {/* Channel Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredChannels.map((ch) => (
              <ChannelMonitorCard
                key={ch.channelId}
                channel={ch}
                stats={statsMap[ch.channelId]}
                isSelected={selectedChannelId === ch.channelId}
                onSelect={handleSelectChannel}
                onRemove={removeChannel}
              />
            ))}
          </div>

          {/* Channel Detail Panel */}
          {selectedChannel && (
            <div className="flex flex-col gap-6">
              <ChannelDetailPanel
                channel={selectedChannel}
                history={selectedHistory}
                onClose={() => setSelectedChannelId(null)}
                onMemoChange={updateChannelMemo}
              />

              {/* Video Insights */}
              {selectedVideos.length > 0 && (
                <VideoInsights
                  videos={selectedVideos}
                  channelTitle={selectedChannel.title}
                />
              )}

              {/* Similar Channels */}
              {similarChannels.length > 0 && (
                <SimilarChannels
                  channels={similarChannels}
                  onAddToMonitor={handleAddSimilar}
                />
              )}
            </div>
          )}
        </>
      )}

      <ChannelAddDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
