import { NextRequest, NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";
import { estimateMonthlyRevenue, estimateAdPrice } from "@/domain/revenueEstimate";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await youtubeClient.getChannel(id);

    if (!result.items || result.items.length === 0) {
      return NextResponse.json({ error: "채널을 찾을 수 없습니다" }, { status: 404 });
    }

    const ch = result.items[0];
    const subscriberCount = parseInt(ch.statistics.subscriberCount) || 0;
    const viewCount = parseInt(ch.statistics.viewCount) || 0;
    const videoCount = parseInt(ch.statistics.videoCount) || 0;
    const dailyAvgViews = videoCount > 0
      ? Math.round(viewCount / Math.max(videoCount * 30, 1))
      : 0;
    const country = ch.snippet.country || "KR";

    const engagementRate = subscriberCount > 0
      ? parseFloat(((dailyAvgViews / subscriberCount) * 100).toFixed(1))
      : 0;

    const estimatedAdPriceValue = estimateAdPrice(subscriberCount, engagementRate);
    const estimatedRevenue = estimateMonthlyRevenue({
      dailyViews: dailyAvgViews,
      country,
      category: "entertainment",
    });

    return NextResponse.json({
      data: {
        channelId: id,
        channelTitle: ch.snippet.title,
        estimatedAdPrice: estimatedAdPriceValue,
        estimatedCPM: dailyAvgViews > 0
          ? Math.round(estimatedAdPriceValue / (dailyAvgViews / 1000))
          : 0,
        estimatedReach: dailyAvgViews * 7,
        estimatedRevenue,
        priceRange: {
          min: Math.round(estimatedAdPriceValue * 0.7),
          max: Math.round(estimatedAdPriceValue * 1.3),
        },
      },
    });
  } catch (error) {
    console.error("YouTube ad-info error:", error);
    return NextResponse.json(
      { error: "YouTube API 호출에 실패했습니다" },
      { status: 500 }
    );
  }
}
