"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHART_TOOLTIP_STYLE } from "./chartConfig";

interface GrowthDataPoint {
  date: string;
  rate: number;
}

interface GrowthChartProps {
  data?: GrowthDataPoint[];
  title?: string;
}

export function GrowthChart({ data, title = "성장률 추이" }: GrowthChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="border-slate-800 bg-slate-800/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">성장 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-sm text-slate-500">
            데이터가 충분하지 않습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-300">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="growthPositive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="growthNegative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              interval={Math.floor(chartData.length / 6)}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              width={40}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value) => {
                const v = Number(value ?? 0);
                return [`${v >= 0 ? "+" : ""}${v}%`, "성장률"];
              }}
            />
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#growthPositive)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
