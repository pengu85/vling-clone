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

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMockTrending(count = 20): TrendingVideoItem[] {
  const titles = [
    "[MV] 최신 K-POP 뮤직비디오",
    "오늘의 뉴스 하이라이트",
    "프로리그 하이라이트 경기",
    "인기 예능 클립 모음",
    "핫이슈 토론 라이브",
    "신작 게임 리뷰",
    "스포츠 명장면 TOP 10",
    "연예계 핫뉴스",
    "맛집 탐방 브이로그",
    "신곡 라이브 무대",
    "드라마 명장면 리액션",
    "일상 브이로그",
    "댄스 커버 영상",
    "해외 축구 하이라이트",
    "최신 기술 리뷰",
    "코미디 스케치",
    "자동차 리뷰",
    "요리 레시피 공유",
    "여행 브이로그",
    "음악 커버 영상",
  ];

  const channels = [
    "HYBE LABELS", "SBS 뉴스", "LCK", "tvN", "JTBC",
    "게임돌", "KBS 스포츠", "디스패치", "쿡방TV", "Mnet K-POP",
    "SBS Drama", "소소일상", "1MILLION", "스포티비", "잇섭",
    "피식대학", "카리뷰", "백종원", "곽튜브", "Dingo Music",
  ];

  return Array.from({ length: count }, (_, i) => {
    const durationSec = randomBetween(60, 1800);
    const mins = Math.floor(durationSec / 60);
    const secs = durationSec % 60;

    return {
      videoId: `mock_trending_${i}`,
      title: titles[i % titles.length],
      thumbnailUrl: `https://placehold.co/480x270/4f46e5/white?text=${encodeURIComponent(`Trending ${i + 1}`)}`,
      channelId: `UC_trending_mock_${i}`,
      channelTitle: channels[i % channels.length],
      channelThumbnailUrl: `https://placehold.co/36x36/6366f1/white?text=${encodeURIComponent(channels[i % channels.length].charAt(0))}`,
      viewCount: randomBetween(100000, 50000000),
      publishedAt: new Date(Date.now() - randomBetween(0, 7) * 86400000).toISOString(),
      duration: `PT${mins}M${secs}S`,
    };
  });
}

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
            channelId: "",
            channelTitle: "",
            channelThumbnailUrl: "",
            viewCount: parseInt(v.statistics.viewCount || "0", 10),
            publishedAt: v.snippet.publishedAt,
            duration: formattedDuration,
          };
        });

        await cache.set(cacheKey, items, CACHE_TTL);
      } catch {
        items = generateMockTrending();
      }
    }
  } else {
    items = generateMockTrending();
  }

  return NextResponse.json({ data: items });
}
