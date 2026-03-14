import { NextRequest, NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";
import { calculateChannelAlgoScore } from "@/domain/algoScore";

export async function GET(request: NextRequest) {
  const channelIds =
    request.nextUrl.searchParams
      .get("channelIds")
      ?.split(",")
      .filter(Boolean) || [];

  if (channelIds.length === 0) {
    return NextResponse.json({ error: "channelIds required" }, { status: 400 });
  }

  const ids = channelIds.slice(0, 20);

  try {
    const result = await youtubeClient.getChannel(ids.join(","));

    const stats: Record<
      string,
      {
        channelId: string;
        subscribers: number;
        subscriberDelta: number;
        dailyViews: number;
        viewsDelta: number;
        algoScore: number;
        algoDelta: number;
        growthRate: number;
        updatedAt: string;
      }
    > = {};

    for (const ch of result.items || []) {
      const subscriberCount = parseInt(ch.statistics.subscriberCount) || 0;
      const viewCount = parseInt(ch.statistics.viewCount) || 0;
      const videoCount = parseInt(ch.statistics.videoCount) || 0;
      const dailyAvgViews =
        videoCount > 0
          ? Math.round(viewCount / Math.max(videoCount * 30, 1))
          : 0;

      const algoScore = calculateChannelAlgoScore({
        avgViewsPerVideo: videoCount > 0 ? viewCount / videoCount : 0,
        subscriberCount,
        avgLikeRate: 0.03,
        avgCommentRate: 0.005,
        videoCount,
        recentVideoCount: 0,
      });

      stats[ch.id] = {
        channelId: ch.id,
        subscribers: subscriberCount,
        subscriberDelta: 0,
        dailyViews: dailyAvgViews,
        viewsDelta: 0,
        algoScore,
        algoDelta: 0,
        growthRate: 0,
        updatedAt: new Date().toISOString(),
      };
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Monitor stats error:", error);
    return NextResponse.json({}, { status: 500 });
  }
}
