"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2, BarChart3, GitCompare, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompareTable } from "@/components/compare/CompareTable";
import { LazyCompareChart as CompareChart } from "@/components/compare/LazyCompareChart";
import { ChannelSearchModal } from "@/components/compare/ChannelSearchModal";
import { useCompareStore } from "@/stores/compareStore";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

export default function ComparePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { channels, addChannel, removeChannel, clearAll } = useCompareStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Track whether we've already loaded from URL to avoid loop
  const loadedFromUrl = useRef(false);

  // On mount: if ?channels= param is present, fetch those channels and add to store
  useEffect(() => {
    if (loadedFromUrl.current) return;
    const param = searchParams.get("channels");
    if (!param) return;

    const ids = param.split(",").filter(Boolean).slice(0, 5);
    if (ids.length === 0) return;

    loadedFromUrl.current = true;

    // Fetch channels from API and add to store
    fetch("/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelIds: ids }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.data && Array.isArray(json.data)) {
          // Clear existing before loading from URL
          clearAll();
          for (const ch of json.data) {
            addChannel(ch);
          }
        }
      })
      .catch(() => {
        // Silently ignore fetch errors for URL-based loading
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When channels change, update the URL
  useEffect(() => {
    // Don't update URL during initial URL-load phase (avoid replacing URL before fetch completes)
    if (!loadedFromUrl.current && searchParams.get("channels")) return;

    if (channels.length === 0) {
      const currentParam = searchParams.get("channels");
      if (currentParam) {
        router.replace("/compare");
      }
      return;
    }

    const ids = channels.map((c) => c.id).join(",");
    const currentParam = searchParams.get("channels");
    if (currentParam !== ids) {
      router.replace(`/compare?channels=${ids}`);
    }
  }, [channels, router, searchParams]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select and copy
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  const isEmpty = channels.length === 0;
  const isFull = channels.length >= 5;

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <Breadcrumb items={[{ label: "채널 비교" }]} />
        {/* Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100">채널 비교</h1>
            <p className="text-sm text-slate-500">
              최대 5개 채널을 나란히 비교하세요
            </p>
          </div>

          <div className="flex items-center gap-2">
            {channels.length > 0 && (
              <>
                <Badge
                  variant="secondary"
                  className="bg-blue-600/20 text-blue-400 border-blue-500/30"
                >
                  {channels.length}개 선택됨
                </Badge>
                {/* Share link button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyLink}
                  className="text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-green-400" />
                      <span className="text-green-400">링크가 복사되었습니다</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="size-3.5" />
                      공유 링크 복사
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-slate-400 hover:text-red-400 hover:bg-red-400/10 gap-1.5"
                >
                  <Trash2 className="size-3.5" />
                  전체 삭제
                </Button>
              </>
            )}

            {/* Add channel button - wrapped in Tooltip when disabled */}
            {isFull ? (
              <Tooltip>
                <TooltipTrigger>
                  <span className="inline-flex">
                    <Button
                      size="sm"
                      disabled
                      className="bg-blue-600 hover:bg-blue-500 text-white border-none gap-1.5 opacity-50 cursor-not-allowed"
                    >
                      <Plus className="size-3.5" />
                      채널 추가
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  최대 5개까지 비교할 수 있습니다
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                size="sm"
                onClick={() => setModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white border-none gap-1.5"
              >
                <Plus className="size-3.5" />
                채널 추가
              </Button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
              <GitCompare className="size-8 text-slate-500" />
            </div>
            <div>
              <p className="text-base font-medium text-slate-300">
                채널을 추가하여 비교를 시작하세요
              </p>
              <p className="mt-1 text-sm text-slate-500">
                2~5개 채널을 선택해 주요 지표를 나란히 비교할 수 있습니다
              </p>
            </div>
            <Button
              onClick={() => setModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white border-none gap-1.5"
            >
              <Plus className="size-4" />
              채널 추가
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Table */}
            <CompareTable channels={channels} onRemove={removeChannel} />

            {/* Chart - only when 2+ channels */}
            {channels.length >= 2 && (
              <CompareChart channels={channels} />
            )}
          </div>
        )}

        <ChannelSearchModal open={modalOpen} onOpenChange={setModalOpen} />
      </div>
    </TooltipProvider>
  );
}
