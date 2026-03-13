"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChannelSearchResult } from "@/types";

interface RecentItem {
  channel: ChannelSearchResult;
  viewedAt: string;
}

interface RecentState {
  recentChannels: RecentItem[];
  addRecent: (channel: ChannelSearchResult) => void;
  removeRecent: (channelId: string) => void;
  clearAll: () => void;
}

const MAX_RECENT = 20;

export const useRecentStore = create<RecentState>()(
  persist(
    (set) => ({
      recentChannels: [],
      addRecent: (channel) =>
        set((state) => {
          const filtered = state.recentChannels.filter(
            (r) => r.channel.id !== channel.id
          );
          return {
            recentChannels: [
              { channel, viewedAt: new Date().toISOString() },
              ...filtered,
            ].slice(0, MAX_RECENT),
          };
        }),
      removeRecent: (channelId) =>
        set((state) => ({
          recentChannels: state.recentChannels.filter(
            (r) => r.channel.id !== channelId
          ),
        })),
      clearAll: () => set({ recentChannels: [] }),
    }),
    { name: "vling-recent-channels" }
  )
);
