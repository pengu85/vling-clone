"use client";
import { useQuery } from "@tanstack/react-query";
import type { Channel, Video, ApiResponse } from "@/types";

async function fetchChannel(id: string): Promise<ApiResponse<Channel>> {
  const res = await fetch(`/api/youtube/channel/${id}`);
  if (!res.ok) throw new Error("채널 정보 로딩 실패");
  return res.json();
}

async function fetchChannelVideos(id: string): Promise<ApiResponse<Video[]>> {
  const res = await fetch(`/api/youtube/channel/${id}/videos`);
  if (!res.ok) throw new Error("영상 목록 로딩 실패");
  return res.json();
}

export function useChannelDetail(id: string) {
  return useQuery({
    queryKey: ["channel", id],
    queryFn: () => fetchChannel(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useChannelVideos(id: string, enabled = true) {
  return useQuery({
    queryKey: ["channel-videos", id],
    queryFn: () => fetchChannelVideos(id),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}
