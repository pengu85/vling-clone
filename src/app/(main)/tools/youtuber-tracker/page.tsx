"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  Bell,
  RefreshCw,
  BarChart2,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Zap,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useMonitorStore } from "@/stores/monitorStore";
import { formatNumber, formatGrowthRate } from "@/lib/formatters";
import { CATEGORIES } from "@/domain/categories";

import { MonitorSummaryCards } from "@/components/monitor/MonitorSummaryCards";
import { FolderSelector } from "@/components/monitor/FolderSelector";
import { MonitorTrendChart } from "@/components/monitor/MonitorTrendChart";
import { VideoInsights } from "@/components/monitor/VideoInsights";
import {
  SimilarChannels,
  type SimilarChannel,
} from "@/components/monitor/SimilarChannels";
import { ChannelAddDialog } from "@/components/monitor/ChannelAddDialog";
import { MonitoringHistory } from "@/components/monitor/MonitoringHistory";

/* ---------- Stats ---------- */

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

async function fetchSimilarChannels(channelId: string): Promise<SimilarChannel[]> {
  const res = await fetch(`/api/monitor/similar?channelId=${channelId}`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

/* ---------- Mobile Tab ---------- */

type MobileTab = "list" | "detail";

/* ---------- Page ---------- */

export default function YoutuberTrackerPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null
  );
  const [mobileTab, setMobileTab] = useState<MobileTab>("list");
  const [memo, setMemo] = useState("");
  const [satisfaction, setSatisfaction] = useState<string | null>(null);

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

  const channelIdList = trackedChannels.map((ch) => ch.channelId).join(",");

  const { data: statsMap = {} } = useQuery<Record<string, ChannelStats>>({
    queryKey: ["monitor-stats", channelIdList],
    queryFn: async () => {
      if (!channelIdList) return {};
      const res = await fetch(`/api/monitor/stats?channelIds=${channelIdList}`);
      if (!res.ok) return {};
      const json = await res.json();
      return (json.data ?? {}) as Record<string, ChannelStats>;
    },
    enabled: trackedChannels.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

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
  const selectedStats = selectedChannelId
    ? statsMap[selectedChannelId]
    : undefined;
  const selectedHistory = selectedChannelId
    ? history[selectedChannelId] ?? []
    : [];
  const { data: selectedVideos = [] } = useQuery({
    queryKey: ["monitor-videos", selectedChannelId],
    queryFn: async () => {
      const res = await fetch(
        `/api/monitor/videos?channelId=${selectedChannelId}`
      );
      if (!res.ok) return [];
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!selectedChannelId,
    staleTime: 1000 * 60 * 30, // 30분
  });
  const { data: similarChannels = [] } = useQuery({
    queryKey: ["similar-channels", selectedChannelId],
    queryFn: () => fetchSimilarChannels(selectedChannelId!),
    enabled: !!selectedChannelId,
    staleTime: 1000 * 60 * 60, // 1시간
  });

  const chartData = useMemo(() => {
    return selectedHistory.map((h) => ({
      date: h.date,
      subscribers: h.subscribers,
      dailyViews: h.dailyViews,
      algoScore: h.algoScore,
    }));
  }, [selectedHistory]);

  // Computed stats from history
  const computedStats = useMemo(() => {
    if (selectedHistory.length < 2) {
      const latest = selectedHistory[0];
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
    const latest = selectedHistory[selectedHistory.length - 1];
    const prev = selectedHistory[selectedHistory.length - 2];
    const oldest = selectedHistory[0];
    return {
      subscribers: latest.subscribers,
      subscriberDelta: latest.subscribers - prev.subscribers,
      dailyViews: latest.dailyViews,
      viewDelta: latest.dailyViews - prev.dailyViews,
      algoScore: latest.algoScore,
      algoDelta: latest.algoScore - prev.algoScore,
      growthRate:
        oldest.subscribers > 0
          ? ((latest.subscribers - oldest.subscribers) / oldest.subscribers) *
            100
          : 0,
    };
  }, [selectedHistory]);

  const isEmpty = trackedChannels.length === 0;

  function handleSelectChannel(channelId: string) {
    setSelectedChannelId(channelId);
    setMemo(
      trackedChannels.find((c) => c.channelId === channelId)?.memo ?? ""
    );
    setSatisfaction(null);
    setMobileTab("detail");
  }

  function handleDeselectChannel() {
    setSelectedChannelId(null);
    setMemo("");
    setSatisfaction(null);
    setMobileTab("list");
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

  function handleMemoBlur() {
    if (selectedChannelId) {
      updateChannelMemo(selectedChannelId, memo);
    }
  }

  function handleMemoKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && selectedChannelId) {
      updateChannelMemo(selectedChannelId, memo);
    }
  }

  const categoryLabel = selectedChannel
    ? (CATEGORIES.find((c) => c.value === selectedChannel.category)?.label ??
      selectedChannel.category)
    : "";

  return (
    <div className="flex flex-col gap-0 min-h-screen bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20">
            <Activity className="size-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">
              유튜버 모니터
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              관심 채널의 구독자, 조회수, 성장률 변동을 실시간으로 추적합니다
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setDialogOpen(true)}
          disabled={trackedChannels.length >= 20}
          className="bg-blue-600 hover:bg-blue-500 text-white border-none gap-1.5"
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">채널 추가</span>
          <span className="sm:hidden">추가</span>
        </Button>
      </div>

      {/* Mobile tab switcher - only on md and below */}
      {!isEmpty && (
        <div className="flex md:hidden border-b border-slate-800">
          <button
            onClick={() => setMobileTab("list")}
            className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${
              mobileTab === "list"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            채널 목록 ({filteredChannels.length})
          </button>
          <button
            onClick={() => setMobileTab("detail")}
            className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${
              mobileTab === "detail"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            채널 상세
          </button>
        </div>
      )}

      {/* Big empty state when no channels at all */}
      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-800">
            <Activity className="size-10 text-slate-500" />
          </div>
          <div>
            <p className="text-lg font-medium text-slate-300">
              아직 추적 중인 채널이 없습니다
            </p>
            <p className="mt-1.5 text-sm text-slate-500">
              관심 채널을 추가하면 구독자/조회수 변동을 실시간으로 확인할 수
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
        /* 2-column layout */
        <div className="flex flex-1 overflow-hidden">
          {/* ===== LEFT PANEL (sidebar) ===== */}
          <aside
            className={`w-full md:w-[280px] md:min-w-[280px] md:max-w-[280px] md:flex flex-col border-r border-slate-800 bg-slate-900 overflow-hidden ${
              mobileTab === "list" ? "flex" : "hidden"
            }`}
          >
            {/* Folder selector */}
            <div className="px-3 pt-3 pb-2 border-b border-slate-800">
              <FolderSelector
                folders={folders}
                activeFolderId={activeFolderId}
                onSelect={setActiveFolder}
                onAdd={addFolder}
                onRemove={removeFolder}
                onRename={renameFolder}
              />
              {filteredChannels.length > 0 && (
                <p className="text-[11px] text-slate-500 mt-2 px-1">
                  {filteredChannels.length}개 채널 추적 중
                </p>
              )}
            </div>

            {/* Channel list */}
            <div className="flex-1 overflow-y-auto py-1">
              {filteredChannels.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-4">
                  <Activity className="size-6 text-slate-600" />
                  <p className="text-xs text-slate-500">
                    이 폴더에 채널이 없습니다
                  </p>
                </div>
              ) : (
                filteredChannels.map((ch) => {
                  const stats = statsMap[ch.channelId];
                  const isActive = selectedChannelId === ch.channelId;
                  const delta = stats?.subscriberDelta ?? 0;
                  const isPositive = delta >= 0;

                  return (
                    <div
                      key={ch.channelId}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectChannel(ch.channelId)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSelectChannel(ch.channelId); }}
                      className={`group w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors relative cursor-pointer ${
                        isActive
                          ? "bg-blue-500/10 border-l-2 border-l-blue-500"
                          : "hover:bg-slate-800/70 border-l-2 border-l-transparent"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-700">
                        {ch.thumbnailUrl ? (
                          <Image
                            src={ch.thumbnailUrl}
                            alt={ch.title}
                            width={32}
                            height={32}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs font-bold text-slate-400">
                            {ch.title.slice(0, 1)}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            isActive ? "text-blue-300" : "text-slate-200"
                          }`}
                        >
                          {ch.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-slate-500">
                            {formatNumber(stats?.subscribers ?? 0)}
                          </span>
                          <span
                            className={`text-[11px] font-medium ${
                              isPositive
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {isPositive ? "+" : ""}
                            {formatNumber(Math.abs(delta))}
                          </span>
                        </div>
                      </div>

                      {/* Remove button on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeChannel(ch.channelId);
                          if (selectedChannelId === ch.channelId) {
                            handleDeselectChannel();
                          }
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center size-6 rounded-md text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="채널 제거"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add channel button at bottom */}
            <div className="px-3 py-2 border-t border-slate-800">
              <button
                onClick={() => setDialogOpen(true)}
                disabled={trackedChannels.length >= 20}
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-sm font-medium text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="size-3.5" />
                채널 추가
              </button>
            </div>

            {/* Info card at bottom of sidebar */}
            <div className="px-3 pb-3">
              <div className="rounded-xl bg-slate-800/50 border border-slate-800 p-3">
                <p className="text-[11px] font-medium text-slate-400 mb-2">
                  모니터링 안내
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <Bell className="size-3 text-blue-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      구독자/조회수 일간 증감 추적
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <RefreshCw className="size-3 text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      최대 20개 채널 동시 추적
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <BarChart2 className="size-3 text-violet-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      알고리즘 노출 점수 변화 확인
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ===== RIGHT PANEL (main content) ===== */}
          <main
            className={`flex-1 overflow-y-auto bg-slate-950 ${
              mobileTab === "detail" ? "flex flex-col" : "hidden md:flex md:flex-col"
            }`}
          >
            <div className="flex flex-col gap-6 p-4 sm:p-6">
              {/* Summary Cards */}
              {trackedChannels.length > 0 && (
                <MonitorSummaryCards channels={summaryData} />
              )}

              {/* Content area */}
              {selectedChannel && selectedStats ? (
                <div className="flex flex-col gap-6">
                  {/* Channel Detail Header */}
                  <Card className="border-slate-800 bg-slate-900 overflow-hidden">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start gap-4">
                        {/* Large thumbnail */}
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-slate-700 ring-2 ring-slate-700">
                          {selectedChannel.thumbnailUrl ? (
                            <Image
                              src={selectedChannel.thumbnailUrl}
                              alt={selectedChannel.title}
                              width={56}
                              height={56}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-lg font-bold text-slate-400">
                              {selectedChannel.title.slice(0, 1)}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg font-bold text-slate-100 truncate">
                              {selectedChannel.title}
                            </h2>
                            <Badge
                              variant="secondary"
                              className="bg-slate-800 text-slate-300 text-xs border-slate-700 shrink-0"
                            >
                              {categoryLabel}
                            </Badge>
                          </div>

                          {/* Subscriber count + delta */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-sm text-slate-300">
                              구독자{" "}
                              {formatNumber(selectedStats.subscribers)}명
                            </span>
                            <span
                              className={`flex items-center gap-0.5 text-xs font-medium ${
                                selectedStats.subscriberDelta >= 0
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >
                              {selectedStats.subscriberDelta >= 0 ? (
                                <TrendingUp className="size-3" />
                              ) : (
                                <TrendingDown className="size-3" />
                              )}
                              {selectedStats.subscriberDelta >= 0 ? "+" : ""}
                              {formatNumber(
                                Math.abs(selectedStats.subscriberDelta)
                              )}
                            </span>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDeselectChannel}
                              className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-xs"
                            >
                              채널 변경하기
                            </Button>
                            <Link
                              href={`/channel/${selectedChannel.channelId}`}
                              className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-3 h-8 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                            >
                              채널 상세 보기
                              <ExternalLink className="size-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Trend Chart */}
                  <MonitorTrendChart
                    data={chartData}
                    channelTitle={selectedChannel.title}
                  />

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Users className="size-3 text-blue-400" />
                        <p className="text-xs text-slate-400">구독자</p>
                      </div>
                      <p className="text-base font-bold text-slate-100">
                        {formatNumber(computedStats.subscribers)}
                      </p>
                      <p
                        className={`mt-0.5 text-xs font-medium ${
                          computedStats.subscriberDelta > 0
                            ? "text-emerald-400"
                            : computedStats.subscriberDelta < 0
                              ? "text-red-400"
                              : "text-slate-500"
                        }`}
                      >
                        {computedStats.subscriberDelta > 0 ? "+" : ""}
                        {formatNumber(computedStats.subscriberDelta)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Eye className="size-3 text-emerald-400" />
                        <p className="text-xs text-slate-400">일 조회수</p>
                      </div>
                      <p className="text-base font-bold text-slate-100">
                        {formatNumber(computedStats.dailyViews)}
                      </p>
                      <p
                        className={`mt-0.5 text-xs font-medium ${
                          computedStats.viewDelta > 0
                            ? "text-emerald-400"
                            : computedStats.viewDelta < 0
                              ? "text-red-400"
                              : "text-slate-500"
                        }`}
                      >
                        {computedStats.viewDelta > 0 ? "+" : ""}
                        {formatNumber(computedStats.viewDelta)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Zap className="size-3 text-violet-400" />
                        <p className="text-xs text-slate-400">알고 점수</p>
                      </div>
                      <p className="text-base font-bold text-slate-100">
                        {computedStats.algoScore}
                      </p>
                      <p
                        className={`mt-0.5 text-xs font-medium ${
                          computedStats.algoDelta > 0
                            ? "text-emerald-400"
                            : computedStats.algoDelta < 0
                              ? "text-red-400"
                              : "text-slate-500"
                        }`}
                      >
                        {computedStats.algoDelta > 0 ? "+" : ""}
                        {computedStats.algoDelta}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Activity className="size-3 text-amber-400" />
                        <p className="text-xs text-slate-400">성장률</p>
                      </div>
                      <p className="text-base font-bold text-slate-100">
                        {formatGrowthRate(computedStats.growthRate)}
                      </p>
                      <p
                        className={`mt-0.5 text-xs font-medium ${
                          computedStats.growthRate > 0
                            ? "text-emerald-400"
                            : computedStats.growthRate < 0
                              ? "text-red-400"
                              : "text-slate-500"
                        }`}
                      >
                        {formatGrowthRate(computedStats.growthRate)}
                      </p>
                    </div>
                  </div>

                  {/* Monitoring History */}
                  {selectedHistory.length > 0 && (
                    <MonitoringHistory
                      channelTitle={selectedChannel.title}
                      history={selectedHistory}
                    />
                  )}

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

                  {/* Memo Section */}
                  <Card className="border-slate-800 bg-slate-900">
                    <CardContent className="p-4">
                      <label className="text-xs font-medium text-slate-400 mb-2 block">
                        메모
                      </label>
                      <Input
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        onBlur={handleMemoBlur}
                        onKeyDown={handleMemoKeyDown}
                        placeholder="채널에 대한 메모를 입력하세요..."
                        className="border-slate-700 bg-slate-800 text-slate-200 placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
                      />
                    </CardContent>
                  </Card>

                  {/* Satisfaction Survey */}
                  <Card className="border-slate-800 bg-slate-900">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-slate-300 text-center mb-3">
                        이 채널 분석이 도움이 되셨나요?
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        {[
                          { key: "bad", emoji: "\uD83D\uDE1E", label: "아쉬워요" },
                          { key: "ok", emoji: "\uD83D\uDE10", label: "보통이에요" },
                          { key: "good", emoji: "\uD83D\uDE0A", label: "만족스러워요" },
                        ].map((item) => (
                          <button
                            key={item.key}
                            onClick={() => setSatisfaction(item.key)}
                            className={`flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl transition-colors ${
                              satisfaction === item.key
                                ? "bg-blue-500/20 ring-1 ring-blue-500/40"
                                : "hover:bg-slate-800"
                            }`}
                          >
                            <span className="text-2xl">{item.emoji}</span>
                            <span className="text-[11px] text-slate-400">
                              {item.label}
                            </span>
                          </button>
                        ))}
                      </div>
                      {satisfaction && (
                        <p className="text-xs text-slate-500 text-center mt-2">
                          소중한 피드백 감사합니다!
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                /* Empty state - no channel selected */
                <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
                    <Activity className="size-8 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-slate-400">
                      왼쪽에서 채널을 선택하세요
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      채널을 선택하면 상세 분석을 확인할 수 있습니다
                    </p>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      <ChannelAddDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
