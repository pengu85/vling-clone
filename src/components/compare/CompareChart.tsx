"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatNumber, formatGrowthRate } from "@/lib/formatters";
import type { Channel } from "@/types";

interface CompareChartProps {
  channels: Channel[];
}

const CHANNEL_COLORS = [
  "#6366f1",
  "#22d3ee",
  "#f59e0b",
  "#10b981",
  "#f43f5e",
];

type MetricKey = "subscriber" | "view" | "growth" | "engagement";

const metrics: { key: MetricKey; label: string }[] = [
  { key: "subscriber", label: "구독자" },
  { key: "view", label: "조회수" },
  { key: "growth", label: "성장률" },
  { key: "engagement", label: "참여율" },
];

type ViewMode = "bar" | "radar";

function getMetricValue(ch: Channel, key: MetricKey): number {
  switch (key) {
    case "subscriber":
      return ch.subscriberCount;
    case "view":
      return ch.dailyAvgViews;
    case "growth":
      return ch.growthRate30d;
    case "engagement":
      return ch.engagementRate;
  }
}

function formatMetricValue(val: number, key: MetricKey): string {
  if (key === "growth") return formatGrowthRate(val);
  if (key === "engagement") return `${val.toFixed(1)}%`;
  return formatNumber(val);
}

export function CompareChart({ channels }: CompareChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>("subscriber");
  const [viewMode, setViewMode] = useState<ViewMode>("bar");

  if (channels.length === 0) return null;

  // Build data: one entry per channel
  const data = channels.map((ch, i) => ({
    name: ch.title.length > 6 ? ch.title.slice(0, 6) + "…" : ch.title,
    value: getMetricValue(ch, activeMetric),
    color: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
  }));

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">지표 비교</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode("bar")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              viewMode === "bar" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            막대
          </button>
          <button
            onClick={() => setViewMode("radar")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              viewMode === "radar" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            레이더
          </button>
        </div>
      </div>
      {viewMode === "bar" && <Tabs
        value={activeMetric}
        onValueChange={(v) => setActiveMetric(v as MetricKey)}
      >
        <TabsList className="mb-5 h-auto gap-1 p-1">
          {metrics.map((m) => (
            <TabsTrigger key={m.key} value={m.key} className="px-3 py-1 text-xs">
              {m.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {metrics.map((m) => (
          <TabsContent key={m.key} value={m.key}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={data}
                margin={{ top: 8, right: 12, left: 8, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatMetricValue(v, m.key)}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "8px",
                    color: "#e2e8f0",
                    fontSize: 12,
                  }}
                  formatter={(value: unknown) => [
                    formatMetricValue(Number(value ?? 0), m.key),
                    m.label,
                  ]}
                  cursor={{ fill: "#1e293b" }}
                />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={64}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-3">
              {channels.map((ch, i) => (
                <div key={ch.id} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: CHANNEL_COLORS[i % CHANNEL_COLORS.length] }}
                  />
                  {ch.title}
                </div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>}
      {viewMode === "radar" && (
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart
              data={metrics.map((m) => ({
                metric: m.label,
                ...Object.fromEntries(
                  channels.map((ch, i) => [
                    ch.title.length > 6 ? ch.title.slice(0, 6) + "…" : ch.title,
                    (() => {
                      const val = getMetricValue(ch, m.key);
                      const allVals = channels.map((c) => getMetricValue(c, m.key));
                      const max = Math.max(...allVals);
                      return max > 0 ? (val / max) * 100 : 0;
                    })(),
                  ])
                ),
              }))}
            >
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              {channels.map((ch, i) => (
                <Radar
                  key={ch.id}
                  name={ch.title}
                  dataKey={ch.title.length > 6 ? ch.title.slice(0, 6) + "…" : ch.title}
                  stroke={CHANNEL_COLORS[i % CHANNEL_COLORS.length]}
                  fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]}
                  fillOpacity={0.15}
                />
              ))}
              <Legend
                wrapperStyle={{ fontSize: 12, color: "#94a3b8" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  color: "#e2e8f0",
                  fontSize: 12,
                }}
                formatter={(value: unknown) => [`${Number(value).toFixed(0)}%`, ""]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
