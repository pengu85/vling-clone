"use client";
import { useQuery } from "@tanstack/react-query";
import type { ChannelSearchResult, ApiResponse } from "@/types";

interface SearchFilters {
  q?: string;
  category?: string;
  country?: string;
  subscriberMin?: number;
  subscriberMax?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

async function fetchChannels(
  filters: SearchFilters
): Promise<ApiResponse<ChannelSearchResult[]>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      params.set(key, String(value));
    }
  });
  const res = await fetch(`/api/youtube/search?${params}`);
  if (!res.ok) throw new Error("검색 실패");
  return res.json();
}

export function useChannelSearch(filters: SearchFilters) {
  return useQuery({
    queryKey: ["channels", filters],
    queryFn: () => fetchChannels(filters),
    staleTime: 60 * 1000,
  });
}

export type { SearchFilters };
