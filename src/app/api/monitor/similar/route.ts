import { NextRequest, NextResponse } from "next/server";
import { youtubeClient, extractCategory } from "@/lib/youtube";
import { cache } from "@/lib/cache";

interface SimilarChannelResult {
  channelId: string;
  title: string;
  thumbnailUrl: string;
  subscriberCount: number;
  category: string;
  similarity: number;
}

/**
 * Extract top N most frequent tags from a list of videos.
 * These tags form the channel's "content DNA".
 */
function extractTopTags(
  videos: Array<{ tags?: string[] }>,
  topN: number
): string[] {
  const freq = new Map<string, number>();
  for (const v of videos) {
    if (!v.tags) continue;
    for (const tag of v.tags) {
      const lower = tag.toLowerCase();
      freq.set(lower, (freq.get(lower) || 0) + 1);
    }
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([tag]) => tag);
}

/**
 * Extract meaningful keywords from video titles.
 * Filters out common stopwords and short words.
 */
function extractTitleKeywords(
  videos: Array<{ title: string }>,
  topN: number
): string[] {
  const stopwords = new Set([
    "the", "a", "an", "is", "are", "and", "or", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "ep", "episode", "part", "vol",
    "의", "가", "이", "은", "들", "는", "에", "와", "을", "를", "으로",
    "도", "한", "그", "저", "것", "수", "거", "좀", "잘", "더", "이번",
    "영상", "채널", "오늘", "드디어", "진짜", "대박", "최초", "공개",
  ]);

  const freq = new Map<string, number>();
  for (const v of videos) {
    const words = v.title
      .replace(/[^\w가-힣\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !stopwords.has(w.toLowerCase()));
    const seen = new Set<string>();
    for (const w of words) {
      const lower = w.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);
      freq.set(lower, (freq.get(lower) || 0) + 1);
    }
  }

  return [...freq.entries()]
    .filter(([, count]) => count >= 2) // appears in at least 2 videos
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([keyword]) => keyword);
}

/**
 * Calculate multi-dimensional similarity score (0-100).
 */
function calculateSimilarity(
  source: {
    subscriberCount: number;
    category: string;
    country: string;
    topicUrls: string[];
  },
  target: {
    subscriberCount: number;
    category: string;
    country: string;
    topicUrls: string[];
    hitCount: number;    // how many tag searches this channel appeared in
    maxHits: number;     // total number of tag searches performed
  }
): number {
  let score = 0;

  // 1. Tag search hit frequency (30 points max)
  // Channels appearing in multiple tag-based searches share more content overlap
  if (target.maxHits > 0) {
    score += Math.round((target.hitCount / target.maxHits) * 30);
  }

  // 2. Topic overlap (25 points max)
  // Compare YouTube topicCategories arrays — more overlap = more similar
  if (source.topicUrls.length > 0 && target.topicUrls.length > 0) {
    const sourceSet = new Set(source.topicUrls);
    const intersection = target.topicUrls.filter((url) => sourceSet.has(url));
    const union = new Set([...source.topicUrls, ...target.topicUrls]);
    const jaccard = union.size > 0 ? intersection.length / union.size : 0;
    score += Math.round(jaccard * 25);
  } else if (source.category === target.category) {
    // Fallback: simple category match when topicDetails unavailable
    score += 15;
  }

  // 3. Subscriber scale proximity (25 points max)
  const sourceLog = Math.log10(Math.max(source.subscriberCount, 1));
  const targetLog = Math.log10(Math.max(target.subscriberCount, 1));
  const scaleDiff = Math.abs(sourceLog - targetLog);
  score += Math.round(Math.max(0, 25 - scaleDiff * 12));

  // 4. Country match (10 points)
  if (source.country === target.country) {
    score += 10;
  }

  // 5. Base relevance (10 points — they appeared in content-specific search)
  score += 10;

  return Math.min(score, 100);
}

export async function GET(request: NextRequest) {
  const channelId = request.nextUrl.searchParams.get("channelId");

  if (!channelId) {
    return NextResponse.json(
      { error: "channelId is required" },
      { status: 400 }
    );
  }

  // Check cache
  const cacheKey = `similar-channels:v2:${channelId}`;
  const cached = await cache.get<SimilarChannelResult[]>(cacheKey);
  if (cached) {
    return NextResponse.json({ data: cached });
  }

  try {
    // ── Phase 1: Understand source channel's content DNA ──

    const sourceInfo = await youtubeClient.getChannel(channelId);
    if (!sourceInfo.items?.length) {
      return NextResponse.json({ data: [] });
    }

    const source = sourceInfo.items[0];
    const sourceCategory = extractCategory(source.topicDetails?.topicCategories);
    const sourceTopicUrls = source.topicDetails?.topicCategories ?? [];
    const sourceSubscribers = parseInt(source.statistics.subscriberCount) || 0;
    const sourceCountry = source.snippet.country || "KR";

    // Fetch recent videos to extract content DNA (tags + title keywords)
    const videoSearchRes = await youtubeClient.getChannelVideos(channelId, 10);
    const videoIds = (videoSearchRes.items || [])
      .map((v) => v.id.videoId)
      .filter(Boolean) as string[];

    let contentTags: string[] = [];
    let titleKeywords: string[] = [];

    if (videoIds.length > 0) {
      const videoDetails = await youtubeClient.getVideoDetails(videoIds);
      const videos = videoDetails.items || [];
      contentTags = extractTopTags(
        videos.map((v) => ({ tags: v.snippet.tags })),
        8
      );
      titleKeywords = extractTitleKeywords(
        videos.map((v) => ({ title: v.snippet.title })),
        5
      );
    }

    // Build search queries: specific tags first, then title keywords, category as fallback
    const searchQueries: string[] = [];

    // Top tags are the most specific content markers
    for (const tag of contentTags.slice(0, 3)) {
      searchQueries.push(tag);
    }

    // Title keywords if not enough tags
    if (searchQueries.length < 3) {
      for (const kw of titleKeywords) {
        if (searchQueries.length >= 3) break;
        if (!searchQueries.includes(kw)) {
          searchQueries.push(kw);
        }
      }
    }

    // Fallback: channel title
    if (searchQueries.length === 0) {
      searchQueries.push(source.snippet.title);
    }

    // ── Phase 2: Find channels via content-specific video search ──
    // Search for VIDEOS using specific tags, then collect unique channel IDs.
    // Channels appearing in multiple tag searches have higher content overlap.

    const hitMap = new Map<string, number>(); // channelId → hit count
    const totalSearches = searchQueries.length;

    for (const query of searchQueries) {
      try {
        const searchRes = await youtubeClient.searchVideos(query, 15);
        const seenInThisSearch = new Set<string>();
        for (const item of searchRes.items) {
          const cid = item.snippet.channelId;
          if (cid && cid !== channelId && !seenInThisSearch.has(cid)) {
            seenInThisSearch.add(cid);
            hitMap.set(cid, (hitMap.get(cid) || 0) + 1);
          }
        }
      } catch {
        // Skip failed searches
      }
    }

    if (hitMap.size === 0) {
      return NextResponse.json({ data: [] });
    }

    // Sort candidates by hit count, take top 20 for detail fetch
    const candidateIds = [...hitMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([id]) => id);

    // ── Phase 3: Get candidate details and score ──

    const detailsRes = await youtubeClient.getChannel(candidateIds.join(","));

    if (!detailsRes.items?.length) {
      return NextResponse.json({ data: [] });
    }

    const results: SimilarChannelResult[] = detailsRes.items
      .filter((ch) => ch.id !== channelId)
      .map((ch) => {
        const targetCategory = extractCategory(ch.topicDetails?.topicCategories);
        const targetSubscribers = parseInt(ch.statistics.subscriberCount) || 0;
        const targetCountry = ch.snippet.country || "KR";
        const targetTopicUrls = ch.topicDetails?.topicCategories ?? [];

        const similarity = calculateSimilarity(
          {
            subscriberCount: sourceSubscribers,
            category: sourceCategory,
            country: sourceCountry,
            topicUrls: sourceTopicUrls,
          },
          {
            subscriberCount: targetSubscribers,
            category: targetCategory,
            country: targetCountry,
            topicUrls: targetTopicUrls,
            hitCount: hitMap.get(ch.id) || 0,
            maxHits: totalSearches,
          }
        );

        return {
          channelId: ch.id,
          title: ch.snippet.title,
          thumbnailUrl: ch.snippet.thumbnails?.high?.url ?? "",
          subscriberCount: targetSubscribers,
          category: targetCategory,
          similarity,
        };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 6);

    // Cache for 2 hours
    await cache.set(cacheKey, results, 7200);

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("Similar channels error:", error);
    return NextResponse.json(
      { error: "유사 채널 검색에 실패했습니다" },
      { status: 500 }
    );
  }
}
