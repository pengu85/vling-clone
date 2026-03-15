"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Film, Smartphone, ExternalLink, AlertTriangle } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ranking/Pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES } from "@/domain/categories";
import { formatNumber, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface VideoRankingItem {
  rank: number;
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  viewCount: number;
  likeCount: number;
  publishedAt: string;
  duration: string;
  isShort: boolean;
  algoScore: number;
}

interface VideoRankingResponse {
  data: VideoRankingItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const VIDEO_TABS = [
  { value: "longform" as const, label: "롱폼", icon: Film },
  { value: "shorts" as const, label: "Shorts", icon: Smartphone },
];

function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";
  const h = parseInt(match[1] || "0", 10);
  const m = parseInt(match[2] || "0", 10);
  const s = parseInt(match[3] || "0", 10);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-blue-400";
  if (score >= 40) return "text-yellow-400";
  return "text-slate-400";
}

const LIMIT = 20;

export default function VideoRankingPage() {
  const [videoType, setVideoType] = useState<"longform" | "shorts">("longform");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery<VideoRankingResponse>({
    queryKey: ["video-ranking", videoType, category, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: videoType,
        category,
        page: String(page),
        limit: String(LIMIT),
      });
      const res = await fetch(`/api/ranking/videos?${params}`);
      if (!res.ok) throw new Error("영상 순위 로딩 실패");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const items = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  function handleTypeChange(type: "longform" | "shorts") {
    setVideoType(type);
    setPage(1);
  }

  return (
    <div className="text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "랭킹", href: "/ranking/subscriber" }, { label: "영상" }]} />
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">
            영상 순위
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            조회수 기반 롱폼/Shorts 영상 순위를 확인하세요.
          </p>
        </div>

        {/* Video Type Tabs */}
        <div className="mb-4 flex gap-1.5">
          {VIDEO_TABS.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant="ghost"
              size="sm"
              onClick={() => handleTypeChange(value)}
              className={cn(
                "h-8 gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors",
                videoType === value
                  ? "bg-blue-600 text-white hover:bg-blue-500"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </Button>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Select value={category} onValueChange={(v) => { setCategory(v ?? "all"); setPage(1); }}>
            <SelectTrigger className="h-8 w-full max-w-[144px] border-slate-700 bg-slate-800 text-slate-300 text-xs sm:w-36">
              <SelectValue placeholder="카테고리" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value} className="text-xs">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 w-12">
                  #
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 min-w-[300px]">
                  영상
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500">
                  채널
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-slate-500">
                  조회수
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-slate-500">
                  좋아요
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-slate-500">
                  업로드일
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-slate-500">
                  알고리즘
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
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-14 w-24 rounded bg-slate-800 shrink-0" />
                          <Skeleton className="h-4 w-48 bg-slate-800" />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Skeleton className="h-4 w-20 bg-slate-800" />
                      </td>
                      <td className="px-3 py-3">
                        <Skeleton className="h-4 w-16 bg-slate-800 ml-auto" />
                      </td>
                      <td className="px-3 py-3">
                        <Skeleton className="h-4 w-12 bg-slate-800 ml-auto" />
                      </td>
                      <td className="px-3 py-3">
                        <Skeleton className="h-4 w-16 bg-slate-800 ml-auto" />
                      </td>
                      <td className="px-3 py-3">
                        <Skeleton className="h-4 w-10 bg-slate-800 ml-auto" />
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
                            item.rank <= 3 ? "text-yellow-400" : "text-slate-500"
                          )}
                        >
                          {item.rank}
                        </span>
                      </td>

                      {/* Thumbnail + Title */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <a
                            href={`https://www.youtube.com/watch?v=${item.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative shrink-0 group"
                          >
                            <Image
                              src={item.thumbnailUrl}
                              alt={item.title}
                              width={160}
                              height={90}
                              className="rounded object-cover w-24 h-14"
                            />
                            <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 py-0.5 text-[10px] font-medium text-white">
                              {formatDuration(item.duration)}
                            </span>
                            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded">
                              <ExternalLink className="size-4 text-white" />
                            </span>
                          </a>
                          <a
                            href={`https://www.youtube.com/watch?v=${item.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-slate-200 hover:text-blue-400 transition-colors line-clamp-2"
                          >
                            {item.title}
                          </a>
                        </div>
                      </td>

                      {/* Channel */}
                      <td className="px-3 py-3">
                        {item.channelId ? (
                          <Link
                            href={`/channel/${item.channelId}`}
                            className="text-sm text-slate-400 hover:text-blue-400 transition-colors whitespace-nowrap"
                          >
                            {item.channelTitle}
                          </Link>
                        ) : (
                          <span className="text-sm text-slate-400 whitespace-nowrap">
                            {item.channelTitle}
                          </span>
                        )}
                      </td>

                      {/* View Count */}
                      <td className="px-3 py-3 text-right">
                        <span className="text-sm font-medium text-slate-300 tabular-nums">
                          {formatNumber(item.viewCount)}
                        </span>
                      </td>

                      {/* Likes */}
                      <td className="px-3 py-3 text-right">
                        <span className="text-sm text-slate-400 tabular-nums">
                          {formatNumber(item.likeCount)}
                        </span>
                      </td>

                      {/* Published */}
                      <td className="px-3 py-3 text-right">
                        <span className="text-sm text-slate-500 whitespace-nowrap">
                          {formatDate(item.publishedAt)}
                        </span>
                      </td>

                      {/* Algo Score */}
                      <td className="px-3 py-3 text-right">
                        <span
                          className={cn(
                            "text-sm font-bold tabular-nums",
                            getScoreColor(item.algoScore)
                          )}
                        >
                          {item.algoScore}
                        </span>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Error state */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <AlertTriangle className="w-12 h-12 mb-4 text-yellow-500" />
            <p className="text-lg mb-2">데이터를 불러올 수 없습니다</p>
            <p className="text-sm mb-4">잠시 후 다시 시도해주세요</p>
            <button onClick={() => refetch()} className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors">
              다시 시도
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && items.length === 0 && (
          <div className="mt-8 text-center text-slate-500">
            해당 조건의 영상이 없습니다.
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !isError && totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
