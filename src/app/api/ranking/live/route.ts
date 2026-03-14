import { NextRequest, NextResponse } from "next/server";
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
  category: string;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMockLiveStreams(count = 20): LiveStreamItem[] {
  const titles = [
    "[LIVE] 프로리그 결승전 생중계",
    "[LIVE] 인기 아이돌 온라인 콘서트",
    "[LIVE] 24시간 게임 마라톤 방송",
    "[LIVE] 실시간 뉴스 브리핑",
    "[LIVE] 먹방 라이브 - 대왕 치킨",
    "[LIVE] 음악 작업실 라이브",
    "[LIVE] 주식 시장 실시간 분석",
    "[LIVE] 코딩 라이브 - 웹 개발",
    "[LIVE] 여행 실시간 중계",
    "[LIVE] 스포츠 경기 실황",
    "[LIVE] 유튜브 라이브 토크쇼",
    "[LIVE] 게임 대회 생중계",
    "[LIVE] ASMR 라이브",
    "[LIVE] 실시간 그림 방송",
    "[LIVE] K-POP 랜덤 플레이 댄스",
    "[LIVE] 공부 같이해요 (스터디 윗미)",
    "[LIVE] 반려동물 실시간",
    "[LIVE] 요리 라이브 - 한식 특집",
    "[LIVE] 운동 라이브 - 홈트레이닝",
    "[LIVE] 라디오 스타일 토크",
  ];

  const channelNames = [
    "LCK 공식", "HYBE LABELS", "게임왕국", "YTN 뉴스", "먹방스타",
    "음악천재", "슈카월드", "코딩애플", "곽튜브", "KBS 스포츠",
    "침착맨", "e스포츠", "ASMR 맛집", "그림쟁이", "Mnet K-POP",
    "열공TV", "반려동물TV", "쿡방TV", "운동루틴", "라디오맨",
  ];

  const categories = [
    "gaming", "music", "gaming", "news", "food",
    "music", "education", "tech", "travel", "sports",
    "entertainment", "gaming", "entertainment", "entertainment", "music",
    "education", "pets", "food", "sports", "entertainment",
  ];

  return Array.from({ length: count }, (_, i) => ({
    rank: i + 1,
    videoId: `mock_live_${i}`,
    title: titles[i % titles.length],
    thumbnailUrl: `https://placehold.co/480x270/dc2626/white?text=${encodeURIComponent(`LIVE ${i + 1}`)}`,
    channelId: `UC_live_mock_${i}`,
    channelTitle: channelNames[i % channelNames.length],
    channelThumbnailUrl: `https://placehold.co/36x36/dc2626/white?text=${encodeURIComponent(channelNames[i % channelNames.length].charAt(0))}`,
    concurrentViewers: randomBetween(500, 200000),
    startedAt: new Date(Date.now() - randomBetween(0, 12) * 3600000).toISOString(),
    category: categories[i % categories.length],
  }))
    .sort((a, b) => b.concurrentViewers - a.concurrentViewers)
    .map((item, i) => ({ ...item, rank: i + 1 }));
}

const CACHE_TTL = 300; // 5 minutes for live data

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category") || "all";

  const cacheKey = `live-ranking:v1:${category}`;
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
            channelId: "",
            channelTitle: "",
            channelThumbnailUrl: "",
            concurrentViewers,
            startedAt: v.liveStreamingDetails?.actualStartTime || v.snippet.publishedAt,
            category: "entertainment",
          };
        });

        items = allItems
          .sort((a, b) => b.concurrentViewers - a.concurrentViewers)
          .map((item, i) => ({ ...item, rank: i + 1 }));

        await cache.set(cacheKey, items, CACHE_TTL);
      } catch {
        items = generateMockLiveStreams();
      }
    }
  } else {
    items = generateMockLiveStreams();
  }

  // Filter by category
  if (category !== "all") {
    items = items
      .filter((item) => item.category === category)
      .map((item, i) => ({ ...item, rank: i + 1 }));
  }

  return NextResponse.json({ data: items });
}
