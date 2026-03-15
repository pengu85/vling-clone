import { NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";
import { cache } from "@/lib/cache";

interface LiveStreamItem {
  rank: number;
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  channelThumbnailUrl: string;
  concurrentViewers: number;
  startedAt: string;
}

const CACHE_TTL = 300; // 5 minutes for live data

export async function GET() {
  const cacheKey = `live-ranking:v1`;
  let items: LiveStreamItem[];

  const hasApiKey = !!process.env.YOUTUBE_API_KEY;

  if (hasApiKey) {
    const cached = await cache.get<LiveStreamItem[]>(cacheKey);
    if (cached) {
      items = cached;
    } else {
      try {
        const searchRes = await youtubeClient.getLiveStreams("KR", 50);

        const videoIds = searchRes.items
          .map((item) => item.id.videoId)
          .filter((id): id is string => !!id);

        if (videoIds.length === 0) throw new Error("No live streams found");

        const detailRes = await youtubeClient.getVideoDetails(videoIds, true);

        const allItems: LiveStreamItem[] = detailRes.items.map((v, i) => {
          const concurrentViewers = parseInt(
            v.liveStreamingDetails?.concurrentViewers || v.statistics.viewCount || "0",
            10
          );

          return {
            rank: i + 1,
            videoId: v.id,
            title: v.snippet.title,
            thumbnailUrl: v.snippet.thumbnails?.high?.url || "",
            channelId: v.snippet.channelId || "",
            channelTitle: v.snippet.channelTitle || "",
            channelThumbnailUrl: "",
            concurrentViewers,
            startedAt: v.liveStreamingDetails?.actualStartTime || v.snippet.publishedAt,
          };
        });

        items = allItems
          .sort((a, b) => b.concurrentViewers - a.concurrentViewers)
          .map((item, i) => ({ ...item, rank: i + 1 }));

        await cache.set(cacheKey, items, CACHE_TTL);
      } catch {
        return NextResponse.json({ error: { code: "SERVICE_UNAVAILABLE", message: "YouTube API를 사용할 수 없습니다" } }, { status: 503 });
      }
    }
  } else {
    return NextResponse.json({ error: { code: "SERVICE_UNAVAILABLE", message: "YouTube API를 사용할 수 없습니다" } }, { status: 503 });
  }

  return NextResponse.json({ data: items });
}
