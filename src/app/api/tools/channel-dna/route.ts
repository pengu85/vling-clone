import { NextRequest, NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";
import { parseChannelInput } from "@/lib/parseChannel";

/* ---------- Types ---------- */

interface DNAScores {
  content: number;
  growth: number;
  influence: number;
  engagement: number;
  consistency: number;
}

interface ChannelDNA {
  channelId: string;
  name: string;
  thumbnail: string;
  subscribers: number;
  videoCount: number;
  viewCount: number;
  dna: DNAScores;
}

interface MatchedChannel extends ChannelDNA {
  similarity: number; // 0-100
  growthDiff: number; // 양수면 매칭 채널이 더 빠름
  benchmarkPoints: string[];
}

interface DNAResponse {
  target: ChannelDNA;
  matches: MatchedChannel[];
}

/* ---------- Tag / Keyword Extraction ---------- */

/**
 * Extract top N most frequent tags from a list of videos.
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
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([keyword]) => keyword);
}

/* ---------- DNA 계산 ---------- */

function calculateDNA(stats: {
  videoCount: number;
  subscriberCount: number;
  viewCount: number;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  uploadIntervals: number[];
  channelAgeDays: number;
  recentVideoCount: number;
}): DNAScores {
  // 콘텐츠력: monthly upload rate (target: 8 videos/month = 100)
  const monthlyUploads = stats.channelAgeDays > 0
    ? (stats.videoCount / stats.channelAgeDays) * 30
    : 0;
  const content = Math.min(100, Math.round((monthlyUploads / 8) * 80));
  const recentBoost = Math.min(20, stats.recentVideoCount * 5);
  const contentFinal = Math.min(100, content + recentBoost);

  // 성장성: view-to-subscriber ratio on log scale
  // Ratio of 0.1 (10% of subs watch) = 50, ratio of 1.0 = 85, ratio of 0.01 = 20
  const vpsRatio = stats.subscriberCount > 0
    ? stats.avgViews / stats.subscriberCount
    : 0;
  const growth = Math.min(100, Math.round(50 + Math.log10(Math.max(vpsRatio, 0.001) / 0.1) * 25));

  // 영향력: avg views on log scale (100 views=20, 10K=50, 100K=65, 1M=80, 10M=95)
  const influence = Math.min(100, Math.round(Math.log10(Math.max(1, stats.avgViews)) * 16 - 10));

  // 참여도: combined like+comment rate
  // Typical: 3% likes + 0.3% comments = 3.3%
  // Scale: 2% = 40, 4% = 65, 8% = 85, 12%+ = 100
  const engagementRate = stats.avgViews > 0
    ? ((stats.avgLikes + stats.avgComments * 3) / stats.avgViews) * 100
    : 0;
  const engagement = Math.min(100, Math.round(engagementRate * 12));

  // 일관성: coefficient of variation of upload intervals (lower = more consistent)
  let consistency = 50;
  if (stats.uploadIntervals.length > 1) {
    const mean = stats.uploadIntervals.reduce((a, b) => a + b, 0) / stats.uploadIntervals.length;
    const variance = stats.uploadIntervals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / stats.uploadIntervals.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
    consistency = Math.min(100, Math.round((1 - Math.min(cv, 1)) * 90 + 10));
  }

  return {
    content: Math.max(5, contentFinal),
    growth: Math.max(5, growth),
    influence: Math.max(5, influence),
    engagement: Math.max(5, engagement),
    consistency: Math.max(5, consistency),
  };
}

function cosineSimilarity(a: DNAScores, b: DNAScores): number {
  const keys: (keyof DNAScores)[] = ["content", "growth", "influence", "engagement", "consistency"];
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (const k of keys) {
    dotProduct += a[k] * b[k];
    normA += a[k] ** 2;
    normB += b[k] ** 2;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return (dotProduct / denom) * 100;
}

function getBenchmarkPoints(target: DNAScores, match: DNAScores): string[] {
  const points: string[] = [];
  const labels: Record<keyof DNAScores, string> = {
    content: "콘텐츠 업로드 빈도",
    growth: "구독자 성장률",
    influence: "조회수 영향력",
    engagement: "시청자 참여도",
    consistency: "업로드 일관성",
  };
  const keys: (keyof DNAScores)[] = ["content", "growth", "influence", "engagement", "consistency"];
  for (const k of keys) {
    if (match[k] > target[k] + 10) {
      points.push(`${labels[k]}가 ${Math.round(match[k] - target[k])}점 더 높음`);
    }
  }
  if (points.length === 0) points.push("전반적으로 균형 잡힌 성장");
  return points.slice(0, 3);
}

/* ---------- API Route ---------- */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelId: rawInput } = body as { channelId: string };

    if (!rawInput || rawInput.trim().length === 0) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "채널 URL, ID 또는 이름을 입력하세요" } },
        { status: 400 }
      );
    }

    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    if (!YOUTUBE_API_KEY) {
      return NextResponse.json(
        { error: { code: "NO_API_KEY", message: "YouTube API 키가 설정되지 않았습니다" } },
        { status: 503 }
      );
    }

    // 채널 ID 확인
    const parsed = parseChannelInput(rawInput);
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

    // 1. 채널 기본 정보
    const channelInfo = await youtubeClient.getChannel(resolvedId);
    if (!channelInfo.items || channelInfo.items.length === 0) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "채널 정보를 가져올 수 없습니다" } },
        { status: 404 }
      );
    }

    const ch = channelInfo.items[0];
    const subscriberCount = parseInt(ch.statistics.subscriberCount) || 0;
    const viewCount = parseInt(ch.statistics.viewCount) || 0;
    const videoCount = parseInt(ch.statistics.videoCount) || 0;
    const sourceTopicUrls = ch.topicDetails?.topicCategories ?? [];

    // 채널 생성일로 실제 채널 나이 계산
    const channelCreatedAt = ch.snippet.publishedAt
      ? new Date(ch.snippet.publishedAt)
      : new Date(Date.now() - 365 * 86400000); // fallback: 1년 전
    const channelAgeDays = Math.max(30, (Date.now() - channelCreatedAt.getTime()) / (1000 * 60 * 60 * 24));

    // 2. 최근 영상 10개 조회
    const recentVideos = await youtubeClient.getChannelVideos(resolvedId, 10);
    const videoIds = recentVideos.items
      .map((v) => v.id.videoId)
      .filter((id): id is string => !!id);

    let avgViews = 0;
    let avgLikes = 0;
    let avgComments = 0;
    const uploadIntervals: number[] = [];
    let recentVideoCount = 0;
    let contentTags: string[] = [];
    let titleKeywords: string[] = [];

    if (videoIds.length > 0) {
      const videoDetails = await youtubeClient.getVideoDetails(videoIds);
      const videos = videoDetails.items;

      const totalViews = videos.reduce((s, v) => s + parseInt(v.statistics.viewCount || "0"), 0);
      const totalLikes = videos.reduce((s, v) => s + parseInt(v.statistics.likeCount || "0"), 0);
      const totalComments = videos.reduce((s, v) => s + parseInt(v.statistics.commentCount || "0"), 0);

      avgViews = videos.length > 0 ? totalViews / videos.length : 0;
      avgLikes = videos.length > 0 ? totalLikes / videos.length : 0;
      avgComments = videos.length > 0 ? totalComments / videos.length : 0;

      // 최근 30일 영상 수 카운트
      const thirtyDaysAgo = Date.now() - 30 * 86400000;
      for (const v of videos) {
        if (new Date(v.snippet.publishedAt).getTime() >= thirtyDaysAgo) {
          recentVideoCount++;
        }
      }

      // 콘텐츠 DNA 추출 (태그 + 제목 키워드)
      contentTags = extractTopTags(
        videos.map((v) => ({ tags: v.snippet.tags })),
        8
      );
      titleKeywords = extractTitleKeywords(
        videos.map((v) => ({ title: v.snippet.title })),
        5
      );

      // 업로드 간격 계산
      const dates = recentVideos.items
        .map((v) => new Date(v.snippet.publishedAt).getTime())
        .sort((a, b) => b - a);
      for (let i = 0; i < dates.length - 1; i++) {
        uploadIntervals.push((dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24));
      }
    }

    const targetDNA = calculateDNA({
      videoCount,
      subscriberCount,
      viewCount,
      avgViews,
      avgLikes,
      avgComments,
      uploadIntervals,
      channelAgeDays,
      recentVideoCount,
    });

    const target: ChannelDNA = {
      channelId: resolvedId,
      name: ch.snippet.title,
      thumbnail: ch.snippet.thumbnails.high.url,
      subscribers: subscriberCount,
      videoCount,
      viewCount,
      dna: targetDNA,
    };

    // 3. 유사 채널 검색 — 태그 기반 콘텐츠 DNA 매칭

    // 검색 쿼리 구성: 태그 우선, 그 다음 제목 키워드, 최후 채널명
    const searchQueries: string[] = [];
    for (const tag of contentTags.slice(0, 3)) {
      searchQueries.push(tag);
    }
    if (searchQueries.length < 3) {
      for (const kw of titleKeywords) {
        if (searchQueries.length >= 3) break;
        if (!searchQueries.includes(kw)) searchQueries.push(kw);
      }
    }
    if (searchQueries.length === 0) {
      searchQueries.push(ch.snippet.title);
    }

    // 각 쿼리로 영상 검색 → 채널 ID 수집 (히트 빈도 추적)
    const hitMap = new Map<string, number>();
    const totalSearches = searchQueries.length;

    for (const query of searchQueries) {
      try {
        const searchRes = await youtubeClient.searchVideos(query, 15);
        const seenInThisSearch = new Set<string>();
        for (const item of searchRes.items) {
          const cid = item.snippet.channelId;
          if (cid && cid !== resolvedId && !seenInThisSearch.has(cid)) {
            seenInThisSearch.add(cid);
            hitMap.set(cid, (hitMap.get(cid) || 0) + 1);
          }
        }
      } catch {
        // 검색 실패 시 건너뜀
      }
    }

    // 히트 빈도순 정렬, 상위 15개 후보
    const candidateIds = [...hitMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([id]) => id);

    const matches: MatchedChannel[] = [];

    if (candidateIds.length > 0) {
      // 배치로 후보 채널 기본 정보 가져오기
      const batchInfo = await youtubeClient.getChannel(candidateIds.join(","));
      const candidateChannels = (batchInfo.items || []).filter((c) => {
        const cSubs = parseInt(c.statistics.subscriberCount) || 0;
        return cSubs >= subscriberCount * 0.1 && cSubs <= subscriberCount * 10;
      });

      // 후보 채널 영상 정보 병렬 조회
      const videoPromises = candidateChannels.map(async (candidateChannel) => {
        try {
          const cId = candidateChannel.id;
          const cSubs = parseInt(candidateChannel.statistics.subscriberCount) || 0;
          const cViews = parseInt(candidateChannel.statistics.viewCount) || 0;
          const cVideoCount = parseInt(candidateChannel.statistics.videoCount) || 0;
          const candidateTopicUrls = candidateChannel.topicDetails?.topicCategories ?? [];

          // 후보 채널 나이 계산
          const cCreatedAt = candidateChannel.snippet.publishedAt
            ? new Date(candidateChannel.snippet.publishedAt)
            : new Date(Date.now() - 365 * 86400000);
          const cAgeDays = Math.max(30, (Date.now() - cCreatedAt.getTime()) / (1000 * 60 * 60 * 24));

          const cRecentVideos = await youtubeClient.getChannelVideos(cId, 5);
          const cVideoIds = cRecentVideos.items
            .map((v) => v.id.videoId)
            .filter((id): id is string => !!id);

          let cAvgViews = 0;
          let cAvgLikes = 0;
          let cAvgComments = 0;
          let cRecentVideoCount = 0;
          const cIntervals: number[] = [];

          if (cVideoIds.length > 0) {
            const cVidDetails = await youtubeClient.getVideoDetails(cVideoIds);
            const cVids = cVidDetails.items;
            cAvgViews = cVids.reduce((s, v) => s + parseInt(v.statistics.viewCount || "0"), 0) / Math.max(1, cVids.length);
            cAvgLikes = cVids.reduce((s, v) => s + parseInt(v.statistics.likeCount || "0"), 0) / Math.max(1, cVids.length);
            cAvgComments = cVids.reduce((s, v) => s + parseInt(v.statistics.commentCount || "0"), 0) / Math.max(1, cVids.length);

            const thirtyDaysAgo = Date.now() - 30 * 86400000;
            for (const v of cVids) {
              if (new Date(v.snippet.publishedAt).getTime() >= thirtyDaysAgo) {
                cRecentVideoCount++;
              }
            }

            const cDates = cRecentVideos.items
              .map((v) => new Date(v.snippet.publishedAt).getTime())
              .sort((a, b) => b - a);
            for (let j = 0; j < cDates.length - 1; j++) {
              cIntervals.push((cDates[j] - cDates[j + 1]) / (1000 * 60 * 60 * 24));
            }
          }

          const cDNA = calculateDNA({
            videoCount: cVideoCount,
            subscriberCount: cSubs,
            viewCount: cViews,
            avgViews: cAvgViews,
            avgLikes: cAvgLikes,
            avgComments: cAvgComments,
            uploadIntervals: cIntervals,
            channelAgeDays: cAgeDays,
            recentVideoCount: cRecentVideoCount,
          });

          // 복합 유사도: 60% DNA 코사인 + 25% 토픽 겹침 + 15% 히트 빈도
          const dnaSimilarity = cosineSimilarity(targetDNA, cDNA);

          // 토픽 Jaccard 유사도
          const sourceTopicsSet = new Set(sourceTopicUrls);
          const intersection = candidateTopicUrls.filter((url) => sourceTopicsSet.has(url));
          const union = new Set([...sourceTopicUrls, ...candidateTopicUrls]);
          const topicJaccard = union.size > 0 ? (intersection.length / union.size) * 100 : 50;

          // 히트 빈도 점수
          const hitCount = hitMap.get(cId) || 0;
          const hitScore = totalSearches > 0 ? (hitCount / totalSearches) * 100 : 0;

          const combinedSimilarity = dnaSimilarity * 0.6 + topicJaccard * 0.25 + hitScore * 0.15;

          const growthDiff = cDNA.growth - targetDNA.growth;

          return {
            channelId: cId,
            name: candidateChannel.snippet.title,
            thumbnail: candidateChannel.snippet.thumbnails.high?.url ?? "",
            subscribers: cSubs,
            videoCount: cVideoCount,
            viewCount: cViews,
            dna: cDNA,
            similarity: Math.round(combinedSimilarity * 10) / 10,
            growthDiff,
            benchmarkPoints: getBenchmarkPoints(targetDNA, cDNA),
          } as MatchedChannel;
        } catch {
          return null;
        }
      });

      const results = await Promise.all(videoPromises);
      for (const r of results) {
        if (r) matches.push(r);
      }
    }

    // 유사도순 정렬, 상위 5개
    matches.sort((a, b) => b.similarity - a.similarity);
    const topMatches = matches.slice(0, 5);

    return NextResponse.json({ data: { target, matches: topMatches } as DNAResponse });
  } catch (err) {
    console.error("Channel DNA API error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "DNA 분석 중 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}
