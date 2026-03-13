import { NextRequest, NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";
import { calculateAlgoScore } from "@/domain/algoScore";
import { estimateMonthlyRevenue } from "@/domain/revenueEstimate";
import { deterministicGrowthRate } from "@/lib/utils";
import type { ChannelSearchResult } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") || "";
  const minScore = parseInt(searchParams.get("minScore") || "0");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  if (!q) {
    return NextResponse.json({
      data: [],
      pagination: { page: 1, limit, total: 0, totalPages: 0 },
    });
  }

  try {
    // Search channels via YouTube API
    const searchResult = await youtubeClient.searchChannels(q, 50);

    if (!searchResult.items || searchResult.items.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: { page: 1, limit, total: 0, totalPages: 0 },
      });
    }

    // Get channel details
    const channelIds = searchResult.items
      .map((item) => item.id.channelId || item.snippet.channelId)
      .filter(Boolean);

    const channelDetails = await youtubeClient.getChannel(channelIds.join(","));

    // Transform and calculate algoScore
    let channels: ChannelSearchResult[] = channelDetails.items.map((ch) => {
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

      const estimatedRevenue = estimateMonthlyRevenue({
        dailyViews: dailyAvgViews,
        country: ch.snippet.country || "KR",
        category: "entertainment",
      });

      return {
        id: ch.id,
        youtubeId: ch.id,
        title: ch.snippet.title,
        thumbnailUrl: ch.snippet.thumbnails.high.url,
        subscriberCount,
        dailyAvgViews,
        growthRate30d: deterministicGrowthRate(ch.id),
        algoScore,
        estimatedRevenue,
        category: "entertainment",
        country: ch.snippet.country || "KR",
      };
    });

    // Filter by minimum algoScore
    if (minScore > 0) {
      channels = channels.filter((ch) => ch.algoScore >= minScore);
    }

    // Sort by algoScore descending
    channels.sort((a, b) => b.algoScore - a.algoScore);

    const total = channels.length;
    const start = (page - 1) * limit;
    const paginated = channels.slice(start, start + limit);

    return NextResponse.json({
      data: paginated,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Algorithm score search error:", error);
    return NextResponse.json(
      { error: "YouTube API 호출에 실패했습니다", details: String(error) },
      { status: 500 }
    );
  }
}
