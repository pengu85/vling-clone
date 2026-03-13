"use client";

import { use, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChannelProfile } from "@/components/channel/ChannelProfile";
import { ChannelVideoGrid } from "@/components/channel/ChannelVideoGrid";
import { StatsChart } from "@/components/charts/StatsChart";
import { AudienceChart } from "@/components/charts/AudienceChart";
import { GrowthChart } from "@/components/charts/GrowthChart";
import { useChannelDetail, useChannelVideos } from "@/hooks/useChannelDetail";
import { useChannelTrends } from "@/hooks/useChannelTrends";
import { generateMockChannel, generateMockVideos } from "@/lib/mockData";
import { formatNumber, formatGrowthRate, formatCurrency } from "@/lib/formatters";
import { TrendingUp, Zap, DollarSign, Activity } from "lucide-react";
import { AIInsightPanel } from "@/components/channel/AIInsightPanel";
import { useRecentStore } from "@/stores/recentStore";

interface Props {
  params: Promise<{ id: string }>;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

function MetricCard({ icon, label, value, sub, color = "text-indigo-500" }: MetricCardProps) {
  return (
    <Card className="bg-white border-slate-200">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
          </div>
          <span className={`${color} mt-0.5`}>{icon}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ChannelDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-slate-200" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-52 bg-slate-200 rounded-xl" />
          <div className="h-52 bg-slate-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function ChannelDetailPage({ params }: Props) {
  const { id } = use(params);

  const { data: channelRes, isLoading: channelLoading } = useChannelDetail(id);
  const { data: videosRes, isLoading: videosLoading } = useChannelVideos(id);
  const { data: trendsData } = useChannelTrends(id, 30);
  const { data: trendsData60 } = useChannelTrends(id, 60);
  const { data: trendsData90 } = useChannelTrends(id, 90);

  // API 실패 시 목 데이터 폴백
  const channel = channelRes?.data ?? generateMockChannel(id);
  const videos = videosRes?.data ?? generateMockVideos(id, 8);

  // Record recently viewed channel
  const addRecent = useRecentStore((s) => s.addRecent);
  useEffect(() => {
    if (channel) {
      addRecent({
        id: channel.id,
        youtubeId: channel.youtubeId,
        title: channel.title,
        thumbnailUrl: channel.thumbnailUrl,
        subscriberCount: channel.subscriberCount,
        dailyAvgViews: channel.dailyAvgViews,
        growthRate30d: channel.growthRate30d,
        algoScore: channel.algoScore,
        estimatedRevenue: channel.estimatedRevenue,
        category: channel.category,
        country: channel.country,
      });
    }
  }, [channel, addRecent]);

  // Merge trend data across all period fetches for the period-toggle charts
  // Use 90-day data as the full dataset; charts slice down to 30/60/90 as needed
  const allViewTrend = trendsData90?.viewTrend ?? trendsData60?.viewTrend ?? trendsData?.viewTrend;
  const allGrowthTrend = trendsData90?.growthTrend ?? trendsData60?.growthTrend ?? trendsData?.growthTrend;

  if (channelLoading) {
    return <ChannelDetailSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <ChannelProfile channel={channel} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6 bg-white border border-slate-200 rounded-xl p-1 h-auto w-auto gap-0.5">
            <TabsTrigger value="overview" className="text-sm px-4 py-2 rounded-lg">
              개요
            </TabsTrigger>
            <TabsTrigger value="videos" className="text-sm px-4 py-2 rounded-lg">
              영상
            </TabsTrigger>
            <TabsTrigger value="audience" className="text-sm px-4 py-2 rounded-lg">
              시청자분석
            </TabsTrigger>
            <TabsTrigger value="adprice" className="text-sm px-4 py-2 rounded-lg">
              광고단가
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-sm px-4 py-2 rounded-lg">
              AI인사이트
            </TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* 구독자/조회수 추이 차트 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <StatsChart
                  title="구독자 추이"
                  color="#6366f1"
                />
                <StatsChart
                  title="조회수 추이"
                  color="#8b5cf6"
                  data={allViewTrend}
                />
              </div>

              {/* 주요 지표 카드 4개 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  icon={<Zap className="h-5 w-5" />}
                  label="알고리즘 스코어"
                  value={`${channel.algoScore}점`}
                  sub="100점 만점"
                  color="text-indigo-500"
                />
                <MetricCard
                  icon={<Activity className="h-5 w-5" />}
                  label="참여율"
                  value={`${channel.engagementRate}%`}
                  sub="좋아요+댓글/조회수"
                  color="text-violet-500"
                />
                <MetricCard
                  icon={<TrendingUp className="h-5 w-5" />}
                  label="30일 성장률"
                  value={formatGrowthRate(channel.growthRate30d)}
                  sub="구독자 증감"
                  color={channel.growthRate30d >= 0 ? "text-emerald-500" : "text-red-500"}
                />
                <MetricCard
                  icon={<DollarSign className="h-5 w-5" />}
                  label="예상 월수익"
                  value={formatCurrency(channel.estimatedRevenue)}
                  sub="광고 수익 추정"
                  color="text-amber-500"
                />
              </div>

              {/* 성장률 차트 */}
              <GrowthChart title="성장률 추이 (30일)" data={allGrowthTrend} />

              {/* 최근 영상 */}
              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-800">
                    최근 영상
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {videosLoading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <ChannelVideoGrid videos={videos.slice(0, 8)} />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 영상 탭 */}
          <TabsContent value="videos">
            <div className="space-y-6">
              {/* 인기 영상 TOP 10 */}
              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-800">
                    인기 영상 TOP 10
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {videosLoading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <ChannelVideoGrid
                      videos={[...videos].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10)}
                    />
                  )}
                </CardContent>
              </Card>

              {/* 업로드 빈도 분석 */}
              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-800">
                    업로드 패턴 분석
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-center">
                      <p className="text-2xl font-bold text-indigo-600">{formatNumber(channel.videoCount)}</p>
                      <p className="text-xs text-slate-500 mt-1">총 영상 수</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-center">
                      <p className="text-2xl font-bold text-violet-600">
                        {videos.length > 1
                          ? (() => {
                              const dates = videos
                                .map((v) => new Date(v.publishedAt instanceof Date ? v.publishedAt : String(v.publishedAt)).getTime())
                                .sort((a, b) => b - a);
                              if (dates.length < 2) return "-";
                              const avgGap = (dates[0] - dates[dates.length - 1]) / (dates.length - 1) / 86400000;
                              return avgGap < 1 ? "매일" : `${Math.round(avgGap)}일`;
                            })()
                          : "-"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">평균 업로드 주기</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-center">
                      <p className="text-2xl font-bold text-emerald-600">
                        {videos.length > 0
                          ? formatNumber(
                              Math.round(videos.reduce((sum, v) => sum + v.viewCount, 0) / videos.length)
                            )
                          : "-"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">평균 조회수</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-center">
                      <p className="text-2xl font-bold text-amber-600">
                        {videos.length > 0
                          ? formatNumber(
                              Math.round(videos.reduce((sum, v) => sum + v.likeCount, 0) / videos.length)
                            )
                          : "-"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">평균 좋아요</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 전체 영상 */}
              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-800">
                    전체 영상 ({formatNumber(channel.videoCount)})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {videosLoading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <ChannelVideoGrid videos={videos} />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 시청자분석 탭 */}
          <TabsContent value="audience">
            <div className="space-y-6">
              <AudienceChart
                audienceMaleRatio={channel.audienceMaleRatio}
                audienceAgeDistribution={channel.audienceAgeDistribution}
                audienceTopCountries={channel.audienceTopCountries}
              />
            </div>
          </TabsContent>

          {/* 광고단가 탭 */}
          <TabsContent value="adprice">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-white border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-slate-800">
                    광고 단가 정보
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-slate-100">
                    <span className="text-sm text-slate-600">예상 협찬 단가</span>
                    <span className="text-lg font-bold text-indigo-600">
                      {formatCurrency(channel.estimatedAdPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-100">
                    <span className="text-sm text-slate-600">예상 월 수익</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(channel.estimatedRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-100">
                    <span className="text-sm text-slate-600">일평균 조회수</span>
                    <span className="font-semibold text-slate-900">
                      {formatNumber(channel.dailyAvgViews)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm text-slate-600">참여율</span>
                    <span className="font-semibold text-emerald-600">
                      {channel.engagementRate}%
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-100">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-indigo-800">
                    캠페인 제안 안내
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-indigo-700 leading-relaxed">
                    위 단가는 AI가 채널 규모, 카테고리, 참여율을 종합하여 산출한 예상 금액입니다.
                    실제 협찬 단가는 콘텐츠 형태 및 협의에 따라 달라질 수 있습니다.
                  </p>
                  <p className="text-xs text-indigo-500 mt-3">
                    캠페인 제안 버튼을 통해 크리에이터에게 직접 제안을 보내세요.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI인사이트 탭 */}
          <TabsContent value="insights">
            <AIInsightPanel channelId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
