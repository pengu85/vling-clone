"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TrackedChannel {
  channelId: string;
  title: string;
  thumbnailUrl: string;
  category: string;
  addedAt: string;
}

interface MonitorState {
  trackedChannels: TrackedChannel[];
  addChannel: (channel: TrackedChannel) => void;
  removeChannel: (channelId: string) => void;
  isTracking: (channelId: string) => boolean;
}

export const useMonitorStore = create<MonitorState>()(
  persist(
    (set, get) => ({
      trackedChannels: [],
      addChannel: (channel) =>
        set((state) => {
          if (state.trackedChannels.length >= 20) return state;
          if (state.trackedChannels.find((c) => c.channelId === channel.channelId))
            return state;
          return {
            trackedChannels: [...state.trackedChannels, channel],
          };
        }),
      removeChannel: (channelId) =>
        set((state) => ({
          trackedChannels: state.trackedChannels.filter(
            (c) => c.channelId !== channelId
          ),
        })),
      isTracking: (channelId) =>
        get().trackedChannels.some((c) => c.channelId === channelId),
    }),
    { name: "vling-monitor" }
  )
);
