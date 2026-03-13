"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, ThumbsUp, TrendingUp, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatDate, formatGrowthRate } from "@/lib/formatters";

export interface VideoInsight {
  id: string;
  title: string;
  type: "long" | "shorts";
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
  thumbnailUrl: string;
  duration: string;
  viewsGrowth: number;
}

interface VideoInsightsProps {
  videos: VideoInsight[];
  channelTitle: string;
}

type TabType = "long" | "shorts";

const GRADIENT_COLORS = [
  "from-indigo-900 to-violet-900",
  "from-blue-900 to-cyan-900",
  "from-rose-900 to-pink-900",
  "from-amber-900 to-orange-900",
  "from-emerald-900 to-teal-900",
  "from-purple-900 to-indigo-900",
];

function thumbnailGradient(index: number): string {
  return GRADIENT_COLORS[index % GRADIENT_COLORS.length];
}

function VideoCard({
  video,
  isHot,
  index,
}: {
  video: VideoInsight;
  isHot: boolean;
  index: number;
}) {
  const isShorts = video.type === "shorts";
  const growthPositive = video.viewsGrowth >= 0;
  const youtubeUrl = isShorts
    ? `https://www.youtube.com/shorts/${video.id}`
    : `https://www.youtube.com/watch?v=${video.id}`;

  return (
    <a
      href={youtubeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors group border border-slate-800 hover:border-slate-700"
    >
      {/* Thumbnail */}
      <div
        className={`relative flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br ${thumbnailGradient(index)} flex items-center justify-center ${
          isShorts ? "w-[54px] h-[96px]" : "w-[160px] h-[90px]"
        }`}
      >
        {/* Real thumbnail image */}
        {video.thumbnailUrl && (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover"
            sizes={isShorts ? "54px" : "160px"}
          />
        )}

        {/* Play icon overlay on hover (shown when no image or as overlay) */}
        {!video.thumbnailUrl && (
          <span className="text-2xl opacity-40">▶</span>
        )}

        {/* Hover play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
          <span className="text-white text-xl opacity-0 group-hover:opacity-80 transition-opacity drop-shadow">
            ▶
          </span>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded font-mono leading-none z-10">
          {video.duration}
        </div>

        {/* HOT badge */}
        {isHot && (
          <div className="absolute top-1 left-1 z-10">
            <span className="flex items-center gap-0.5 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded leading-none">
              <Flame className="h-2.5 w-2.5" />
              HOT
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
        <p className="text-sm font-medium text-slate-100 line-clamp-2 leading-snug group-hover:text-blue-300 transition-colors">
          {video.title}
        </p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Eye className="h-3 w-3" />
            {formatNumber(video.views)}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <ThumbsUp className="h-3 w-3" />
            {formatNumber(video.likes)}
          </span>
          <span className="text-xs text-slate-500">
            {formatDate(video.publishedAt)}
          </span>
          <span
            className={`flex items-center gap-0.5 text-xs font-medium ml-auto ${
              growthPositive ? "text-emerald-400" : "text-red-400"
            }`}
          >
            <TrendingUp className="h-3 w-3" />
            {formatGrowthRate(video.viewsGrowth)}
          </span>
        </div>
      </div>
    </a>
  );
}

function SummaryStats({ videos }: { videos: VideoInsight[] }) {
  const totalViews = videos.reduce((sum, v) => sum + v.views, 0);
  const avgViews = videos.length > 0 ? Math.round(totalViews / videos.length) : 0;
  const totalLikes = videos.reduce((sum, v) => sum + v.likes, 0);

  const stats = [
    { label: "총 조회수", value: formatNumber(totalViews) },
    { label: "평균 조회수", value: formatNumber(avgViews) },
    { label: "총 좋아요", value: formatNumber(totalLikes) },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-800"
        >
          <p className="text-lg font-bold text-slate-100">{stat.value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

export function VideoInsights({ videos, channelTitle }: VideoInsightsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("long");

  const filtered = videos.filter((v) => v.type === activeTab);

  // Top video by viewsGrowth
  const hotVideoId =
    filtered.length > 0
      ? filtered.reduce((best, v) =>
          v.viewsGrowth > best.viewsGrowth ? v : best
        ).id
      : null;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-100">
          영상 인사이트
          <span className="ml-2 text-xs text-slate-500 font-normal">
            {channelTitle}
          </span>
        </h3>

        {/* Tab toggle */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("long")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === "long"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            롱폼영상
          </button>
          <button
            onClick={() => setActiveTab("shorts")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === "shorts"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Shorts
          </button>
        </div>
      </div>

      {/* Summary stats */}
      {filtered.length > 0 && <SummaryStats videos={filtered} />}

      {/* Video list */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
          영상이 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((video, index) => (
            <VideoCard
              key={video.id}
              video={video}
              isHot={video.id === hotVideoId}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
