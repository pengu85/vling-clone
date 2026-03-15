import { NextRequest, NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";
import { parseChannelInput } from "@/lib/parseChannel";
import { cache } from "@/lib/cache";

/* ---------- Types ---------- */

interface TrafficSource {
  name: string;
  value: number;
  color: string;
}

interface HeatmapCell {
  day: number; // 0=월 ~ 6=일
  hour: number; // 0~23
  avgViews: number;
  intensity: number; // 0~1
  isBest: boolean;
}

interface KeywordStat {
  keyword: string;
  count: number;
  avgViews: number;
  performance: "high" | "medium" | "low";
}

interface UploadPatternDay {
  day: string;
  uploads: number;
  avgViews: number;
}

interface AlgorithmScoreItem {
  label: string;
  score: number;
  maxScore: number;
}

interface AlgorithmAnatomyResponse {
  channelName: string;
  channelThumbnail: string;
  subscribers: number;
  trafficSources: TrafficSource[];
  heatmap: HeatmapCell[];
  bestTimes: { day: string; hour: number }[];
  keywords: KeywordStat[];
  uploadPattern: UploadPatternDay[];
  algorithmScore: number;
  algorithmFactors: AlgorithmScoreItem[];
}

/* ---------- 유입 경로 역추정 ---------- */

function estimateTrafficSources(
  videos: Array<{
    title: string;
    views: number;
    likes: number;
    comments: number;
    tags: string[];
  }>,
  subscriberCount: number
): TrafficSource[] {
  if (videos.length === 0) {
    return [
      { name: "추천 영상", value: 30, color: "#3b82f6" },
      { name: "탐색/홈", value: 25, color: "#10b981" },
      { name: "검색", value: 20, color: "#f59e0b" },
      { name: "외부", value: 15, color: "#a855f7" },
      { name: "기타", value: 10, color: "#64748b" },
    ];
  }

  // 검색 친화도: 태그 수 + 제목 길이
  const avgTags = videos.reduce((s, v) => s + v.tags.length, 0) / videos.length;
  const avgTitleLen = videos.reduce((s, v) => s + v.title.length, 0) / videos.length;
  let searchScore = Math.min(35, avgTags * 2 + (avgTitleLen > 30 ? 10 : 0));

  // 추천 비중: 조회수/구독자 비율이 높으면 추천 유입 추정
  const avgViews = videos.reduce((s, v) => s + v.views, 0) / videos.length;
  const viewSubRatio = subscriberCount > 0 ? avgViews / subscriberCount : 1;
  let suggestedScore = Math.min(45, viewSubRatio * 30);

  // 탐색 비중: 참여율이 높고 조회수도 높으면 탐색 노출 추정
  const engagementRate = videos.reduce(
    (s, v) => s + (v.likes + v.comments) / Math.max(1, v.views),
    0
  ) / videos.length;
  let browseScore = Math.min(30, engagementRate * 500);

  // 외부 비중: 기본 10~15% (결정적으로 영상 수 기반)
  let externalScore = 10 + (videos.length % 5);

  // 정규화
  const total = searchScore + suggestedScore + browseScore + externalScore;
  const normalize = (v: number) => Math.round((v / total) * 100);

  const search = normalize(searchScore);
  const suggested = normalize(suggestedScore);
  const browse = normalize(browseScore);
  const external = normalize(externalScore);
  const other = 100 - search - suggested - browse - external;

  return [
    { name: "추천 영상", value: suggested, color: "#3b82f6" },
    { name: "탐색/홈", value: browse, color: "#10b981" },
    { name: "검색", value: search, color: "#f59e0b" },
    { name: "외부", value: external, color: "#a855f7" },
    { name: "기타", value: Math.max(0, other), color: "#64748b" },
  ];
}

/* ---------- 히트맵 생성 ---------- */

function generateHeatmap(
  videos: Array<{ publishedAt: string; views: number }>
): { heatmap: HeatmapCell[]; bestTimes: { day: string; hour: number }[] } {
  const dayNames = ["월", "화", "수", "목", "금", "토", "일"];

  // 7x24 grid accumulator
  const grid: { totalViews: number; count: number }[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => ({ totalViews: 0, count: 0 }))
  );

  for (const v of videos) {
    const date = new Date(v.publishedAt);
    // getDay() returns 0=Sun, convert to 0=Mon
    const jsDay = date.getUTCDay();
    const day = jsDay === 0 ? 6 : jsDay - 1;
    const hour = date.getUTCHours();
    // KST = UTC+9
    const kstHour = (hour + 9) % 24;
    const kstDay = hour + 9 >= 24 ? (day + 1) % 7 : day;

    grid[kstDay][kstHour].totalViews += v.views;
    grid[kstDay][kstHour].count += 1;
  }

  // Calculate averages
  let maxAvg = 0;
  const avgGrid: number[][] = grid.map((row) =>
    row.map((cell) => {
      const avg = cell.count > 0 ? cell.totalViews / cell.count : 0;
      if (avg > maxAvg) maxAvg = avg;
      return avg;
    })
  );

  // Build cells
  const cells: HeatmapCell[] = [];
  let bestAvg = 0;
  const bestCells: { day: number; hour: number; avg: number }[] = [];

  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const avg = avgGrid[d][h];
      const intensity = maxAvg > 0 ? avg / maxAvg : 0;
      cells.push({ day: d, hour: h, avgViews: Math.round(avg), intensity, isBest: false });

      if (avg > bestAvg) {
        bestAvg = avg;
      }
      if (avg > 0) {
        bestCells.push({ day: d, hour: h, avg });
      }
    }
  }

  // Mark top 3 best times
  bestCells.sort((a, b) => b.avg - a.avg);
  const top3 = bestCells.slice(0, 3);
  for (const bc of top3) {
    const idx = bc.day * 24 + bc.hour;
    cells[idx].isBest = true;
  }

  const bestTimes = top3.map((bc) => ({
    day: dayNames[bc.day],
    hour: bc.hour,
  }));

  return { heatmap: cells, bestTimes };
}

/* ---------- 키워드 추출 ---------- */

function extractKeywords(
  videos: Array<{ title: string; tags: string[]; views: number }>
): KeywordStat[] {
  const keywordMap = new Map<string, { count: number; totalViews: number }>();

  // Korean stopwords
  const stopwords = new Set([
    "의", "가", "이", "은", "들", "는", "에", "와", "을", "를", "으로",
    "도", "한", "그", "저", "것", "수", "거", "좀", "잘", "더",
    "the", "a", "an", "is", "are", "and", "or", "in", "on", "at",
    "to", "for", "of", "with", "by", "from",
  ]);

  for (const v of videos) {
    // Extract from title
    const titleWords = v.title
      .replace(/[^\w가-힣\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !stopwords.has(w.toLowerCase()));

    // Combine with tags
    const allWords = [...titleWords, ...v.tags.filter((t) => t.length >= 2)];

    const seen = new Set<string>();
    for (const word of allWords) {
      const lower = word.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);

      const existing = keywordMap.get(lower);
      if (existing) {
        existing.count++;
        existing.totalViews += v.views;
      } else {
        keywordMap.set(lower, { count: 1, totalViews: v.views });
      }
    }
  }

  // Sort by count, take top 10
  const sorted = [...keywordMap.entries()]
    .filter(([, stat]) => stat.count >= 2) // At least 2 occurrences
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);

  if (sorted.length === 0) return [];

  const avgViewsAll =
    sorted.reduce((s, [, stat]) => s + stat.totalViews / stat.count, 0) / sorted.length;

  return sorted.map(([keyword, stat]) => {
    const avgViews = Math.round(stat.totalViews / stat.count);
    let performance: "high" | "medium" | "low" = "medium";
    if (avgViews > avgViewsAll * 1.3) performance = "high";
    else if (avgViews < avgViewsAll * 0.7) performance = "low";

    return { keyword, count: stat.count, avgViews, performance };
  });
}

/* ---------- 업로드 패턴 ---------- */

function analyzeUploadPattern(
  videos: Array<{ publishedAt: string; views: number }>
): UploadPatternDay[] {
  const dayNames = ["월", "화", "수", "목", "금", "토", "일"];
  const dayData: { uploads: number; totalViews: number }[] = Array.from(
    { length: 7 },
    () => ({ uploads: 0, totalViews: 0 })
  );

  for (const v of videos) {
    const date = new Date(v.publishedAt);
    const jsDay = date.getUTCDay();
    const day = jsDay === 0 ? 6 : jsDay - 1;
    // KST adjustment
    const hour = date.getUTCHours();
    const kstDay = hour + 9 >= 24 ? (day + 1) % 7 : day;

    dayData[kstDay].uploads++;
    dayData[kstDay].totalViews += v.views;
  }

  return dayNames.map((name, i) => ({
    day: name,
    uploads: dayData[i].uploads,
    avgViews: dayData[i].uploads > 0
      ? Math.round(dayData[i].totalViews / dayData[i].uploads)
      : 0,
  }));
}

/* ---------- 알고리즘 추천 지수 ---------- */

function calculateAlgorithmScore(
  videos: Array<{
    title: string;
    views: number;
    likes: number;
    comments: number;
    publishedAt: string;
    tags: string[];
  }>,
  subscriberCount: number
): { score: number; factors: AlgorithmScoreItem[] } {
  if (videos.length === 0) {
    return {
      score: 0,
      factors: [
        { label: "업로드 빈도", score: 0, maxScore: 25 },
        { label: "시청 유지율 추정", score: 0, maxScore: 25 },
        { label: "참여도", score: 0, maxScore: 25 },
        { label: "키워드 최적화", score: 0, maxScore: 25 },
      ],
    };
  }

  // 1. 업로드 빈도 (max 25)
  const dates = videos
    .map((v) => new Date(v.publishedAt).getTime())
    .sort((a, b) => b - a);
  let avgIntervalDays = 7;
  if (dates.length >= 2) {
    const totalSpan = dates[0] - dates[dates.length - 1];
    avgIntervalDays = totalSpan / (dates.length - 1) / (1000 * 60 * 60 * 24);
  }
  // 주 2~3회 = 최적
  const frequencyScore = Math.min(
    25,
    Math.round(avgIntervalDays <= 3 ? 25 : avgIntervalDays <= 7 ? 20 : avgIntervalDays <= 14 ? 12 : 5)
  );

  // 2. 시청 유지율 추정 (max 25) - 좋아요/조회수 비율 proxy
  const avgLikeRate =
    videos.reduce((s, v) => s + v.likes / Math.max(1, v.views), 0) / videos.length;
  const retentionScore = Math.min(25, Math.round(avgLikeRate * 500));

  // 3. 참여도 (max 25) - (좋아요+댓글)/조회수
  const avgEngagement =
    videos.reduce(
      (s, v) => s + (v.likes + v.comments) / Math.max(1, v.views),
      0
    ) / videos.length;
  const engagementScore = Math.min(25, Math.round(avgEngagement * 400));

  // 4. 키워드 최적화 (max 25) - 태그 수 + 제목 길이
  const avgTags = videos.reduce((s, v) => s + v.tags.length, 0) / videos.length;
  const avgTitleLen =
    videos.reduce((s, v) => s + v.title.length, 0) / videos.length;
  const keywordScore = Math.min(
    25,
    Math.round(Math.min(avgTags, 10) * 1.5 + (avgTitleLen > 20 && avgTitleLen < 60 ? 10 : 5))
  );

  const totalScore = frequencyScore + retentionScore + engagementScore + keywordScore;

  return {
    score: totalScore,
    factors: [
      { label: "업로드 빈도", score: frequencyScore, maxScore: 25 },
      { label: "시청 유지율 추정", score: retentionScore, maxScore: 25 },
      { label: "참여도", score: engagementScore, maxScore: 25 },
      { label: "키워드 최적화", score: keywordScore, maxScore: 25 },
    ],
  };
}

/* ---------- API Route ---------- */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawInput: string = body.channelId || "";

    if (!rawInput || rawInput.trim().length === 0) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "채널 URL, ID 또는 이름을 입력하세요" } },
        { status: 400 }
      );
    }

    const channelId = rawInput.trim();
    const cacheKey = `algo-anatomy:v1:${channelId}`;
    const cached = await cache.get<AlgorithmAnatomyResponse>(cacheKey);
    if (cached) {
      return NextResponse.json({ data: cached });
    }

    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    if (!YOUTUBE_API_KEY) {
      return NextResponse.json({ error: { code: "API_KEY_REQUIRED", message: "YouTube API 키가 설정되지 않았습니다" } }, { status: 503 });
    }

    // Resolve channel ID
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

    // 1. Channel info
    const channelInfo = await youtubeClient.getChannel(resolvedId);
    if (!channelInfo.items || channelInfo.items.length === 0) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "채널 정보를 가져올 수 없습니다" } },
        { status: 404 }
      );
    }

    const ch = channelInfo.items[0];
    const subscriberCount = parseInt(ch.statistics.subscriberCount) || 0;

    // 2. Recent 20 videos
    const recentVideos = await youtubeClient.getChannelVideos(resolvedId, 20);
    const videoIds = recentVideos.items
      .map((v) => v.id.videoId)
      .filter((id): id is string => !!id);

    interface VideoData {
      title: string;
      views: number;
      likes: number;
      comments: number;
      tags: string[];
      publishedAt: string;
    }

    let videoDataList: VideoData[] = [];

    if (videoIds.length > 0) {
      const videoDetails = await youtubeClient.getVideoDetails(videoIds);
      videoDataList = videoDetails.items.map((v) => ({
        title: v.snippet.title,
        views: parseInt(v.statistics.viewCount) || 0,
        likes: parseInt(v.statistics.likeCount) || 0,
        comments: parseInt(v.statistics.commentCount) || 0,
        tags: v.snippet.tags || [],
        publishedAt: v.snippet.publishedAt,
      }));
    }

    // 3. Compute all analysis
    const trafficSources = estimateTrafficSources(videoDataList, subscriberCount);
    const { heatmap, bestTimes } = generateHeatmap(videoDataList);
    const keywords = extractKeywords(videoDataList);
    const uploadPattern = analyzeUploadPattern(videoDataList);
    const { score: algorithmScore, factors: algorithmFactors } =
      calculateAlgorithmScore(videoDataList, subscriberCount);

    const response: AlgorithmAnatomyResponse = {
      channelName: ch.snippet.title,
      channelThumbnail: ch.snippet.thumbnails.high.url,
      subscribers: subscriberCount,
      trafficSources,
      heatmap,
      bestTimes,
      keywords,
      uploadPattern,
      algorithmScore,
      algorithmFactors,
    };

    await cache.set(cacheKey, response, 3600);

    return NextResponse.json({ data: response });
  } catch (err) {
    console.error("Algorithm Anatomy API error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "분석 중 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}
