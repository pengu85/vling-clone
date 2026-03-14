import { NextRequest, NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";
import { cache } from "@/lib/cache";

interface TrendingVideoItem {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  channelThumbnailUrl: string;
  viewCount: number;
  publishedAt: string;
  duration: string;
}

const TRENDING_CATEGORY_MAP: Record<string, string> = {
  all: "",
  music: "10",
  gaming: "20",
  entertainment: "24",
  news: "25",
  sports: "17",
};

const CACHE_TTL = 1800; // 30 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const regionCode = searchParams.get("region") || "KR";
  const category = searchParams.get("category") || "all";

  const cacheKey = `trending:v1:${regionCode}:${category}`;
  let items: TrendingVideoItem[];

  const hasApiKey = !!process.env.YOUTUBE_API_KEY;

  if (hasApiKey) {
    const cached = await cache.get<TrendingVideoItem[]>(cacheKey);
    if (cached) {
      items = cached;
    } else {
      try {
        const categoryId = TRENDING_CATEGORY_MAP[category];
        const res = await youtubeClient.getTrendingVideos(
          regionCode,
          categoryId || undefined,
          24
        );

        items = res.items.map((v) => {
          const durationMatch = v.contentDetails.duration.match(
            /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
          );
          const formattedDuration = v.contentDetails.duration;

          return {
            videoId: v.id,
            title: v.snippet.title,
            thumbnailUrl: v.snippet.thumbnails?.high?.url || "",
            channelId: v.snippet.channelId || "",
            channelTitle: v.snippet.channelTitle || "",
            channelThumbnailUrl: "",
            viewCount: parseInt(v.statistics.viewCount || "0", 10),
            publishedAt: v.snippet.publishedAt,
            duration: formattedDuration,
          };
        });

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
