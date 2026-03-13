"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { AutocompleteChannel } from "@/app/api/youtube/autocomplete/route";

export interface UseAutocompleteReturn {
  suggestions: AutocompleteChannel[];
  isLoading: boolean;
  isOpen: boolean;
  activeIndex: number;
  setIsOpen: (open: boolean) => void;
  setActiveIndex: (index: number) => void;
  clearSuggestions: () => void;
}

export function useAutocomplete(query: string, enabled = true): UseAutocompleteReturn {
  const [suggestions, setSuggestions] = useState<AutocompleteChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const trimmed = query.trim();

    if (!trimmed) {
      clearSuggestions();
      return;
    }

    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      // Cancel any in-flight request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();

      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/youtube/autocomplete?q=${encodeURIComponent(trimmed)}`,
          { signal: abortRef.current.signal }
        );
        if (!res.ok) throw new Error("fetch failed");
        const json = await res.json();
        const results: AutocompleteChannel[] = json.data ?? [];
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setActiveIndex(-1);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setSuggestions([]);
          setIsOpen(false);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, enabled, clearSuggestions]);

  return {
    suggestions,
    isLoading,
    isOpen,
    activeIndex,
    setIsOpen,
    setActiveIndex,
    clearSuggestions,
  };
}
