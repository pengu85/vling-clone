import { NextRequest, NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";
import { estimateMonthlyRevenue } from "@/domain/revenueEstimate";
import { parseChannelInput } from "@/lib/parseChannel";

/* ---------- Types ---------- */

interface ChannelAnalysis {
  channel: {
    id: string;
    name: string;
    thumbnail: string;
    subscribers: number;
    totalViews: number;
    videoCount: number;
    country: string;
    category: string;
  };
  revenue: {
    dailyViews: number;
    monthlyRevenue: number;
    yearlyRevenue: number;
    cpm: number;
    revenueRange: { min: number; max: number };
  };
  additionalRevenue: {
    superChat: { estimated: number; applicable: boolean };
    brandedContent: { min: number; max: number; label: string };
  };
  similarChannels: Array<{
    id: string;
    name: string;
    thumbnail: string;
    subscribers: number;
    estimatedMonthlyRevenue: number;
  }>;
}

/* ---------- Helpers ---------- */

function estimateBrandedContentPrice(subscribers: number): {
  min: number;
  max: number;
  label: string;
} {
  if (subscribers >= 1_000_000) {
    return { min: 10_000_000, max: 50_000_000, label: "1000만원+" };
  }
  if (subscribers >= 100_000) {
    return { min: 2_000_000, max: 10_000_000, label: "200~1000만원" };
  }
  if (subscribers >= 10_000) {
    return { min: 500_000, max: 2_000_000, label: "50~200만원" };
  }
  return { min: 300_000, max: 500_000, label: "30~50만원" };
}

function detectCategory(titles: string[]): string {
  const categoryKeywords: Record<string, string[]> = {
    gaming: ["게임", "롤", "발로란트", "마크", "스팀", "플스", "닌텐도", "game"],
    music: ["음악", "노래", "커버", "뮤직", "music", "MV", "앨범"],
    education: ["강의", "공부", "교육", "학습", "수학", "영어", "설명"],
    tech: ["IT", "코딩", "개발", "프로그래밍", "리뷰", "스마트폰", "AI", "앱"],
    beauty: ["메이크업", "화장", "뷰티", "스킨", "피부", "화장품"],
    food: ["먹방", "요리", "레시피", "맛집", "음식", "카페"],
    entertainment: ["예능", "웃긴", "몰카", "브이로그", "일상"],
    kids: ["키즈", "장난감", "어린이", "만화"],
    sports: ["운동", "헬스", "축구", "야구", "농구"],
  };

  const scores: Record<string, number> = {};
  const joined = titles.join(" ").toLowerCase();

  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    scores[cat] = keywords.reduce(
      (sum, kw) => sum + (joined.includes(kw.toLowerCase()) ? 1 : 0),
      0
    );
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted[0][1] > 0 ? sorted[0][0] : "entertainment";
}

/* ---------- Route Handler ---------- */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const channelInput: string = body.channelInput?.trim();

    if (!channelInput) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "채널 URL, ID 또는 이름을 입력하세요" } },
        { status: 400 }
      );
    }

    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    if (!YOUTUBE_API_KEY) {
      return NextResponse.json({ error: { code: "API_KEY_REQUIRED", message: "YouTube API 키가 설정되지 않았습니다" } }, { status: 503 });
    }

    // 1. Resolve channel ID
    const parsed = parseChannelInput(channelInput);
    let resolvedId: string | null = null;

    if (parsed.type === "id") {
      resolvedId = parsed.value;
    } else {
      resolvedId = await youtubeClient.resolveHandle(parsed.value);
    }

    if (!resolvedId) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "채널을 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    // 2. Get channel info
    const channelInfo = await youtubeClient.getChannel(resolvedId);
    if (!channelInfo.items || channelInfo.items.length === 0) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "채널 정보를 가져올 수 없습니다" } },
        { status: 404 }
      );
    }

    const ch = channelInfo.items[0];
    const subscribers = parseInt(ch.statistics.subscriberCount) || 0;
    const totalViews = parseInt(ch.statistics.viewCount) || 0;
    const videoCount = parseInt(ch.statistics.videoCount) || 0;
    const country = ch.snippet.country || "KR";

    // 3. Get recent videos for daily views estimation & category detection
    const recentSearch = await youtubeClient.getChannelVideos(resolvedId, 20);
    const videoIds = recentSearch.items
      .map((v) => v.id.videoId)
      .filter((id): id is string => !!id);

    let dailyViews = Math.round(totalViews / Math.max(1, videoCount) / 30);
    let category = "entertainment";
    let hasLiveContent = false;

    if (videoIds.length > 0) {
      const videoDetails = await youtubeClient.getVideoDetails(videoIds, true);
      const vids = videoDetails.items;

      // Calculate average daily views from recent videos
      const totalRecentViews = vids.reduce(
        (sum, v) => sum + (parseInt(v.statistics.viewCount) || 0),
        0
      );
      const oldestDate = vids
        .map((v) => new Date(v.snippet.publishedAt).getTime())
        .reduce((min, d) => Math.min(min, d), Date.now());
      const daySpan = Math.max(1, (Date.now() - oldestDate) / 86400000);
      dailyViews = Math.round(totalRecentViews / daySpan);

      // Detect category from titles
      category = detectCategory(vids.map((v) => v.snippet.title));

      // Check live streaming
      hasLiveContent = vids.some((v) => !!v.liveStreamingDetails);
    }

    const monthlyRevenue = estimateMonthlyRevenue({
      dailyViews,
      country,
      category,
    });

    // 4. Super chat estimation
    const superChatEstimated = hasLiveContent
      ? Math.round(subscribers * 0.002 * 30)
      : 0;

    // 5. Similar channels
    const similarChannels: ChannelAnalysis["similarChannels"] = [];
    try {
      const searchQuery = ch.snippet.title;
      const searchResult = await youtubeClient.searchChannels(searchQuery, 10);
      const similarIds = searchResult.items
        .map((item) => item.id.channelId ?? item.snippet.channelId)
        .filter((id): id is string => !!id && id !== resolvedId)
        .slice(0, 5);

      if (similarIds.length > 0) {
        const simInfo = await youtubeClient.getChannel(similarIds.join(","));
        for (const sim of simInfo.items || []) {
          const simSubs = parseInt(sim.statistics.subscriberCount) || 0;
          const simTotalViews = parseInt(sim.statistics.viewCount) || 0;
          const simVideoCount = parseInt(sim.statistics.videoCount) || 1;
          const simDailyViews = Math.round(
            simTotalViews / simVideoCount / 30
          );
          similarChannels.push({
            id: sim.id,
            name: sim.snippet.title,
            thumbnail: sim.snippet.thumbnails.high.url,
            subscribers: simSubs,
            estimatedMonthlyRevenue: estimateMonthlyRevenue({
              dailyViews: simDailyViews,
              country: "KR",
              category,
            }),
          });
        }
      }
    } catch {
      // skip similar channels on error
    }

    const data: ChannelAnalysis = {
      channel: {
        id: resolvedId,
        name: ch.snippet.title,
        thumbnail: ch.snippet.thumbnails.high.url,
        subscribers,
        totalViews,
        videoCount,
        country,
        category,
      },
      revenue: {
        dailyViews,
        monthlyRevenue,
        yearlyRevenue: monthlyRevenue * 12,
        cpm: parseFloat(
          ((monthlyRevenue / (dailyViews * 30)) * 1000).toFixed(2)
        ),
        revenueRange: {
          min: Math.round(monthlyRevenue * 0.7),
          max: Math.round(monthlyRevenue * 1.3),
        },
      },
      additionalRevenue: {
        superChat: {
          estimated: superChatEstimated,
          applicable: hasLiveContent,
        },
        brandedContent: estimateBrandedContentPrice(subscribers),
      },
      similarChannels,
    };

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}
