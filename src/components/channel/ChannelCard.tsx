"use client";

import Link from "next/link";
import Image from "next/image";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatCurrency, formatDate, formatGrowthRate } from "@/lib/formatters";
import type { ChannelSearchResult } from "@/types";
import { CATEGORIES } from "@/domain/categories";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";

interface ChannelCardProps {
  channel: ChannelSearchResult;
  rank: number;
}

export function ChannelCard({ channel, rank }: ChannelCardProps) {
  const categoryLabel =
    CATEGORIES.find((c) => c.value === channel.category)?.label ??
    channel.category;

  const isPositiveGrowth = channel.growthRate30d >= 0;

  return (
    <Link href={`/channel/${channel.id}`}>
      {/* Mobile: card layout */}
      <div className="block md:hidden px-4 py-3 hover:bg-slate-800/60 transition-colors cursor-pointer border-b border-slate-800 last:border-0">
        <div className="flex items-center gap-3">
          {/* 순위 */}
          <span className="text-sm font-semibold text-slate-400 w-6 text-center shrink-0">
            {rank}
          </span>

          {/* 썸네일 */}
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-700">
            {channel.thumbnailUrl ? (
              <Image
                src={channel.thumbnailUrl}
                alt={channel.title}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-slate-500 font-medium">
                {channel.title.charAt(0)}
              </div>
            )}
          </div>

          {/* 채널명 + 카테고리 */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-100">
              {channel.title}
            </p>
            <Badge
              variant="secondary"
              className="mt-0.5 h-4 px-1.5 text-[10px] bg-slate-700 text-slate-400 border-0"
            >
              {categoryLabel}
            </Badge>
          </div>

          {/* 구독자 + 성장률 */}
          <div className="text-right shrink-0">
            <p className="text-sm font-medium text-slate-200">
              {formatNumber(channel.subscriberCount)}
            </p>
            <div
              className={`flex items-center justify-end gap-0.5 text-xs font-medium ${
                isPositiveGrowth ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {isPositiveGrowth ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {formatGrowthRate(channel.growthRate30d)}
            </div>
          </div>
          {/* 즐겨찾기 */}
          <FavoriteButton channel={channel} size="sm" />
        </div>
      </div>

      {/* Desktop: table row layout */}
      <div className="hidden md:grid grid-cols-[48px_minmax(200px,1fr)_120px_100px_120px_120px_minmax(160px,1fr)_40px] items-center gap-3 px-4 py-3 hover:bg-slate-800/60 transition-colors cursor-pointer border-b border-slate-800 last:border-0 min-w-[960px]">
        {/* 순위 */}
        <div className="text-center">
          <span className="text-sm font-semibold text-slate-400">{rank}</span>
        </div>

        {/* 채널 썸네일 + 이름 + 카테고리 */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-700">
            {channel.thumbnailUrl ? (
              <Image
                src={channel.thumbnailUrl}
                alt={channel.title}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-slate-500 font-medium">
                {channel.title.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-100">
              {channel.title}
            </p>
            <Badge
              variant="secondary"
              className="mt-0.5 h-4 px-1.5 text-[10px] bg-slate-700 text-slate-400 border-0"
            >
              {categoryLabel}
            </Badge>
          </div>
        </div>

        {/* 구독자 수 */}
        <div className="text-right">
          <p className="text-sm font-medium text-slate-200">
            {formatNumber(channel.subscriberCount)}
          </p>
          <p className="text-[10px] text-slate-500">구독자</p>
        </div>

        {/* 성장률 */}
        <div className="text-right">
          <div
            className={`flex items-center justify-end gap-0.5 text-sm font-medium ${
              isPositiveGrowth ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {isPositiveGrowth ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {formatGrowthRate(channel.growthRate30d)}
          </div>
          <p className="text-[10px] text-slate-500">30일 성장</p>
        </div>

        {/* 일 평균 조회수 */}
        <div className="text-right">
          <p className="text-sm font-medium text-slate-200">
            {formatNumber(channel.dailyAvgViews)}
          </p>
          <p className="text-[10px] text-slate-500">일 조회수</p>
        </div>

        {/* 예상 수익 */}
        <div className="text-right">
          <p className="text-sm font-medium text-slate-200">
            {formatCurrency(channel.estimatedRevenue)}
          </p>
          <p className="text-[10px] text-slate-500">예상 수익</p>
        </div>

        {/* 최신 영상 */}
        <div className="min-w-0">
          {channel.latestVideo ? (
            <>
              <p className="truncate text-xs text-slate-300">
                {channel.latestVideo.title}
              </p>
              <p className="text-[10px] text-slate-500">
                {formatDate(channel.latestVideo.publishedAt)}
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-600">-</p>
          )}
        </div>
        {/* 즐겨찾기 */}
        <div className="flex justify-center">
          <FavoriteButton channel={channel} size="sm" />
        </div>
      </div>
    </Link>
  );
}
