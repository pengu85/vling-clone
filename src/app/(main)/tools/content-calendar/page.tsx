"use client";

import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Calendar,
  Search,
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Clock,
  Tag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { formatNumber } from "@/lib/formatters";

/* ---------- Types ---------- */

interface HeatmapCell {
  day: number;
  hour: number;
  avgViews: number;
  count: number;
}

interface TimeSlot {
  day: number;
  hour: number;
  avgViews: number;
  improvement: number;
}

interface CategoryRecommendation {
  category: string;
  bestTimes: Array<{ day: number; hour: number }>;
}

interface UploadPattern {
  mostActiveDay: number;
  mostActiveHour: number;
  dayDistribution: number[];
}

interface UploadTimingResponse {
  channelId: string;
  channelName: string;
  analyzedVideos: number;
  avgPerWeek: number;
  improvement: number;
  heatmap: HeatmapCell[];
  bestSlots: TimeSlot[];
  worstSlots: TimeSlot[];
  categoryRecommendation: CategoryRecommendation;
  uploadPattern: UploadPattern;
}

/* ---------- Constants ---------- */

const DAY_NAMES = ["\uc77c", "\uc6d4", "\ud654", "\uc218", "\ubaa9", "\uae08", "\ud1a0"];
const HOUR_LABELS = [0, 3, 6, 9, 12, 15, 18, 21];

/* ---------- Helpers ---------- */

function needsResolve(input: string): boolean {
  return (
    input.includes("youtube.com") ||
    input.includes("youtu.be") ||
    input.startsWith("@")
  );
}

async function resolveChannelId(input: string): Promise<string> {
  const res = await fetch(
    `/api/youtube/resolve?url=${encodeURIComponent(input)}`
  );
  if (!res.ok) {
    throw new Error("\ucc44\ub110\uc744 \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4");
  }
  const data = await res.json();
  return data.channelId;
}

/* ---------- Heatmap Component ---------- */

function UploadHeatmap({ cells }: { cells: HeatmapCell[] }) {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const maxViews = useMemo(
    () => Math.max(...cells.map((c) => c.avgViews), 1),
    [cells]
  );

  // Build a lookup map for quick access
  const cellMap = useMemo(() => {
    const map = new Map<string, HeatmapCell>();
    for (const cell of cells) {
      map.set(`${cell.day}-${cell.hour}`, cell);
    }
    return map;
  }, [cells]);

  function getCellColor(avgViews: number): string {
    if (avgViews === 0) return "rgba(139, 92, 246, 0.05)";
    const intensity = avgViews / maxViews;
    // transparent -> violet-500 gradient
    const alpha = 0.08 + intensity * 0.85;
    return `rgba(139, 92, 246, ${alpha.toFixed(2)})`;
  }

  return (
    <div className="relative">
      {/* Scrollable container for mobile */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Hour labels */}
          <div className="flex ml-8 mb-1">
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                className="flex-1 text-center text-[10px] text-slate-500"
              >
                {HOUR_LABELS.includes(h) ? `${h}\uc2dc` : ""}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {DAY_NAMES.map((dayName, dayIdx) => (
            <div key={dayIdx} className="flex items-center gap-1 mb-0.5">
              {/* Day label */}
              <div className="w-7 text-right text-xs text-slate-400 shrink-0">
                {dayName}
              </div>

              {/* Hour cells */}
              <div className="flex flex-1 gap-px">
                {Array.from({ length: 24 }, (_, hour) => {
                  const cell = cellMap.get(`${dayIdx}-${hour}`);
                  const avgViews = cell?.avgViews ?? 0;
                  const count = cell?.count ?? 0;

                  return (
                    <div
                      key={hour}
                      className="flex-1 h-6 rounded-sm cursor-pointer transition-all hover:ring-1 hover:ring-violet-400"
                      style={{ backgroundColor: getCellColor(avgViews) }}
                      onMouseEnter={(e) => {
                        setHoveredCell({ day: dayIdx, hour, avgViews, count });
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltipPos({
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setHoveredCell(null)}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-3 mr-1">
            <span className="text-[10px] text-slate-500">\uc801\uc74c</span>
            <div className="flex gap-px">
              {[0.08, 0.25, 0.45, 0.65, 0.85].map((alpha, i) => (
                <div
                  key={i}
                  className="w-4 h-3 rounded-sm"
                  style={{
                    backgroundColor: `rgba(139, 92, 246, ${alpha})`,
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] text-slate-500">\ub9ce\uc74c</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 shadow-xl text-xs"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y - 8,
            transform: "translate(-50%, -100%)",
          }}
        >
          <span className="text-slate-200 font-medium">
            {DAY_NAMES[hoveredCell.day]}\uc694\uc77c {hoveredCell.hour}\uc2dc
          </span>
          <span className="text-slate-400 mx-1.5">|</span>
          <span className="text-slate-300">
            \ud3c9\uade0 \uc870\ud68c\uc218: {formatNumber(hoveredCell.avgViews)}
          </span>
          <span className="text-slate-400 mx-1.5">|</span>
          <span className="text-slate-300">\uc601\uc0c1 \uc218: {hoveredCell.count}</span>
        </div>
      )}
    </div>
  );
}

/* ---------- Summary Cards ---------- */

function SummaryCards({
  analyzedVideos,
  avgPerWeek,
  improvement,
}: {
  analyzedVideos: number;
  avgPerWeek: number;
  improvement: number;
}) {
  const cards = [
    {
      label: "\ubd84\uc11d \uc601\uc0c1 \uc218",
      value: `${analyzedVideos}\uac1c`,
      icon: BarChart3,
      color: "text-blue-400",
    },
    {
      label: "\uc8fc\uac04 \uc5c5\ub85c\ub4dc \ube48\ub3c4",
      value: `${avgPerWeek}\ud68c`,
      icon: Clock,
      color: "text-amber-400",
    },
    {
      label: "\ucd5c\uc801 \uc2dc\uac04 \ub300\ube44 \uc131\uacfc",
      value: `+${improvement}%`,
      icon: TrendingUp,
      color: "text-emerald-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-800/80">
                <card.icon className={`size-4 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className="text-lg font-bold text-slate-100">{card.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ---------- Best / Worst Slots ---------- */

function BestSlotsCard({ slots }: { slots: TimeSlot[] }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-emerald-400" />
          <CardTitle className="text-base text-slate-200">
            \ucd94\ucc9c \uc5c5\ub85c\ub4dc \uc2dc\uac04 TOP 5
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {slots.slice(0, 5).map((slot, i) => (
            <div
              key={`${slot.day}-${slot.hour}`}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/50"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-violet-400 w-5">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-200">
                  {DAY_NAMES[slot.day]}\uc694\uc77c {slot.hour}\uc2dc
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  \ud3c9\uade0 {formatNumber(slot.avgViews)}\ud68c
                </span>
                <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                  <TrendingUp className="size-3" />+{slot.improvement}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function WorstSlotsCard({ slots }: { slots: TimeSlot[] }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <TrendingDown className="size-4 text-red-400" />
          <CardTitle className="text-base text-slate-200">
            \ud53c\ud574\uc57c \ud560 \uc2dc\uac04\ub300
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {slots.slice(0, 3).map((slot, i) => (
            <div
              key={`${slot.day}-${slot.hour}`}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/50"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-red-400 w-5">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-200">
                  {DAY_NAMES[slot.day]}\uc694\uc77c {slot.hour}\uc2dc
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  \ud3c9\uade0 {formatNumber(slot.avgViews)}\ud68c
                </span>
                <span className="text-xs font-medium text-red-400">
                  {slot.improvement}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Category Recommendation ---------- */

function CategoryCard({
  recommendation,
}: {
  recommendation: CategoryRecommendation;
}) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Tag className="size-4 text-violet-400" />
          <CardTitle className="text-base text-slate-200">
            \uce74\ud14c\uace0\ub9ac \ucd94\ucc9c \uc2dc\uac04
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-violet-500/30 text-violet-400 text-xs"
          >
            {recommendation.category}
          </Badge>
        </div>
        <p className="text-xs text-slate-500">
          \uc774 \uce74\ud14c\uace0\ub9ac\uc5d0\uc11c \uac00\uc7a5 \ud6a8\uacfc\uc801\uc778 \uc2dc\uac04\ub300\uc785\ub2c8\ub2e4
        </p>
        <div className="space-y-1.5">
          {recommendation.bestTimes.map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm text-slate-300"
            >
              <Clock className="size-3 text-slate-500" />
              {DAY_NAMES[t.day]}\uc694\uc77c {t.hour}\uc2dc
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Upload Pattern ---------- */

function UploadPatternCard({ pattern }: { pattern: UploadPattern }) {
  const maxDayCount = Math.max(...pattern.dayDistribution, 1);

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-blue-400" />
          <CardTitle className="text-base text-slate-200">
            \ud604\uc7ac \uc5c5\ub85c\ub4dc \ud328\ud134
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-800/50">
            <p className="text-xs text-slate-500 mb-1">\uac00\uc7a5 \ub9ce\uc774 \uc62c\ub9ac\ub294 \uc694\uc77c</p>
            <p className="text-sm font-semibold text-slate-200">
              {DAY_NAMES[pattern.mostActiveDay]}\uc694\uc77c
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/50">
            <p className="text-xs text-slate-500 mb-1">\uac00\uc7a5 \ub9ce\uc774 \uc62c\ub9ac\ub294 \uc2dc\uac04</p>
            <p className="text-sm font-semibold text-slate-200">
              {pattern.mostActiveHour}\uc2dc
            </p>
          </div>
        </div>

        {/* Day distribution bar chart */}
        <div className="space-y-1.5">
          <p className="text-xs text-slate-500">\uc694\uc77c\ubcc4 \uc5c5\ub85c\ub4dc \ube44\uc728</p>
          {DAY_NAMES.map((dayName, i) => {
            const count = pattern.dayDistribution[i] ?? 0;
            const pct = (count / maxDayCount) * 100;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 text-xs text-slate-400 text-right">
                  {dayName}
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500/70 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 text-[10px] text-slate-500 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Loading Skeleton ---------- */

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Summary cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-800/50" />
        ))}
      </div>
      {/* Heatmap skeleton */}
      <div className="h-56 rounded-xl bg-slate-800/50" />
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 rounded-xl bg-slate-800/50" />
        <div className="h-64 rounded-xl bg-slate-800/50" />
      </div>
    </div>
  );
}

/* ---------- Main Page ---------- */

export default function ContentCalendarPage() {
  const [input, setInput] = useState("");

  const mutation = useMutation<
    { data: UploadTimingResponse },
    Error,
    string
  >({
    mutationFn: async (rawInput: string) => {
      let channelId = rawInput;

      // Resolve URL / handle to channel ID
      if (needsResolve(rawInput)) {
        channelId = await resolveChannelId(rawInput);
      }

      const res = await fetch("/api/tools/upload-timing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err.error?.message || "\uc5c5\ub85c\ub4dc \ud0c0\uc774\ubc0d \ubd84\uc11d\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4"
        );
      }
      return res.json();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    mutation.mutate(input.trim());
  };

  const result = mutation.data?.data;

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "\ub3c4\uad6c", href: "/tools/ai-finder" },
          { label: "\ucf58\ud150\uce20 \uce98\ub9b0\ub354" },
        ]}
      />

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="h-5 w-5 text-violet-400" />
          <h1 className="text-xl font-bold text-slate-100">
            \ucf58\ud150\uce20 \uce98\ub9b0\ub354
          </h1>
        </div>
        <p className="text-sm text-slate-400">
          \ucc44\ub110\uc758 \uc5c5\ub85c\ub4dc \ud328\ud134\uc744 \ubd84\uc11d\ud558\uace0 \ucd5c\uc801\uc758 \uc5c5\ub85c\ub4dc \uc2dc\uac04\uc744 \ucc3e\uc544\ubcf4\uc138\uc694
        </p>
      </div>

      {/* Input */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="\ucc44\ub110 URL, @\ud578\ub4e4, \ucc44\ub110 ID\ub97c \uc785\ub825\ud558\uc138\uc694"
                className="pl-10 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-violet-500"
              />
            </div>
            <Button
              type="submit"
              disabled={mutation.isPending || !input.trim()}
              className="bg-violet-600 hover:bg-violet-700 text-white shrink-0"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  \ubd84\uc11d \uc911
                </>
              ) : (
                <>
                  <Calendar className="size-4 mr-1.5" />
                  \ubd84\uc11d\ud558\uae30
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Loading */}
      {mutation.isPending && <LoadingSkeleton />}

      {/* Error */}
      {mutation.isError && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-5 text-red-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-400">{mutation.error.message}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 shrink-0"
                onClick={() => mutation.mutate(input.trim())}
              >
                \ub2e4\uc2dc \uc2dc\ub3c4
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <SummaryCards
            analyzedVideos={result.analyzedVideos}
            avgPerWeek={result.avgPerWeek}
            improvement={result.improvement}
          />

          {/* Heatmap */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-violet-400" />
                <CardTitle className="text-base text-slate-200">
                  \uc2dc\uac04\ub300\ubcc4 \ud3c9\uade0 \uc870\ud68c\uc218 \ud788\ud2b8\ub9f5
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <UploadHeatmap cells={result.heatmap} />
            </CardContent>
          </Card>

          {/* Best & Worst slots */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BestSlotsCard slots={result.bestSlots} />
            <WorstSlotsCard slots={result.worstSlots} />
          </div>

          {/* Category & Pattern */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CategoryCard recommendation={result.categoryRecommendation} />
            <UploadPatternCard pattern={result.uploadPattern} />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !mutation.isPending && !mutation.isError && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-16 text-center space-y-3">
            <Calendar className="size-12 text-slate-700 mx-auto" />
            <div>
              <p className="text-sm font-medium text-slate-400">
                \ucc44\ub110\uc744 \uc785\ub825\ud558\uba74 \uc5c5\ub85c\ub4dc \ud0c0\uc774\ubc0d \ubd84\uc11d\uc774 \uc2dc\uc791\ub429\ub2c8\ub2e4
              </p>
              <p className="text-xs text-slate-600 mt-1">
                \uc5c5\ub85c\ub4dc \ud328\ud134, \ucd5c\uc801 \uc2dc\uac04\ub300, \uce74\ud14c\uace0\ub9ac\ubcc4 \ucd94\ucc9c \uc2dc\uac04\uc744 \ud655\uc778\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
