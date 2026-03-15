"use client";

import { Star } from "lucide-react";
import { FavoriteManager } from "@/components/favorites/FavoriteManager";
import { useFavoriteStore } from "@/stores/favoriteStore";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default function FavoritesPage() {
  const totalCount = useFavoriteStore((s) => s.favorites.length);

  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: "즐겨찾기" }]} />
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
