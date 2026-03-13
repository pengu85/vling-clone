"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DataPoint {
  date: string;
  value: number;
}

interface StatsChartProps {
  data?: DataPoint[];
  title: string;
  color?: string;
}

function generateMockTrend(days: number, baseValue: number): DataPoint[] {
  const points: DataPoint[] = [];
  let current = baseValue;
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const change = (Math.random() - 0.45) * current * 0.03;
    current = Math.max(0, current + change);
    points.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      value: Math.round(current),
    });
  }
  return points;
}

function formatYAxis(value: number): string {
  if (value >= 100000000) return `${(value / 100000000).toFixed(0)}억`;
  if (value >= 10000) return `${(value / 10000).toFixed(0)}만`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return String(value);
}

const PERIOD_OPTIONS = [
  { label: "30일", value: 30 },
  { label: "60일", value: 60 },
  { label: "90일", value: 90 },
];

export function StatsChart({ data, title, color = "#6366f1" }: StatsChartProps) {
  const [period, setPeriod] = useState(30);

  const chartData = useMemo(() => {
    if (data && data.length > 0) {
      return data.slice(-period);
    }
    return generateMockTrend(period, 250000);
  }, [data, period]);

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader className="pb-2 px-3 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium text-slate-700 truncate">{title}</CardTitle>
          <div className="flex gap-1 shrink-0">
            {PERIOD_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={period === opt.value ? "default" : "ghost"}
                size="sm"
                className={
                  period === opt.value
                    ? "h-6 px-1.5 sm:px-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white border-none"
                    : "h-6 px-1.5 sm:px-2 text-xs text-slate-500 hover:text-slate-700"
                }
                onClick={() => setPeriod(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-1 sm:px-6">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart
            data={chartData}
            margin={{ top: 4, right: 4, bottom: 0, left: -8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              interval={Math.floor(chartData.length / 4)}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 9, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
              }}
              formatter={(value) => [formatYAxis(Number(value ?? 0)), title]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
