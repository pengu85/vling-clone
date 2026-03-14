import { NextRequest, NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";
import { parseChannelInput } from "@/lib/parseChannel";

/* ---------- Types ---------- */

interface VideoInfo {
  title: string;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  duration: string; // ISO 8601
}

interface HealthItem {
  key: string;
  label: string;
  score: number; // 0-100
  status: "good" | "warning" | "danger";
  description: string;
}

interface DiagnosisSummary {
  strengths: string[];
  improvements: string[];
  warnings: string[];
}

interface CategoryAverage {
  uploadConsistency: number;
  viewStability: number;
  growthMomentum: number;
  engagementHealth: number;
  shortsDependency: number;
  contentDiversity: number;
}

interface HealthResponse {
  channelId: string;
  channelName: string;
  thumbnail: string;
  subscribers: number;
  totalScore: number;
  grade: string;
  gradeComment: string;
  items: HealthItem[];
  diagnosis: DiagnosisSummary;
  categoryAverage: CategoryAverage;
  radarData: Array<{
    axis: string;
    channel: number;
    average: number;
  }>;
}

/* ---------- Duration Parser ---------- */

function parseDurationSeconds(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || "0");
  const m = parseInt(match[2] || "0");
  const s = parseInt(match[3] || "0");
  return h * 3600 + m * 60 + s;
}

/* ---------- Health Calculations ---------- */

function calcUploadConsistency(videos: VideoInfo[]): { score: number; description: string } {
  if (videos.length < 3) return { score: 50, description: "영상 수가 부족하여 정확한 측정 불가" };

  const intervals = videos.slice(0, -1).map((v, i) =>
    (new Date(v.publishedAt).getTime() - new Date(videos[i + 1].publishedAt).getTime()) / 86400000
  );
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const std = Math.sqrt(intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / intervals.length);
  const cv = std / Math.max(1, mean);
  const score = Math.max(0, Math.min(100, Math.round(100 - cv * 30)));

  const avgDays = Math.round(mean);
  if (score >= 80) return { score, description: `평균 ${avgDays}일 간격으로 매우 규칙적` };
  if (score >= 60) return { score, description: `평균 ${avgDays}일 간격이나 다소 불규칙` };
  return { score, description: `업로드 간격이 불규칙 (평균 ${avgDays}일, 편차 큼)` };
}

function calcViewStability(videos: VideoInfo[]): { score: number; description: string } {
  if (videos.length < 3) return { score: 50, description: "영상 수가 부족하여 정확한 측정 불가" };

  const views = videos.map((v) => v.views);
  const mean = views.reduce((a, b) => a + b, 0) / views.length;
  const std = Math.sqrt(views.reduce((a, b) => a + (b - mean) ** 2, 0) / views.length);
  const cv = std / Math.max(1, mean);
  const score = Math.max(0, Math.min(100, Math.round(100 - cv * 50)));

  if (score >= 80) return { score, description: "조회수가 안정적으로 유지되고 있음" };
  if (score >= 60) return { score, description: "조회수 변동이 다소 있으나 양호한 수준" };
  return { score, description: "조회수 편차가 크며 안정성 개선 필요" };
}

function calcGrowthMomentum(videos: VideoInfo[], subscribers: number): { score: number; description: string } {
  if (videos.length < 4) return { score: 50, description: "데이터 부족으로 추세 분석 불가" };

  const half = Math.floor(videos.length / 2);
  const recentViews = videos.slice(0, half).reduce((a, v) => a + v.views, 0) / half;
  const olderViews = videos.slice(half).reduce((a, v) => a + v.views, 0) / (videos.length - half);

  const ratio = olderViews > 0 ? recentViews / olderViews : 1;
  let score: number;
  if (ratio >= 1.3) score = Math.min(100, Math.round(70 + (ratio - 1) * 30));
  else if (ratio >= 1.0) score = Math.round(50 + (ratio - 1) * 66);
  else if (ratio >= 0.7) score = Math.round(30 + (ratio - 0.7) * 66);
  else score = Math.max(0, Math.round(ratio * 43));

  // Factor in subscriber scale
  const viewSubRatio = recentViews / Math.max(1, subscribers);
  if (viewSubRatio > 0.5) score = Math.min(100, score + 10);

  score = Math.max(0, Math.min(100, score));

  if (ratio >= 1.2) return { score, description: `최근 영상이 이전 대비 ${Math.round((ratio - 1) * 100)}% 성장` };
  if (ratio >= 0.9) return { score, description: "조회수가 안정적으로 유지되고 있음" };
  return { score, description: `최근 조회수가 이전 대비 ${Math.round((1 - ratio) * 100)}% 하락` };
}

function calcEngagementHealth(videos: VideoInfo[]): { score: number; description: string } {
  if (videos.length === 0) return { score: 50, description: "데이터 없음" };

  const totalViews = videos.reduce((a, v) => a + v.views, 0);
  const totalLikes = videos.reduce((a, v) => a + v.likes, 0);
  const totalComments = videos.reduce((a, v) => a + v.comments, 0);

  const likeRate = totalViews > 0 ? (totalLikes / totalViews) * 100 : 0; // percent
  const commentRate = totalViews > 0 ? (totalComments / totalViews) * 100 : 0;

  // Typical YouTube: 2-4% like rate, 0.05-0.5% comment rate
  const likeScore = Math.min(60, Math.round(likeRate * 15));
  const commentScore = Math.min(40, Math.round(commentRate * 40));
  const score = Math.max(0, Math.min(100, likeScore + commentScore));

  if (score >= 80) return { score, description: `좋아요 ${likeRate.toFixed(1)}%, 댓글 ${commentRate.toFixed(2)}%로 높은 참여도` };
  if (score >= 50) return { score, description: `좋아요 ${likeRate.toFixed(1)}%, 댓글 ${commentRate.toFixed(2)}%로 보통 수준` };
  return { score, description: `참여도가 낮음 (좋아요 ${likeRate.toFixed(1)}%)` };
}

function calcShortsDependency(videos: VideoInfo[]): { score: number; description: string } {
  if (videos.length === 0) return { score: 50, description: "데이터 없음" };

  const shortsCount = videos.filter((v) => parseDurationSeconds(v.duration) <= 60).length;
  const ratio = shortsCount / videos.length;

  let score: number;
  if (ratio <= 0.3) score = 100;
  else if (ratio <= 0.5) score = 80;
  else if (ratio <= 0.7) score = 50;
  else score = 20;

  const pct = Math.round(ratio * 100);
  if (ratio <= 0.3) return { score, description: `쇼츠 비중 ${pct}%로 적절한 균형` };
  if (ratio <= 0.5) return { score, description: `쇼츠 비중 ${pct}%로 양호하나 모니터링 필요` };
  return { score, description: `쇼츠 비중 ${pct}%로 장기 성장에 불리할 수 있음` };
}

function calcContentDiversity(videos: VideoInfo[]): { score: number; description: string } {
  if (videos.length < 3) return { score: 50, description: "영상 수가 부족하여 분석 불가" };

  // Extract keywords from titles
  const allWords = videos
    .flatMap((v) =>
      v.title
        .replace(/[^\w\sㄱ-ㅎ가-힣]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 2)
    );

  const wordFreq = new Map<string, number>();
  for (const w of allWords) {
    wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
  }

  const uniqueWords = wordFreq.size;
  const totalWords = allWords.length;
  const uniqueRatio = totalWords > 0 ? uniqueWords / totalWords : 0;

  // Check concentration: top 3 words vs total
  const sorted = [...wordFreq.entries()].sort((a, b) => b[1] - a[1]);
  const top3Count = sorted.slice(0, 3).reduce((a, [, c]) => a + c, 0);
  const concentration = totalWords > 0 ? top3Count / totalWords : 0;

  let score = Math.round(uniqueRatio * 80 + (1 - concentration) * 40);
  score = Math.max(0, Math.min(100, score));

  if (score >= 70) return { score, description: "다양한 주제의 콘텐츠를 제작하고 있음" };
  if (score >= 45) return { score, description: "콘텐츠 주제가 일부 편중되어 있음" };
  return { score, description: "특정 주제에 과도하게 집중 - 다양화 권장" };
}

/* ---------- Helpers ---------- */

function getGrade(score: number): { grade: string; comment: string } {
  if (score >= 90) return { grade: "A+", comment: "매우 건강한 채널입니다!" };
  if (score >= 80) return { grade: "A", comment: "건강하게 성장하고 있는 채널입니다" };
  if (score >= 70) return { grade: "B+", comment: "양호하지만 개선 여지가 있습니다" };
  if (score >= 60) return { grade: "B", comment: "보통 수준입니다. 일부 항목을 개선해보세요" };
  if (score >= 50) return { grade: "C", comment: "주의가 필요한 채널입니다" };
  return { grade: "D", comment: "전반적인 개선이 시급합니다" };
}

function getStatus(score: number): "good" | "warning" | "danger" {
  if (score >= 70) return "good";
  if (score >= 45) return "warning";
  return "danger";
}

function buildDiagnosis(items: HealthItem[]): DiagnosisSummary {
  const sorted = [...items].sort((a, b) => b.score - a.score);
  const strengths: string[] = [];
  const improvements: string[] = [];
  const warnings: string[] = [];

  for (const item of sorted) {
    if (item.score >= 75) {
      strengths.push(`${item.label}: ${item.description}`);
    } else if (item.score >= 45) {
      improvements.push(`${item.label}: ${item.description}`);
    } else {
      warnings.push(`${item.label}: ${item.description}`);
    }
  }

  return {
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
    warnings: warnings.slice(0, 3),
  };
}

/* ---------- Category Average ---------- */

const CATEGORY_BENCHMARKS: Record<string, CategoryAverage> = {
  default:       { uploadConsistency: 60, viewStability: 60, growthMomentum: 55, engagementHealth: 55, shortsDependency: 65, contentDiversity: 58 },
  gaming:        { uploadConsistency: 70, viewStability: 55, growthMomentum: 52, engagementHealth: 65, shortsDependency: 60, contentDiversity: 55 },
  music:         { uploadConsistency: 50, viewStability: 65, growthMomentum: 65, engagementHealth: 60, shortsDependency: 55, contentDiversity: 62 },
  entertainment: { uploadConsistency: 60, viewStability: 60, growthMomentum: 60, engagementHealth: 60, shortsDependency: 60, contentDiversity: 60 },
  education:     { uploadConsistency: 65, viewStability: 55, growthMomentum: 50, engagementHealth: 50, shortsDependency: 70, contentDiversity: 65 },
};

function getCategoryAverage(category?: string): CategoryAverage {
  return CATEGORY_BENCHMARKS[category ?? ""] ?? CATEGORY_BENCHMARKS.default;
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
    const subscribers = parseInt(ch.statistics.subscriberCount) || 0;

    // 2. Recent 20 videos
    const recentSearch = await youtubeClient.getChannelVideos(resolvedId, 20);
    const videoIds = recentSearch.items
      .map((v) => v.id.videoId)
      .filter((id): id is string => !!id);

    if (videoIds.length === 0) {
      return NextResponse.json(
        { error: { code: "NO_DATA", message: "채널에 분석할 영상이 없습니다" } },
        { status: 404 }
      );
    }

    const videoDetails = await youtubeClient.getVideoDetails(videoIds);
    const videos: VideoInfo[] = videoDetails.items.map((v) => ({
      title: v.snippet.title,
      publishedAt: v.snippet.publishedAt,
      views: parseInt(v.statistics.viewCount || "0"),
      likes: parseInt(v.statistics.likeCount || "0"),
      comments: parseInt(v.statistics.commentCount || "0"),
      duration: v.contentDetails.duration,
    }));

    // Sort by published date (newest first)
    videos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // 3. Calculate each health item
    const uc = calcUploadConsistency(videos);
    const vs = calcViewStability(videos);
    const gm = calcGrowthMomentum(videos, subscribers);
    const eh = calcEngagementHealth(videos);
    const sd = calcShortsDependency(videos);
    const cd = calcContentDiversity(videos);

    const items: HealthItem[] = [
      { key: "uploadConsistency", label: "업로드 일관성", score: uc.score, status: getStatus(uc.score), description: uc.description },
      { key: "viewStability", label: "조회수 안정성", score: vs.score, status: getStatus(vs.score), description: vs.description },
      { key: "growthMomentum", label: "성장 모멘텀", score: gm.score, status: getStatus(gm.score), description: gm.description },
      { key: "engagementHealth", label: "참여도 건강", score: eh.score, status: getStatus(eh.score), description: eh.description },
      { key: "shortsDependency", label: "쇼츠 의존도", score: sd.score, status: getStatus(sd.score), description: sd.description },
      { key: "contentDiversity", label: "콘텐츠 다양성", score: cd.score, status: getStatus(cd.score), description: cd.description },
    ];

    // 4. Total score (weighted average)
    const weights = [0.15, 0.2, 0.2, 0.2, 0.1, 0.15];
    const totalScore = Math.round(
      items.reduce((sum, item, i) => sum + item.score * weights[i], 0)
    );

    const { grade, comment } = getGrade(totalScore);
    const categoryAvg = getCategoryAverage();

    const response: HealthResponse = {
      channelId: resolvedId,
      channelName: ch.snippet.title,
      thumbnail: ch.snippet.thumbnails.high.url,
      subscribers,
      totalScore,
      grade,
      gradeComment: comment,
      items,
      diagnosis: buildDiagnosis(items),
      categoryAverage: categoryAvg,
      radarData: items.map((item) => ({
        axis: item.label,
        channel: item.score,
        average: categoryAvg[item.key as keyof CategoryAverage] || 60,
      })),
    };

    return NextResponse.json({ data: response });
  } catch (err) {
    console.error("Channel Health API error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "건강검진 중 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}
