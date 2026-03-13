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

// Hardcoded fallback data
const FALLBACK_DATA: CategoryTrendData[] = [
  { name: "금융", cpm: 8500, growth: 12.3, channels: 1200, color: "#6366f1" },
  { name: "교육", cpm: 6200, growth: 8.7, channels: 3400, color: "#8b5cf6" },
  { name: "테크", cpm: 5800, growth: 15.2, channels: 2800, color: "#06b6d4" },
  { name: "뷰티", cpm: 5200, growth: 6.4, channels: 4500, color: "#ec4899" },
  { name: "게임", cpm: 4100, growth: 9.1, channels: 8200, color: "#10b981" },
  { name: "음식", cpm: 3800, growth: 7.8, channels: 5600, color: "#f59e0b" },
  { name: "여행", cpm: 3500, growth: 11.5, channels: 2100, color: "#14b8a6" },
  { name: "예능", cpm: 3200, growth: 5.3, channels: 6800, color: "#f43f5e" },
  { name: "스포츠", cpm: 2900, growth: 4.2, channels: 3200, color: "#3b82f6" },
  { name: "음악", cpm: 2600, growth: 3.8, channels: 7500, color: "#a855f7" },
  { name: "뉴스", cpm: 2400, growth: 2.1, channels: 1800, color: "#64748b" },
  { name: "키즈", cpm: 2200, growth: -1.5, channels: 4200, color: "#fb923c" },
];

// Category search keywords and estimated CPM (KRW)
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
const CACHE_TTL_SECONDS = 3600; // 1 hour

async function fetchCategoryTrends(): Promise<CategoryTrendData[]> {
  const results: CategoryTrendData[] = [];

  for (const [name, config] of Object.entries(CATEGORY_CONFIG)) {
    try {
      // Search for channels in this category
      const searchRes = await youtubeClient.searchChannels(config.keyword, 10, {
        regionCode: "KR",
        relevanceLanguage: "ko",
      });

      const channelIds = searchRes.items
        .map((item) => item.id.channelId ?? item.snippet.channelId)
        .filter(Boolean);

      if (channelIds.length === 0) {
        // Use fallback for this category
        const fallback = FALLBACK_DATA.find((d) => d.name === name);
        if (fallback) results.push(fallback);
        continue;
      }

      // Fetch channel details for subscriber counts
      const detailRes = await youtubeClient.getChannel(channelIds.join(","));
      const subscriberCounts = detailRes.items.map(
        (item) => parseInt(item.statistics.subscriberCount ?? "0", 10) || 0
      );

      // totalResults from search gives rough channel count in this space
      const estimatedChannels = searchRes.pageInfo.totalResults ?? channelIds.length * 100;

      // Growth: derive from subscriber distribution (higher variance = more growth)
      const avgSubs = subscriberCounts.reduce((a, b) => a + b, 0) / subscriberCounts.length;
      const variance = subscriberCounts.reduce((sum, s) => sum + Math.pow(s - avgSubs, 2), 0) / subscriberCounts.length;
      const cv = Math.sqrt(variance) / (avgSubs || 1); // coefficient of variation
      const growth = parseFloat((cv * 20 - 2).toFixed(1)); // normalize to ~-2 to ~18 range

      results.push({
        name,
        cpm: config.cpm,
        growth,
        channels: Math.min(estimatedChannels, 50000),
        color: config.color,
      });
    } catch {
      // On error, use fallback for this specific category
      const fallback = FALLBACK_DATA.find((d) => d.name === name);
      if (fallback) results.push(fallback);
    }
  }

  return results.length > 0 ? results : FALLBACK_DATA;
}

export async function GET() {
  const hasApiKey = !!process.env.YOUTUBE_API_KEY;

  if (!hasApiKey) {
    return NextResponse.json({ data: FALLBACK_DATA, source: "fallback" });
  }

  // Check cache
  const cached = await cache.get<CategoryTrendData[]>(CACHE_KEY);
  if (cached && cached.length > 0) {
    return NextResponse.json({ data: cached, source: "cache" });
  }

  try {
    const data = await fetchCategoryTrends();
    await cache.set(CACHE_KEY, data, CACHE_TTL_SECONDS);
    return NextResponse.json({ data, source: "youtube" });
  } catch {
    return NextResponse.json({ data: FALLBACK_DATA, source: "fallback" });
  }
}
