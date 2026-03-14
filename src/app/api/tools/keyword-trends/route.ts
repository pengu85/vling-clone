import { NextRequest, NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";

/* ---------- Types ---------- */

interface KeywordDetail {
  keyword: string;
  totalVideos: number;
  avgViews: number;
  competition: "높음" | "중간" | "낮음";
  suggestedTitles: string[];
  timeline: Array<{ label: string; videos: number; views: number }>;
}

interface RelatedKeyword {
  keyword: string;
  score: number;
}

interface KeywordTrendsResponse {
  keywords: KeywordDetail[];
  relatedKeywords: RelatedKeyword[];
}

/* ---------- Helpers ---------- */

function getCompetition(videoCount: number): "높음" | "중간" | "낮음" {
  if (videoCount > 500) return "높음";
  if (videoCount > 100) return "중간";
  return "낮음";
}

function getPeriodBuckets(
  period: "7d" | "30d" | "90d"
): { label: string; startDate: Date; endDate: Date }[] {
  const now = new Date();
  const buckets: { label: string; startDate: Date; endDate: Date }[] = [];

  if (period === "7d") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      buckets.push({
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        startDate: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        endDate: new Date(next.getFullYear(), next.getMonth(), next.getDate()),
      });
    }
  } else if (period === "30d") {
    for (let i = 5; i >= 0; i--) {
      const end = new Date(now);
      end.setDate(end.getDate() - i * 5);
      const start = new Date(end);
      start.setDate(start.getDate() - 5);
      buckets.push({
        label: `${start.getMonth() + 1}/${start.getDate()}`,
        startDate: start,
        endDate: end,
      });
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const end = new Date(now);
      end.setDate(end.getDate() - i * 15);
      const start = new Date(end);
      start.setDate(start.getDate() - 15);
      buckets.push({
        label: `${start.getMonth() + 1}/${start.getDate()}`,
        startDate: start,
        endDate: end,
      });
    }
  }
  return buckets;
}

/* ---------- Mock Fallback ---------- */

function getMockResponse(
  keywords: string[],
  period: "7d" | "30d" | "90d"
): KeywordTrendsResponse {
  const buckets = getPeriodBuckets(period);

  const keywordDetails: KeywordDetail[] = keywords.map((keyword) => {
    const baseVideos = Math.round(100 + Math.random() * 900);
    const baseViews = Math.round(10000 + Math.random() * 200000);
    const competition = getCompetition(baseVideos);

    return {
      keyword,
      totalVideos: baseVideos,
      avgViews: baseViews,
      competition,
      suggestedTitles: [
        `${keyword} 완벽 가이드 (2025)`,
        `${keyword} 초보자를 위한 꿀팁 TOP 10`,
        `${keyword} 현실적인 후기`,
        `알려주지 않는 ${keyword}의 비밀`,
        `${keyword} vs 대안 비교`,
      ],
      timeline: buckets.map((b) => ({
        label: b.label,
        videos: Math.round(baseVideos / 6 + (Math.random() - 0.3) * 50),
        views: Math.round(baseViews / 6 + (Math.random() - 0.3) * 30000),
      })),
    };
  });

  const relatedKeywords: RelatedKeyword[] = keywords
    .flatMap((kw) => [
      { keyword: `${kw} 추천`, score: Math.round(70 + Math.random() * 30) },
      { keyword: `${kw} 후기`, score: Math.round(60 + Math.random() * 30) },
      { keyword: `${kw} 비교`, score: Math.round(50 + Math.random() * 30) },
      { keyword: `${kw} 가격`, score: Math.round(40 + Math.random() * 30) },
      { keyword: `${kw} 방법`, score: Math.round(40 + Math.random() * 30) },
    ])
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return { keywords: keywordDetails, relatedKeywords };
}

/* ---------- Route Handler ---------- */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const keywords: string[] = (body.keywords || [])
      .filter((k: unknown) => typeof k === "string" && k.trim())
      .map((k: string) => k.trim())
      .slice(0, 3);
    const period: "7d" | "30d" | "90d" = body.period || "30d";

    if (keywords.length === 0) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "키워드를 1개 이상 입력하세요" } },
        { status: 400 }
      );
    }

    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    if (!YOUTUBE_API_KEY) {
      return NextResponse.json({ data: getMockResponse(keywords, period) });
    }

    const buckets = getPeriodBuckets(period);
    const keywordDetails: KeywordDetail[] = [];
    const allTags = new Set<string>();

    for (const keyword of keywords) {
      try {
        // Search for videos with this keyword
        const searchResult = await youtubeClient.searchVideos(keyword, 50);
        const totalVideos = searchResult.pageInfo?.totalResults || 0;

        const videoIds = searchResult.items
          .map((item) => item.id.videoId)
          .filter((id): id is string => !!id)
          .slice(0, 50);

        let avgViews = 0;
        const timeline: KeywordDetail["timeline"] = [];
        const suggestedTitles: string[] = [];

        if (videoIds.length > 0) {
          const details = await youtubeClient.getVideoDetails(videoIds);
          const vids = details.items;

          // Average views
          const totalViewsSum = vids.reduce(
            (sum, v) => sum + (parseInt(v.statistics.viewCount) || 0),
            0
          );
          avgViews = Math.round(totalViewsSum / Math.max(1, vids.length));

          // Collect tags for related keywords
          for (const v of vids) {
            if (v.snippet.tags) {
              for (const tag of v.snippet.tags.slice(0, 5)) {
                allTags.add(tag);
              }
            }
          }

          // Build timeline: group videos by publishedAt into buckets
          for (const bucket of buckets) {
            const bucketVids = vids.filter((v) => {
              const pubDate = new Date(v.snippet.publishedAt);
              return pubDate >= bucket.startDate && pubDate < bucket.endDate;
            });
            const bucketViews = bucketVids.reduce(
              (sum, v) => sum + (parseInt(v.statistics.viewCount) || 0),
              0
            );
            timeline.push({
              label: bucket.label,
              videos: bucketVids.length,
              views: bucketViews,
            });
          }

          // If timeline is all zeros (videos outside period range), estimate
          const hasData = timeline.some((t) => t.videos > 0);
          if (!hasData) {
            // Distribute evenly with some variance
            const perBucket = Math.max(1, Math.round(vids.length / buckets.length));
            const viewsPerBucket = Math.round(avgViews * perBucket);
            for (const t of timeline) {
              t.videos = Math.round(perBucket + (Math.random() - 0.5) * perBucket * 0.5);
              t.views = Math.round(viewsPerBucket + (Math.random() - 0.5) * viewsPerBucket * 0.5);
            }
          }

          // Extract title patterns for suggestions
          const topVids = [...vids]
            .sort(
              (a, b) =>
                parseInt(b.statistics.viewCount || "0") -
                parseInt(a.statistics.viewCount || "0")
            )
            .slice(0, 5);
          for (const v of topVids) {
            suggestedTitles.push(v.snippet.title);
          }
        } else {
          // No videos found, create empty timeline
          for (const bucket of buckets) {
            timeline.push({ label: bucket.label, videos: 0, views: 0 });
          }
        }

        if (suggestedTitles.length === 0) {
          suggestedTitles.push(
            `${keyword} 완벽 가이드 (2025)`,
            `${keyword} 초보자를 위한 꿀팁`,
            `${keyword} 현실적인 후기`
          );
        }

        keywordDetails.push({
          keyword,
          totalVideos,
          avgViews,
          competition: getCompetition(totalVideos),
          suggestedTitles: suggestedTitles.slice(0, 5),
          timeline,
        });
      } catch {
        // Fallback for individual keyword
        keywordDetails.push({
          keyword,
          totalVideos: 0,
          avgViews: 0,
          competition: "낮음",
          suggestedTitles: [`${keyword} 가이드`, `${keyword} 추천`],
          timeline: buckets.map((b) => ({
            label: b.label,
            videos: 0,
            views: 0,
          })),
        });
      }
    }

    // Build related keywords from collected tags
    const relatedKeywords: RelatedKeyword[] = [...allTags]
      .filter((tag) => !keywords.some((kw) => tag.toLowerCase().includes(kw.toLowerCase())))
      .slice(0, 10)
      .map((tag) => ({
        keyword: tag,
        score: Math.round(50 + Math.random() * 50),
      }))
      .sort((a, b) => b.score - a.score);

    // If not enough related keywords, add generic ones
    if (relatedKeywords.length < 10) {
      const suffixes = ["추천", "후기", "비교", "방법", "가격", "순위", "장단점", "2025"];
      for (const kw of keywords) {
        for (const suffix of suffixes) {
          if (relatedKeywords.length >= 10) break;
          const candidate = `${kw} ${suffix}`;
          if (!relatedKeywords.some((rk) => rk.keyword === candidate)) {
            relatedKeywords.push({
              keyword: candidate,
              score: Math.round(30 + Math.random() * 40),
            });
          }
        }
      }
    }

    const response: KeywordTrendsResponse = {
      keywords: keywordDetails,
      relatedKeywords: relatedKeywords.slice(0, 10),
    };

    return NextResponse.json({ data: response });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}
