"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Flame, ExternalLink, AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/components/ui/breadcrumb";

interface TrendingVideoItem {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  channelThumbnailUrl: string;
  viewCount: number;
  publishedAt: string;
  duration: string;
}

interface TrendingResponse {
  data: TrendingVideoItem[];
}

const TRENDING_CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "music", label: "음악" },
  { value: "gaming", label: "게임" },
  { value: "entertainment", label: "엔터테인먼트" },
  { value: "news", label: "뉴스" },
  { value: "sports", label: "스포츠" },
];

const REGION_OPTIONS = [
  { value: "KR", label: "한국" },
  { value: "US", label: "미국" },
  { value: "JP", label: "일본" },
  { value: "GB", label: "영국" },
  { value: "DE", label: "독일" },
  { value: "FR", label: "프랑스" },
  { value: "BR", label: "브라질" },
  { value: "IN", label: "인도" },
  { value: "TW", label: "대만" },
  { value: "TH", label: "태국" },
];

function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";
  const h = parseInt(match[1] || "0", 10);
  const m = parseInt(match[2] || "0", 10);
  const s = parseInt(match[3] || "0", 10);
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function TrendingPage() {
  const [category, setCategory] = useState("all");
  const [region, setRegion] = useState("KR");

  const { data, isLoading, isError, refetch } = useQuery<TrendingResponse>({
    queryKey: ["trending", region, category],
    queryFn: async () => {
      const params = new URLSearchParams({ region, category });
      const res = await fetch(`/api/trending?${params}`);
      if (!res.ok) throw new Error("인기 급상승 데이터 로딩 실패");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const items = data?.data ?? [];

  return (
    <div className="text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "트렌딩" }]} />
        {/* Header */}
        <div className="mb-6 flex items-center gap-2">
          <Flame className="size-6 text-orange-400" />
          <div>
            <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">
              인기 급상승 동영상
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              YouTube 인기 급상승 동영상을 실시간으로 확인하세요.
            </p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {TRENDING_CATEGORIES.map((cat) => (
            <Button
              key={cat.value}
              variant="ghost"
              size="sm"
              onClick={() => setCategory(cat.value)}
              className={cn(
                "h-8 rounded-lg px-3 text-sm font-medium transition-colors",
                category === cat.value
                  ? "bg-orange-600 text-white hover:bg-orange-500"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              )}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Region Select */}
        <div className="mb-6">
          <Select value={region} onValueChange={(v) => setRegion(v ?? "KR")}>
            <SelectTrigger className="h-8 w-28 border-slate-700 bg-slate-800 text-slate-300 text-xs">
              <SelectValue placeholder="지역" />
            </SelectTrigger>
            <SelectContent>
              {REGION_OPTIONS.map((r) => (
                <SelectItem key={r.value} value={r.value} className="text-xs">
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Video Grid */}
        {isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <AlertTriangle className="w-12 h-12 mb-4 text-yellow-500" />
            <p className="text-lg mb-2">데이터를 불러올 수 없습니다</p>
            <p className="text-sm mb-4">잠시 후 다시 시도해주세요</p>
            <button onClick={() => refetch()} className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors">
              다시 시도
            </button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900"
              >
                <Skeleton className="aspect-video w-full bg-slate-800" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-full bg-slate-800" />
                  <Skeleton className="h-4 w-2/3 bg-slate-800" />
                  <Skeleton className="h-3 w-1/2 bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 text-center text-slate-500">
            해당 조건의 인기 영상이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <a
                key={item.videoId}
                href={`https://www.youtube.com/watch?v=${item.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-lg border border-slate-800 bg-slate-900 hover:border-slate-700 transition-colors"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                  <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                    {formatDuration(item.duration)}
                  </span>
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <ExternalLink className="size-6 text-white" />
                  </span>
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex gap-2.5">
                    {/* Channel avatar */}
                    {item.channelThumbnailUrl && (
                      <div className="shrink-0 mt-0.5">
                        <Image
                          src={item.channelThumbnailUrl}
                          alt={item.channelTitle}
                          width={36}
                          height={36}
                          className="rounded-full object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-slate-200 line-clamp-2 leading-snug">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 truncate">
                        {item.channelTitle}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {formatNumber(item.viewCount)}회 ·{" "}
                        {formatDate(item.publishedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
