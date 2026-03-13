"use client";

import Image from "next/image";
import { ThumbsUp, Eye, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatDate } from "@/lib/formatters";
import type { Video } from "@/types";

interface ChannelVideoGridProps {
  videos: Video[];
}

function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return iso;
  const h = parseInt(match[1] ?? "0");
  const m = parseInt(match[2] ?? "0");
  const s = parseInt(match[3] ?? "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface VideoCardProps {
  video: Video;
}

function VideoCard({ video }: VideoCardProps) {
  return (
    <div className="group bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:shadow-md hover:shadow-indigo-900/40 transition-shadow cursor-pointer">
      {/* 썸네일 */}
      <div className="relative aspect-video bg-slate-700 overflow-hidden">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 to-violet-900">
            <span className="text-3xl text-indigo-400">▶</span>
          </div>
        )}
        {/* 재생 시간 */}
        <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-mono">
          {formatDuration(video.duration)}
        </div>
        {/* Shorts 배지 */}
        {video.isShort && (
          <div className="absolute top-1.5 left-1.5">
            <Badge className="bg-red-500 text-white border-none text-[10px] px-1.5 py-0.5 h-auto">
              Shorts
            </Badge>
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="p-3">
        <p className="text-sm font-medium text-slate-100 line-clamp-2 leading-snug mb-2">
          {video.title}
        </p>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {formatNumber(video.viewCount)}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" />
            {formatNumber(video.likeCount)}
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <Clock className="h-3 w-3" />
            {formatDate(
              video.publishedAt instanceof Date
                ? video.publishedAt.toISOString()
                : String(video.publishedAt)
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ChannelVideoGrid({ videos }: ChannelVideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
        영상이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
