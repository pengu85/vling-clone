import { NextRequest, NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";
import { calculateAlgoScore } from "@/domain/algoScore";
import { estimateMonthlyRevenue, estimateAdPrice } from "@/domain/revenueEstimate";
import type { Channel } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Get channel details from YouTube API
    const result = await youtubeClient.getChannel(id);

    if (!result.items || result.items.length === 0) {
      return NextResponse.json(
        { error: "채널을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const ch = result.items[0];
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

    const estimatedRevenue = estimateMonthlyRevenue({
      dailyViews: dailyAvgViews,
      country: ch.snippet.country || "KR",
      category: "entertainment",
    });

    const channel: Channel = {
      id: ch.id,
      youtubeId: ch.id,
      title: ch.snippet.title,
      description: ch.snippet.description,
      thumbnailUrl: ch.snippet.thumbnails.high.url,
      bannerUrl: ch.brandingSettings?.image?.bannerExternalUrl || null,
      subscriberCount,
      viewCount,
      videoCount,
      category: "entertainment",
      country: ch.snippet.country || "KR",
      language: ch.snippet.defaultLanguage || "ko",
      growthRate30d: parseFloat((Math.random() * 5 - 1).toFixed(1)),
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

    return NextResponse.json({ data: channel });
  } catch (error) {
    console.error("YouTube channel error:", error);
    return NextResponse.json(
      { error: "YouTube API 호출에 실패했습니다", details: String(error) },
      { status: 500 }
    );
  }
}
