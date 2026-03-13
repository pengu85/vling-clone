import { NextRequest, NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";
import type { SearchChannelsOptions } from "@/lib/youtube";
import { calculateAlgoScore } from "@/domain/algoScore";
import { estimateMonthlyRevenue, estimateAdPrice } from "@/domain/revenueEstimate";
import type { ChannelSearchResult } from "@/types";

// Map UI sort values to YouTube API order parameter values.
// YouTube channel search supports: relevance, date, rating, viewCount, title
function mapSortToOrder(sort: string | null): SearchChannelsOptions["order"] {
  switch (sort) {
    case "subscriber":
    case "view":
      return "viewCount";
    case "growth":
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

    // 3. Transform to ChannelSearchResult format
    let channels: ChannelSearchResult[] = channelDetails.items.map((ch) => {
      const subscriberCount = parseInt(ch.statistics.subscriberCount) || 0;
      const viewCount = parseInt(ch.statistics.viewCount) || 0;
      const videoCount = parseInt(ch.statistics.videoCount) || 0;
      const dailyAvgViews = videoCount > 0
        ? Math.round(viewCount / Math.max(videoCount * 30, 1))
        : 0;

      const algoScore = calculateAlgoScore({
        viewCount,
        likeCount: Math.round(viewCount * 0.03),
        commentCount: Math.round(viewCount * 0.005),
        subscriberCount,
        publishedDaysAgo: 30,
        videoCount,
      });

      const estimatedRevenue = estimateMonthlyRevenue({
        dailyViews: dailyAvgViews,
        country: ch.snippet.country || "KR",
        category: "entertainment",
      });

      return {
        id: ch.id,
        youtubeId: ch.id,
        title: ch.snippet.title,
        thumbnailUrl: ch.snippet.thumbnails.high.url,
        subscriberCount,
        dailyAvgViews,
        growthRate30d: parseFloat((Math.random() * 5 - 1).toFixed(1)),
        algoScore,
        estimatedRevenue,
        category: "entertainment",
        country: ch.snippet.country || "KR",
      };
    });

    // 4. Client-side filtering for fields YouTube API doesn't filter natively

    // Subscriber range filter
    if (subscriberMin !== null) {
      channels = channels.filter((ch) => ch.subscriberCount >= subscriberMin);
    }
    if (subscriberMax !== null) {
      channels = channels.filter((ch) => ch.subscriberCount <= subscriberMax);
    }

    // Category filter (YouTube channel search has no category parameter)
    if (category) {
      channels = channels.filter(
        (ch) => ch.category?.toLowerCase() === category.toLowerCase()
      );
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
