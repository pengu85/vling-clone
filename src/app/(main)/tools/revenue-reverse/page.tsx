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
import {
  Target,
  TrendingUp,
  Users,
  Trophy,
  Award,
  Monitor,
  Heart,
  Handshake,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ── Types ──────────────────────────────────────────────────────────

interface ScenarioResult {
  requiredMonthlyViews: number;
  requiredDailyViews: number;
  estimatedSubscribers: number;
  uploadsNeeded: number;
  difficulty: "쉬움" | "보통" | "어려움" | "매우 어려움";
}

interface Scenario2Result {
  adRevenue: number;
  adViews: number;
  superChatRevenue: number;
  superChatSessions: number;
  membershipRevenue: number;
  membershipMembers: number;
  estimatedSubscribers: number;
  difficulty: "쉬움" | "보통" | "어려움" | "매우 어려움";
}

interface Scenario3Result {
  adRevenue: number;
  adViews: number;
  sponsorRevenue: number;
  sponsorPrice: number;
  sponsorCount: number;
  minSubscribers: number;
  estimatedSubscribers: number;
  difficulty: "쉬움" | "보통" | "어려움" | "매우 어려움";
}

interface RoadmapMonth {
  month: number;
  label: string;
  subscribers: number;
  revenue: number;
}

interface Milestone {
  icon: React.ElementType;
  label: string;
  month: number;
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

const PRESETS = [
  { label: "100만", value: 100 },
  { label: "300만", value: 300 },
  { label: "500만", value: 500 },
  { label: "1000만", value: 1000 },
] as const;

const CPM_TABLE: Record<string, Record<string, number>> = {
  엔터테인먼트: { 한국: 1.5, 미국: 4.0, 일본: 3.0, 기타: 1.0 },
  교육: { 한국: 3.0, 미국: 8.0, 일본: 5.0, 기타: 2.0 },
  게임: { 한국: 2.0, 미국: 5.0, 일본: 4.0, 기타: 1.5 },
  뷰티: { 한국: 2.5, 미국: 6.0, 일본: 4.5, 기타: 1.5 },
  테크: { 한국: 4.0, 미국: 10.0, 일본: 6.0, 기타: 2.5 },
  음식: { 한국: 2.0, 미국: 4.5, 일본: 3.5, 기타: 1.0 },
  여행: { 한국: 2.5, 미국: 5.0, 일본: 4.0, 기타: 1.5 },
  음악: { 한국: 1.0, 미국: 3.0, 일본: 2.0, 기타: 0.8 },
  스포츠: { 한국: 2.0, 미국: 5.0, 일본: 3.5, 기타: 1.0 },
  기타: { 한국: 1.5, 미국: 4.0, 일본: 2.5, 기타: 1.0 },
};

// ── Calculation Logic ──────────────────────────────────────────────

function getCpmKRW(category: string, country: string): number {
  const cpmUSD = CPM_TABLE[category]?.[country] ?? 1.5;
  return cpmUSD * 1300;
}

function getDifficulty(subscribers: number): "쉬움" | "보통" | "어려움" | "매우 어려움" {
  if (subscribers < 10000) return "쉬움";
  if (subscribers < 100000) return "보통";
  if (subscribers < 500000) return "어려움";
  return "매우 어려움";
}

function calcScenario1(
  targetKRW: number,
  category: string,
  country: string
): ScenarioResult {
  const cpmKRW = getCpmKRW(category, country);
  const requiredMonthlyViews = Math.ceil((targetKRW / cpmKRW) * 1000);
  const requiredDailyViews = Math.ceil(requiredMonthlyViews / 30);
  const estimatedSubscribers = Math.ceil(requiredDailyViews / 0.1);
  const uploadsNeeded = Math.ceil(requiredMonthlyViews / 50000);
  const difficulty = getDifficulty(estimatedSubscribers);

  return {
    requiredMonthlyViews,
    requiredDailyViews,
    estimatedSubscribers,
    uploadsNeeded,
    difficulty,
  };
}

function calcScenario2(
  targetKRW: number,
  category: string,
  country: string
): Scenario2Result {
  const cpmKRW = getCpmKRW(category, country);

  const adRevenue = targetKRW * 0.7;
  const superChatRevenue = targetKRW * 0.2;
  const membershipRevenue = targetKRW * 0.1;

  const adViews = Math.ceil((adRevenue / cpmKRW) * 1000);
  const superChatSessions = Math.ceil(superChatRevenue / 50000); // 1회 라이브 평균 5만원
  const membershipMembers = Math.ceil(membershipRevenue / 4900); // 멤버십 4,900원/월

  const dailyViews = Math.ceil(adViews / 30);
  const estimatedSubscribers = Math.ceil(dailyViews / 0.1);
  const difficulty = getDifficulty(estimatedSubscribers);

  return {
    adRevenue,
    adViews,
    superChatRevenue,
    superChatSessions,
    membershipRevenue,
    membershipMembers,
    estimatedSubscribers,
    difficulty,
  };
}

function calcScenario3(
  targetKRW: number,
  category: string,
  country: string
): Scenario3Result {
  const cpmKRW = getCpmKRW(category, country);

  const adRevenue = targetKRW * 0.5;
  const sponsorRevenue = targetKRW * 0.5;

  const adViews = Math.ceil((adRevenue / cpmKRW) * 1000);
  const dailyViews = Math.ceil(adViews / 30);
  const estimatedSubscribers = Math.ceil(dailyViews / 0.1);

  // 협찬 단가: 구독자 1만 기준 50만, 10만 기준 200만, 50만 기준 500만
  const sponsorPrice =
    estimatedSubscribers >= 500000
      ? 5000000
      : estimatedSubscribers >= 100000
        ? 2000000
        : estimatedSubscribers >= 10000
          ? 500000
          : 200000;
  const sponsorCount = Math.ceil(sponsorRevenue / sponsorPrice);

  const difficulty = getDifficulty(estimatedSubscribers);

  return {
    adRevenue,
    adViews,
    sponsorRevenue,
    sponsorPrice,
    sponsorCount,
    minSubscribers: 10000,
    estimatedSubscribers,
    difficulty,
  };
}

function generateRoadmap(
  targetKRW: number,
  category: string,
  country: string
): { data: RoadmapMonth[]; milestones: Milestone[] } {
  const cpmKRW = getCpmKRW(category, country);
  const data: RoadmapMonth[] = [];
  const milestones: Milestone[] = [];

  // Assume starting from 0, growing at a realistic pace
  // Growth model: subscribers double every 3 months initially, slowing down
  let subs = 100;
  const targetSubs = calcScenario1(targetKRW, category, country).estimatedSubscribers;
  const totalMonths = Math.min(36, Math.max(12, Math.ceil(Math.log2(targetSubs / 100) * 3)));

  const monthlyGrowthRate = Math.pow(targetSubs / 100, 1 / totalMonths);

  const subMilestones = [
    { target: 1000, label: "구독자 1,000명", icon: Users, color: "text-blue-400" },
    { target: 10000, label: "구독자 1만명", icon: Users, color: "text-blue-400" },
    { target: 50000, label: "구독자 5만명", icon: TrendingUp, color: "text-green-400" },
    { target: 100000, label: "실버 버튼 (10만)", icon: Award, color: "text-slate-300" },
    { target: 500000, label: "구독자 50만명", icon: Trophy, color: "text-purple-400" },
    { target: 1000000, label: "골드 버튼 (100만)", icon: Trophy, color: "text-yellow-400" },
  ];
  const reachedSubs = new Set<number>();

  for (let m = 0; m <= totalMonths; m++) {
    subs = m === 0 ? 100 : Math.round(100 * Math.pow(monthlyGrowthRate, m));
    const dailyViews = Math.round(subs * 0.1);
    const monthlyViews = dailyViews * 30;
    const revenue = Math.round((monthlyViews / 1000) * cpmKRW);

    data.push({
      month: m,
      label: `${m}개월`,
      subscribers: subs,
      revenue,
    });

    for (const ms of subMilestones) {
      if (!reachedSubs.has(ms.target) && subs >= ms.target) {
        reachedSubs.add(ms.target);
        milestones.push({ ...ms, month: m });
      }
    }
  }

  return { data, milestones };
}

// ── Formatters ─────────────────────────────────────────────────────

function formatNumber(value: number): string {
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}억`;
  if (value >= 10_000) return `${Math.round(value / 10_000).toLocaleString()}만`;
  return value.toLocaleString();
}

function formatKRW(value: number): string {
  return formatNumber(value) + "원";
}

// ── Difficulty Badge ───────────────────────────────────────────────

function DifficultyBadge({
  difficulty,
}: {
  difficulty: "쉬움" | "보통" | "어려움" | "매우 어려움";
}) {
  const config = {
    쉬움: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    보통: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    어려움: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "매우 어려움": "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config[difficulty]}`}
    >
      {difficulty}
    </span>
  );
}

// ── Stat Row ───────────────────────────────────────────────────────

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-200 tabular-nums">
        {value}
      </span>
    </div>
  );
}

// ── Chart Tooltip Style ────────────────────────────────────────────

const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid #334155",
  backgroundColor: "#1e293b",
  color: "#e2e8f0",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.4)",
};

// ── Main Page ──────────────────────────────────────────────────────

export default function RevenueReversePage() {
  const [targetManWon, setTargetManWon] = useState(500);
  const [category, setCategory] = useState("엔터테인먼트");
  const [country, setCountry] = useState("한국");

  const targetKRW = targetManWon * 10000;

  const scenario1 = useMemo(
    () => calcScenario1(targetKRW, category, country),
    [targetKRW, category, country]
  );

  const scenario2 = useMemo(
    () => calcScenario2(targetKRW, category, country),
    [targetKRW, category, country]
  );

  const scenario3 = useMemo(
    () => calcScenario3(targetKRW, category, country),
    [targetKRW, category, country]
  );

  const roadmap = useMemo(
    () => generateRoadmap(targetKRW, category, country),
    [targetKRW, category, country]
  );

  const chartData = useMemo(
    () =>
      roadmap.data.map((d) => ({
        ...d,
        revenueMan: Math.round(d.revenue / 10000),
      })),
    [roadmap.data]
  );

  const cpmUSD = CPM_TABLE[category]?.[country] ?? 1.5;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Target className="h-5 w-5 text-blue-400" />
          <h1 className="text-xl font-bold text-slate-100">수익 역산기</h1>
        </div>
        <p className="text-sm text-slate-400">
          목표 월 수익을 입력하면 필요한 구독자 수, 조회수, 업로드 빈도를 역산합니다
        </p>
      </div>

      {/* Target Settings */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-300">
            목표 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Target Revenue Input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">
              목표 월 수익 (만원)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={targetManWon || ""}
                  onChange={(e) => setTargetManWon(Number(e.target.value) || 0)}
                  placeholder="500"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200
                    focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                    [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                  만원
                </span>
              </div>
            </div>
            {/* Presets */}
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setTargetManWon(p.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    targetManWon === p.value
                      ? "bg-blue-600/20 text-blue-400 border-blue-500/40"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">
                카테고리
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200
                  focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">국가</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200
                  focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Current CPM Info */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Info className="h-3.5 w-3.5" />
            <span>
              적용 CPM: <span className="text-slate-300 font-medium">${cpmUSD.toFixed(1)}</span>
              {" "}({category} / {country})
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 3 Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Scenario 1: Ad Revenue Only */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                <Monitor className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium text-slate-200">
                  광고 수익만
                </CardTitle>
                <p className="text-xs text-slate-500">광고 수익 100%</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <StatRow
              label="필요 월 조회수"
              value={`${formatNumber(scenario1.requiredMonthlyViews)}회`}
            />
            <StatRow
              label="필요 일 조회수"
              value={`${formatNumber(scenario1.requiredDailyViews)}회`}
            />
            <StatRow
              label="추정 필요 구독자"
              value={`${formatNumber(scenario1.estimatedSubscribers)}명`}
            />
            <StatRow
              label="필요 월 업로드 수"
              value={`${scenario1.uploadsNeeded}개`}
            />
            <div className="pt-3 flex items-center justify-between">
              <span className="text-xs text-slate-500">난이도</span>
              <DifficultyBadge difficulty={scenario1.difficulty} />
            </div>
          </CardContent>
        </Card>

        {/* Scenario 2: Ad + SuperChat + Membership */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
                <Heart className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium text-slate-200">
                  광고 + 슈퍼챗 + 멤버십
                </CardTitle>
                <p className="text-xs text-slate-500">70% + 20% + 10%</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <StatRow
              label="광고 수익 (70%)"
              value={formatKRW(scenario2.adRevenue)}
            />
            <StatRow
              label="필요 조회수"
              value={`${formatNumber(scenario2.adViews)}회`}
            />
            <StatRow
              label="슈퍼챗 수익 (20%)"
              value={formatKRW(scenario2.superChatRevenue)}
            />
            <StatRow
              label="필요 라이브 횟수"
              value={`월 ${scenario2.superChatSessions}회`}
            />
            <StatRow
              label="멤버십 수익 (10%)"
              value={formatKRW(scenario2.membershipRevenue)}
            />
            <StatRow
              label="필요 멤버십 회원"
              value={`${formatNumber(scenario2.membershipMembers)}명`}
            />
            <div className="pt-3 flex items-center justify-between">
              <span className="text-xs text-slate-500">난이도</span>
              <DifficultyBadge difficulty={scenario2.difficulty} />
            </div>
          </CardContent>
        </Card>

        {/* Scenario 3: Ad + Sponsorship */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                <Handshake className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium text-slate-200">
                  광고 + 협찬
                </CardTitle>
                <p className="text-xs text-slate-500">50% + 50%</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <StatRow
              label="광고 수익 (50%)"
              value={formatKRW(scenario3.adRevenue)}
            />
            <StatRow
              label="필요 조회수"
              value={`${formatNumber(scenario3.adViews)}회`}
            />
            <StatRow
              label="협찬 수익 (50%)"
              value={formatKRW(scenario3.sponsorRevenue)}
            />
            <StatRow
              label="협찬 단가"
              value={`${formatNumber(scenario3.sponsorPrice)}원/건`}
            />
            <StatRow
              label="필요 협찬 건수"
              value={`월 ${scenario3.sponsorCount}건`}
            />
            <StatRow
              label="협찬 최소 구독자"
              value={`${formatNumber(scenario3.minSubscribers)}명 이상`}
            />
            <div className="pt-3 flex items-center justify-between">
              <span className="text-xs text-slate-500">난이도</span>
              <DifficultyBadge difficulty={scenario3.difficulty} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roadmap Timeline */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">
            목표 달성 로드맵
          </CardTitle>
          <p className="text-xs text-slate-500">
            0에서 목표 수익까지의 예상 성장 곡선
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="gradRevReverse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                tickFormatter={(v: number) => `${v}만`}
                width={52}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value) => [
                  `${Number(value ?? 0).toLocaleString()}만원`,
                  "예상 수익",
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenueMan"
                name="예상 수익"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#gradRevReverse)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Milestones Timeline */}
      {roadmap.milestones.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              예상 마일스톤
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-0">
              {roadmap.milestones.map((ms, idx) => {
                const Icon = ms.icon;
                return (
                  <div key={idx} className="flex items-start gap-3 py-2.5">
                    <div className="relative flex flex-col items-center">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 ring-2 ring-slate-700">
                        <Icon className={`h-3.5 w-3.5 ${ms.color}`} />
                      </div>
                      {idx < roadmap.milestones.length - 1 && (
                        <div className="w-px h-full min-h-[16px] bg-slate-700 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm font-medium text-slate-200">
                        {ms.label}
                      </p>
                      <p className="text-xs text-slate-500">
                        약 {ms.month}개월 소요
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CPM Reference Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">
            카테고리별 평균 CPM (USD)
          </CardTitle>
          <p className="text-xs text-slate-500">
            CPM = 1,000회 조회당 예상 광고 수익
          </p>
        </CardHeader>
        <CardContent className="pt-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-2 pr-4 text-xs font-medium text-slate-500">
                  카테고리
                </th>
                {COUNTRIES.map((c) => (
                  <th
                    key={c}
                    className="text-right py-2 px-2 text-xs font-medium text-slate-500"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((cat) => (
                <tr
                  key={cat}
                  className={`border-b border-slate-800/50 ${
                    cat === category ? "bg-blue-500/5" : ""
                  }`}
                >
                  <td className="py-2 pr-4 text-slate-300 text-xs font-medium">
                    {cat}
                    {cat === category && (
                      <span className="ml-1.5 text-blue-400 text-[10px]">
                        (선택됨)
                      </span>
                    )}
                  </td>
                  {COUNTRIES.map((cty) => (
                    <td
                      key={cty}
                      className={`text-right py-2 px-2 text-xs tabular-nums ${
                        cat === category && cty === country
                          ? "text-blue-400 font-semibold"
                          : "text-slate-400"
                      }`}
                    >
                      ${CPM_TABLE[cat]?.[cty]?.toFixed(1) ?? "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Category Revenue Structure Info */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">
            상위 채널 평균 수익 구조
          </CardTitle>
          <p className="text-xs text-slate-500">
            같은 카테고리 상위 채널의 일반적인 수익 비율
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: "광고 수익",
                pct: "40-60%",
                desc: "CPM 기반 조회수 수익",
                color: "text-blue-400 bg-blue-500/10",
              },
              {
                label: "협찬/브랜드딜",
                pct: "20-40%",
                desc: "구독자 1만+ 가능",
                color: "text-amber-400 bg-amber-500/10",
              },
              {
                label: "슈퍼챗/라이브",
                pct: "5-15%",
                desc: "라이브 방송 수익",
                color: "text-purple-400 bg-purple-500/10",
              },
              {
                label: "멤버십/굿즈",
                pct: "5-10%",
                desc: "정기 구독 수익",
                color: "text-green-400 bg-green-500/10",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-slate-800 p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`px-2 py-0.5 rounded text-xs font-bold ${item.color}`}
                  >
                    {item.pct}
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-200">
                  {item.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
