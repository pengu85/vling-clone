"use client";

import { useState, useMemo, useCallback } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  LineChart as LineChartIcon,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  DollarSign,
  Users,
  Trophy,
  Target,
  Award,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ── Types ──────────────────────────────────────────────────────────

interface SimParams {
  subscribers: number;
  category: string;
  country: string;
  uploadsPerMonth: number;
  avgViewsPerVideo: number;
  monthlyGrowthRate: number;
  months: number;
  customCpm: number | null;
  superChatMonthly: number;
  membershipMonthly: number;
  sponsorshipPrice: number;
  sponsorshipCount: number;
}

interface MonthlyData {
  month: number;
  subscribers: number;
  adRevenue: number;
  superChat: number;
  membership: number;
  sponsorship: number;
  totalRevenue: number;
}

interface Milestone {
  icon: React.ElementType;
  label: string;
  date: string;
  color: string;
}

// ── Constants ──────────────────────────────────────────────────────

const CATEGORIES = [
  "엔터테인먼트",
  "교육",
  "게임",
  "뷰티",
  "테크",
  "음식",
  "여행",
  "음악",
  "스포츠",
  "기타",
] as const;

const COUNTRIES = ["한국", "미국", "일본", "기타"] as const;

const CPM_BY_CATEGORY: Record<string, number> = {
  엔터테인먼트: 1.5,
  교육: 3.0,
  게임: 2.0,
  뷰티: 2.5,
  테크: 4.0,
  음식: 2.0,
  여행: 2.5,
  음악: 1.0,
  스포츠: 2.0,
  기타: 1.5,
};

const CPM_MULTIPLIER: Record<string, number> = {
  한국: 1.0,
  미국: 3.0,
  일본: 2.0,
  기타: 0.8,
};

// ── Simulation Logic ───────────────────────────────────────────────

function simulate(params: SimParams): MonthlyData[] {
  const results: MonthlyData[] = [];
  let currentSubs = params.subscribers;

  const baseCpm =
    params.customCpm ??
    CPM_BY_CATEGORY[params.category] * CPM_MULTIPLIER[params.country];

  for (let month = 1; month <= params.months; month++) {
    currentSubs *= 1 + params.monthlyGrowthRate / 100;
    const monthlyViews = params.uploadsPerMonth * params.avgViewsPerVideo;

    const viewMultiplier = currentSubs / params.subscribers;
    const adjustedViews = monthlyViews * Math.sqrt(viewMultiplier);

    const adRevenue = (adjustedViews / 1000) * baseCpm * 1300;
    const superChat = params.superChatMonthly || 0;
    const membership = params.membershipMonthly || 0;
    const sponsorship =
      (params.sponsorshipPrice || 0) * (params.sponsorshipCount || 0);

    results.push({
      month,
      subscribers: Math.round(currentSubs),
      adRevenue: Math.round(adRevenue),
      superChat,
      membership,
      sponsorship,
      totalRevenue: Math.round(adRevenue + superChat + membership + sponsorship),
    });
  }
  return results;
}

// ── Formatters ─────────────────────────────────────────────────────

function formatKRW(value: number): string {
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}억`;
  if (value >= 10_000) return `${Math.round(value / 10_000)}만`;
  return value.toLocaleString();
}

function formatSubs(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function logSliderToValue(position: number): number {
  const minLog = Math.log10(1000);
  const maxLog = Math.log10(1_000_000);
  const value = Math.pow(10, minLog + (position / 100) * (maxLog - minLog));
  return Math.round(value);
}

function valueToLogSlider(value: number): number {
  const minLog = Math.log10(1000);
  const maxLog = Math.log10(1_000_000);
  return ((Math.log10(value) - minLog) / (maxLog - minLog)) * 100;
}

// ── Slider Component ───────────────────────────────────────────────

function SliderInput({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
  isLog,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  displayValue: string;
  onChange: (v: number) => void;
  isLog?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-400">{label}</label>
        <span className="text-xs font-semibold text-blue-400 tabular-nums">
          {displayValue}
        </span>
      </div>
      <input
        type="range"
        min={isLog ? 0 : min}
        max={isLog ? 100 : max}
        step={isLog ? 0.1 : step ?? 1}
        value={isLog ? valueToLogSlider(value) : value}
        onChange={(e) => {
          const raw = parseFloat(e.target.value);
          onChange(isLog ? logSliderToValue(raw) : raw);
        }}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-700
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500
          [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(59,130,246,0.5)]
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
          [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500
          [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
      />
    </div>
  );
}

// ── Select Component ───────────────────────────────────────────────

function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200
          focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Number Input Component ─────────────────────────────────────────

function NumberInput({
  label,
  value,
  onChange,
  suffix,
  placeholder,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-400">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          placeholder={placeholder ?? "0"}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200
            focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
            [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Chart Tooltip ──────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid #334155",
  backgroundColor: "#1e293b",
  color: "#e2e8f0",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.4)",
};

// ── Main Page Component ────────────────────────────────────────────

export default function RevenueSimulatorPage() {
  // Channel info
  const [subscribers, setSubscribers] = useState(10000);
  const [category, setCategory] = useState("엔터테인먼트");
  const [country, setCountry] = useState("한국");

  // Simulation variables
  const [uploadsPerMonth, setUploadsPerMonth] = useState(8);
  const [avgViews, setAvgViews] = useState(10000);
  const [growthRate, setGrowthRate] = useState(3);
  const [months, setMonths] = useState(12);

  // Advanced settings
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [customCpm, setCustomCpm] = useState<number | null>(null);
  const [superChat, setSuperChat] = useState(0);
  const [membership, setMembership] = useState(0);
  const [sponsorshipPrice, setSponsorshipPrice] = useState(0);
  const [sponsorshipCount, setSponsorshipCount] = useState(0);

  const params: SimParams = useMemo(
    () => ({
      subscribers,
      category,
      country,
      uploadsPerMonth,
      avgViewsPerVideo: avgViews,
      monthlyGrowthRate: growthRate,
      months,
      customCpm,
      superChatMonthly: superChat,
      membershipMonthly: membership,
      sponsorshipPrice,
      sponsorshipCount,
    }),
    [
      subscribers,
      category,
      country,
      uploadsPerMonth,
      avgViews,
      growthRate,
      months,
      customCpm,
      superChat,
      membership,
      sponsorshipPrice,
      sponsorshipCount,
    ]
  );

  const data = useMemo(() => simulate(params), [params]);

  const lastMonth = data[data.length - 1];
  const firstMonth = data[0];
  const totalRevenue = data.reduce((sum, d) => sum + d.totalRevenue, 0);

  // Milestones
  const milestones = useMemo(() => {
    const result: Milestone[] = [];
    const now = new Date();

    // Subscriber milestones
    const subTargets = [
      { target: 1000, label: "구독자 1,000명 달성" },
      { target: 10000, label: "구독자 1만명 달성" },
      { target: 100000, label: "실버 버튼 (10만)" },
      { target: 1000000, label: "골드 버튼 (100만)" },
    ];
    for (const { target, label } of subTargets) {
      if (subscribers >= target) continue;
      const monthIdx = data.findIndex((d) => d.subscribers >= target);
      if (monthIdx !== -1) {
        const estDate = new Date(now);
        estDate.setMonth(estDate.getMonth() + monthIdx + 1);
        result.push({
          icon: target >= 100000 ? Award : Users,
          label,
          date: `${estDate.getFullYear()}년 ${estDate.getMonth() + 1}월`,
          color:
            target >= 1000000
              ? "text-yellow-400"
              : target >= 100000
                ? "text-slate-300"
                : "text-blue-400",
        });
      }
    }

    // Revenue milestones
    const revTargets = [
      { target: 500000, label: "월 수익 50만원 돌파" },
      { target: 1000000, label: "월 수익 100만원 돌파" },
      { target: 5000000, label: "월 수익 500만원 돌파" },
      { target: 10000000, label: "월 수익 1,000만원 돌파" },
    ];
    for (const { target, label } of revTargets) {
      if (firstMonth && firstMonth.totalRevenue >= target) continue;
      const monthIdx = data.findIndex((d) => d.totalRevenue >= target);
      if (monthIdx !== -1) {
        const estDate = new Date(now);
        estDate.setMonth(estDate.getMonth() + monthIdx + 1);
        result.push({
          icon: target >= 5000000 ? Trophy : Target,
          label,
          date: `${estDate.getFullYear()}년 ${estDate.getMonth() + 1}월`,
          color:
            target >= 10000000
              ? "text-yellow-400"
              : target >= 5000000
                ? "text-purple-400"
                : "text-green-400",
        });
      }
    }

    return result.slice(0, 5);
  }, [data, subscribers, firstMonth]);

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        label: `${d.month}개월`,
        adRevenueMan: Math.round(d.adRevenue / 10000),
        superChatMan: Math.round(d.superChat / 10000),
        membershipMan: Math.round(d.membership / 10000),
        sponsorshipMan: Math.round(d.sponsorship / 10000),
        totalMan: Math.round(d.totalRevenue / 10000),
      })),
    [data]
  );

  const handleSubsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSubscribers(Number(e.target.value) || 0);
  }, []);

  const handleReset = useCallback(() => {
    setSubscribers(10000);
    setCategory("엔터테인먼트");
    setCountry("한국");
    setUploadsPerMonth(8);
    setAvgViews(10000);
    setGrowthRate(3);
    setMonths(12);
    setCustomCpm(null);
    setSuperChat(0);
    setMembership(0);
    setSponsorshipPrice(0);
    setSponsorshipCount(0);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LineChartIcon className="h-5 w-5 text-blue-400" />
            <h1 className="text-xl font-bold text-slate-100">수익 시뮬레이터</h1>
          </div>
          <p className="text-sm text-slate-400">
            업로드 빈도, 카테고리, 성장률을 조절하여 미래 수익을 시뮬레이션하세요
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 shrink-0 rounded-lg border border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          초기화
        </button>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left Panel: Inputs ── */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          {/* Channel Info */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                채널 기본 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">
                  현재 구독자 수
                </label>
                <input
                  type="number"
                  value={subscribers || ""}
                  onChange={handleSubsChange}
                  placeholder="10000"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200
                    focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                    [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
              <SelectInput
                label="카테고리"
                value={category}
                options={CATEGORIES}
                onChange={setCategory}
              />
              <SelectInput
                label="국가"
                value={country}
                options={COUNTRIES}
                onChange={setCountry}
              />
            </CardContent>
          </Card>

          {/* Simulation Variables */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                시뮬레이션 변수
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SliderInput
                label="월 업로드 수"
                value={uploadsPerMonth}
                min={1}
                max={30}
                displayValue={`${uploadsPerMonth}개`}
                onChange={setUploadsPerMonth}
              />
              <SliderInput
                label="영상당 평균 조회수"
                value={avgViews}
                min={1000}
                max={1000000}
                displayValue={formatSubs(avgViews)}
                onChange={setAvgViews}
                isLog
              />
              <SliderInput
                label="월 구독자 증가율"
                value={growthRate}
                min={0}
                max={20}
                step={0.5}
                displayValue={`${growthRate}%`}
                onChange={setGrowthRate}
              />
              <SliderInput
                label="시뮬레이션 기간"
                value={months}
                min={3}
                max={36}
                displayValue={
                  months >= 12
                    ? `${Math.floor(months / 12)}년${months % 12 > 0 ? ` ${months % 12}개월` : ""}`
                    : `${months}개월`
                }
                onChange={setMonths}
              />
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-0">
              <button
                onClick={() => setAdvancedOpen(!advancedOpen)}
                className="flex items-center justify-between w-full text-left"
              >
                <CardTitle className="text-sm font-medium text-slate-300">
                  고급 설정
                </CardTitle>
                {advancedOpen ? (
                  <ChevronUp className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                )}
              </button>
            </CardHeader>
            {advancedOpen && (
              <CardContent className="space-y-3 pt-3">
                <NumberInput
                  label="광고 CPM 수동 설정 (USD)"
                  value={customCpm ?? 0}
                  onChange={(v) => setCustomCpm(v > 0 ? v : null)}
                  suffix="USD"
                  placeholder="자동 계산"
                />
                <NumberInput
                  label="슈퍼챗 예상 수입 (월)"
                  value={superChat}
                  onChange={setSuperChat}
                  suffix="원"
                />
                <NumberInput
                  label="멤버십 예상 수입 (월)"
                  value={membership}
                  onChange={setMembership}
                  suffix="원"
                />
                <NumberInput
                  label="협찬 단가 (건당)"
                  value={sponsorshipPrice}
                  onChange={setSponsorshipPrice}
                  suffix="원"
                />
                <NumberInput
                  label="월 협찬 건수"
                  value={sponsorshipCount}
                  onChange={setSponsorshipCount}
                  suffix="건"
                />
              </CardContent>
            )}
          </Card>

          {/* CPM Info */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
            <p className="text-xs text-slate-500 leading-relaxed">
              현재 CPM:{" "}
              <span className="text-slate-300 font-medium">
                $
                {(
                  customCpm ??
                  CPM_BY_CATEGORY[category] * CPM_MULTIPLIER[country]
                ).toFixed(1)}
              </span>{" "}
              ({category} / {country})
            </p>
          </div>
        </div>

        {/* ── Right Panel: Results ── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
                    <DollarSign className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <span className="text-xs text-slate-400">예상 월 수익</span>
                </div>
                <p className="text-lg font-bold text-slate-100">
                  {formatKRW(lastMonth?.totalRevenue ?? 0)}
                  <span className="text-xs text-slate-500 font-normal ml-1">
                    원
                  </span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  현재 {formatKRW(firstMonth?.totalRevenue ?? 0)}원 →{" "}
                  {months}개월 후
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/10">
                    <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                  </div>
                  <span className="text-xs text-slate-400">예상 누적 수익</span>
                </div>
                <p className="text-lg font-bold text-slate-100">
                  {formatKRW(totalRevenue)}
                  <span className="text-xs text-slate-500 font-normal ml-1">
                    원
                  </span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {months}개월간 총 수익
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10">
                    <Users className="h-3.5 w-3.5 text-purple-400" />
                  </div>
                  <span className="text-xs text-slate-400">예상 구독자</span>
                </div>
                <p className="text-lg font-bold text-slate-100">
                  {formatSubs(lastMonth?.subscribers ?? subscribers)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  현재 {formatSubs(subscribers)} → {months}개월 후
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Timeline Chart */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                수익 타임라인
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                >
                  <defs>
                    <linearGradient id="gradAd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradSuper" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradMember" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="gradSponsor"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    interval={Math.max(0, Math.floor(chartData.length / 8) - 1)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}만`}
                    width={48}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value, name) => [
                      `${Number(value ?? 0).toLocaleString()}만원`,
                      String(name),
                    ]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="adRevenueMan"
                    name="광고 수익"
                    stackId="1"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#gradAd)"
                  />
                  <Area
                    type="monotone"
                    dataKey="superChatMan"
                    name="슈퍼챗"
                    stackId="1"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fill="url(#gradSuper)"
                  />
                  <Area
                    type="monotone"
                    dataKey="membershipMan"
                    name="멤버십"
                    stackId="1"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="url(#gradMember)"
                  />
                  <Area
                    type="monotone"
                    dataKey="sponsorshipMan"
                    name="협찬"
                    stackId="1"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill="url(#gradSponsor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Subscriber Growth Chart */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                구독자 성장 예측
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    interval={Math.max(0, Math.floor(chartData.length / 8) - 1)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatSubs(v)}
                    width={48}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value) => [
                      Number(value ?? 0).toLocaleString() + "명",
                      "구독자",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="subscribers"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Milestones */}
          {milestones.length > 0 && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">
                  예상 마일스톤
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-0">
                  {milestones.map((ms, idx) => {
                    const Icon = ms.icon;
                    return (
                      <div key={idx} className="flex items-start gap-3 py-2.5">
                        <div className="relative flex flex-col items-center">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 ring-2 ring-slate-700`}
                          >
                            <Icon className={`h-3.5 w-3.5 ${ms.color}`} />
                          </div>
                          {idx < milestones.length - 1 && (
                            <div className="w-px h-full min-h-[16px] bg-slate-700 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-sm font-medium text-slate-200">
                            {ms.label}
                          </p>
                          <p className="text-xs text-slate-500">{ms.date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
