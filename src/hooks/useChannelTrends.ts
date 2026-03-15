"use client";
import { useQuery } from "@tanstack/react-query";

interface ViewTrendPoint {
  date: string;
  value: number;
}

interface GrowthTrendPoint {
  date: string;
  rate: number;
}

interface ChannelTrendsData {
  viewTrend: ViewTrendPoint[];
  growthTrend: GrowthTrendPoint[];
}

async function fetchChannelTrends(id: string, period: number): Promise<ChannelTrendsData> {
  const res = await fetch(`/api/youtube/channel/${id}/trends?period=${period}`);
  if (!res.ok) throw new Error("트렌드 데이터 로딩 실패");
  const json = await res.json();
  return json.data as ChannelTrendsData;
}

export function useChannelTrends(id: string, period = 30) {
  return useQuery({
    queryKey: ["channel-trends", id, period],
    queryFn: () => fetchChannelTrends(id, period),
    staleTime: 10 * 60 * 1000,
  });
}

export type { ViewTrendPoint, GrowthTrendPoint, ChannelTrendsData };
