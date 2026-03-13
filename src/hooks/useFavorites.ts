"use client";
import { useFavoriteStore } from "@/stores/favoriteStore";

export function useFavorites() {
  const store = useFavoriteStore();
  return {
    folders: store.folders,
    favorites: store.favorites,
    totalCount: store.favorites.length,
    addFolder: store.addFolder,
    removeFolder: store.removeFolder,
    renameFolder: store.renameFolder,
    addFavorite: store.addFavorite,
    removeFavorite: store.removeFavorite,
    moveFavorite: store.moveFavorite,
    isFavorite: store.isFavorite,
    getFolderChannels: store.getFolderChannels,
  };
}
