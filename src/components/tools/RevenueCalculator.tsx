"use client";

import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  DollarSign,
  TrendingUp,
  Calculator,
  Search,
  Loader2,
  Users,
  Eye,
  Megaphone,
  Radio,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { formatCurrency, formatNumber } from "@/lib/formatters";

/* ---------- Types ---------- */

interface ChannelAnalysis {
  channel: {
    id: string;
    name: string;
    thumbnail: string;
    subscribers: number;
    totalViews: number;
    videoCount: number;
    country: string;
    category: string;
  };
  revenue: {
    dailyViews: number;
    monthlyRevenue: number;
    yearlyRevenue: number;
    cpm: number;
    revenueRange: { min: number; max: number };
  };
  additionalRevenue: {
    superChat: { estimated: number; applicable: boolean };
    brandedContent: { min: number; max: number; label: string };
  };
  similarChannels: Array<{
    id: string;
    name: string;
    thumbnail: string;
    subscribers: number;
    estimatedMonthlyRevenue: number;
  }>;
}

/* ---------- API ---------- */

async function analyzeChannel(channelInput: string): Promise<ChannelAnalysis> {
  const res = await fetch("/api/tools/calculator/channel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channelInput }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || "채널을 분석할 수 없습니다");
  return json.data;
}

/* ---------- Component ---------- */

export function RevenueCalculator() {
  const [channelInput, setChannelInput] = useState("");
  const [dailyViews, setDailyViews] = useState<number>(10000);
  const [country, setCountry] = useState<string>("KR");
  const [category, setCategory] = useState<string>("entertainment");

  const channelMutation = useMutation({
    mutationFn: analyzeChannel,
    onSuccess: (data) => {
      setDailyViews(data.revenue.dailyViews);
      setCountry(data.channel.country);
      const matchedCat = CATEGORIES.find((c) => c.value === data.channel.category);
      if (matchedCat) setCategory(data.channel.category);
    },
  });

  const channelData = channelMutation.data;

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

  const handleAnalyze = () => {
    if (!channelInput.trim()) return;
    channelMutation.mutate(channelInput.trim());
  };

  return (
    <div className="space-y-6">
      {/* 채널 URL 분석 섹션 */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <Search className="h-5 w-5 text-blue-400" />
            채널 자동 분석
          </CardTitle>
          <CardDescription className="text-slate-400">
            채널 URL, @핸들 또는 채널명을 입력하면 자동으로 수익을 분석합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={channelInput}
              onChange={(e) => setChannelInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="예: https://youtube.com/@channelname 또는 채널명"
              className="bg-slate-800 border-slate-700 text-slate-100 focus-visible:ring-blue-500"
            />
            <Button
              onClick={handleAnalyze}
              disabled={channelMutation.isPending || !channelInput.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
            >
              {channelMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  분석 중
                </>
              ) : (
                "분석"
              )}
            </Button>
          </div>
          {channelMutation.isError && (
            <p className="text-sm text-red-400 mt-2">
              {(channelMutation.error as Error).message}
            </p>
          )}

          {/* 채널 분석 결과 요약 */}
          {channelData && (
            <div className="mt-4 p-3 rounded-lg border border-slate-700 bg-slate-800/50">
              <div className="flex items-center gap-3">
                {channelData.channel.thumbnail ? (
                  <img
                    src={channelData.channel.thumbnail}
                    alt={channelData.channel.name}
                    className="h-12 w-12 rounded-full"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center">
                    <Users className="h-5 w-5 text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-100 truncate">
                    {channelData.channel.name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {formatNumber(channelData.channel.subscribers)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {formatNumber(channelData.channel.totalViews)}
                    </span>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-blue-500/10 text-blue-400 border-0 text-xs shrink-0"
                >
                  자동 입력 완료
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* 추가 수익원 (채널 분석 시에만 표시) */}
      {channelData && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* 브랜디드 콘텐츠 (PPL) */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Megaphone className="h-3 w-3" />
                    광고 단가 추정 (브랜디드/PPL)
                  </p>
                  <p className="text-xl font-bold text-amber-400">
                    {channelData.additionalRevenue.brandedContent.label}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    구독자 {formatNumber(channelData.channel.subscribers)} 기준
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                  <Megaphone className="h-4 w-4 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 슈퍼챗 */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Radio className="h-3 w-3" />
                    슈퍼챗 예상 수익
                  </p>
                  {channelData.additionalRevenue.superChat.applicable ? (
                    <>
                      <p className="text-xl font-bold text-pink-400">
                        {formatCurrency(channelData.additionalRevenue.superChat.estimated)}
                        <span className="text-sm font-normal text-slate-500">/월</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        라이브 방송 채널 기준 추정
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-semibold text-slate-500">해당 없음</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        최근 라이브 활동이 감지되지 않았습니다
                      </p>
                    </>
                  )}
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/10">
                  <Radio className="h-4 w-4 text-pink-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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

      {/* 유사 채널 비교 (채널 분석 시에만 표시) */}
      {channelData && channelData.similarChannels.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base text-slate-100">
              유사 채널 수익 비교
            </CardTitle>
            <CardDescription className="text-slate-400">
              같은 카테고리의 유사 채널과 예상 수익을 비교합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">
                      채널
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase">
                      구독자
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase">
                      예상 월 수익
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* 현재 채널 */}
                  <tr className="border-b border-slate-800/50 bg-blue-500/5">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        {channelData.channel.thumbnail ? (
                          <img
                            src={channelData.channel.thumbnail}
                            alt={channelData.channel.name}
                            className="h-7 w-7 rounded-full"
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-slate-700" />
                        )}
                        <span className="text-slate-100 font-medium truncate max-w-[160px]">
                          {channelData.channel.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-blue-500/15 text-blue-400 border-0 text-[10px] shrink-0"
                        >
                          내 채널
                        </Badge>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {formatNumber(channelData.channel.subscribers)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-400">
                      {formatCurrency(channelData.revenue.monthlyRevenue)}
                    </td>
                  </tr>
                  {/* 유사 채널 */}
                  {channelData.similarChannels.map((sim) => (
                    <tr key={sim.id} className="border-b border-slate-800/50">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          {sim.thumbnail ? (
                            <img
                              src={sim.thumbnail}
                              alt={sim.name}
                              className="h-7 w-7 rounded-full"
                            />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-slate-700" />
                          )}
                          <span className="text-slate-300 truncate max-w-[160px]">
                            {sim.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400">
                        {formatNumber(sim.subscribers)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-300">
                        {formatCurrency(sim.estimatedMonthlyRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
