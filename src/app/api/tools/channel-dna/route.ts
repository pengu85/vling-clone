import { NextRequest, NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";

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
}): DNAScores {
  // 콘텐츠력: 일 평균 업로드 빈도
  const dailyUpload = stats.channelAgeDays > 0
    ? stats.videoCount / stats.channelAgeDays
    : 0;
  const content = Math.min(100, Math.round(dailyUpload * 300));

  // 성장성: 구독자 대비 조회수 비율 (활성도)
  const growthRate = stats.subscriberCount > 0
    ? (stats.avgViews / stats.subscriberCount) * 100
    : 0;
  const growth = Math.min(100, Math.round(growthRate * 2));

  // 영향력: 평균 조회수 로그 스케일
  const influence = Math.min(100, Math.round(Math.log10(Math.max(1, stats.avgViews)) * 15));

  // 참여도: 좋아요/조회수 비율
  const engagementRate = stats.avgViews > 0
    ? (stats.avgLikes / stats.avgViews) * 1000
    : 0;
  const engagement = Math.min(100, Math.round(engagementRate));

  // 일관성: 업로드 간격의 일관성 (표준편차 역수)
  let consistency = 50;
  if (stats.uploadIntervals.length > 1) {
    const mean = stats.uploadIntervals.reduce((a, b) => a + b, 0) / stats.uploadIntervals.length;
    const variance = stats.uploadIntervals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / stats.uploadIntervals.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 1; // coefficient of variation
    consistency = Math.min(100, Math.round((1 - Math.min(cv, 1)) * 100));
  }

  return { content, growth, influence, engagement, consistency };
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

/* ---------- 채널 ID 파싱 ---------- */

function parseChannelInput(input: string): { type: "id" | "handle" | "search"; value: string } {
  const trimmed = input.trim();

  // UC로 시작하는 채널 ID
  if (/^UC[\w-]{22}$/.test(trimmed)) {
    return { type: "id", value: trimmed };
  }

  // URL 파싱
  const urlPatterns = [
    /youtube\.com\/channel\/(UC[\w-]{22})/,
    /youtube\.com\/@([\w.-]+)/,
    /youtube\.com\/c\/([\w.-]+)/,
  ];
  for (const pattern of urlPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      if (match[1].startsWith("UC")) return { type: "id", value: match[1] };
      return { type: "handle", value: match[1] };
    }
  }

  // @핸들
  if (trimmed.startsWith("@")) {
    return { type: "handle", value: trimmed.slice(1) };
  }

  return { type: "search", value: trimmed };
}

/* ---------- Mock 데이터 ---------- */

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateMockDNA(seed: number): DNAScores {
  return {
    content: Math.round(30 + seededRandom(seed * 1) * 60),
    growth: Math.round(20 + seededRandom(seed * 2) * 70),
    influence: Math.round(25 + seededRandom(seed * 3) * 65),
    engagement: Math.round(20 + seededRandom(seed * 4) * 70),
    consistency: Math.round(30 + seededRandom(seed * 5) * 60),
  };
}

function generateMockResponse(channelInput: string): DNAResponse {
  const seed = channelInput.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const targetDNA = generateMockDNA(seed);

  const mockNames = [
    "테크리뷰 마스터",
    "일상 브이로그 채널",
    "게이밍 프로",
    "쿠킹 스튜디오",
    "뮤직 커버 채널",
    "여행 다이어리",
    "교육 콘텐츠 랩",
    "뷰티 클래스",
  ];

  const target: ChannelDNA = {
    channelId: `UC${channelInput.slice(0, 22).padEnd(22, "x")}`,
    name: channelInput.startsWith("@") ? channelInput : `채널 ${channelInput.slice(0, 8)}`,
    thumbnail: `https://placehold.co/176x176/1e293b/94a3b8?text=${encodeURIComponent(channelInput.slice(0, 2))}`,
    subscribers: Math.round(10000 + seededRandom(seed * 10) * 990000),
    videoCount: Math.round(50 + seededRandom(seed * 11) * 450),
    viewCount: Math.round(1000000 + seededRandom(seed * 12) * 99000000),
    dna: targetDNA,
  };

  const matches: MatchedChannel[] = [];
  for (let i = 0; i < 5; i++) {
    const mSeed = seed + (i + 1) * 137;
    const mDNA = generateMockDNA(mSeed);
    // 유사하게 만들기 위해 target DNA 방향으로 보정
    const keys: (keyof DNAScores)[] = ["content", "growth", "influence", "engagement", "consistency"];
    for (const k of keys) {
      mDNA[k] = Math.round(mDNA[k] * 0.4 + targetDNA[k] * 0.6 + (seededRandom(mSeed + i) - 0.3) * 20);
      mDNA[k] = Math.max(5, Math.min(100, mDNA[k]));
    }
    // 성장성을 약간 높여서 "더 빠르게 성장하는" 채널로 만들기
    mDNA.growth = Math.min(100, mDNA.growth + Math.round(seededRandom(mSeed * 7) * 25));

    const similarity = cosineSimilarity(targetDNA, mDNA);
    const growthDiff = mDNA.growth - targetDNA.growth;

    matches.push({
      channelId: `UC${"mock".repeat(5)}${i}x`.slice(0, 24),
      name: mockNames[i % mockNames.length],
      thumbnail: `https://placehold.co/176x176/1e293b/94a3b8?text=${encodeURIComponent(mockNames[i % mockNames.length].slice(0, 2))}`,
      subscribers: Math.round(target.subscribers * (0.5 + seededRandom(mSeed * 8) * 1.5)),
      videoCount: Math.round(50 + seededRandom(mSeed * 9) * 450),
      viewCount: Math.round(target.viewCount * (0.3 + seededRandom(mSeed * 10) * 2)),
      dna: mDNA,
      similarity: Math.round(similarity * 10) / 10,
      growthDiff,
      benchmarkPoints: getBenchmarkPoints(targetDNA, mDNA),
    });
  }

  matches.sort((a, b) => b.similarity - a.similarity);

  return { target, matches };
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
      // Mock 폴백
      const mockData = generateMockResponse(rawInput);
      return NextResponse.json({ data: mockData });
    }

    // 채널 ID 확인
    const parsed = parseChannelInput(rawInput);
    let resolvedId: string | null = null;

    if (parsed.type === "id") {
      resolvedId = parsed.value;
    } else if (parsed.type === "handle") {
      resolvedId = await youtubeClient.resolveHandle(parsed.value);
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

    // 2. 최근 영상 10개 조회
    const recentVideos = await youtubeClient.getChannelVideos(resolvedId, 10);
    const videoIds = recentVideos.items
      .map((v) => v.id.videoId)
      .filter((id): id is string => !!id);

    let avgViews = 0;
    let avgLikes = 0;
    let avgComments = 0;
    const uploadIntervals: number[] = [];

    if (videoIds.length > 0) {
      const videoDetails = await youtubeClient.getVideoDetails(videoIds);
      const videos = videoDetails.items;

      const totalViews = videos.reduce((s, v) => s + parseInt(v.statistics.viewCount || "0"), 0);
      const totalLikes = videos.reduce((s, v) => s + parseInt(v.statistics.likeCount || "0"), 0);
      const totalComments = videos.reduce((s, v) => s + parseInt(v.statistics.commentCount || "0"), 0);

      avgViews = videos.length > 0 ? totalViews / videos.length : 0;
      avgLikes = videos.length > 0 ? totalLikes / videos.length : 0;
      avgComments = videos.length > 0 ? totalComments / videos.length : 0;

      // 업로드 간격 계산
      const dates = recentVideos.items
        .map((v) => new Date(v.snippet.publishedAt).getTime())
        .sort((a, b) => b - a);
      for (let i = 0; i < dates.length - 1; i++) {
        uploadIntervals.push((dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24)); // days
      }
    }

    // 채널 나이 (대략적)
    const firstVideoDate = recentVideos.items.length > 0
      ? new Date(recentVideos.items[recentVideos.items.length - 1].snippet.publishedAt)
      : new Date();
    const channelAgeDays = Math.max(1, (Date.now() - firstVideoDate.getTime()) / (1000 * 60 * 60 * 24));

    const targetDNA = calculateDNA({
      videoCount,
      subscriberCount,
      viewCount,
      avgViews,
      avgLikes,
      avgComments,
      uploadIntervals,
      channelAgeDays: Math.max(channelAgeDays, 365), // 최소 1년으로 추정
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

    // 3. 유사 채널 검색
    const searchQuery = ch.snippet.title.split(/[\s\-_|]/)[0]; // 채널명 첫 키워드
    const searchResult = await youtubeClient.searchChannels(searchQuery, 20);

    const candidateIds = searchResult.items
      .map((item) => item.id.channelId || item.snippet.channelId)
      .filter((id): id is string => !!id && id !== resolvedId);

    const uniqueIds = [...new Set(candidateIds)].slice(0, 15);

    const matches: MatchedChannel[] = [];

    // 각 후보 채널의 DNA 계산
    for (const cId of uniqueIds) {
      try {
        const cInfo = await youtubeClient.getChannel(cId);
        if (!cInfo.items || cInfo.items.length === 0) continue;

        const c = cInfo.items[0];
        const cSubs = parseInt(c.statistics.subscriberCount) || 0;
        const cViews = parseInt(c.statistics.viewCount) || 0;
        const cVideoCount = parseInt(c.statistics.videoCount) || 0;

        // 비슷한 규모 필터 (구독자 0.1배 ~ 10배)
        if (cSubs < subscriberCount * 0.1 || cSubs > subscriberCount * 10) continue;

        const cRecentVideos = await youtubeClient.getChannelVideos(cId, 5);
        const cVideoIds = cRecentVideos.items
          .map((v) => v.id.videoId)
          .filter((id): id is string => !!id);

        let cAvgViews = 0;
        let cAvgLikes = 0;
        let cAvgComments = 0;
        const cIntervals: number[] = [];

        if (cVideoIds.length > 0) {
          const cVidDetails = await youtubeClient.getVideoDetails(cVideoIds);
          const cVids = cVidDetails.items;
          cAvgViews = cVids.reduce((s, v) => s + parseInt(v.statistics.viewCount || "0"), 0) / Math.max(1, cVids.length);
          cAvgLikes = cVids.reduce((s, v) => s + parseInt(v.statistics.likeCount || "0"), 0) / Math.max(1, cVids.length);
          cAvgComments = cVids.reduce((s, v) => s + parseInt(v.statistics.commentCount || "0"), 0) / Math.max(1, cVids.length);

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
          channelAgeDays: Math.max(channelAgeDays, 365),
        });

        const similarity = cosineSimilarity(targetDNA, cDNA);
        const growthDiff = cDNA.growth - targetDNA.growth;

        matches.push({
          channelId: cId,
          name: c.snippet.title,
          thumbnail: c.snippet.thumbnails.high.url,
          subscribers: cSubs,
          videoCount: cVideoCount,
          viewCount: cViews,
          dna: cDNA,
          similarity: Math.round(similarity * 10) / 10,
          growthDiff,
          benchmarkPoints: getBenchmarkPoints(targetDNA, cDNA),
        });
      } catch {
        // 개별 채널 실패는 무시
        continue;
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
