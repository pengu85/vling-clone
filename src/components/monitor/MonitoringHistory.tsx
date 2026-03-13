"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatNumber, formatGrowthRate } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HistoryEntry {
  date: string;
  subscribers: number;
  dailyViews: number;
  totalViews: number;
  algoScore: number;
  videoCount: number;
}

interface MonitoringHistoryProps {
  channelTitle: string;
  history: HistoryEntry[];
}

type DateRange = 7 | 14 | 30;

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  7: "최근 7일",
  14: "최근 14일",
  30: "최근 30일",
};

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dow = DAY_LABELS[date.getDay()];
  return `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")} (${dow})`;
}

function getDelta(current: number, previous: number | undefined): number {
  if (previous === undefined) return 0;
  return current - previous;
}

interface DayDelta {
  entry: HistoryEntry;
  subDelta: number;
  viewDelta: number;
  algoDelta: number;
}

function computeDeltas(entries: HistoryEntry[]): DayDelta[] {
  return entries.map((entry, i) => {
    const prev = entries[i - 1];
    return {
      entry,
      subDelta: getDelta(entry.subscribers, prev?.subscribers),
      viewDelta: entry.dailyViews,
      algoDelta: prev ? parseFloat((entry.algoScore - prev.algoScore).toFixed(1)) : 0,
    };
  });
}

function DotIndicator({ subDelta }: { subDelta: number }) {
  if (subDelta > 0) {
    return (
      <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
    );
  }
  if (subDelta < 0) {
    return (
      <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
    );
  }
  return <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-slate-600" />;
}

function ChangeValue({
  value,
  prefix = "+",
  suffix = "",
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  return (
    <span
      className={cn(
        "text-sm font-semibold tabular-nums",
        isPositive && "text-emerald-400",
        isNegative && "text-rose-400",
        !isPositive && !isNegative && "text-slate-400",
        className
      )}
    >
      {isPositive ? `${prefix}${formatNumber(value)}` : isNegative ? `-${formatNumber(Math.abs(value))}` : `0${suffix}`}
      {suffix && value !== 0 ? suffix : ""}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: "green" | "red";
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-slate-800/60 px-4 py-3 border border-slate-700/50">
      <span className="text-xs text-slate-400">{label}</span>
      <span
        className={cn(
          "text-base font-bold tabular-nums",
          highlight === "green" && "text-emerald-400",
          highlight === "red" && "text-rose-400",
          !highlight && "text-slate-100"
        )}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-slate-500">{sub}</span>}
    </div>
  );
}

export function MonitoringHistory({ channelTitle, history }: MonitoringHistoryProps) {
  const [range, setRange] = useState<DateRange>(14);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const sliced = useMemo(() => {
    return history.slice(-range);
  }, [history, range]);

  const deltas = useMemo(() => computeDeltas(sliced), [sliced]);

  // Summary stats (skip first entry which has no previous to delta from)
  const validDeltas = deltas.slice(1);

  const totalSubDelta = validDeltas.reduce((sum, d) => sum + d.subDelta, 0);
  const avgDailyViews =
    validDeltas.length > 0
      ? Math.round(validDeltas.reduce((sum, d) => sum + d.viewDelta, 0) / validDeltas.length)
      : 0;
  const bestDay = validDeltas.reduce(
    (best, d) => (d.subDelta > (best?.subDelta ?? -Infinity) ? d : best),
    validDeltas[0] ?? null
  );
  const worstDay = validDeltas.reduce(
    (worst, d) => (d.subDelta < (worst?.subDelta ?? Infinity) ? d : worst),
    validDeltas[0] ?? null
  );

  function toggleExpand(date: string) {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-slate-200">모니터링 히스토리</h3>
        {/* Date range filter */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-800 p-0.5 border border-slate-700">
          {([7, 14, 30] as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-all",
                range === r
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {DATE_RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryCard
          label="구독자 증감"
          value={`${totalSubDelta >= 0 ? "+" : ""}${formatNumber(totalSubDelta)}`}
          sub={`${range}일 누적`}
          highlight={totalSubDelta > 0 ? "green" : totalSubDelta < 0 ? "red" : undefined}
        />
        <SummaryCard
          label="일평균 조회수"
          value={formatNumber(avgDailyViews)}
          sub="기간 평균"
        />
        <SummaryCard
          label="최고의 날"
          value={bestDay ? `+${formatNumber(bestDay.subDelta)}` : "-"}
          sub={bestDay ? formatDateLabel(bestDay.entry.date) : undefined}
          highlight="green"
        />
        <SummaryCard
          label="최악의 날"
          value={
            worstDay
              ? worstDay.subDelta < 0
                ? `-${formatNumber(Math.abs(worstDay.subDelta))}`
                : `+${formatNumber(worstDay.subDelta)}`
              : "-"
          }
          sub={worstDay ? formatDateLabel(worstDay.entry.date) : undefined}
          highlight={worstDay && worstDay.subDelta < 0 ? "red" : undefined}
        />
      </div>

      {/* Timeline */}
      <div className="relative flex flex-col">
        {/* Vertical line */}
        <div className="absolute left-[5px] top-2 bottom-2 w-px bg-slate-700/60" />

        <div className="flex flex-col gap-0.5">
          {[...deltas].reverse().map(({ entry, subDelta, viewDelta, algoDelta }, reversedIdx) => {
            const isFirst = reversedIdx === deltas.length - 1; // oldest entry has no prior
            const isExpanded = expandedDates.has(entry.date);
            const isBigGain = subDelta > 1000;

            return (
              <div key={entry.date} className="pl-5 relative">
                {/* Dot on timeline */}
                <div className="absolute left-0 top-[7px]">
                  <DotIndicator subDelta={isFirst ? 0 : subDelta} />
                </div>

                {/* Entry card */}
                <button
                  onClick={() => toggleExpand(entry.date)}
                  className={cn(
                    "w-full text-left rounded-lg px-3 py-2.5 border transition-all duration-200",
                    "hover:bg-slate-800/70 active:scale-[0.995]",
                    isExpanded
                      ? "bg-slate-800/80 border-slate-600/70"
                      : "bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    {/* Date + badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-slate-300 tabular-nums">
                        {formatDateLabel(entry.date)}
                      </span>
                      {isBigGain && !isFirst && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                          ⚡ 급상승
                        </span>
                      )}
                    </div>

                    {/* Quick stats */}
                    {!isFirst && (
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500">구독</span>
                          <ChangeValue value={subDelta} />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500">조회</span>
                          <span className="text-sm font-semibold text-slate-300 tabular-nums">
                            {formatNumber(viewDelta)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500">알고</span>
                          <ChangeValue value={algoDelta} suffix="pt" />
                        </div>
                        <span
                          className={cn(
                            "text-[10px] transition-transform duration-200 text-slate-500",
                            isExpanded && "rotate-180"
                          )}
                          style={{ display: "inline-block" }}
                        >
                          ▾
                        </span>
                      </div>
                    )}
                    {isFirst && (
                      <span className="text-[10px] text-slate-600 italic">기준일</span>
                    )}
                  </div>

                  {/* Expanded detail */}
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-in-out",
                      isExpanded ? "max-h-40 opacity-100 mt-2.5" : "max-h-0 opacity-0"
                    )}
                  >
                    <div className="grid grid-cols-2 gap-2 border-t border-slate-700/50 pt-2.5 sm:grid-cols-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-500">총 구독자</span>
                        <span className="text-xs font-semibold text-slate-200 tabular-nums">
                          {formatNumber(entry.subscribers)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-500">누적 조회수</span>
                        <span className="text-xs font-semibold text-slate-200 tabular-nums">
                          {formatNumber(entry.totalViews)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-500">알고리즘 점수</span>
                        <span className="text-xs font-semibold text-slate-200 tabular-nums">
                          {entry.algoScore.toFixed(1)}pt
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-500">총 영상 수</span>
                        <span className="text-xs font-semibold text-slate-200 tabular-nums">
                          {entry.videoCount.toLocaleString()}개
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
