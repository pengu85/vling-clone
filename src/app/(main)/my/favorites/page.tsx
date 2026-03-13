"use client";

import { Star } from "lucide-react";
import { FavoriteManager } from "@/components/favorites/FavoriteManager";
import { useFavorites } from "@/hooks/useFavorites";

export default function FavoritesPage() {
  const { totalCount } = useFavorites();

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
        <h1 className="text-xl font-bold text-slate-100">즐겨찾기</h1>
        <span className="text-sm text-slate-500">전체 {totalCount}개 채널</span>
      </div>

      {/* 즐겨찾기 관리 */}
      <FavoriteManager />
    </div>
  );
}
