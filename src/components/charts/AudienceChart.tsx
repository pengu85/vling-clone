"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AudienceChartProps {
  audienceMaleRatio?: number;
  audienceAgeDistribution?: Record<string, number>;
  audienceTopCountries?: Array<{ country: string; ratio: number }>;
}

const COUNTRY_NAMES: Record<string, string> = {
  KR: "한국",
  US: "미국",
  JP: "일본",
  CN: "중국",
  TW: "대만",
  CA: "캐나다",
  AU: "호주",
  GB: "영국",
  DE: "독일",
  FR: "프랑스",
};

const DEFAULT_AGE: Record<string, number> = {
  "13-17": 8,
  "18-24": 28,
  "25-34": 35,
  "35-44": 18,
  "45-54": 8,
  "55+": 3,
};

const DEFAULT_COUNTRIES = [
  { country: "KR", ratio: 72 },
  { country: "US", ratio: 12 },
  { country: "JP", ratio: 8 },
  { country: "CN", ratio: 5 },
  { country: "TW", ratio: 3 },
];

const DARK_TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid #334155",
  backgroundColor: "#1e293b",
  color: "#e2e8f0",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.4)",
};

export function AudienceChart({
  audienceMaleRatio = 58,
  audienceAgeDistribution = DEFAULT_AGE,
  audienceTopCountries = DEFAULT_COUNTRIES,
}: AudienceChartProps) {
  const femaleRatio = 100 - audienceMaleRatio;

  const genderData = [
    { label: "남성", value: audienceMaleRatio, color: "#6366f1" },
    { label: "여성", value: femaleRatio, color: "#a78bfa" },
  ];

  const ageData = Object.entries(audienceAgeDistribution).map(([age, ratio]) => ({
    age,
    ratio,
  }));

  const countryData = audienceTopCountries.map((c) => ({
    country: COUNTRY_NAMES[c.country] ?? c.country,
    ratio: c.ratio,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {/* 성별 비율 */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-300">성별 비율</CardTitle>
            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">추정치</span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={genderData}
              layout="vertical"
              margin={{ top: 4, right: 24, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                dataKey="label"
                type="category"
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip
                formatter={(value) => [`${Number(value ?? 0)}%`, ""]}
                contentStyle={DARK_TOOLTIP_STYLE}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                {genderData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 연령 분포 */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-300">연령 분포</CardTitle>
            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">추정치</span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ageData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="age"
                tick={{ fontSize: 9, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                formatter={(value) => [`${Number(value ?? 0)}%`, "비율"]}
                contentStyle={DARK_TOOLTIP_STYLE}
              />
              <Bar dataKey="ratio" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 국가별 시청자 */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-300">국가별 시청자</CardTitle>
            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">추정치</span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={countryData}
              layout="vertical"
              margin={{ top: 4, right: 24, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                dataKey="country"
                type="category"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip
                formatter={(value) => [`${Number(value ?? 0)}%`, "비율"]}
                contentStyle={DARK_TOOLTIP_STYLE}
              />
              <Bar dataKey="ratio" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
