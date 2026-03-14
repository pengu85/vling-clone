"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Search, Plus, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/formatters";
import { useCompareStore } from "@/stores/compareStore";
import { CATEGORIES } from "@/domain/categories";
import type { ChannelSearchResult, Channel } from "@/types";

interface ChannelSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChannelSearchModal({ open, onOpenChange }: ChannelSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChannelSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { channels: compareChannels, addChannel } = useCompareStore();

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(q)}&limit=10`
      );
      const json = await res.json();
      setResults(json.data ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      return;
    }
    search("");
  }, [open, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const isAdded = (id: string) => compareChannels.some((c) => c.id === id);
  const isFull = compareChannels.length >= 5;

  const handleAdd = (ch: ChannelSearchResult) => {
    // Convert ChannelSearchResult to Channel (fill missing fields with defaults)
    const channel: Channel = {
      id: ch.id,
      youtubeId: ch.youtubeId,
      title: ch.title,
      description: "",
      thumbnailUrl: ch.thumbnailUrl,
      bannerUrl: null,
      subscriberCount: ch.subscriberCount,
      viewCount: 0,
      videoCount: 0,
      category: ch.category,
      country: ch.country,
      language: "ko",
      growthRate30d: ch.growthRate30d,
      dailyAvgViews: ch.dailyAvgViews,
      algoScore: ch.algoScore,
      engagementRate: 0,
      estimatedRevenue: ch.estimatedRevenue,
      estimatedAdPrice: 0,
      audienceMaleRatio: 50,
      audienceAgeDistribution: {},
      audienceTopCountries: [],
      tags: [],
      updatedAt: new Date(),
    };
    addChannel(channel);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-slate-100">채널 검색</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <Input
            placeholder="채널명을 입력하세요"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1 max-h-80 overflow-y-auto -mx-4 px-4">
          {loading && (
            <p className="py-6 text-center text-sm text-slate-500">검색 중...</p>
          )}
          {!loading && results.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">
              검색 결과가 없습니다
            </p>
          )}
          {!loading &&
            results.map((ch) => {
              const added = isAdded(ch.id);
              const categoryLabel =
                CATEGORIES.find((c) => c.value === ch.category)?.label ??
                ch.category;
              return (
                <div
                  key={ch.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-800 transition-colors"
                >
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-700">
                    <Image
                      src={ch.thumbnailUrl}
                      alt={ch.title}
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-slate-100">
                      {ch.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">
                        {formatNumber(ch.subscriberCount)} 구독자
                      </span>
                      <Badge
                        variant="secondary"
                        className="h-4 px-1.5 text-[10px] bg-slate-700 text-slate-400 border-0"
                      >
                        {categoryLabel}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="icon-sm"
                    variant={added ? "secondary" : "default"}
                    disabled={added || isFull}
                    onClick={() => handleAdd(ch)}
                    className={
                      added
                        ? "bg-slate-700 text-slate-400"
                        : "bg-blue-600 hover:bg-blue-500 text-white border-none"
                    }
                  >
                    {added ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                  </Button>
                </div>
              );
            })}
        </div>

        {isFull && (
          <p className="text-xs text-amber-400 text-center">
            최대 5개까지 비교할 수 있습니다.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
