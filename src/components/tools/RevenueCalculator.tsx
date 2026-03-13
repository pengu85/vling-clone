"use client";

import { useState, useMemo } from "react";
import { DollarSign, TrendingUp, Calculator } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { COUNTRIES, CATEGORIES } from "@/domain/categories";
import { estimateMonthlyRevenue } from "@/domain/revenueEstimate";
import { formatCurrency } from "@/lib/formatters";

export function RevenueCalculator() {
  const [dailyViews, setDailyViews] = useState<number>(10000);
  const [country, setCountry] = useState<string>("KR");
  const [category, setCategory] = useState<string>("entertainment");

  const result = useMemo(() => {
    if (dailyViews <= 0) return null;
    const monthlyRevenue = estimateMonthlyRevenue({ dailyViews, country, category });
    const yearlyRevenue = monthlyRevenue * 12;
    const cpm = parseFloat(
      ((monthlyRevenue / (dailyViews * 30)) * 1000).toFixed(2)
    );
    return {
      monthlyRevenue,
      yearlyRevenue,
      cpm,
      min: Math.round(monthlyRevenue * 0.7),
      max: Math.round(monthlyRevenue * 1.3),
    };
  }, [dailyViews, country, category]);

  const chartData = useMemo(() => {
    if (dailyViews <= 0) return [];
    const multipliers = [0.5, 1, 1.5, 2, 3];
    return multipliers.map((m) => ({
      label: `${m}x`,
      views: Math.round(dailyViews * m),
      revenue: estimateMonthlyRevenue({
        dailyViews: Math.round(dailyViews * m),
        country,
        category,
      }),
    }));
  }, [dailyViews, country, category]);

  return (
    <div className="space-y-6">
      {/* 입력 섹션 */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <Calculator className="h-5 w-5 text-violet-400" />
            수익 입력
          </CardTitle>
          <CardDescription className="text-slate-400">
            채널 정보를 입력하면 예상 수익을 바로 계산합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* 일 평균 조회수 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                일 평균 조회수
              </label>
              <Input
                type="number"
                min={0}
                value={dailyViews}
                onChange={(e) => setDailyViews(parseInt(e.target.value) || 0)}
                className="bg-slate-800 border-slate-700 text-slate-100 focus-visible:ring-violet-500"
                placeholder="예: 10000"
              />
              <p className="text-[11px] text-slate-500">
                숫자를 직접 입력하세요
              </p>
            </div>

            {/* 국가 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                주요 시청자 국가
              </label>
              <Select value={country} onValueChange={(v) => v && setCountry(v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100 focus:ring-violet-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {COUNTRIES.map((c) => (
                    <SelectItem
                      key={c.value}
                      value={c.value}
                      className="text-slate-200 focus:bg-slate-700 focus:text-slate-100"
                    >
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 카테고리 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                채널 카테고리
              </label>
              <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100 focus:ring-violet-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                    <SelectItem
                      key={c.value}
                      value={c.value}
                      className="text-slate-200 focus:bg-slate-700 focus:text-slate-100"
                    >
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 결과 섹션 */}
      {result ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 예상 월 수익 */}
          <Card className="bg-slate-900 border-slate-800 col-span-1 sm:col-span-2 lg:col-span-1">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">예상 월 수익</p>
                  <p className="text-3xl font-bold text-emerald-400">
                    {formatCurrency(result.monthlyRevenue)}
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 예상 연 수익 */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">예상 연 수익</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {formatCurrency(result.yearlyRevenue)}
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CPM */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-5">
              <p className="text-xs text-slate-500 mb-1">예상 CPM</p>
              <p className="text-2xl font-bold text-violet-400">
                ${result.cpm}
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                1,000회당 수익
              </p>
            </CardContent>
          </Card>

          {/* 수익 구간 */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-5">
              <p className="text-xs text-slate-500 mb-2">수익 구간 (±30%)</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="secondary"
                    className="bg-red-500/10 text-red-400 border-0 text-[10px]"
                  >
                    최소
                  </Badge>
                  <span className="text-sm font-semibold text-slate-200">
                    {formatCurrency(result.min)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge
                    variant="secondary"
                    className="bg-green-500/10 text-green-400 border-0 text-[10px]"
                  >
                    최대
                  </Badge>
                  <span className="text-sm font-semibold text-slate-200">
                    {formatCurrency(result.max)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-10 text-center text-slate-500">
            일 평균 조회수를 입력하면 예상 수익이 표시됩니다
          </CardContent>
        </Card>
      )}

      {/* 수익 분포 차트 */}
      {chartData.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base text-slate-100">
              조회수 시나리오별 월 수익 시뮬레이션
            </CardTitle>
            <CardDescription className="text-slate-400">
              현재 조회수 기준 배율별 예상 수익
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={{ stroke: "#334155" }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => formatCurrency(v)}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={{ stroke: "#334155" }}
                    tickLine={false}
                    width={72}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#e2e8f0",
                    }}
                    formatter={(value) => [
                      formatCurrency(typeof value === "number" ? value : 0),
                      "월 수익",
                    ]}
                    labelFormatter={(label) => `조회수 배율: ${label}`}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="url(#revenueGradient)"
                    radius={[4, 4, 0, 0]}
                  />
                  <defs>
                    <linearGradient
                      id="revenueGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
