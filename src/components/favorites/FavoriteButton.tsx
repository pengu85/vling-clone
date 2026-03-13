"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavoriteStore } from "@/stores/favoriteStore";
import { useToast } from "@/stores/toastStore";
import type { ChannelSearchResult } from "@/types";

interface FavoriteButtonProps {
  channel: ChannelSearchResult;
  size?: "sm" | "md";
}

export function FavoriteButton({ channel, size = "md" }: FavoriteButtonProps) {
  const isFavorite = useFavoriteStore((s) => s.isFavorite(channel.id));
  const addFavorite = useFavoriteStore((s) => s.addFavorite);
  const removeFavorite = useFavoriteStore((s) => s.removeFavorite);
  const { toast } = useToast();

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isFavorite) {
      removeFavorite(channel.id);
      toast(`${channel.title} 즐겨찾기 해제`, "info");
    } else {
      addFavorite(channel);
      toast(`${channel.title} 즐겨찾기 추가`, "success");
    }
  }

  return (
    <button
      onClick={handleToggle}
      aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      className={cn(
        "inline-flex items-center justify-center rounded-md transition-colors",
        "hover:bg-slate-700/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
        size === "sm" ? "h-6 w-6" : "h-8 w-8"
      )}
    >
      <Star
        className={cn(
          "transition-colors",
          size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
          isFavorite
            ? "fill-yellow-400 text-yellow-400"
            : "fill-none text-slate-500 hover:text-yellow-400"
        )}
      />
    </button>
  );
}
