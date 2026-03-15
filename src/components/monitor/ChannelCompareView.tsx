"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatNumber, formatGrowthRate } from "@/lib/formatters";

export interface CompareChannel {
  channelId: string;
  title: string;
  thumbnailUrl: string;
  subscribers: number;
  subscriberDelta: number;
  dailyViews: number;
  viewsDelta: number;
  algoScore: number;
  growthRate: number;
}

export interface ChannelCompareViewProps {
  channels: CompareChannel[];
}

interface MetricRow {
  label: string;
  key: keyof Pick<CompareChannel, "subscribers" | "dailyViews" | "algoScore" | "growthRate">;
  format: (v: number) => string;
  deltaKey?: keyof Pick<CompareChannel, "subscriberDelta" | "viewsDelta">;
  higherIsBetter: boolean;
}

const METRIC_ROWS: MetricRow[] = [
  {
    label: "구독자",
    key: "subscribers",
    format: formatNumber,
    deltaKey: "subscriberDelta",
    higherIsBetter: true,
  },
  {
    label: "일 조회수",
    key: "dailyViews",
    format: formatNumber,
    deltaKey: "viewsDelta",
    higherIsBetter: true,
  },
  {
    label: "알고 점수",
    key: "algoScore",
    format: (v) => `${v.toFixed(1)}pt`,
    higherIsBetter: true,
  },
  {
    label: "30일 성장률",
    key: "growthRate",
    format: formatGrowthRate,
    higherIsBetter: true,
  },
];

function CSSBar({
  value,
  max,
  isWinner,
}: {
  value: number;
  max: number;
  isWinner: boolean;
}) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-700/60">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          isWinner ? "bg-emerald-500" : "bg-indigo-500/70"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return null;
  const isPos = delta > 0;
  return (
    <span
      className={cn(
        "text-[10px] font-medium tabular-nums",
        isPos ? "text-emerald-400" : "text-rose-400"
      )}
    >
      {isPos ? "+" : ""}
      {formatNumber(delta)}
    </span>
  );
}

export function ChannelCompareView({ channels }: ChannelCompareViewProps) {
  const visible = channels.slice(0, 3);

  if (visible.length < 2) {
    return (
      <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 px-4 py-6 text-center">
        <p className="text-sm text-slate-500">채널 2개 이상 선택 시 비교 가능합니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 overflow-hidden">
      <div className="overflow-x-auto">
      {/* Table header — channel avatars */}
      <div
        className="grid border-b border-slate-700/50"
        style={{
          gridTemplateColumns: `140px repeat(${visible.length}, minmax(120px, 1fr))`,
          minWidth: `${140 + visible.length * 120}px`,
        }}
      >
        {/* Empty corner */}
        <div className="px-4 py-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            채널 비교
          </span>
        </div>

        {visible.map((ch) => (
          <div
            key={ch.channelId}
            className="flex flex-col items-center gap-1.5 border-l border-slate-700/40 px-3 py-3"
          >
            <div className="relative size-9 overflow-hidden rounded-full ring-2 ring-slate-600">
              <Image
                src={ch.thumbnailUrl}
                alt={ch.title}
                fill
                className="object-cover"
              />
            </div>
            <span className="line-clamp-1 text-center text-[11px] font-medium text-slate-200 leading-tight">
              {ch.title}
            </span>
          </div>
        ))}
      </div>

      {/* Metric rows */}
      {METRIC_ROWS.map((metric) => {
        const values = visible.map((ch) => ch[metric.key] as number);
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);
        const winnerValue = metric.higherIsBetter ? maxValue : minValue;

        return (
          <div
            key={metric.key}
            className="grid border-b border-slate-700/30 last:border-b-0"
            style={{
              gridTemplateColumns: `140px repeat(${visible.length}, minmax(120px, 1fr))`,
              minWidth: `${140 + visible.length * 120}px`,
            }}
          >
            {/* Label */}
            <div className="flex items-center px-4 py-3">
              <span className="text-xs font-medium text-slate-400">{metric.label}</span>
            </div>

            {/* Values */}
            {visible.map((ch) => {
              const raw = ch[metric.key] as number;
              const isWinner = raw === winnerValue;
              const deltaKey = metric.deltaKey;
              const deltaVal = deltaKey ? (ch[deltaKey] as number) : undefined;

              return (
                <div
                  key={ch.channelId}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 border-l border-slate-700/40 px-3 py-2.5 transition-colors",
                    isWinner && "bg-emerald-950/30"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "text-sm font-bold tabular-nums",
                        isWinner ? "text-emerald-400" : "text-slate-200"
                      )}
                    >
                      {metric.format(raw)}
                    </span>
                    {isWinner && (
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wide">
                        1위
                      </span>
                    )}
                  </div>

                  {/* CSS bar */}
                  <CSSBar value={raw} max={maxValue} isWinner={isWinner} />

                  {/* Delta badge */}
                  {deltaVal !== undefined && <DeltaBadge delta={deltaVal} />}
                </div>
              );
            })}
          </div>
        );
      })}
      </div>
    </div>
  );
}
