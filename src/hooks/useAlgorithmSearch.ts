"use client";
import { useQuery } from "@tanstack/react-query";
import type { ChannelSearchResult, ApiResponse } from "@/types";

interface AlgoFilters {
  q?: string;
  minScore?: number;
  page?: number;
  limit?: number;
}

async function fetchAlgoResults(filters: AlgoFilters): Promise<ApiResponse<ChannelSearchResult[]>> {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.minScore) params.set("minScore", String(filters.minScore));
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  const res = await fetch(`/api/algorithm-score?${params}`);
  if (!res.ok) throw new Error("알고리즘 검색 실패");
  return res.json();
}

export function useAlgorithmSearch(filters: AlgoFilters) {
  return useQuery({
    queryKey: ["algorithm-score", filters],
    queryFn: () => fetchAlgoResults(filters),
    staleTime: 60 * 1000,
  });
}
