"use client";

import { useState } from "react";
import { Plus, Trash2, BarChart3, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompareTable } from "@/components/compare/CompareTable";
import { CompareChart } from "@/components/compare/CompareChart";
import { ChannelSearchModal } from "@/components/compare/ChannelSearchModal";
import { useCompareStore } from "@/stores/compareStore";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default function ComparePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { channels, removeChannel, clearAll } = useCompareStore();

  const isEmpty = channels.length === 0;

  return (
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
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            disabled={channels.length >= 5}
            className="bg-blue-600 hover:bg-blue-500 text-white border-none gap-1.5"
          >
            <Plus className="size-3.5" />
            채널 추가
          </Button>
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
  );
}
