"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, X, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRecentStore } from "@/stores/recentStore";
import { formatNumber, formatDate } from "@/lib/formatters";

export function RecentChannels() {
  const recentChannels = useRecentStore((s) => s.recentChannels);
  const removeRecent = useRecentStore((s) => s.removeRecent);
  const clearAll = useRecentStore((s) => s.clearAll);

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          최근 본 채널
        </CardTitle>
        {recentChannels.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-xs text-slate-500 hover:text-red-400 hover:bg-slate-700 h-7 px-2"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            전체 삭제
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {recentChannels.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-2">최근 본 채널이 없습니다</p>
            <Link
              href="/search"
              className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2"
            >
              채널 검색하기
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            {recentChannels.slice(0, 10).map((item) => (
              <div
                key={item.channel.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-700/50 transition-colors group"
              >
                <Link
                  href={`/channel/${item.channel.id}`}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <Image
                    src={item.channel.thumbnailUrl}
                    alt={item.channel.title}
                    width={36}
                    height={36}
                    className="rounded-full shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate group-hover:text-slate-100">
                      {item.channel.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>구독자 {formatNumber(item.channel.subscriberCount)}</span>
                      <span>-</span>
                      <span>{formatDate(item.viewedAt)}</span>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => removeRecent(item.channel.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1 rounded"
                  title="삭제"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
