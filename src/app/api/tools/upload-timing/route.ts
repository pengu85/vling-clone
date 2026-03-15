import { NextRequest, NextResponse } from "next/server";
import { youtubeClient, extractCategory } from "@/lib/youtube";
import { cache } from "@/lib/cache";

/* ---------- Constants ---------- */

const CATEGORY_BEST_TIMES: Record<string, { day: number; hour: number }[]> = {
  gaming: [{ day: 5, hour: 18 }, { day: 6, hour: 14 }, { day: 0, hour: 14 }],
  entertainment: [{ day: 2, hour: 18 }, { day: 4, hour: 18 }, { day: 6, hour: 12 }],
  education: [{ day: 1, hour: 9 }, { day: 3, hour: 9 }, { day: 2, hour: 18 }],
  music: [{ day: 5, hour: 18 }, { day: 4, hour: 12 }, { day: 6, hour: 15 }],
  food: [{ day: 3, hour: 11 }, { day: 6, hour: 11 }, { day: 0, hour: 17 }],
  beauty: [{ day: 2, hour: 19 }, { day: 5, hour: 19 }, { day: 6, hour: 14 }],
  tech: [{ day: 2, hour: 10 }, { day: 4, hour: 10 }, { day: 1, hour: 18 }],
  sports: [{ day: 1, hour: 18 }, { day: 3, hour: 20 }, { day: 6, hour: 10 }],
  default: [{ day: 2, hour: 18 }, { day: 4, hour: 18 }, { day: 6, hour: 14 }],
};

/* ---------- Types ---------- */

interface HeatmapCell {
  totalViews: number;
  totalLikes: number;
  videoCount: number;
}

interface HeatmapEntry {
  day: number;
  hour: number;
  avgViews: number;
  avgLikes: number;
  videoCount: number;
}

interface BestSlot {
  day: number;
  hour: number;
  avgViews: number;
  videoCount: number;
  improvement: number;
}

interface WorstSlot {
  day: number;
  hour: number;
  avgViews: number;
  videoCount: number;
}

interface UploadTimingResponse {
  channelId: string;
  channelTitle: string;
  analyzedVideos: number;
  heatmap: HeatmapEntry[];
  bestSlots: BestSlot[];
  worstSlots: WorstSlot[];
  uploadPattern: {
    totalVideos: number;
    avgPerWeek: number;
    mostActiveDay: number;
    mostActiveHour: number;
  };
  categoryRecommendation: {
    category: string;
    recommendedSlots: { day: number; hour: number }[];
  };
  overallAvgViews: number;
}

/* ---------- Helpers ---------- */

/** Convert a UTC date to KST (UTC+9) and extract day-of-week and hour. */
function toKST(dateStr: string): { dayOfWeek: number; hour: number } {
  const date = new Date(dateStr);
  // Offset to KST: add 9 hours in ms
  const kstMs = date.getTime() + 9 * 60 * 60 * 1000;
  const kst = new Date(kstMs);
  return {
    dayOfWeek: kst.getUTCDay(),   // 0=Sun ... 6=Sat
    hour: kst.getUTCHours(),       // 0-23
  };
}

/* ---------- API Route ---------- */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const channelId: string = body.channelId || "";

    if (!channelId || typeof channelId !== "string" || channelId.trim().length === 0) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "channelId는 필수 입력값입니다" } },
        { status: 400 }
      );
    }

    const trimmedId = channelId.trim();

    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    if (!YOUTUBE_API_KEY) {
      return NextResponse.json(
        { error: { code: "API_KEY_REQUIRED", message: "YouTube API 키가 설정되지 않았습니다" } },
        { status: 503 }
      );
    }

    // Check cache
    const cacheKey = `upload-timing:v1:${trimmedId}`;
    const cached = await cache.get<UploadTimingResponse>(cacheKey);
    if (cached) {
      return NextResponse.json({ data: cached });
    }

    // 1. Fetch channel info for title and category
    const channelInfo = await youtubeClient.getChannel(trimmedId);
    if (!channelInfo.items || channelInfo.items.length === 0) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "채널을 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    const ch = channelInfo.items[0];
    const channelTitle = ch.snippet.title;
    const category = extractCategory(ch.topicDetails?.topicCategories);

    // 2. Fetch recent 50 videos
    const recentSearch = await youtubeClient.getChannelVideos(trimmedId, 50);
    const videoIds = recentSearch.items
      .map((v) => v.id.videoId)
      .filter((id): id is string => !!id);

    if (videoIds.length === 0) {
      return NextResponse.json(
        { error: { code: "NO_DATA", message: "채널에 분석할 영상이 없습니다" } },
        { status: 404 }
      );
    }

    // YouTube API allows max 50 IDs per request, so we may need to batch
    const videoDetails = await youtubeClient.getVideoDetails(videoIds);
    const videos = videoDetails.items;
    const analyzedVideos = videos.length;

    // 3. Build 7x24 heatmap
    const heatmap: HeatmapCell[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => ({ totalViews: 0, totalLikes: 0, videoCount: 0 }))
    );

    let totalViewsAll = 0;

    for (const video of videos) {
      const { dayOfWeek, hour } = toKST(video.snippet.publishedAt);
      const views = parseInt(video.statistics.viewCount || "0");
      const likes = parseInt(video.statistics.likeCount || "0");

      heatmap[dayOfWeek][hour].totalViews += views;
      heatmap[dayOfWeek][hour].totalLikes += likes;
      heatmap[dayOfWeek][hour].videoCount += 1;
      totalViewsAll += views;
    }

    const overallAvgViews = analyzedVideos > 0 ? totalViewsAll / analyzedVideos : 0;

    // 4. Flatten heatmap to entries with averages
    const heatmapEntries: HeatmapEntry[] = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const cell = heatmap[day][hour];
        if (cell.videoCount > 0) {
          heatmapEntries.push({
            day,
            hour,
            avgViews: Math.round(cell.totalViews / cell.videoCount),
            avgLikes: Math.round(cell.totalLikes / cell.videoCount),
            videoCount: cell.videoCount,
          });
        }
      }
    }

    // 5. Find best and worst slots
    const minVideosForSignificance = analyzedVideos < 20 ? 1 : 2;

    const significantSlots = heatmapEntries.filter(
      (e) => e.videoCount >= minVideosForSignificance
    );

    // Sort by avgViews descending for best
    const sortedByViews = [...significantSlots].sort((a, b) => b.avgViews - a.avgViews);

    const bestSlots: BestSlot[] = sortedByViews.slice(0, 5).map((slot) => ({
      day: slot.day,
      hour: slot.hour,
      avgViews: slot.avgViews,
      videoCount: slot.videoCount,
      improvement: overallAvgViews > 0
        ? Math.round(((slot.avgViews - overallAvgViews) / overallAvgViews) * 100)
        : 0,
    }));

    // Worst: sort ascending
    const worstSlots: WorstSlot[] = [...significantSlots]
      .sort((a, b) => a.avgViews - b.avgViews)
      .slice(0, 3)
      .map((slot) => ({
        day: slot.day,
        hour: slot.hour,
        avgViews: slot.avgViews,
        videoCount: slot.videoCount,
      }));

    // 6. Upload pattern analysis
    const dayCount = new Array(7).fill(0);
    const hourCount = new Array(24).fill(0);

    for (const video of videos) {
      const { dayOfWeek, hour } = toKST(video.snippet.publishedAt);
      dayCount[dayOfWeek]++;
      hourCount[hour]++;
    }

    const mostActiveDay = dayCount.indexOf(Math.max(...dayCount));
    const mostActiveHour = hourCount.indexOf(Math.max(...hourCount));

    // Calculate avg videos per week based on date range
    let avgPerWeek = 0;
    if (videos.length >= 2) {
      const dates = videos.map((v) => new Date(v.snippet.publishedAt).getTime());
      const oldest = Math.min(...dates);
      const newest = Math.max(...dates);
      const spanWeeks = (newest - oldest) / (7 * 24 * 60 * 60 * 1000);
      avgPerWeek = spanWeeks > 0 ? Math.round((analyzedVideos / spanWeeks) * 10) / 10 : analyzedVideos;
    } else {
      avgPerWeek = analyzedVideos;
    }

    // 7. Category recommendation
    const recommendedSlots = CATEGORY_BEST_TIMES[category] || CATEGORY_BEST_TIMES.default;

    // Build response
    const response: UploadTimingResponse = {
      channelId: trimmedId,
      channelTitle,
      analyzedVideos,
      heatmap: heatmapEntries,
      bestSlots,
      worstSlots,
      uploadPattern: {
        totalVideos: analyzedVideos,
        avgPerWeek,
        mostActiveDay,
        mostActiveHour,
      },
      categoryRecommendation: {
        category,
        recommendedSlots,
      },
      overallAvgViews: Math.round(overallAvgViews),
    };

    // Cache for 2 hours
    await cache.set(cacheKey, response, 7200);

    return NextResponse.json({ data: response });
  } catch (err) {
    console.error("Upload Timing API error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "업로드 타이밍 분석 중 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}
