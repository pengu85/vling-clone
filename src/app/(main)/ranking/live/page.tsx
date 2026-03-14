"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Radio, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES } from "@/domain/categories";
import { formatNumber, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface LiveStreamItem {
  rank: number;
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  channelThumbnailUrl: string;
  concurrentViewers: number;
  startedAt: string;
  category: string;
}

interface LiveResponse {
  data: LiveStreamItem[];
}

const LIVE_CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "gaming", label: "게임" },
  { value: "music", label: "음악" },
  { value: "entertainment", label: "엔터테인먼트" },
  { value: "sports", label: "스포츠" },
  { value: "news", label: "뉴스" },
  { value: "education", label: "교육" },
  { value: "food", label: "먹방" },
  { value: "tech", label: "기술/IT" },
];

function formatElapsed(startedAt: string): string {
  const diff = Date.now() - new Date(startedAt).getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}시간 ${minutes}분 전 시작`;
  return `${minutes}분 전 시작`;
}

export default function LiveRankingPage() {
  const [category, setCategory] = useState("all");

  const { data, isLoading } = useQuery<LiveResponse>({
    queryKey: ["live-ranking", category],
    queryFn: async () => {
      const params = new URLSearchParams({ category });
      const res = await fetch(`/api/ranking/live?${params}`);
      if (!res.ok) throw new Error("라이브 순위 로딩 실패");
      return res.json();
    },
    staleTime: 60 * 1000, // 1 minute for live data
    refetchInterval: 60 * 1000, // auto-refetch every minute
  });

  const items = data?.data ?? [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-2">
          <Radio className="size-6 text-red-400" />
          <div>
            <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">
              라이브 시청자 순위
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              현재 라이브 중인 채널의 동시 시청자 수 순위입니다.
            </p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-5 flex flex-wrap gap-1.5">
          {LIVE_CATEGORIES.map((cat) => (
            <Button
              key={cat.value}
              variant="ghost"
              size="sm"
              onClick={() => setCategory(cat.value)}
              className={cn(
                "h-8 rounded-lg px-3 text-sm font-medium transition-colors",
                category === cat.value
                  ? "bg-red-600 text-white hover:bg-red-500"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              )}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 w-12">
                  #
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 min-w-[200px]">
                  채널
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 min-w-[250px]">
                  라이브 제목
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-slate-500">
                  동시 시청자
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-slate-500">
                  시작 시간
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-center text-xs font-medium text-slate-500">
                  카테고리
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-800/50">
                      <td className="px-3 py-3">
                        <Skeleton className="h-4 w-6 bg-slate-800" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Skeleton className="size-9 rounded-full bg-slate-800 shrink-0" />
                          <Skeleton className="h-4 w-24 bg-slate-800" />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Skeleton className="h-4 w-48 bg-slate-800" />
                      </td>
                      <td className="px-3 py-3">
                        <Skeleton className="h-4 w-16 bg-slate-800 ml-auto" />
                      </td>
                      <td className="px-3 py-3">
                        <Skeleton className="h-4 w-20 bg-slate-800 ml-auto" />
                      </td>
                      <td className="px-3 py-3">
                        <Skeleton className="h-4 w-16 bg-slate-800 mx-auto" />
                      </td>
                    </tr>
                  ))
                : items.map((item) => (
                    <tr
                      key={item.videoId}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Rank */}
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "text-sm font-bold tabular-nums",
                            item.rank <= 3
                              ? "text-yellow-400"
                              : "text-slate-500"
                          )}
                        >
                          {item.rank}
                        </span>
                      </td>

                      {/* Channel */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          {item.channelThumbnailUrl && (
                            <Image
                              src={item.channelThumbnailUrl}
                              alt={item.channelTitle}
                              width={36}
                              height={36}
                              className="rounded-full object-cover shrink-0"
                            />
                          )}
                          <span className="text-sm font-medium text-slate-200 truncate">
                            {item.channelTitle}
                          </span>
                        </div>
                      </td>

                      {/* Live Title */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase shrink-0">
                            <span className="size-1.5 rounded-full bg-white animate-pulse" />
                            LIVE
                          </span>
                          <a
                            href={`https://www.youtube.com/watch?v=${item.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-slate-300 hover:text-red-400 transition-colors line-clamp-1 group inline-flex items-center gap-1"
                          >
                            {item.title}
                            <ExternalLink className="size-3 opacity-0 group-hover:opacity-100 shrink-0" />
                          </a>
                        </div>
                      </td>

                      {/* Concurrent Viewers */}
                      <td className="px-3 py-3 text-right">
                        <span className="text-sm font-bold text-red-400 tabular-nums">
                          {formatNumber(item.concurrentViewers)}
                        </span>
                        <span className="text-xs text-slate-600 ml-1">명</span>
                      </td>

                      {/* Started At */}
                      <td className="px-3 py-3 text-right">
                        <span className="text-sm text-slate-500 whitespace-nowrap">
                          {formatElapsed(item.startedAt)}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="px-3 py-3 text-center">
                        <span className="inline-block rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                          {CATEGORIES.find((c) => c.value === item.category)
                            ?.label || item.category}
                        </span>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {!isLoading && items.length === 0 && (
          <div className="mt-8 text-center text-slate-500">
            현재 라이브 중인 채널이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
