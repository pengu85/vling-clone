"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChannelSearchResult } from "@/types";

interface FavoriteItem {
  channel: ChannelSearchResult;
  folderName: string;
  addedAt: string;
}

interface FavoriteState {
  folders: string[];
  favorites: FavoriteItem[];
  addFolder: (name: string) => void;
  removeFolder: (name: string) => void;
  renameFolder: (oldName: string, newName: string) => void;
  addFavorite: (channel: ChannelSearchResult, folderName?: string) => void;
  removeFavorite: (channelId: string) => void;
  moveFavorite: (channelId: string, toFolder: string) => void;
  isFavorite: (channelId: string) => boolean;
  getFolderChannels: (folderName: string) => FavoriteItem[];
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      folders: ["기본"],
      favorites: [],
      addFolder: (name) =>
        set((state) => {
          if (state.folders.includes(name)) return state;
          return { folders: [...state.folders, name] };
        }),
      removeFolder: (name) =>
        set((state) => {
          if (name === "기본") return state;
          const moved = state.favorites.map((f) =>
            f.folderName === name ? { ...f, folderName: "기본" } : f
          );
          return {
            folders: state.folders.filter((f) => f !== name),
            favorites: moved,
          };
        }),
      renameFolder: (oldName, newName) =>
        set((state) => ({
          folders: state.folders.map((f) => (f === oldName ? newName : f)),
          favorites: state.favorites.map((f) =>
            f.folderName === oldName ? { ...f, folderName: newName } : f
          ),
        })),
      addFavorite: (channel, folderName = "기본") =>
        set((state) => {
          if (state.favorites.find((f) => f.channel.id === channel.id)) return state;
          return {
            favorites: [
              ...state.favorites,
              { channel, folderName, addedAt: new Date().toISOString() },
            ],
          };
        }),
      removeFavorite: (channelId) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.channel.id !== channelId),
        })),
      moveFavorite: (channelId, toFolder) =>
        set((state) => ({
          favorites: state.favorites.map((f) =>
            f.channel.id === channelId ? { ...f, folderName: toFolder } : f
          ),
        })),
      isFavorite: (channelId) => get().favorites.some((f) => f.channel.id === channelId),
      getFolderChannels: (folderName) =>
        get().favorites.filter((f) => f.folderName === folderName),
    }),
    { name: "vling-favorites" }
  )
);
