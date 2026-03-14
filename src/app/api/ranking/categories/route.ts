import { NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";
import { cache } from "@/lib/cache";

interface CategoryTrendData {
  name: string;
  cpm: number;
  growth: number;
  channels: number;
  color: string;
}

const CATEGORY_CONFIG: Record<string, { keyword: string; cpm: number; color: string }> = {
  "금융": { keyword: "금융 투자 유튜버", cpm: 8500, color: "#6366f1" },
  "교육": { keyword: "교육 강의 유튜버", cpm: 6200, color: "#8b5cf6" },
  "테크": { keyword: "IT 테크 리뷰 유튜버", cpm: 5800, color: "#06b6d4" },
  "뷰티": { keyword: "뷰티 화장 유튜버", cpm: 5200, color: "#ec4899" },
  "게임": { keyword: "게임 유튜버", cpm: 4100, color: "#10b981" },
  "음식": { keyword: "먹방 요리 유튜버", cpm: 3800, color: "#f59e0b" },
  "여행": { keyword: "여행 브이로그 유튜버", cpm: 3500, color: "#14b8a6" },
  "예능": { keyword: "예능 엔터테인먼트 유튜버", cpm: 3200, color: "#f43f5e" },
  "스포츠": { keyword: "스포츠 운동 유튜버", cpm: 2900, color: "#3b82f6" },
  "음악": { keyword: "음악 노래 유튜버", cpm: 2600, color: "#a855f7" },
  "뉴스": { keyword: "뉴스 시사 유튜버", cpm: 2400, color: "#64748b" },
  "키즈": { keyword: "키즈 어린이 유튜버", cpm: 2200, color: "#fb923c" },
};

const CACHE_KEY = "category-trends:v1";
const CACHE_TTL_SECONDS = 3600;

async function fetchCategoryTrends(): Promise<CategoryTrendData[]> {
  const results: CategoryTrendData[] = [];

  for (const [name, config] of Object.entries(CATEGORY_CONFIG)) {
    const searchRes = await youtubeClient.searchChannels(config.keyword, 10, {
      regionCode: "KR",
      relevanceLanguage: "ko",
    });

    const channelIds = searchRes.items
      .map((item) => item.id.channelId ?? item.snippet.channelId)
      .filter(Boolean);

    if (channelIds.length === 0) continue;

    const detailRes = await youtubeClient.getChannel(channelIds.join(","));
    const subscriberCounts = detailRes.items.map(
      (item) => parseInt(item.statistics.subscriberCount ?? "0", 10) || 0
    );

    const estimatedChannels = searchRes.pageInfo.totalResults ?? channelIds.length * 100;

    const avgSubs = subscriberCounts.reduce((a, b) => a + b, 0) / subscriberCounts.length;
    const variance = subscriberCounts.reduce((sum, s) => sum + Math.pow(s - avgSubs, 2), 0) / subscriberCounts.length;
    const cv = Math.sqrt(variance) / (avgSubs || 1);
    const growth = parseFloat((cv * 20 - 2).toFixed(1));

    results.push({
      name,
      cpm: config.cpm,
      growth,
      channels: Math.min(estimatedChannels, 50000),
      color: config.color,
    });
  }

  return results;
}

export async function GET() {
  if (!process.env.YOUTUBE_API_KEY) {
    return NextResponse.json(
      { error: { code: "SERVICE_UNAVAILABLE", message: "YouTube API를 사용할 수 없습니다" } },
      { status: 503 }
    );
  }

  const cached = await cache.get<CategoryTrendData[]>(CACHE_KEY);
  if (cached && cached.length > 0) {
    return NextResponse.json({ data: cached, source: "cache" });
  }

  try {
    const data = await fetchCategoryTrends();
    await cache.set(CACHE_KEY, data, CACHE_TTL_SECONDS);
    return NextResponse.json({ data, source: "youtube" });
  } catch {
    return NextResponse.json(
      { error: { code: "SERVICE_UNAVAILABLE", message: "YouTube API를 사용할 수 없습니다" } },
      { status: 503 }
    );
  }
}
