"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFavoriteStore } from "@/stores/favoriteStore";
import { formatNumber } from "@/lib/formatters";

export function FavoritesSummary() {
  const favorites = useFavoriteStore((s) => s.favorites);

  if (favorites.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            즐겨찾기 채널 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Star className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-2">즐겨찾기한 채널이 없습니다</p>
            <Link
              href="/search"
              className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2"
            >
              채널 검색하기
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          즐겨찾기 채널 요약
          <span className="text-xs font-normal text-slate-500">{favorites.length}개 채널</span>
        </CardTitle>
        <Link
          href="/my/favorites"
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          전체보기 <ExternalLink className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {/* Channel list */}
        <div className="space-y-2">
          {favorites.slice(0, 5).map((item) => (
            <Link
              key={item.channel.id}
              href={`/channel/${item.channel.id}`}
              className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-700/50 transition-colors group"
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
                <p className="text-xs text-slate-500">
                  구독자 {formatNumber(item.channel.subscriberCount)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
