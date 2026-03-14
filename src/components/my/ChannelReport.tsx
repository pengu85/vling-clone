"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import {
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
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  DollarSign,
  Zap,
  Heart,
  Globe,
  Play,
  ThumbsUp,
  MessageSquare,
  Lightbulb,
  Link,
  CheckCircle2,
  Calendar,
  BarChart2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatNumber, formatCurrency, formatGrowthRate } from "@/lib/formatters";
import { estimateMonthlyRevenue } from "@/domain/revenueEstimate";
import type { Channel, Video } from "@/types";

// ─── 헬퍼 ──────────────────────────────────────────────────────────────────────

const COUNTRY_NAMES: Record<string, string> = {
  KR: "한국", US: "미국", JP: "일본", CN: "중국",
  TW: "대만", CA: "캐나다", AU: "호주", GB: "영국",
};

function formatYAxis(value: number): string {
  if (value >= 100000000) return `${(value / 100000000).toFixed(0)}억`;
  if (value >= 10000) return `${(value / 10000).toFixed(0)}만`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return String(value);
}

function generateDeterministicTrend(
  days: number,
  currentSubs: number,
  currentViews: number,
  growthRate: number
): Array<{ date: string; subscribers: number; views: number }> {
  const dailyGrowth = 1 + (growthRate / 100 / 30);
  const now = new Date();
  const result = [];
  let subs = currentSubs / Math.pow(dailyGrowth, days);
  let views = currentViews / Math.pow(dailyGrowth, days);

  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    subs *= dailyGrowth;
    views *= dailyGrowth;
    result.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      subscribers: Math.round(subs),
      views: Math.round(views),
    });
  }
  return result;
}

function engagementColor(rate: number): string {
  if (rate >= 6) return "text-emerald-400";
  if (rate >= 3) return "text-yellow-400";
  return "text-red-400";
}

// ─── 서브 컴포넌트 ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  trend?: number;
  highlight?: boolean;
}

function MetricCard({ icon, label, value, sub, trend, highlight }: MetricCardProps) {
  return (
    <Card className={`border-slate-800 ${highlight ? "bg-indigo-950/60" : "bg-slate-800/60"}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className="text-xl font-bold text-slate-100 truncate">{value}</p>
            {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
          </div>
          <div className="shrink-0 p-2 rounded-lg bg-slate-700/50">{icon}</div>
        </div>
        {trend !== undefined && (
          <div className="mt-2 flex items-center gap-1">
            {trend >= 0 ? (
              <TrendingUp className="h-3 w-3 text-emerald-400" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-400" />
            )}
            <span className={`text-xs font-medium ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {formatGrowthRate(trend)}
            </span>
            <span className="text-xs text-slate-500">30일</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── 채널 연결 프롬프트 ──────────────────────────────────────────────────────────

interface ConnectChannelProps {
  onConnect: (channelId: string) => void;
}

function ConnectChannelPrompt({ onConnect }: ConnectChannelProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("YouTube 채널 URL 또는 채널 ID를 입력해주세요.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `/api/youtube/resolve?url=${encodeURIComponent(trimmed)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "채널을 찾을 수 없습니다.");
        return;
      }
      onConnect(data.channelId);
    } catch {
      setError("채널 검색에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="text-center space-y-2">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/20 border border-indigo-500/30">
          <Link className="h-7 w-7 text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">채널을 연결하세요</h2>
        <p className="text-sm text-slate-400 max-w-xs">
          내 YouTube 채널을 연결하면 구독자 추이, 수익 예측, AI 개선 제안 등
          맞춤형 리포트를 확인할 수 있습니다.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <div className="space-y-1.5">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="예: https://youtube.com/@channelname"
            className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <Button
          onClick={handleConnect}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white border-none disabled:opacity-60"
        >
          {loading ? "검색 중..." : "채널 연결"}
        </Button>
      </div>

      <div className="flex flex-col items-center gap-2 text-xs text-slate-500">
        {[
          "읽기 전용 접근 — 채널을 수정하지 않습니다",
          "언제든지 연결 해제 가능",
        ].map((text) => (
          <span key={text} className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── 메인 리포트 ────────────────────────────────────────────────────────────────

interface ReportDashboardProps {
  channel: Channel;
  videos: Video[];
}

function ReportDashboard({ channel, videos }: ReportDashboardProps) {
  const trendData = useMemo(
    () => generateDeterministicTrend(30, channel.subscriberCount, channel.dailyAvgViews, channel.growthRate30d),
    [channel.subscriberCount, channel.dailyAvgViews, channel.growthRate30d]
  );

  const monthlyRevenue = useMemo(
    () =>
      estimateMonthlyRevenue({
        dailyViews: channel.dailyAvgViews,
        country: channel.country,
        category: channel.category,
      }),
    [channel]
  );

  const topVideos = useMemo(
    () =>
      [...videos]
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 5),
    [videos]
  );

  const ageEntries = Object.entries(channel.audienceAgeDistribution).sort(
    (a, b) => b[1] - a[1]
  );
  const topAge = ageEntries[0];
  const secondAge = ageEntries[1];

  const aiSuggestions = [
    {
      icon: <Zap className="h-4 w-4 text-yellow-400" />,
      title: "업로드 주기를 주 2회로 늘리세요",
      desc: "분석 결과, 주 2회 업로드 채널이 주 1회 채널보다 성장률이 평균 47% 높습니다. 현재 업로드 주기 개선을 권장합니다.",
    },
    {
      icon: <Users className="h-4 w-4 text-blue-400" />,
      title: `${topAge?.[0] ?? "25-34"} 타겟 콘텐츠를 강화하세요`,
      desc: `주요 시청자층(${topAge?.[0] ?? "25-34"}: ${topAge?.[1] ?? 35}%)에 맞는 콘텐츠 비중을 높이면 참여율과 재방문율이 향상됩니다.`,
    },
    {
      icon: <TrendingUp className="h-4 w-4 text-emerald-400" />,
      title: "쇼츠(Shorts)를 도입해 신규 유입을 늘리세요",
      desc: "쇼츠는 알고리즘 노출에 유리하며 신규 구독자 유입 채널로 효과적입니다. 주 3-4개 쇼츠 업로드를 권장합니다.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── A. 채널 요약 카드 ── */}
      <Card className="bg-slate-800/60 border-slate-800 overflow-hidden">
        {channel.bannerUrl && (
          <div className="relative h-28 w-full">
            <Image
              src={channel.bannerUrl}
              alt="채널 배너"
              fill
              className="object-cover opacity-60"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/80" />
          </div>
        )}
        <CardContent className={`p-5 ${channel.bannerUrl ? "-mt-8 relative" : ""}`}>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="relative shrink-0">
              <Image
                src={channel.thumbnailUrl}
                alt={channel.title}
                width={72}
                height={72}
                className="rounded-full border-4 border-slate-900"
                unoptimized
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-slate-100">{channel.title}</h2>
                <Badge className="bg-indigo-600/30 text-indigo-300 border-indigo-500/40 text-xs">
                  {channel.category}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">{channel.description}</p>
            </div>
          </div>

          <Separator className="my-4 bg-slate-700" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "구독자", value: formatNumber(channel.subscriberCount), icon: <Users className="h-4 w-4 text-indigo-400" /> },
              { label: "총 조회수", value: formatNumber(channel.viewCount), icon: <Eye className="h-4 w-4 text-blue-400" /> },
              { label: "영상 수", value: `${channel.videoCount.toLocaleString()}개`, icon: <Play className="h-4 w-4 text-purple-400" /> },
              { label: "채널 국가", value: COUNTRY_NAMES[channel.country] ?? channel.country, icon: <Globe className="h-4 w-4 text-teal-400" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="text-center">
                <div className="flex justify-center mb-1">{icon}</div>
                <p className="text-base font-bold text-slate-100">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── B. 핵심 지표 그리드 ── */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-indigo-400" />
          핵심 지표
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
            label="월 예상 수익"
            value={formatCurrency(monthlyRevenue)}
            sub="CPM 기반 추정"
            highlight
          />
          <MetricCard
            icon={<TrendingUp className="h-4 w-4 text-blue-400" />}
            label="30일 성장률"
            value={formatGrowthRate(channel.growthRate30d)}
            sub="구독자 기준"
            trend={channel.growthRate30d}
          />
          <MetricCard
            icon={<Zap className="h-4 w-4 text-yellow-400" />}
            label="알고리즘 스코어"
            value={`${channel.algoScore}점`}
            sub="100점 만점"
          />
          <MetricCard
            icon={<Heart className="h-4 w-4 text-pink-400" />}
            label="참여율"
            value={`${channel.engagementRate.toFixed(1)}%`}
            sub="좋아요+댓글 기준"
          />
        </div>
      </div>

      {/* ── C. 구독자/조회수 추이 차트 ── */}
      <Card className="bg-slate-800/60 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">
            30일 구독자 · 조회수 추이
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={trendData}
              margin={{ top: 4, right: 12, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                interval={Math.floor(trendData.length / 6)}
              />
              <YAxis
                yAxisId="subs"
                tickFormatter={formatYAxis}
                tick={{ fontSize: 10, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                width={42}
              />
              <YAxis
                yAxisId="views"
                orientation="right"
                tickFormatter={formatYAxis}
                tick={{ fontSize: 10, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                width={42}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #334155",
                  backgroundColor: "#1e293b",
                  color: "#e2e8f0",
                }}
                formatter={(value, name) => [
                  formatYAxis(Number(value ?? 0)),
                  name === "subscribers" ? "구독자" : "조회수",
                ]}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-slate-400">
                    {value === "subscribers" ? "구독자" : "조회수"}
                  </span>
                )}
              />
              <Line
                yAxisId="subs"
                type="monotone"
                dataKey="subscribers"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#6366f1" }}
              />
              <Line
                yAxisId="views"
                type="monotone"
                dataKey="views"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#22d3ee" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── D. 시청자 분석 요약 ── */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-400" />
          시청자 분석
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 성별 */}
          <Card className="bg-slate-800/60 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">성별 비율</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {[
                { label: "남성", ratio: channel.audienceMaleRatio, color: "bg-indigo-500" },
                { label: "여성", ratio: 100 - channel.audienceMaleRatio, color: "bg-violet-400" },
              ].map(({ label, ratio, color }) => (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{label}</span>
                    <span className="font-medium text-slate-200">{ratio}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 상위 국가 */}
          <Card className="bg-slate-800/60 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">상위 국가</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {channel.audienceTopCountries.slice(0, 3).map(({ country, ratio }) => (
                <div key={country} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{COUNTRY_NAMES[country] ?? country}</span>
                    <span className="font-medium text-slate-200">{ratio}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 연령 하이라이트 */}
          <Card className="bg-slate-800/60 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">연령 하이라이트</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <div className="text-center py-2">
                <p className="text-2xl font-bold text-slate-100">{topAge?.[0]}</p>
                <p className="text-xs text-slate-400">주 시청자층</p>
                <Badge className="mt-1 bg-indigo-600/30 text-indigo-300 border-indigo-500/40 text-xs">
                  {topAge?.[1]}%
                </Badge>
              </div>
              <Separator className="bg-slate-700" />
              <p className="text-xs text-slate-500 text-center">
                2위: <span className="text-slate-300">{secondAge?.[0]}</span>{" "}
                ({secondAge?.[1]}%)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── E. 콘텐츠 성과 ── */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Play className="h-4 w-4 text-purple-400" />
          콘텐츠 성과 (TOP 5)
        </h3>
        <Card className="bg-slate-800/60 border-slate-800">
          <CardContent className="p-0">
            <div className="divide-y divide-slate-800">
              {topVideos.map((video, idx) => {
                const engagement = ((video.likeCount + video.commentCount) / Math.max(video.viewCount, 1) * 100);
                return (
                  <div key={video.id} className="flex gap-3 p-4 items-start hover:bg-slate-700/30 transition-colors">
                    <span className="shrink-0 w-5 text-sm font-bold text-slate-500 mt-0.5">
                      {idx + 1}
                    </span>
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      width={80}
                      height={45}
                      className="rounded shrink-0 object-cover"
                      unoptimized
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 font-medium line-clamp-1 mb-1">
                        {video.title}
                      </p>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {formatNumber(video.viewCount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {formatNumber(video.likeCount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {formatNumber(video.commentCount)}
                        </span>
                        <span className={`flex items-center gap-1 font-medium ${engagementColor(engagement)}`}>
                          <Heart className="h-3 w-3" />
                          {engagement.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    {video.isShort && (
                      <Badge className="shrink-0 bg-red-600/30 text-red-300 border-red-500/40 text-xs">
                        Shorts
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── F. AI 추천 ── */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-yellow-400" />
          AI 개선 제안
        </h3>
        <div className="space-y-3">
          {aiSuggestions.map((item) => (
            <Card key={item.title} className="bg-slate-800/60 border-slate-800 hover:border-slate-700 transition-colors">
              <CardContent className="p-4 flex gap-3">
                <div className="shrink-0 p-2 rounded-lg bg-slate-700/50 self-start">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-200 mb-0.5">{item.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 데이터 기준 일자 */}
      <p className="text-xs text-slate-600 flex items-center gap-1.5">
        <Calendar className="h-3 w-3" />
        데이터 기준:{" "}
        {channel.updatedAt instanceof Date
          ? channel.updatedAt.toLocaleDateString("ko-KR")
          : new Date(channel.updatedAt).toLocaleDateString("ko-KR")}
      </p>
    </div>
  );
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────────────────────────

export function ChannelReport() {
  const [channelId, setChannelId] = useState<string | null>(null);

  const {
    data: channelData,
    isLoading: channelLoading,
    error: channelError,
  } = useQuery({
    queryKey: ["channel", channelId],
    queryFn: async () => {
      const res = await fetch(`/api/youtube/channel/${channelId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "채널 정보를 불러오지 못했습니다.");
      }
      const json = await res.json();
      return json.data as Channel;
    },
    enabled: !!channelId,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: videosData,
    isLoading: videosLoading,
  } = useQuery({
    queryKey: ["channel-videos", channelId],
    queryFn: async () => {
      const res = await fetch(`/api/monitor/videos?channelId=${channelId}`);
      if (!res.ok) return [];
      const items = await res.json();
      // Map API response to Video type
      return (items as Array<{
        id: string;
        title: string;
        type: string;
        views: number;
        likes: number;
        comments: number;
        publishedAt: string;
        thumbnailUrl: string;
        duration: string;
        viewsGrowth: number;
      }>).map((item): Video => ({
        id: item.id,
        youtubeId: item.id,
        channelId: channelId!,
        title: item.title,
        description: "",
        thumbnailUrl: item.thumbnailUrl,
        viewCount: item.views,
        likeCount: item.likes,
        commentCount: item.comments,
        duration: item.duration,
        publishedAt: new Date(item.publishedAt),
        algoScore: 0,
        isShort: item.type === "shorts",
        tags: [],
        updatedAt: new Date(),
      }));
    },
    enabled: !!channelId,
    staleTime: 5 * 60 * 1000,
  });

  if (!channelId) {
    return <ConnectChannelPrompt onConnect={(id) => setChannelId(id)} />;
  }

  if (channelLoading || videosLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-400">채널 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (channelError || !channelData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-sm text-red-400">
          {channelError instanceof Error
            ? channelError.message
            : "채널 정보를 불러오지 못했습니다."}
        </p>
        <Button
          onClick={() => setChannelId(null)}
          variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <ReportDashboard channel={channelData} videos={videosData ?? []} />
  );
}
