"use client";
import { create } from "zustand";
import type { Channel } from "@/types";

interface CompareState {
  channels: Channel[];
  addChannel: (channel: Channel) => void;
  removeChannel: (id: string) => void;
  clearAll: () => void;
}

export const useCompareStore = create<CompareState>((set) => ({
  channels: [],
  addChannel: (channel) =>
    set((state) => {
      if (state.channels.length >= 5) return state;
      if (state.channels.find((c) => c.id === channel.id)) return state;
      return { channels: [...state.channels, channel] };
    }),
  removeChannel: (id) =>
    set((state) => ({ channels: state.channels.filter((c) => c.id !== id) })),
  clearAll: () => set({ channels: [] }),
}));
