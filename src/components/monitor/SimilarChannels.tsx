"use client";

import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/formatters";

export interface SimilarChannel {
  channelId: string;
  title: string;
  thumbnailUrl: string;
  subscriberCount: number;
  category: string;
  similarity: number;
}

interface SimilarChannelsProps {
  channels: SimilarChannel[];
  onAddToMonitor: (channel: SimilarChannel) => void;
}

const AVATAR_GRADIENTS = [
  "from-indigo-600 to-violet-600",
  "from-blue-600 to-cyan-600",
  "from-rose-600 to-pink-600",
  "from-amber-600 to-orange-600",
  "from-emerald-600 to-teal-600",
  "from-purple-600 to-indigo-600",
];

function similarityColor(similarity: number): string {
  if (similarity >= 80) return "text-emerald-400";
  if (similarity >= 60) return "text-amber-400";
  return "text-slate-400";
}

function ChannelCard({
  channel,
  index,
  onAddToMonitor,
}: {
  channel: SimilarChannel;
  index: number;
  onAddToMonitor: (channel: SimilarChannel) => void;
}) {
  const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  const initials = channel.title.slice(0, 2);

  return (
    <div className="flex-shrink-0 w-40 bg-slate-800/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col items-center gap-3 transition-colors group">
      {/* Avatar */}
      <div
        className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 ring-2 ring-slate-700 group-hover:ring-indigo-600 transition-all`}
      >
        <span className="text-white text-base font-bold">{initials}</span>
      </div>

      {/* Info */}
      <div className="flex flex-col items-center gap-1 text-center w-full min-w-0">
        <p className="text-sm font-semibold text-slate-100 truncate w-full">
          {channel.title}
        </p>
        <p className="text-xs text-slate-400">
          {formatNumber(channel.subscriberCount)}명
        </p>
        <Badge className="bg-slate-700 text-slate-300 border-none text-[10px] px-2 py-0.5 h-auto mt-0.5">
          {channel.category}
        </Badge>
        <span
          className={`text-xs font-medium mt-0.5 ${similarityColor(channel.similarity)}`}
        >
          유사도 {channel.similarity}%
        </span>
      </div>

      {/* Add button */}
      <button
        onClick={() => onAddToMonitor(channel)}
        className="w-full flex items-center justify-center gap-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-1.5 transition-colors mt-auto"
      >
        <Plus className="h-3 w-3" />
        추가
      </button>
    </div>
  );
}

export function SimilarChannels({
  channels,
  onAddToMonitor,
}: SimilarChannelsProps) {
  const displayed = channels.slice(0, 6);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-100">
          이런 채널은 어때요?
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          비슷한 콘텐츠를 만드는 채널을 모니터링해보세요
        </p>
      </div>

      {/* Horizontal scroll */}
      {displayed.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-slate-500 text-sm">
          유사 채널을 불러오는 중입니다.
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
          {displayed.map((channel, index) => (
            <ChannelCard
              key={channel.channelId}
              channel={channel}
              index={index}
              onAddToMonitor={onAddToMonitor}
            />
          ))}
        </div>
      )}
    </div>
  );
}
