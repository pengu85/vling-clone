"use client";
import { useQuery } from "@tanstack/react-query";
import type { ChannelSearchResult, ChannelRanking, ApiResponse } from "@/types";

interface RankingFilters {
  type?: string;
  category?: string;
  page?: number;
  limit?: number;
}

type RankingItem = ChannelRanking & { channel: ChannelSearchResult };

async function fetchRankings(filters: RankingFilters): Promise<ApiResponse<RankingItem[]>> {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.category && filters.category !== "all") params.set("category", filters.category);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  const res = await fetch(`/api/ranking?${params}`);
  if (!res.ok) throw new Error("순위 데이터 로딩 실패");
  return res.json();
}

export function useRanking(filters: RankingFilters) {
  return useQuery({
    queryKey: ["ranking", filters],
    queryFn: () => fetchRankings(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export type { RankingFilters, RankingItem };
