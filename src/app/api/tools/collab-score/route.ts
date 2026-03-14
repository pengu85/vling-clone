import { NextRequest, NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";

/* ---------- Types ---------- */

interface ChannelStats {
  channelId: string;
  name: string;
  thumbnail: string;
  subscribers: number;
  videoCount: number;
  viewCount: number;
  category: string;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  avgDurationSeconds: number;
  uploadsPerMonth: number;
  engagementRate: number; // (likes+comments) / views
}

interface CollabFactor {
  label: string;
  key: string;
  score: number; // 0-25
  maxScore: number;
  detail: string;
  percentage?: number;
}

interface CollabExpectedEffect {
  estimatedReach: number;
  overlapEstimate: number;
  expectedViews: number;
  viewMultiplier: number;
  recommendedFormats: string[];
}

interface CollabResponse {
  channelA: ChannelStats;
  channelB: ChannelStats;
  totalScore: number;
  grade: string;
  factors: CollabFactor[];
  expectedEffect: CollabExpectedEffect;
  similarCaseStats: {
    avgViewIncrease: number;
    successRate: number;
  };
}

/* ---------- Category Detection ---------- */

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "게임": ["game", "gaming", "게임", "플레이", "공략", "롤", "배그", "마크", "발로란트"],
  "뷰티": ["beauty", "뷰티", "메이크업", "화장", "스킨케어", "코스메틱"],
  "먹방": ["먹방", "mukbang", "쿡방", "요리", "맛집", "레시피", "cooking", "food"],
  "일상": ["vlog", "브이로그", "일상", "daily", "라이프"],
  "교육": ["education", "교육", "공부", "강의", "튜토리얼", "학습"],
  "음악": ["music", "음악", "커버", "노래", "연주", "뮤직"],
  "기술": ["tech", "기술", "IT", "리뷰", "언박싱", "테크"],
  "엔터": ["entertainment", "예능", "웃긴", "코미디", "개그"],
  "스포츠": ["sports", "스포츠", "운동", "피트니스", "헬스"],
  "여행": ["travel", "여행", "해외", "투어"],
};

const RELATED_CATEGORIES: Record<string, string[]> = {
  "게임": ["기술", "엔터"],
  "뷰티": ["일상", "먹방"],
  "먹방": ["일상", "여행", "뷰티"],
  "일상": ["여행", "뷰티", "먹방"],
  "교육": ["기술"],
  "음악": ["엔터"],
  "기술": ["게임", "교육"],
  "엔터": ["음악", "게임", "일상"],
  "스포츠": ["일상"],
  "여행": ["일상", "먹방"],
};

function detectCategory(name: string, description?: string): string {
  const text = `${name} ${description || ""}`.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw.toLowerCase()))) {
      return cat;
    }
  }
  return "기타";
}

/* ---------- ISO 8601 Duration Parser ---------- */

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || "0");
  const m = parseInt(match[2] || "0");
  const s = parseInt(match[3] || "0");
  return h * 3600 + m * 60 + s;
}

/* ---------- Score Calculation ---------- */

function calculateCollabScore(
  a: ChannelStats,
  b: ChannelStats
): { totalScore: number; grade: string; factors: CollabFactor[] } {
  const factors: CollabFactor[] = [];

  // 1. 구독자 규모 균형 (최대 25점)
  const ratio =
    Math.min(a.subscribers, b.subscribers) /
    Math.max(a.subscribers, b.subscribers, 1);
  const balanceScore = Math.round(ratio * 25);
  const balanceRatio = `1:${(1 / Math.max(ratio, 0.01)).toFixed(1)}`;
  factors.push({
    label: "구독자 규모 균형",
    key: "balance",
    score: balanceScore,
    maxScore: 25,
    detail:
      ratio > 0.5
        ? `비슷한 규모 (${balanceRatio}) — 대등한 콜라보 가능`
        : ratio > 0.1
          ? `규모 차이 있음 (${balanceRatio}) — 멘토-멘티 콜라보 추천`
          : `규모 차이 큼 (${balanceRatio}) — 콜라보 효과 제한적`,
    percentage: Math.round(ratio * 100),
  });

  // 2. 카테고리 시너지 (최대 25점)
  let categoryScore = 15; // 기본
  let categoryDetail = "";
  if (a.category === b.category) {
    categoryScore = 20;
    categoryDetail = `같은 카테고리 (${a.category}) — 시청자 타겟 공유`;
  } else if (
    RELATED_CATEGORIES[a.category]?.includes(b.category) ||
    RELATED_CATEGORIES[b.category]?.includes(a.category)
  ) {
    categoryScore = 25;
    categoryDetail = `관련 카테고리 (${a.category} + ${b.category}) — 크로스 시너지 극대화`;
  } else {
    categoryScore = 12;
    categoryDetail = `다른 카테고리 (${a.category} + ${b.category}) — 새로운 시청자층 발굴 가능`;
  }
  factors.push({
    label: "카테고리 시너지",
    key: "category",
    score: categoryScore,
    maxScore: 25,
    detail: categoryDetail,
    percentage: Math.round((categoryScore / 25) * 100),
  });

  // 3. 참여도 매칭 (최대 25점)
  const engageDiff = Math.abs(a.engagementRate - b.engagementRate);
  const engageScore = Math.max(0, Math.round(25 - engageDiff * 500));
  const avgEngage = ((a.engagementRate + b.engagementRate) / 2) * 100;
  factors.push({
    label: "참여도 매칭",
    key: "engagement",
    score: engageScore,
    maxScore: 25,
    detail:
      engageDiff < 0.02
        ? `참여도 비슷 (평균 ${avgEngage.toFixed(1)}%) — 시청자 반응 수준 일치`
        : `참여도 차이 있음 (차이 ${(engageDiff * 100).toFixed(1)}%) — 콘텐츠 반응 격차`,
    percentage: Math.round((engageScore / 25) * 100),
  });

  // 4. 콘텐츠 스타일 유사도 (최대 25점)
  const freqDiff = Math.abs(a.uploadsPerMonth - b.uploadsPerMonth);
  const durationRatio =
    Math.min(a.avgDurationSeconds, b.avgDurationSeconds) /
    Math.max(a.avgDurationSeconds, b.avgDurationSeconds, 1);
  const styleScore = Math.max(
    0,
    Math.round(15 - freqDiff * 2 + durationRatio * 10)
  );
  const cappedStyleScore = Math.min(25, styleScore);
  factors.push({
    label: "콘텐츠 스타일 유사도",
    key: "style",
    score: cappedStyleScore,
    maxScore: 25,
    detail: `업로드 빈도 차이 ${freqDiff.toFixed(1)}회/월, 평균 영상 길이 비율 ${(durationRatio * 100).toFixed(0)}%`,
    percentage: Math.round((cappedStyleScore / 25) * 100),
  });

  const totalScore = Math.min(
    100,
    factors.reduce((sum, f) => sum + f.score, 0)
  );

  let grade: string;
  if (totalScore >= 90) grade = "환상의 콜라보!";
  else if (totalScore >= 70) grade = "좋은 궁합";
  else if (totalScore >= 50) grade = "보통";
  else grade = "비추천";

  return { totalScore, grade, factors };
}

/* ---------- Expected Effects ---------- */

function calculateExpectedEffects(
  a: ChannelStats,
  b: ChannelStats,
  totalScore: number
): CollabExpectedEffect {
  // 겹침 추정: 같은 카테고리일수록 겹침 높음, 규모 비슷할수록 겹침 높음
  const ratio =
    Math.min(a.subscribers, b.subscribers) /
    Math.max(a.subscribers, b.subscribers, 1);
  let overlapRate = 0.05; // 기본 5%
  if (a.category === b.category) overlapRate += 0.15;
  if (
    RELATED_CATEGORIES[a.category]?.includes(b.category) ||
    RELATED_CATEGORIES[b.category]?.includes(a.category)
  )
    overlapRate += 0.08;
  overlapRate += ratio * 0.1;
  overlapRate = Math.min(0.4, overlapRate);

  const overlapEstimate = Math.round(
    Math.min(a.subscribers, b.subscribers) * overlapRate
  );
  const estimatedReach = a.subscribers + b.subscribers - overlapEstimate;

  // 콜라보 영상 예상 조회수: 두 채널 평균 조회수의 1.5~3배
  const avgViews = (a.avgViews + b.avgViews) / 2;
  const multiplier = 1.5 + (totalScore / 100) * 1.5; // 궁합 점수에 비례
  const expectedViews = Math.round(avgViews * multiplier);

  // 추천 콜라보 형식
  const formats: string[] = [];
  if (a.category === b.category) {
    formats.push("크로스 리뷰", "합동 챌린지", "콜라보 콘텐츠");
  } else {
    formats.push("크로스오버 대담", "카테고리 교환 챌린지", "게스트 출연");
  }
  if (ratio > 0.3) {
    formats.push("합동 라이브 방송");
  }
  if (a.avgDurationSeconds > 600 && b.avgDurationSeconds > 600) {
    formats.push("심층 대담/토론");
  }

  return {
    estimatedReach,
    overlapEstimate,
    expectedViews,
    viewMultiplier: Math.round(multiplier * 10) / 10,
    recommendedFormats: formats.slice(0, 4),
  };
}

/* ---------- Channel Input Parser ---------- */

function parseChannelInput(
  input: string
): { type: "id" | "handle" | "search"; value: string } {
  const trimmed = input.trim();
  if (/^UC[\w-]{22}$/.test(trimmed)) return { type: "id", value: trimmed };

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
  if (trimmed.startsWith("@")) return { type: "handle", value: trimmed.slice(1) };
  return { type: "search", value: trimmed };
}

async function resolveChannelId(input: string): Promise<string | null> {
  const parsed = parseChannelInput(input);
  if (parsed.type === "id") return parsed.value;
  return youtubeClient.resolveHandle(parsed.value);
}

/* ---------- Fetch Channel Stats ---------- */

async function fetchChannelStats(channelId: string): Promise<ChannelStats> {
  const info = await youtubeClient.getChannel(channelId);
  if (!info.items || info.items.length === 0) {
    throw new Error("채널을 찾을 수 없습니다");
  }

  const ch = info.items[0];
  const subscribers = parseInt(ch.statistics.subscriberCount) || 0;
  const viewCount = parseInt(ch.statistics.viewCount) || 0;
  const videoCount = parseInt(ch.statistics.videoCount) || 0;

  const recentVideos = await youtubeClient.getChannelVideos(channelId, 10);
  const videoIds = recentVideos.items
    .map((v) => v.id.videoId)
    .filter((id): id is string => !!id);

  let avgViews = 0;
  let avgLikes = 0;
  let avgComments = 0;
  let avgDurationSeconds = 0;
  let uploadsPerMonth = 0;

  if (videoIds.length > 0) {
    const details = await youtubeClient.getVideoDetails(videoIds);
    const vids = details.items;

    avgViews =
      vids.reduce((s, v) => s + parseInt(v.statistics.viewCount || "0"), 0) /
      Math.max(1, vids.length);
    avgLikes =
      vids.reduce((s, v) => s + parseInt(v.statistics.likeCount || "0"), 0) /
      Math.max(1, vids.length);
    avgComments =
      vids.reduce(
        (s, v) => s + parseInt(v.statistics.commentCount || "0"),
        0
      ) / Math.max(1, vids.length);
    avgDurationSeconds =
      vids.reduce((s, v) => s + parseDuration(v.contentDetails.duration), 0) /
      Math.max(1, vids.length);

    // 업로드 빈도: 최근 영상 날짜 범위 기반
    const dates = recentVideos.items
      .map((v) => new Date(v.snippet.publishedAt).getTime())
      .sort((a, b) => b - a);
    if (dates.length >= 2) {
      const spanDays =
        (dates[0] - dates[dates.length - 1]) / (1000 * 60 * 60 * 24);
      uploadsPerMonth =
        spanDays > 0 ? (dates.length / spanDays) * 30 : dates.length;
    } else {
      uploadsPerMonth = 4; // default
    }
  }

  const engagementRate =
    avgViews > 0 ? (avgLikes + avgComments) / avgViews : 0;
  const category = detectCategory(
    ch.snippet.title,
    ch.snippet.description
  );

  return {
    channelId,
    name: ch.snippet.title,
    thumbnail: ch.snippet.thumbnails.high.url,
    subscribers,
    videoCount,
    viewCount,
    category,
    avgViews: Math.round(avgViews),
    avgLikes: Math.round(avgLikes),
    avgComments: Math.round(avgComments),
    avgDurationSeconds: Math.round(avgDurationSeconds),
    uploadsPerMonth: Math.round(uploadsPerMonth * 10) / 10,
    engagementRate: Math.round(engagementRate * 10000) / 10000,
  };
}

/* ---------- Mock Fallback ---------- */

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateMockStats(input: string, seedOffset: number): ChannelStats {
  const seed =
    input.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) + seedOffset;
  const categories = [
    "게임",
    "뷰티",
    "먹방",
    "일상",
    "교육",
    "음악",
    "기술",
    "엔터",
  ];
  const subscribers = Math.round(10000 + seededRandom(seed * 10) * 990000);
  const avgViews = Math.round(subscribers * (0.05 + seededRandom(seed * 11) * 0.3));
  const avgLikes = Math.round(avgViews * (0.02 + seededRandom(seed * 12) * 0.06));
  const avgComments = Math.round(avgViews * (0.005 + seededRandom(seed * 13) * 0.02));

  return {
    channelId: `UC${input.slice(0, 22).padEnd(22, String(seedOffset))}`,
    name: input.startsWith("@")
      ? input
      : `채널 ${input.slice(0, 8)}`,
    thumbnail: `https://placehold.co/176x176/1e293b/94a3b8?text=${encodeURIComponent(input.slice(0, 2))}`,
    subscribers,
    videoCount: Math.round(50 + seededRandom(seed * 14) * 450),
    viewCount: Math.round(avgViews * (100 + seededRandom(seed * 15) * 400)),
    category: categories[Math.floor(seededRandom(seed * 16) * categories.length)],
    avgViews,
    avgLikes,
    avgComments,
    avgDurationSeconds: Math.round(300 + seededRandom(seed * 17) * 1200),
    uploadsPerMonth: Math.round((2 + seededRandom(seed * 18) * 18) * 10) / 10,
    engagementRate:
      avgViews > 0
        ? Math.round(((avgLikes + avgComments) / avgViews) * 10000) / 10000
        : 0,
  };
}

/* ---------- API Route ---------- */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelA: rawA, channelB: rawB } = body as {
      channelA: string;
      channelB: string;
    };

    if (!rawA?.trim() || !rawB?.trim()) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "두 채널 모두 입력해주세요",
          },
        },
        { status: 400 }
      );
    }

    let statsA: ChannelStats;
    let statsB: ChannelStats;

    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    if (!YOUTUBE_API_KEY) {
      // Mock fallback
      statsA = generateMockStats(rawA.trim(), 0);
      statsB = generateMockStats(rawB.trim(), 100);
    } else {
      const [idA, idB] = await Promise.all([
        resolveChannelId(rawA.trim()),
        resolveChannelId(rawB.trim()),
      ]);

      if (!idA) {
        return NextResponse.json(
          {
            error: {
              code: "NOT_FOUND",
              message: `채널 A를 찾을 수 없습니다: ${rawA}`,
            },
          },
          { status: 404 }
        );
      }
      if (!idB) {
        return NextResponse.json(
          {
            error: {
              code: "NOT_FOUND",
              message: `채널 B를 찾을 수 없습니다: ${rawB}`,
            },
          },
          { status: 404 }
        );
      }

      [statsA, statsB] = await Promise.all([
        fetchChannelStats(idA),
        fetchChannelStats(idB),
      ]);
    }

    const { totalScore, grade, factors } = calculateCollabScore(statsA, statsB);
    const expectedEffect = calculateExpectedEffects(statsA, statsB, totalScore);

    // 유사 성공 사례 통계 (시뮬레이션)
    const similarCaseStats = {
      avgViewIncrease: Math.round(120 + totalScore * 1.5),
      successRate: Math.round(50 + totalScore * 0.4),
    };

    const response: CollabResponse = {
      channelA: statsA,
      channelB: statsB,
      totalScore,
      grade,
      factors,
      expectedEffect,
      similarCaseStats,
    };

    return NextResponse.json({ data: response });
  } catch (err) {
    console.error("Collab Score API error:", err);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "콜라보 궁합 분석 중 오류가 발생했습니다",
        },
      },
      { status: 500 }
    );
  }
}
