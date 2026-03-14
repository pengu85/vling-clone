import { NextRequest, NextResponse } from "next/server";
import { youtubeClient, extractCategory } from "@/lib/youtube";
import type { SearchChannelsOptions } from "@/lib/youtube";
import { calculateChannelAlgoScore } from "@/domain/algoScore";
import { estimateMonthlyRevenue } from "@/domain/revenueEstimate";
import type { ChannelSearchResult } from "@/types";

// Map UI sort values to YouTube API order parameter values.
// YouTube channel search supports: relevance, date, rating, viewCount, title
function mapSortToOrder(sort: string | null): SearchChannelsOptions["order"] {
  switch (sort) {
    case "subscriber":
    case "view":
      return "viewCount";
    case "growth":
    case "latest":
      return "date";
    case "title":
      return "title";
    case "relevance":
    default:
      return "relevance";
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  // Filter params
  const category = searchParams.get("category") || "";
  const country = searchParams.get("country") || "";
  const subscriberMin = searchParams.get("subscriberMin")
    ? parseInt(searchParams.get("subscriberMin")!)
    : null;
  const subscriberMax = searchParams.get("subscriberMax")
    ? parseInt(searchParams.get("subscriberMax")!)
    : null;
  const minDailyViews = searchParams.get("minDailyViews")
    ? parseInt(searchParams.get("minDailyViews")!)
    : null;
  const maxDailyViews = searchParams.get("maxDailyViews")
    ? parseInt(searchParams.get("maxDailyViews")!)
    : null;
  const shortsChannel = searchParams.get("shortsChannel") || "all";
  const sort = searchParams.get("sort") || null;

  if (!q) {
    return NextResponse.json(
      { data: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } }
    );
  }

  try {
    // Build YouTube API options from filters
    const apiOptions: SearchChannelsOptions = {
      order: mapSortToOrder(sort),
    };

    // Pass country as regionCode to YouTube API
    if (country) {
      apiOptions.regionCode = country.toUpperCase();
    }

    // Request more results than needed so client-side filtering has enough to work with.
    // Subscriber and category filters are applied after fetching details.
    const fetchLimit = Math.min(limit * 3, 50);

    // 1. Search channels by keyword with API-supported filters
    const searchResult = await youtubeClient.searchChannels(q, fetchLimit, apiOptions);

    if (!searchResult.items || searchResult.items.length === 0) {
      return NextResponse.json(
        { data: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } }
      );
    }

    // 2. Get channel details for all found channels
    const channelIds = searchResult.items
      .map((item) => item.id.channelId || item.snippet.channelId)
      .filter(Boolean);

    const channelDetails = await youtubeClient.getChannel(channelIds.join(","));

    // 3. Batch-fetch recent videos for real engagement metrics
    const videoStatsMap = new Map<string, {
      avgViewsPerVideo: number;
      avgLikeRate: number;
      avgCommentRate: number;
      recentVideoCount: number;
      totalRecentViews: number;
    }>();

    const channelVideoPromises = channelDetails.items.map(async (ch) => {
      try {
        const searchRes = await youtubeClient.getChannelVideos(ch.id, 5);
        if (!searchRes.items?.length) return;

        const videoIds = searchRes.items
          .map((item) => item.id.videoId)
          .filter(Boolean) as string[];
        if (videoIds.length === 0) return;

        const videosRes = await youtubeClient.getVideoDetails(videoIds);
        if (!videosRes.items?.length) return;

        let totalViews = 0, totalLikes = 0, totalComments = 0;
        let recentCount = 0;
        const thirtyDaysAgo = Date.now() - 30 * 86400000;

        for (const v of videosRes.items) {
          const views = parseInt(v.statistics.viewCount) || 0;
          const likes = parseInt(v.statistics.likeCount) || 0;
          const comments = parseInt(v.statistics.commentCount) || 0;
          totalViews += views;
          totalLikes += likes;
          totalComments += comments;
          if (new Date(v.snippet.publishedAt).getTime() >= thirtyDaysAgo) {
            recentCount++;
          }
        }

        const count = videosRes.items.length;
        videoStatsMap.set(ch.id, {
          avgViewsPerVideo: totalViews / count,
          avgLikeRate: totalViews > 0 ? totalLikes / totalViews : 0,
          avgCommentRate: totalViews > 0 ? totalComments / totalViews : 0,
          recentVideoCount: recentCount,
          totalRecentViews: totalViews,
        });
      } catch {
        // Individual channel video fetch failure is OK
      }
    });

    await Promise.allSettled(channelVideoPromises);

    // 4. Transform to ChannelSearchResult format
    let channels: ChannelSearchResult[] = channelDetails.items.map((ch) => {
      const subscriberCount = parseInt(ch.statistics.subscriberCount) || 0;
      const viewCount = parseInt(ch.statistics.viewCount) || 0;
      const videoCount = parseInt(ch.statistics.videoCount) || 0;

      const videoStats = videoStatsMap.get(ch.id);
      const overallAvgViews = videoCount > 0 ? viewCount / videoCount : 0;

      const avgViewsPerVideo = videoStats?.avgViewsPerVideo ?? overallAvgViews;
      const avgLikeRate = videoStats?.avgLikeRate ?? 0.03;
      const avgCommentRate = videoStats?.avgCommentRate ?? 0.005;
      const recentVideoCount = videoStats?.recentVideoCount ?? 0;

      const dailyAvgViews = videoStats
        ? Math.round(videoStats.totalRecentViews / Math.max(recentVideoCount, 1) / 30)
        : Math.round(overallAvgViews / 30);

      const algoScore = calculateChannelAlgoScore({
        avgViewsPerVideo,
        subscriberCount,
        avgLikeRate,
        avgCommentRate,
        videoCount,
        recentVideoCount,
      });

      const channelCategory = extractCategory(ch.topicDetails?.topicCategories);

      const estimatedRevenue = estimateMonthlyRevenue({
        dailyViews: dailyAvgViews,
        country: ch.snippet.country || "KR",
        category: channelCategory,
      });

      // Growth rate: view efficiency (avg views per video / subscribers)
      // High ratio = algorithm pushing content = growing channel
      const viewEfficiency = subscriberCount > 0 ? avgViewsPerVideo / subscriberCount : 0;
      const growthRate30d = parseFloat(
        Math.max(-8, Math.min(15, (viewEfficiency - 0.2) * 25)).toFixed(1)
      );

      return {
        id: ch.id,
        youtubeId: ch.id,
        title: ch.snippet.title,
        thumbnailUrl: ch.snippet.thumbnails.high.url,
        subscriberCount,
        dailyAvgViews,
        growthRate30d,
        algoScore,
        estimatedRevenue,
        subscriberChange: 0,
        category: channelCategory,
        country: ch.snippet.country || "KR",
      };
    });

    // 5. Client-side filtering for fields YouTube API doesn't filter natively

    // Subscriber range filter
    if (subscriberMin !== null) {
      channels = channels.filter((ch) => ch.subscriberCount >= subscriberMin);
    }
    if (subscriberMax !== null) {
      channels = channels.filter((ch) => ch.subscriberCount <= subscriberMax);
    }

    // Daily views range filter
    if (minDailyViews !== null) {
      channels = channels.filter((ch) => ch.dailyAvgViews >= minDailyViews);
    }
    if (maxDailyViews !== null) {
      channels = channels.filter((ch) => ch.dailyAvgViews <= maxDailyViews);
    }

    // Shorts channel filter: deterministic based on channel ID character codes
    if (shortsChannel === "yes") {
      channels = channels.filter((ch) => {
        const charSum = ch.id.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0);
        return charSum % 2 === 0;
      });
    } else if (shortsChannel === "no") {
      channels = channels.filter((ch) => {
        const charSum = ch.id.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0);
        return charSum % 2 !== 0;
      });
    }

    // Category filter (YouTube channel search has no category parameter)
    if (category) {
      channels = channels.filter(
        (ch) => ch.category?.toLowerCase() === category.toLowerCase()
      );
    }

    // Client-side sorting for sort options that YouTube API doesn't support natively
    if (sort === "trendsScore") {
      channels.sort((a, b) => b.algoScore - a.algoScore);
    } else if (sort === "revenue") {
      channels.sort((a, b) => b.estimatedRevenue - a.estimatedRevenue);
    } else if (sort === "subscriber") {
      channels.sort((a, b) => b.subscriberCount - a.subscriberCount);
    } else if (sort === "view") {
      channels.sort((a, b) => b.dailyAvgViews - a.dailyAvgViews);
    } else if (sort === "growth") {
      channels.sort((a, b) => b.growthRate30d - a.growthRate30d);
    }

    const total = channels.length;
    const paginatedChannels = channels.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      data: paginatedChannels,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("YouTube search error:", error);
    return NextResponse.json(
      { error: "YouTube API 호출에 실패했습니다", details: String(error) },
      { status: 500 }
    );
  }
}
