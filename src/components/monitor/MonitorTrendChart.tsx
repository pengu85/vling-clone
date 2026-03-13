"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/formatters";

interface MonitorTrendChartProps {
  data: Array<{
    date: string; // YYYY-MM-DD
    subscribers: number;
    dailyViews: number;
    algoScore: number;
  }>;
  channelTitle: string;
}

type MetricKey = "subscribers" | "dailyViews" | "algoScore";

interface MetricConfig {
  key: MetricKey;
  label: string;
  color: string;
  gradientId: string;
}

const METRICS: MetricConfig[] = [
  {
    key: "subscribers",
    label: "구독자",
    color: "#60a5fa",
    gradientId: "gradSubscribers",
  },
  {
    key: "dailyViews",
    label: "조회수",
    color: "#34d399",
    gradientId: "gradViews",
  },
  {
    key: "algoScore",
    label: "알고 점수",
    color: "#a78bfa",
    gradientId: "gradAlgo",
  },
];

const PERIOD_OPTIONS = [
  { label: "7일", value: 7 },
  { label: "14일", value: 14 },
  { label: "30일", value: 30 },
];

function formatYAxis(value: number): string {
  if (value >= 100000000) return `${(value / 100000000).toFixed(0)}억`;
  if (value >= 10000) return `${(value / 10000).toFixed(0)}만`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return String(value);
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    payload: {
      date: string;
      subscribers: number;
      dailyViews: number;
      algoScore: number;
      _prevValue?: number;
    };
  }>;
  label?: string;
  metric: MetricConfig;
}

function CustomTooltip({ active, payload, metric }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0];
  const value = entry.value;
  const prevValue = entry.payload._prevValue;
  const delta = prevValue !== undefined ? value - prevValue : undefined;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400">{entry.payload.date}</p>
      <p className="mt-1 text-sm font-semibold text-slate-100">
        {metric.label}: {formatNumber(value)}
      </p>
      {delta !== undefined && (
        <p
          className={`mt-0.5 text-xs font-medium ${
            delta > 0
              ? "text-emerald-400"
              : delta < 0
                ? "text-red-400"
                : "text-slate-400"
          }`}
        >
          전일 대비:{" "}
          {delta > 0 ? "+" : ""}
          {formatNumber(delta)}
        </p>
      )}
    </div>
  );
}

export function MonitorTrendChart({ data, channelTitle }: MonitorTrendChartProps) {
  const [period, setPeriod] = useState(30);
  const [activeMetric, setActiveMetric] = useState<MetricKey>("subscribers");

  const metric = METRICS.find((m) => m.key === activeMetric)!;

  const chartData = useMemo(() => {
    const sliced = data.slice(-period);
    return sliced.map((item, idx) => ({
      ...item,
      displayDate: formatDateLabel(item.date),
      _prevValue: idx > 0 ? sliced[idx - 1][activeMetric] : undefined,
    }));
  }, [data, period, activeMetric]);

  return (
    <Card className="border-slate-800 bg-slate-900">
      <CardHeader className="pb-2 px-3 sm:px-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-200">
              {channelTitle} 추이
            </CardTitle>
            <div className="flex gap-1 shrink-0">
              {PERIOD_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={period === opt.value ? "default" : "ghost"}
                  size="sm"
                  className={
                    period === opt.value
                      ? "h-6 px-2 text-xs bg-slate-700 hover:bg-slate-600 text-white border-none"
                      : "h-6 px-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }
                  onClick={() => setPeriod(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex gap-1">
            {METRICS.map((m) => (
              <Button
                key={m.key}
                variant={activeMetric === m.key ? "default" : "ghost"}
                size="sm"
                className={
                  activeMetric === m.key
                    ? "h-7 px-3 text-xs border-none text-white"
                    : "h-7 px-3 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }
                style={
                  activeMetric === m.key
                    ? { backgroundColor: m.color, opacity: 0.85 }
                    : undefined
                }
                onClick={() => setActiveMetric(m.key)}
              >
                {m.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-1 sm:px-4">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 0, left: -4 }}
          >
            <defs>
              <linearGradient id={metric.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={metric.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              interval={Math.max(0, Math.floor(chartData.length / 6) - 1)}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              content={<CustomTooltip metric={metric} />}
              cursor={{ stroke: "#475569", strokeDasharray: "4 4" }}
            />
            <Area
              type="monotone"
              dataKey={activeMetric}
              stroke={metric.color}
              strokeWidth={2}
              fill={`url(#${metric.gradientId})`}
              dot={false}
              activeDot={{ r: 4, fill: metric.color, stroke: "#0f172a", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
