"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_ITEMS = 20;

interface SearchHistoryState {
  queries: string[];
  addQuery: (q: string) => void;
  removeQuery: (q: string) => void;
  clearAll: () => void;
}

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set) => ({
      queries: [],
      addQuery: (q) =>
        set((state) => {
          const trimmed = q.trim();
          if (!trimmed) return state;
          const filtered = state.queries.filter((item) => item !== trimmed);
          return { queries: [trimmed, ...filtered].slice(0, MAX_ITEMS) };
        }),
      removeQuery: (q) =>
        set((state) => ({
          queries: state.queries.filter((item) => item !== q),
        })),
      clearAll: () => set({ queries: [] }),
    }),
    { name: "vling-search-history" }
  )
);
