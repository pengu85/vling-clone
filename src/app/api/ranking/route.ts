import { NextRequest, NextResponse } from "next/server";
import { generateMockRankings } from "@/lib/mockData";
import { youtubeClient } from "@/lib/youtube";
import { cache } from "@/lib/cache";
import { calculateAlgoScore } from "@/domain/algoScore";
import { estimateMonthlyRevenue } from "@/domain/revenueEstimate";
import type { ChannelSearchResult } from "@/types";
import type { ChannelRanking } from "@/types/ranking";

const CACHE_TTL_SECONDS = 3600; // 1 hour

// Search terms per category to seed YouTube API results
const CATEGORY_SEARCH_TERMS: Record<string, string[]> = {
  all: ["인기 유튜버 한국", "한국 유명 유튜버"],
  gaming: ["게임 유튜버", "게임 방송"],
  music: ["음악 유튜버", "뮤직 채널"],
  entertainment: ["예능 유튜버", "엔터테인먼트 채널"],
  education: ["교육 유튜버", "강의 채널"],
  sports: ["스포츠 유튜버", "운동 채널"],
  beauty: ["뷰티 유튜버", "화장 채널"],
  food: ["먹방 유튜버", "요리 채널"],
  travel: ["여행 유튜버", "브이로그"],
  tech: ["IT 유튜버", "테크 리뷰 채널"],
  news: ["뉴스 유튜버", "시사 채널"],
  pets: ["동물 유튜버", "반려동물 채널"],
  comedy: ["코미디 유튜버", "웃긴 채널"],
  autos: ["자동차 유튜버", "카리뷰 채널"],
  film: ["영화 리뷰 유튜버", "애니 채널"],
  howto: ["라이프스타일 유튜버", "DIY 채널"],
  science: ["과학 유튜버", "과학기술 채널"],
  kids: ["키즈 유튜버", "어린이 채널"],
};

// Heuristic: map channel title/description keywords to our category labels
function guessCategory(title: string, description: string): string {
  const text = (title + " " + description).toLowerCase();
  if (/게임|gaming|gamer|롤|lol|배그|배틀그라운드|마인크래프트/.test(text)) return "gaming";
  if (/음악|music|노래|뮤직|kpop|k-pop|cover/.test(text)) return "music";
  if (/예능|entertainment|웃음|버라이어티/.test(text)) return "entertainment";
  if (/교육|education|강의|공부|학습|수학|영어/.test(text)) return "education";
  if (/스포츠|sports|운동|헬스|축구|야구|농구/.test(text)) return "sports";
  if (/뷰티|beauty|화장|메이크업|makeup|skincare/.test(text)) return "beauty";
  if (/먹방|음식|요리|food|cooking|레시피/.test(text)) return "food";
  if (/여행|travel|브이로그|vlog|해외|관광/.test(text)) return "travel";
  if (/it|테크|tech|기술|리뷰|review|전자|gadget/.test(text)) return "tech";
  if (/뉴스|news|정치|시사|시청/.test(text)) return "news";
  if (/동물|반려|강아지|고양이|pet|animal/.test(text)) return "pets";
  if (/코미디|comedy|개그|웃긴/.test(text)) return "comedy";
  if (/자동차|car|automotive|드라이브|차/.test(text)) return "autos";
  if (/영화|film|애니|animation|드라마/.test(text)) return "film";
  if (/키즈|kids|어린이|child/.test(text)) return "kids";
  if (/과학|science|물리|화학|우주/.test(text)) return "science";
  return "entertainment";
}

type RankingEntry = ChannelRanking & { channel: ChannelSearchResult };

async function fetchRealRankings(category: string): Promise<RankingEntry[]> {
  const terms = CATEGORY_SEARCH_TERMS[category] ?? CATEGORY_SEARCH_TERMS.all;

  // Collect unique channel IDs from search results
  const channelIdSet = new Set<string>();
  for (const term of terms) {
    try {
      const searchRes = await youtubeClient.searchChannels(term, 25, {
        regionCode: "KR",
        relevanceLanguage: "ko",
        order: "relevance",
      });
      for (const item of searchRes.items) {
        const cid = item.id.channelId ?? item.snippet.channelId;
        if (cid) channelIdSet.add(cid);
      }
    } catch {
      // Skip failed search terms, continue with whatever we have
    }
  }

  if (channelIdSet.size === 0) {
    throw new Error("No channels found from YouTube search");
  }

  // Fetch channel details in batches of 50 (API limit)
  const channelIds = Array.from(channelIdSet);
  const batchSize = 50;
  const channelItems: Array<{
    id: string;
    snippet: { title: string; description: string; thumbnails: { high: { url: string } }; country?: string };
    statistics: { subscriberCount: string; viewCount: string; videoCount: string };
  }> = [];

  for (let i = 0; i < channelIds.length; i += batchSize) {
    const batch = channelIds.slice(i, i + batchSize);
    try {
      const detailRes = await youtubeClient.getChannel(batch.join(","));
      channelItems.push(...detailRes.items);
    } catch {
      // Skip failed batches
    }
  }

  if (channelItems.length === 0) {
    throw new Error("Failed to fetch channel details from YouTube");
  }

  // Map YouTube API data to ChannelSearchResult
  const now = Date.now();
  const channels: ChannelSearchResult[] = channelItems.map((item) => {
    const subscriberCount = parseInt(item.statistics.subscriberCount ?? "0", 10) || 0;
    const totalViewCount = parseInt(item.statistics.viewCount ?? "0", 10) || 0;
    const videoCount = parseInt(item.statistics.videoCount ?? "0", 10) || 1;
    const country = item.snippet.country ?? "KR";
    const category = guessCategory(item.snippet.title, item.snippet.description);

    // Estimate daily average views: total views / max(videoCount * 7, 30) days
    const estimatedDays = Math.max(videoCount * 7, 30);
    const dailyAvgViews = Math.round(totalViewCount / estimatedDays);

    // AlgoScore requires video-level data we don't have here; use channel-level proxy
    const publishedDaysAgo = 180; // conservative estimate
    const algoScore = calculateAlgoScore({
      viewCount: dailyAvgViews * 7,
      likeCount: Math.round(dailyAvgViews * 0.04),
      commentCount: Math.round(dailyAvgViews * 0.005),
      subscriberCount,
      publishedDaysAgo,
      videoCount,
    });

    const estimatedRevenue = estimateMonthlyRevenue({ dailyViews: dailyAvgViews, country, category });

    // Growth rate: not available from basic API, use a small random proxy
    // Seeded by subscriber count so it's deterministic per channel
    const growthSeed = (subscriberCount % 100) / 100;
    const growthRate30d = parseFloat(((growthSeed * 12) - 2).toFixed(1));

    return {
      id: item.id,
      youtubeId: item.id,
      title: item.snippet.title,
      thumbnailUrl: item.snippet.thumbnails?.high?.url ?? "",
      subscriberCount,
      dailyAvgViews,
      growthRate30d,
      algoScore,
      estimatedRevenue,
      category,
      country,
    };
  });

  // Remove duplicates by youtubeId
  const seen = new Set<string>();
  const unique = channels.filter((ch) => {
    if (seen.has(ch.youtubeId)) return false;
    seen.add(ch.youtubeId);
    return true;
  });

  // Build ranking entries (sort happens in GET handler after cache retrieval)
  const today = new Date(now).toISOString().split("T")[0];
  const entries: RankingEntry[] = unique.map((ch, i) => ({
    id: `rank_real_${ch.youtubeId}_${i}`,
    channelId: ch.youtubeId,
    rankType: "subscriber" as ChannelRanking["rankType"],
    category,
    rank: i + 1,
    score: ch.subscriberCount,
    date: today,
    channel: ch,
  }));

  return entries;
}

function sortAndRank(entries: RankingEntry[], type: string): RankingEntry[] {
  const sorted = [...entries].sort((a, b) => {
    switch (type) {
      case "subscriber": return b.channel.subscriberCount - a.channel.subscriberCount;
      case "view": return b.channel.dailyAvgViews - a.channel.dailyAvgViews;
      case "growth": return b.channel.growthRate30d - a.channel.growthRate30d;
      case "revenue": return b.channel.estimatedRevenue - a.channel.estimatedRevenue;
      case "superchat": {
        // Estimate superchat revenue as ~15% of total revenue, weighted by engagement
        const aSuperchat = a.channel.estimatedRevenue * 0.15 * (1 + a.channel.growthRate30d / 100);
        const bSuperchat = b.channel.estimatedRevenue * 0.15 * (1 + b.channel.growthRate30d / 100);
        return bSuperchat - aSuperchat;
      }
      default: return b.channel.subscriberCount - a.channel.subscriberCount;
    }
  });

  const today = new Date().toISOString().split("T")[0];
  return sorted.map((entry, i) => ({
    ...entry,
    id: `rank_${type}_${entry.channel.youtubeId}_${i + 1}`,
    rankType: type as ChannelRanking["rankType"],
    rank: i + 1,
    score:
      type === "subscriber" ? entry.channel.subscriberCount
      : type === "view" ? entry.channel.dailyAvgViews
      : type === "growth" ? entry.channel.growthRate30d
      : type === "revenue" ? entry.channel.estimatedRevenue
      : type === "superchat" ? Math.round(entry.channel.estimatedRevenue * 0.15 * (1 + entry.channel.growthRate30d / 100))
      : entry.channel.estimatedRevenue,
    date: today,
  }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type") || "subscriber";
  const category = searchParams.get("category") || "all";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  let rankings: RankingEntry[];

  // Check if YouTube API key is present
  const hasApiKey = !!process.env.YOUTUBE_API_KEY;

  if (hasApiKey) {
    // Cache key is per category (type-agnostic; we re-sort from cached data)
    const cacheKey = `ranking:v1:${category}`;
    let cached = await cache.get<RankingEntry[]>(cacheKey);

    if (!cached) {
      try {
        cached = await fetchRealRankings(category);
        // cache.set uses seconds for TTL
        await cache.set(cacheKey, cached, CACHE_TTL_SECONDS);
      } catch {
        // Fall back to mock data on any YouTube API error
        cached = null;
      }
    }

    if (cached && cached.length > 0) {
      rankings = sortAndRank(cached, type);
    } else {
      // Fallback: mock data
      rankings = generateMockRankings(type, 100);
      if (category !== "all") {
        rankings = rankings.filter((r) => r.channel.category === category);
      }
    }
  } else {
    // No API key — use mock data
    rankings = generateMockRankings(type, 100);
    if (category !== "all") {
      rankings = rankings.filter((r) => r.channel.category === category);
    }
  }

  const total = rankings.length;
  const start = (page - 1) * limit;
  const paginated = rankings.slice(start, start + limit);

  return NextResponse.json({
    data: paginated,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
