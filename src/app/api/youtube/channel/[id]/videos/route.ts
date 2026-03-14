import { NextRequest, NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";
import { calculateAlgoScore } from "@/domain/algoScore";
import type { Video } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Get channel subscriber count for accurate algo score
    const channelRes = await youtubeClient.getChannel(id);
    const channelSubCount = channelRes.items?.[0]
      ? parseInt(channelRes.items[0].statistics.subscriberCount) || 0
      : 0;

    // 1. Get recent videos from channel
    const searchResult = await youtubeClient.getChannelVideos(id, 12);

    if (!searchResult.items || searchResult.items.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 2. Get video details (views, likes, etc.)
    const videoIds = searchResult.items
      .map((item) => item.id.videoId)
      .filter(Boolean) as string[];

    if (videoIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const videoDetails = await youtubeClient.getVideoDetails(videoIds);

    // 3. Transform to Video format
    const videos: Video[] = videoDetails.items.map((vid) => {
      const viewCount = parseInt(vid.statistics.viewCount) || 0;
      const likeCount = parseInt(vid.statistics.likeCount) || 0;
      const commentCount = parseInt(vid.statistics.commentCount) || 0;
      const publishedAt = new Date(vid.snippet.publishedAt);
      const daysAgo = Math.floor(
        (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if it's a Short (duration <= 60s)
      const durationMatch = vid.contentDetails.duration.match(
        /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
      );
      const totalSeconds = durationMatch
        ? (parseInt(durationMatch[1] || "0") * 3600) +
          (parseInt(durationMatch[2] || "0") * 60) +
          parseInt(durationMatch[3] || "0")
        : 0;

      return {
        id: vid.id,
        youtubeId: vid.id,
        channelId: id,
        title: vid.snippet.title,
        description: vid.snippet.description,
        thumbnailUrl: vid.snippet.thumbnails.high.url,
        viewCount,
        likeCount,
        commentCount,
        duration: vid.contentDetails.duration,
        publishedAt,
        algoScore: calculateAlgoScore({
          viewCount,
          likeCount,
          commentCount,
          subscriberCount: channelSubCount,
          publishedDaysAgo: daysAgo,
          videoCount: 1,
        }),
        isShort: totalSeconds > 0 && totalSeconds <= 60,
        tags: vid.snippet.tags || [],
        updatedAt: new Date(),
      };
    });

    return NextResponse.json({ data: videos });
  } catch (error) {
    console.error("YouTube videos error:", error);
    return NextResponse.json(
      { error: "YouTube API 호출에 실패했습니다", details: String(error) },
      { status: 500 }
    );
  }
}
