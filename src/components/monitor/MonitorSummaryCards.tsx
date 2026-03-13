"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/formatters";

interface ChannelStats {
  subscriberDelta: number;
  viewDelta: number;
}

interface MonitorSummaryCardsProps {
  channels: ChannelStats[];
}

interface SummaryItem {
  label: string;
  value: string;
  delta?: number;
  icon: React.ReactNode;
  iconBg: string;
}

function UsersIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function TrendUpIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

function DeltaIndicator({ value }: { value: number }) {
  if (value === 0) {
    return <span className="text-xs text-slate-500">-</span>;
  }
  const isPositive = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isPositive ? "text-emerald-400" : "text-red-400"
      }`}
    >
      {isPositive ? "+" : ""}
      {formatNumber(value)}
    </span>
  );
}

export function MonitorSummaryCards({ channels }: MonitorSummaryCardsProps) {
  const summary = useMemo(() => {
    const total = channels.length;
    if (total === 0) {
      return { total: 0, avgSubDelta: 0, avgViewDelta: 0, surgeCount: 0 };
    }

    const totalSubDelta = channels.reduce((s, c) => s + c.subscriberDelta, 0);
    const totalViewDelta = channels.reduce((s, c) => s + c.viewDelta, 0);
    const surgeCount = channels.filter((c) => c.subscriberDelta > 1000).length;

    return {
      total,
      avgSubDelta: Math.round(totalSubDelta / total),
      avgViewDelta: Math.round(totalViewDelta / total),
      surgeCount,
    };
  }, [channels]);

  const items: SummaryItem[] = [
    {
      label: "총 추적 채널",
      value: String(summary.total),
      icon: <UsersIcon />,
      iconBg: "bg-blue-500/20 text-blue-400",
    },
    {
      label: "평균 구독자 증감",
      value: formatNumber(Math.abs(summary.avgSubDelta)),
      delta: summary.avgSubDelta,
      icon: <TrendUpIcon />,
      iconBg: "bg-emerald-500/20 text-emerald-400",
    },
    {
      label: "평균 일 조회수 변동",
      value: formatNumber(Math.abs(summary.avgViewDelta)),
      delta: summary.avgViewDelta,
      icon: <EyeIcon />,
      iconBg: "bg-violet-500/20 text-violet-400",
    },
    {
      label: "구독자 급상승 채널",
      value: String(summary.surgeCount),
      icon: <RocketIcon />,
      iconBg: "bg-amber-500/20 text-amber-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <Card
          key={item.label}
          className="border-slate-800 bg-slate-900"
        >
          <CardContent className="flex items-start gap-3 py-3 px-4">
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${item.iconBg}`}
            >
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 truncate">{item.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-lg font-bold text-slate-100">{item.value}</p>
                {item.delta !== undefined && <DeltaIndicator value={item.delta} />}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
