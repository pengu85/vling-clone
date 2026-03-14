import { NextRequest, NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";
import { cache } from "@/lib/cache";
import { calculateAlgoScore } from "@/domain/algoScore";

interface VideoRankingItem {
  rank: number;
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  viewCount: number;
  likeCount: number;
  publishedAt: string;
  duration: string;
  isShort: boolean;
  algoScore: number;
}

const YOUTUBE_CATEGORY_MAP: Record<string, string> = {
  all: "",
  gaming: "20",
  music: "10",
  entertainment: "24",
  education: "27",
  sports: "17",
  news: "25",
  science: "28",
  howto: "26",
  film: "1",
  autos: "2",
  pets: "15",
  comedy: "23",
  kids: "24",
};

function parseDurationToSeconds(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

function isShortVideo(duration: string): boolean {
  return parseDurationToSeconds(duration) <= 60;
}

interface VideoDetailItem {
  id: string;
  snippet: {
    title: string;
    channelId: string;
    channelTitle: string;
    thumbnails: { high: { url: string } };
    publishedAt: string;
  };
  statistics: { viewCount: string; likeCount: string; commentCount: string };
  contentDetails: { duration: string };
}

function mapToRankingItems(videos: VideoDetailItem[]): VideoRankingItem[] {
  return videos.map((v, i) => {
    const viewCount = parseInt(v.statistics.viewCount || "0", 10);
    const likeCount = parseInt(v.statistics.likeCount || "0", 10);
    const commentCount = parseInt(v.statistics.commentCount || "0", 10);
    const daysAgo = Math.max(
      1,
      Math.floor((Date.now() - new Date(v.snippet.publishedAt).getTime()) / 86400000)
    );

    return {
      rank: i + 1,
      videoId: v.id,
      title: v.snippet.title,
      thumbnailUrl: v.snippet.thumbnails?.high?.url || "",
      channelId: v.snippet.channelId || "",
      channelTitle: v.snippet.channelTitle || "",
      viewCount,
      likeCount,
      publishedAt: v.snippet.publishedAt,
      duration: v.contentDetails.duration,
      isShort: isShortVideo(v.contentDetails.duration),
      algoScore: calculateAlgoScore({
        viewCount,
        likeCount,
        commentCount,
        subscriberCount: 0,
        publishedDaysAgo: daysAgo,
        videoCount: 0,
      }),
    };
  });
}

const CACHE_TTL = 3600;

const SHORTS_QUERIES: Record<string, string[]> = {
  all: ["인기 쇼츠", "shorts 한국 인기", "쇼츠 추천"],
  gaming: ["게임 쇼츠", "게임 shorts"],
  music: ["음악 쇼츠", "뮤직 shorts"],
  entertainment: ["예능 쇼츠", "웃긴 shorts"],
  education: ["교육 쇼츠", "공부 shorts"],
  sports: ["스포츠 쇼츠", "운동 shorts"],
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = (searchParams.get("type") || "longform") as "longform" | "shorts";
  const category = searchParams.get("category") || "all";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const cacheKey = `video-ranking:v2:${type}:${category}`;
  let items: VideoRankingItem[];

  const hasApiKey = !!process.env.YOUTUBE_API_KEY;

  if (!hasApiKey) {
    return NextResponse.json(
      { error: { code: "SERVICE_UNAVAILABLE", message: "YouTube API를 사용할 수 없습니다" } },
      { status: 503 }
    );
  }

  const cached = await cache.get<VideoRankingItem[]>(cacheKey);
  if (cached) {
    items = cached;
  } else {
    try {
      const categoryId = YOUTUBE_CATEGORY_MAP[category] || "";

      if (type === "shorts") {
        // Shorts are not in mostPopular chart — use keyword search instead
        const queries = SHORTS_QUERIES[category] || [`${category} 쇼츠`, `${category} shorts`];

        const videoIdSet = new Set<string>();
        for (const query of queries) {
          try {
            const searchRes = await youtubeClient.searchVideos(query, 50);
            for (const item of searchRes.items) {
              if (item.id.videoId) videoIdSet.add(item.id.videoId);
            }
          } catch { /* skip failed query */ }
        }

        if (videoIdSet.size === 0) {
          items = [];
        } else {
          const ids = [...videoIdSet].slice(0, 50);
          const details = await youtubeClient.getVideoDetails(ids);
          // Filter to actual shorts (≤60s)
          const shortsOnly = details.items.filter((v) =>
            isShortVideo(v.contentDetails.duration)
          );
          const mapped = mapToRankingItems(shortsOnly as unknown as VideoDetailItem[]);
          items = mapped
            .sort((a, b) => b.viewCount - a.viewCount)
            .map((item, i) => ({ ...item, rank: i + 1 }));
        }
      } else {
        // Longform: use mostPopular chart (accurate trending)
        const trendingRes = await youtubeClient.getTrendingVideos(
          "KR",
          categoryId || undefined,
          50
        );
        const longOnly = trendingRes.items.filter((v) =>
          !isShortVideo(v.contentDetails.duration)
        );
        const mapped = mapToRankingItems(longOnly as unknown as VideoDetailItem[]);
        items = mapped
          .sort((a, b) => b.viewCount - a.viewCount)
          .map((item, i) => ({ ...item, rank: i + 1 }));
      }

      // Only cache non-empty results
      if (items.length > 0) {
        await cache.set(cacheKey, items, CACHE_TTL);
      }
    } catch (err) {
      console.error("Video ranking API error:", err);
      // If quota exceeded or API error, return empty result instead of 503
      // so the UI can show "no data" state gracefully
      items = [];
    }
  }

  const total = items.length;
  const start = (page - 1) * limit;
  const paginated = items.slice(start, start + limit);

  return NextResponse.json({
    data: paginated,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
