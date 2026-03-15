import { NextRequest, NextResponse } from "next/server";
import { youtubeClient, extractCategory } from "@/lib/youtube";
import type { SearchChannelsOptions } from "@/lib/youtube";
import { calculateChannelAlgoScore, DEFAULT_AVG_LIKE_RATE, DEFAULT_AVG_COMMENT_RATE } from "@/domain/algoScore";
import { estimateMonthlyRevenue } from "@/domain/revenueEstimate";
import { calculateGrowthRate } from "@/domain/growthRate";
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

    // === Multi-strategy search for maximum results + relevance ===
    // Strategy 1: Channel search (direct channel match)
    // Strategy 2: Video search by relevance (extracts channels from popular related videos)
    // Strategy 3: Video search by viewCount (extracts channels from top-viewed videos)
    // All 3 run in parallel for speed.

    const videoSearchParams: Record<string, string> = {};
    if (country) videoSearchParams.regionCode = country.toUpperCase();

    const [channelSearch, videoSearchRelevance, videoSearchViews] = await Promise.allSettled([
      // Strategy 1: Direct channel search (2 pages)
      (async () => {
        const page1 = await youtubeClient.searchChannels(q, 50, apiOptions);
        const items = [...(page1.items ?? [])];
        if (page1.nextPageToken) {
          try {
            const page2 = await youtubeClient.searchChannels(q, 50, {
              ...apiOptions,
              pageToken: page1.nextPageToken,
            });
            if (page2.items) items.push(...page2.items);
          } catch { /* page 2 optional */ }
        }
        return items;
      })(),
      // Strategy 2: Video search by relevance → extract channelIds
      fetch(
        `https://www.googleapis.com/youtube/v3/search?${new URLSearchParams({
          part: "snippet",
          q,
          type: "video",
          order: "relevance",
          maxResults: "50",
          key: process.env.YOUTUBE_API_KEY || "",
          ...(country ? { regionCode: country.toUpperCase() } : {}),
        })}`,
        { next: { revalidate: 3600 } }
      ).then((r) => r.json()).then((r) => r.items ?? []).catch(() => []),
      // Strategy 3: Video search by viewCount → extract channelIds
      youtubeClient.searchVideos(q, 50).then((r) => r.items ?? []).catch(() => []),
    ]);

    // Collect unique channel IDs from all strategies
    const channelIdSet = new Set<string>();

    // From channel search
    const channelSearchItems = channelSearch.status === "fulfilled" ? channelSearch.value : [];
    for (const item of channelSearchItems) {
      const cid = item.id.channelId || item.snippet.channelId;
      if (cid) channelIdSet.add(cid);
    }

    // From video searches — extract the channel that uploaded each video
    const videoItems = [
      ...(videoSearchRelevance.status === "fulfilled" ? videoSearchRelevance.value : []),
      ...(videoSearchViews.status === "fulfilled" ? videoSearchViews.value : []),
    ];
    for (const item of videoItems) {
      if (item.snippet.channelId) channelIdSet.add(item.snippet.channelId);
    }

    if (channelIdSet.size === 0) {
      return NextResponse.json(
        { data: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } }
      );
    }

    const channelIds = Array.from(channelIdSet);

    const channelItems: Awaited<ReturnType<typeof youtubeClient.getChannel>>["items"] = [];
    for (let i = 0; i < channelIds.length; i += 50) {
      const batch = channelIds.slice(i, i + 50);
      try {
        const res = await youtubeClient.getChannel(batch.join(","));
        channelItems.push(...res.items);
      } catch { /* skip failed batch */ }
    }

    if (channelItems.length === 0) {
      return NextResponse.json(
        { data: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } }
      );
    }

    const channelDetails = { items: channelItems };

    // 3. Transform to ChannelSearchResult format
    // Note: Per-channel video fetching is intentionally omitted here to avoid
    // burning 2 API calls per channel (100+ calls for a 50-result search).
    // Engagement stats are estimated from channel-level totals.
    // The channel detail page fetches real video data when the user navigates there.
    let channels: ChannelSearchResult[] = channelDetails.items.map((ch) => {
      const subscriberCount = parseInt(ch.statistics.subscriberCount) || 0;
      const viewCount = parseInt(ch.statistics.viewCount) || 0;
      const videoCount = parseInt(ch.statistics.videoCount) || 0;

      const overallAvgViews = videoCount > 0 ? viewCount / videoCount : 0;

      const avgViewsPerVideo = overallAvgViews;
      const avgLikeRate = DEFAULT_AVG_LIKE_RATE;
      const avgCommentRate = DEFAULT_AVG_COMMENT_RATE;
      // Estimate recent activity: assume ~1 video per week on average, capped at 8
      const recentVideoCount = Math.min(Math.round(videoCount / 30), 8);

      const dailyAvgViews = Math.round(overallAvgViews / 30);

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

      // Growth rate: shared calculation based on total views, video count, and subscribers
      const growthRate30d = calculateGrowthRate(viewCount, videoCount, subscriberCount);

      // Estimated daily subscriber change from growth rate
      const subscriberChange = Math.round(subscriberCount * growthRate30d / 100 / 30);

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
        subscriberChange,
        category: channelCategory,
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

    // Daily views range filter
    if (minDailyViews !== null) {
      channels = channels.filter((ch) => ch.dailyAvgViews >= minDailyViews);
    }
    if (maxDailyViews !== null) {
      channels = channels.filter((ch) => ch.dailyAvgViews <= maxDailyViews);
    }

    // Shorts channel filter: not supported by YouTube API without per-channel video analysis
    // Filtering removed — was using fake character-code-based determination

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

    // Fetch latest video for each paginated channel (parallel, max ~20 calls)
    const videoPromises = paginatedChannels.map(async (ch) => {
      try {
        const vids = await youtubeClient.getChannelVideos(ch.id, 1);
        if (vids.items?.[0]) {
          ch.latestVideo = {
            title: vids.items[0].snippet.title,
            publishedAt: vids.items[0].snippet.publishedAt,
          };
        }
      } catch { /* skip - latestVideo is optional */ }
    });
    await Promise.all(videoPromises);

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
