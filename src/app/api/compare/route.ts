import { NextRequest, NextResponse } from "next/server";
import { youtubeClient, extractCategory } from "@/lib/youtube";
import { calculateAlgoScore } from "@/domain/algoScore";
import { estimateMonthlyRevenue, estimateAdPrice } from "@/domain/revenueEstimate";
import { calculateGrowthRate } from "@/domain/growthRate";
import type { Channel } from "@/types";

export async function POST(request: NextRequest) {
  const { channelIds } = await request.json() as { channelIds: string[] };

  if (!channelIds || channelIds.length < 2 || channelIds.length > 5) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "2~5개 채널을 선택해주세요." } },
      { status: 400 }
    );
  }

  try {
    const result = await youtubeClient.getChannel(channelIds.join(","));

    if (!result.items || result.items.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const channels: Channel[] = result.items.map((ch) => {
      const subscriberCount = parseInt(ch.statistics.subscriberCount) || 0;
      const viewCount = parseInt(ch.statistics.viewCount) || 0;
      const videoCount = parseInt(ch.statistics.videoCount) || 0;
      const dailyAvgViews = videoCount > 0
        ? Math.round(viewCount / Math.max(videoCount * 30, 1))
        : 0;

      const algoScore = calculateAlgoScore({
        viewCount,
        likeCount: Math.round(viewCount * 0.03),
        commentCount: Math.round(viewCount * 0.005),
        subscriberCount,
        publishedDaysAgo: 30,
        videoCount,
      });

      const engagementRate = subscriberCount > 0
        ? parseFloat(((dailyAvgViews / subscriberCount) * 100).toFixed(1))
        : 0;

      const category = extractCategory(ch.topicDetails?.topicCategories);

      const estimatedRevenue = estimateMonthlyRevenue({
        dailyViews: dailyAvgViews,
        country: ch.snippet.country || "KR",
        category,
      });

      return {
        id: ch.id,
        youtubeId: ch.id,
        title: ch.snippet.title,
        description: ch.snippet.description,
        thumbnailUrl: ch.snippet.thumbnails.high.url,
        bannerUrl: ch.brandingSettings?.image?.bannerExternalUrl || null,
        subscriberCount,
        viewCount,
        videoCount,
        category,
        country: ch.snippet.country || "KR",
        language: ch.snippet.defaultLanguage || "ko",
        growthRate30d: calculateGrowthRate(viewCount, videoCount, subscriberCount),
        dailyAvgViews,
        algoScore,
        engagementRate,
        estimatedRevenue,
        estimatedAdPrice: estimateAdPrice(subscriberCount, engagementRate),
        audienceMaleRatio: 55,
        audienceAgeDistribution: { "13-17": 8, "18-24": 28, "25-34": 35, "35-44": 18, "45-54": 8, "55+": 3 },
        audienceTopCountries: [
          { country: ch.snippet.country || "KR", ratio: 72 },
          { country: "US", ratio: 12 },
          { country: "JP", ratio: 8 },
        ],
        tags: [ch.snippet.title],
        updatedAt: new Date(),
      };
    });

    return NextResponse.json({ data: channels });
  } catch (error) {
    console.error("Compare API error:", error);
    return NextResponse.json(
      { error: "YouTube API 호출에 실패했습니다", details: String(error) },
      { status: 500 }
    );
  }
}
