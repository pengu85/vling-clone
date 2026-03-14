import { NextRequest, NextResponse } from "next/server";
import { youtubeClient, extractCategory } from "@/lib/youtube";
import { calculateChannelAlgoScore } from "@/domain/algoScore";
import { estimateMonthlyRevenue, estimateAdPrice } from "@/domain/revenueEstimate";
import type { Channel } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Get channel details from YouTube API
    const result = await youtubeClient.getChannel(id);

    if (!result.items || result.items.length === 0) {
      return NextResponse.json(
        { error: "채널을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const ch = result.items[0];
    const subscriberCount = parseInt(ch.statistics.subscriberCount) || 0;
    const viewCount = parseInt(ch.statistics.viewCount) || 0;
    const videoCount = parseInt(ch.statistics.videoCount) || 0;
    const dailyAvgViews = videoCount > 0
      ? Math.round(viewCount / Math.max(videoCount * 30, 1))
      : 0;

    // Fetch recent videos for real engagement data
    const searchRes = await youtubeClient.getChannelVideos(id, 10);
    let avgViewsPerVideo = 0;
    let avgLikeRate = 0.03;
    let avgCommentRate = 0.005;
    let recentVideoCount = 0;
    let realEngagementRate = 0;

    if (searchRes.items?.length) {
      const videoIds = searchRes.items
        .map((item) => item.id.videoId)
        .filter(Boolean) as string[];

      if (videoIds.length > 0) {
        const videosRes = await youtubeClient.getVideoDetails(videoIds);
        if (videosRes.items?.length) {
          let totalViews = 0, totalLikes = 0, totalComments = 0;
          const thirtyDaysAgo = Date.now() - 30 * 86400000;

          for (const v of videosRes.items) {
            const views = parseInt(v.statistics.viewCount) || 0;
            const likes = parseInt(v.statistics.likeCount) || 0;
            const comments = parseInt(v.statistics.commentCount) || 0;
            totalViews += views;
            totalLikes += likes;
            totalComments += comments;
            if (new Date(v.snippet.publishedAt).getTime() >= thirtyDaysAgo) {
              recentVideoCount++;
            }
          }

          const count = videosRes.items.length;
          avgViewsPerVideo = totalViews / count;
          avgLikeRate = totalViews > 0 ? totalLikes / totalViews : 0;
          avgCommentRate = totalViews > 0 ? totalComments / totalViews : 0;
          realEngagementRate = parseFloat(((avgLikeRate + avgCommentRate) * 100).toFixed(1));
        }
      }
    }

    const overallAvgViews = videoCount > 0 ? viewCount / videoCount : 0;
    if (avgViewsPerVideo === 0) avgViewsPerVideo = overallAvgViews;

    const algoScore = calculateChannelAlgoScore({
      avgViewsPerVideo,
      subscriberCount,
      avgLikeRate,
      avgCommentRate,
      videoCount,
      recentVideoCount,
    });

    const engagementRate = realEngagementRate || (subscriberCount > 0
      ? parseFloat(((dailyAvgViews / subscriberCount) * 100).toFixed(1))
      : 0);

    const category = extractCategory(ch.topicDetails?.topicCategories);

    // Growth rate: view efficiency (avg views per video / subscribers)
    const viewEfficiency = subscriberCount > 0 ? avgViewsPerVideo / subscriberCount : 0;
    const growthRate30d = parseFloat(
      Math.max(-8, Math.min(15, (viewEfficiency - 0.2) * 25)).toFixed(1)
    );

    const estimatedRevenue = estimateMonthlyRevenue({
      dailyViews: dailyAvgViews,
      country: ch.snippet.country || "KR",
      category,
    });

    // Audience estimation based on channel's country and category
    const channelCountry = ch.snippet.country || "KR";
    const audienceMaleRatio = category === "beauty" ? 25
      : category === "gaming" ? 72
      : category === "tech" ? 68
      : category === "sports" ? 65
      : category === "food" ? 40
      : category === "kids" ? 50
      : category === "health" ? 42
      : 52;

    const audienceAgeDistribution = category === "gaming"
      ? { "13-17": 18, "18-24": 35, "25-34": 28, "35-44": 12, "45-54": 5, "55+": 2 }
      : category === "kids"
      ? { "13-17": 40, "18-24": 15, "25-34": 25, "35-44": 15, "45-54": 3, "55+": 2 }
      : category === "tech"
      ? { "13-17": 5, "18-24": 25, "25-34": 38, "35-44": 20, "45-54": 8, "55+": 4 }
      : category === "beauty"
      ? { "13-17": 15, "18-24": 35, "25-34": 30, "35-44": 12, "45-54": 5, "55+": 3 }
      : category === "education"
      ? { "13-17": 12, "18-24": 30, "25-34": 28, "35-44": 18, "45-54": 8, "55+": 4 }
      : { "13-17": 8, "18-24": 25, "25-34": 32, "35-44": 20, "45-54": 10, "55+": 5 };

    // Top countries: use real country as primary, vary secondary based on language
    const secondaryCountries = channelCountry === "KR"
      ? [{ country: "US", ratio: 8 }, { country: "JP", ratio: 5 }]
      : channelCountry === "US"
      ? [{ country: "GB", ratio: 10 }, { country: "CA", ratio: 8 }]
      : channelCountry === "JP"
      ? [{ country: "KR", ratio: 6 }, { country: "US", ratio: 5 }]
      : [{ country: "US", ratio: 10 }, { country: "KR", ratio: 5 }];

    const audienceTopCountries = [
      { country: channelCountry, ratio: channelCountry === "US" ? 65 : 72 },
      ...secondaryCountries,
    ];

    const channel: Channel = {
      id: ch.id,
      youtubeId: ch.id,
      title: ch.snippet.title,
      description: ch.snippet.description,
      thumbnailUrl: ch.snippet.thumbnails.high.url,
      bannerUrl: ch.brandingSettings?.image?.bannerExternalUrl || null,
      subscriberCount,
      viewCount,
      videoCount,
      category,
      country: ch.snippet.country || "KR",
      language: ch.snippet.defaultLanguage || "ko",
      growthRate30d,
      dailyAvgViews,
      algoScore,
      engagementRate,
      estimatedRevenue,
      estimatedAdPrice: estimateAdPrice(subscriberCount, engagementRate),
      audienceMaleRatio,
      audienceAgeDistribution,
      audienceTopCountries,
      tags: [ch.snippet.title],
      updatedAt: new Date(),
    };

    return NextResponse.json({ data: channel });
  } catch (error) {
    console.error("YouTube channel error:", error);
    return NextResponse.json(
      { error: "YouTube API 호출에 실패했습니다", details: String(error) },
      { status: 500 }
    );
  }
}
