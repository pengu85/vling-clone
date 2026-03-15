"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChannelSnapshot } from "@/types/monitor";

const MAX_HISTORY_PER_CHANNEL = 90;

export type { ChannelSnapshot };

export interface MonitorFolder {
  id: string;
  name: string;
  channelIds: string[];
  createdAt: string;
}

export interface TrackedChannel {
  channelId: string;
  title: string;
  thumbnailUrl: string;
  category: string;
  addedAt: string;
  memo?: string;
}

interface MonitorState {
  trackedChannels: TrackedChannel[];
  folders: MonitorFolder[];
  activeFolderId: string | null;
  history: Record<string, ChannelSnapshot[]>;

  // Channel actions
  addChannel: (channel: TrackedChannel) => void;
  removeChannel: (channelId: string) => void;
  isTracking: (channelId: string) => boolean;
  updateChannelMemo: (channelId: string, memo: string) => void;
  getFilteredChannels: () => TrackedChannel[];

  // Folder actions
  addFolder: (name: string) => void;
  removeFolder: (id: string) => void;
  renameFolder: (id: string, name: string) => void;
  setActiveFolder: (id: string | null) => void;
  addChannelToFolder: (folderId: string, channelId: string) => void;
  removeChannelFromFolder: (folderId: string, channelId: string) => void;
}

let folderCounter = 0;

function generateFolderId(): string {
  folderCounter += 1;
  return `folder_${Date.now()}_${folderCounter}`;
}

function ensureHistory(
  current: Record<string, ChannelSnapshot[]>,
  channelId: string
): Record<string, ChannelSnapshot[]> {
  if (current[channelId]) return current;
  return {
    ...current,
    [channelId]: [],
  };
}

export const useMonitorStore = create<MonitorState>()(
  persist(
    (set, get) => ({
      trackedChannels: [],
      folders: [],
      activeFolderId: null,
      history: {},

      addChannel: (channel) =>
        set((state) => {
          if (state.trackedChannels.length >= 20) return state;
          if (
            state.trackedChannels.find(
              (c) => c.channelId === channel.channelId
            )
          )
            return state;
          return {
            trackedChannels: [...state.trackedChannels, channel],
            history: ensureHistory(state.history, channel.channelId),
          };
        }),

      removeChannel: (channelId) =>
        set((state) => {
          const newHistory = { ...state.history };
          delete newHistory[channelId];
          return {
            trackedChannels: state.trackedChannels.filter(
              (c) => c.channelId !== channelId
            ),
            folders: state.folders.map((f) => ({
              ...f,
              channelIds: f.channelIds.filter((id) => id !== channelId),
            })),
            history: newHistory,
          };
        }),

      isTracking: (channelId) =>
        get().trackedChannels.some((c) => c.channelId === channelId),

      updateChannelMemo: (channelId, memo) =>
        set((state) => ({
          trackedChannels: state.trackedChannels.map((c) =>
            c.channelId === channelId ? { ...c, memo } : c
          ),
        })),

      getFilteredChannels: () => {
        const state = get();
        if (!state.activeFolderId) return state.trackedChannels;
        const folder = state.folders.find(
          (f) => f.id === state.activeFolderId
        );
        if (!folder) return state.trackedChannels;
        return state.trackedChannels.filter((c) =>
          folder.channelIds.includes(c.channelId)
        );
      },

      addFolder: (name) =>
        set((state) => ({
          folders: [
            ...state.folders,
            {
              id: generateFolderId(),
              name,
              channelIds: [],
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      removeFolder: (id) =>
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          activeFolderId:
            state.activeFolderId === id ? null : state.activeFolderId,
        })),

      renameFolder: (id, name) =>
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, name } : f
          ),
        })),

      setActiveFolder: (id) => set({ activeFolderId: id }),

      addChannelToFolder: (folderId, channelId) =>
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === folderId && !f.channelIds.includes(channelId)
              ? { ...f, channelIds: [...f.channelIds, channelId] }
              : f
          ),
        })),

      removeChannelFromFolder: (folderId, channelId) =>
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === folderId
              ? {
                  ...f,
                  channelIds: f.channelIds.filter((id) => id !== channelId),
                }
              : f
          ),
        })),
    }),
    {
      name: "vling-monitor",
      partialize: (state) => ({
        ...state,
        history: Object.fromEntries(
          Object.entries(state.history).map(([k, v]) => [k, v.slice(-MAX_HISTORY_PER_CHANNEL)])
        ),
      }),
    }
  )
);
