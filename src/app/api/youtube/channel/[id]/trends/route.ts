import { NextRequest, NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";
import { cache } from "@/lib/cache";

interface ViewTrendPoint {
  date: string;
  value: number;
}

interface GrowthTrendPoint {
  date: string;
  rate: number;
}

interface TrendsResponse {
  viewTrend: ViewTrendPoint[];
  growthTrend: GrowthTrendPoint[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getPeriodKey(dateStr: string, granularity: "day" | "week"): string {
  const d = new Date(dateStr);
  if (granularity === "week") {
    // ISO week start (Monday)
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    return monday.toISOString().split("T")[0];
  }
  return d.toISOString().split("T")[0];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const period = Math.min(90, Math.max(30, parseInt(searchParams.get("period") ?? "30", 10)));

  const cacheKey = `channel-trends:${id}:${period}`;
  const cached = await cache.get<TrendsResponse>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    // Fetch recent videos - use more results to get better coverage
    const maxResults = period >= 60 ? 50 : 30;
    const searchRes = await youtubeClient.getChannelVideos(id, maxResults);

    if (!searchRes.items || searchRes.items.length === 0) {
      return NextResponse.json({ viewTrend: [], growthTrend: [] });
    }

    // Extract video IDs
    const videoIds = searchRes.items
      .map((item) => item.id.videoId)
      .filter((vid): vid is string => Boolean(vid));

    if (videoIds.length === 0) {
      return NextResponse.json({ viewTrend: [], growthTrend: [] });
    }

    // Fetch detailed stats for each video
    const detailsRes = await youtubeClient.getVideoDetails(videoIds);

    if (!detailsRes.items || detailsRes.items.length === 0) {
      return NextResponse.json({ viewTrend: [], growthTrend: [] });
    }

    // Filter to videos within the requested period
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period);

    const videos = detailsRes.items
      .filter((v) => new Date(v.snippet.publishedAt) >= cutoff)
      .map((v) => ({
        publishedAt: v.snippet.publishedAt,
        viewCount: parseInt(v.statistics.viewCount ?? "0", 10) || 0,
        likeCount: parseInt(v.statistics.likeCount ?? "0", 10) || 0,
        commentCount: parseInt(v.statistics.commentCount ?? "0", 10) || 0,
      }));

    // Decide granularity: weekly if period >= 60, daily otherwise
    const granularity: "day" | "week" = period >= 60 ? "week" : "day";

    // Group by period key and sum views
    const grouped = new Map<string, { total: number; count: number; rawDate: string }>();
    for (const v of videos) {
      const key = getPeriodKey(v.publishedAt, granularity);
      const existing = grouped.get(key);
      if (existing) {
        existing.total += v.viewCount;
        existing.count += 1;
      } else {
        grouped.set(key, { total: v.viewCount, count: 1, rawDate: v.publishedAt });
      }
    }

    // Sort by date ascending
    const sortedKeys = Array.from(grouped.keys()).sort();

    // Build viewTrend
    const viewTrend: ViewTrendPoint[] = sortedKeys.map((key) => {
      const entry = grouped.get(key)!;
      return {
        date: formatDate(key),
        value: entry.total,
      };
    });

    // Build growthTrend: percentage change in views vs previous period
    const growthTrend: GrowthTrendPoint[] = sortedKeys.map((key, i) => {
      const current = grouped.get(key)!.total;
      if (i === 0) {
        return { date: formatDate(key), rate: 0 };
      }
      const prevKey = sortedKeys[i - 1];
      const prev = grouped.get(prevKey)!.total;
      if (prev === 0) {
        return { date: formatDate(key), rate: 0 };
      }
      const rate = parseFloat((((current - prev) / prev) * 100).toFixed(2));
      return { date: formatDate(key), rate };
    });

    const result: TrendsResponse = { viewTrend, growthTrend };

    // Cache for 1 hour
    await cache.set(cacheKey, result, 3600);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Channel trends error:", error);
    return NextResponse.json(
      { error: "트렌드 데이터를 불러오는 데 실패했습니다", details: String(error) },
      { status: 500 }
    );
  }
}
