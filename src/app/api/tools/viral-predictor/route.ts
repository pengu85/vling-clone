import { NextRequest, NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";

/* ---------- Types ---------- */

interface VideoStats {
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  tags: string[];
}

interface ViralFactor {
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

interface TimelinePoint {
  label: string;
  hours: number;
  optimistic: number;
  baseline: number;
  conservative: number;
  actual?: number;
}

interface ViralPrediction {
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  hoursOld: number;
  currentViews: number;
  currentLikes: number;
  currentComments: number;
  viralScore: number;
  metrics: {
    viewsPerHour: number;
    engagementRate: number;
    commentsPerHour: number;
    categoryMultiplier: number;
  };
  timeline: TimelinePoint[];
  factors: ViralFactor[];
}

/* ---------- Viral Score Calculation ---------- */

function calculateViralScore(video: VideoStats): number {
  const hoursOld =
    (Date.now() - new Date(video.publishedAt).getTime()) / 3600000;
  const viewsPerHour = video.views / Math.max(1, hoursOld);
  const engagementRate =
    (video.likes + video.comments) / Math.max(1, video.views);

  let score = 0;
  // 시간당 조회수 (최대 40점)
  score += Math.min(40, viewsPerHour / 100);
  // 참여도 (최대 30점)
  score += Math.min(30, engagementRate * 300);
  // 신선도 보너스 (24시간 이내면 +15)
  if (hoursOld < 24) score += 15;
  // 좋아요 비율 (최대 15점)
  score += Math.min(15, (video.likes / Math.max(1, video.views)) * 150);

  return Math.min(100, Math.round(score));
}

/* ---------- Timeline Prediction ---------- */

function generateTimeline(video: VideoStats): TimelinePoint[] {
  const hoursOld =
    (Date.now() - new Date(video.publishedAt).getTime()) / 3600000;
  const viewsPerHour = video.views / Math.max(1, hoursOld);

  const milestones = [
    { label: "1시간", hours: 1 },
    { label: "6시간", hours: 6 },
    { label: "24시간", hours: 24 },
    { label: "48시간", hours: 48 },
    { label: "7일", hours: 168 },
  ];

  return milestones.map((m) => {
    const baseProjection = viewsPerHour * m.hours;
    // Apply decay: growth slows over time
    const decayFactor = 1 / (1 + Math.log(1 + m.hours / 24));
    const baseline = Math.round(baseProjection * decayFactor);
    const optimistic = Math.round(baseline * 1.8);
    const conservative = Math.round(baseline * 0.5);

    return {
      label: m.label,
      hours: m.hours,
      optimistic,
      baseline,
      conservative,
      ...(m.hours <= hoursOld ? { actual: video.views } : {}),
    };
  });
}

/* ---------- Viral Factors ---------- */

function analyzeFactors(video: VideoStats): ViralFactor[] {
  const hoursOld =
    (Date.now() - new Date(video.publishedAt).getTime()) / 3600000;
  const viewsPerHour = video.views / Math.max(1, hoursOld);
  const likeRatio = video.likes / Math.max(1, video.views);
  const commentsPerHour = video.comments / Math.max(1, hoursOld);

  // 클릭 유도 키워드 체크
  const clickbaitKeywords = [
    "충격",
    "대박",
    "레전드",
    "실화",
    "OMG",
    "놀라운",
    "미쳤",
    "역대급",
    "최초",
    "공개",
    "비밀",
    "반전",
  ];
  const hasClickbait = clickbaitKeywords.some(
    (kw) =>
      video.title.includes(kw) ||
      video.tags.some((t) => t.includes(kw))
  );

  const factors: ViralFactor[] = [
    {
      label: "제목에 클릭 유도 키워드 포함",
      status: hasClickbait ? "pass" : "warn",
      detail: hasClickbait
        ? "제목이나 태그에 관심을 끄는 키워드가 포함되어 있습니다"
        : "클릭 유도 키워드가 부족합니다",
    },
    {
      label: "첫 1시간 조회수 폭발적",
      status:
        viewsPerHour > 1000 ? "pass" : viewsPerHour > 200 ? "warn" : "fail",
      detail: `시간당 ${Math.round(viewsPerHour).toLocaleString()}회 조회`,
    },
    {
      label: "좋아요 비율 높음",
      status: likeRatio > 0.04 ? "pass" : likeRatio > 0.02 ? "warn" : "fail",
      detail: `좋아요 비율 ${(likeRatio * 100).toFixed(1)}%`,
    },
    {
      label: "댓글 활발",
      status:
        commentsPerHour > 50 ? "pass" : commentsPerHour > 10 ? "warn" : "fail",
      detail: `시간당 ${Math.round(commentsPerHour)}개 댓글`,
    },
    {
      label: "업로드 시간 최적",
      status: (() => {
        const uploadHour = new Date(video.publishedAt).getUTCHours();
        // KST = UTC+9, peak hours 18-22 KST → 9-13 UTC
        if (uploadHour >= 9 && uploadHour <= 13) return "pass";
        if (uploadHour >= 6 && uploadHour <= 15) return "warn";
        return "fail";
      })(),
      detail: (() => {
        const uploadHour = new Date(video.publishedAt).getUTCHours();
        const kstHour = (uploadHour + 9) % 24;
        return `업로드 시각: ${kstHour}시 (KST)`;
      })(),
    },
  ];

  return factors;
}

/* ---------- URL Parsing ---------- */

function extractVideoId(input: string): string | null {
  // Direct video ID (11 chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;

  try {
    const url = new URL(input);
    // youtu.be/VIDEO_ID
    if (url.hostname === "youtu.be") return url.pathname.slice(1) || null;
    // youtube.com/watch?v=VIDEO_ID
    if (
      url.hostname === "www.youtube.com" ||
      url.hostname === "youtube.com" ||
      url.hostname === "m.youtube.com"
    ) {
      const v = url.searchParams.get("v");
      if (v) return v;
      // youtube.com/shorts/VIDEO_ID
      const shortsMatch = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shortsMatch) return shortsMatch[1];
    }
  } catch {
    // Not a valid URL
  }
  return null;
}

/* ---------- Route Handler ---------- */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawInput: string = body.videoUrl || body.videoId || "";
    const videoId = extractVideoId(rawInput);

    if (!videoId) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "올바른 YouTube 영상 URL 또는 ID를 입력하세요",
          },
        },
        { status: 400 }
      );
    }

    let prediction!: ViralPrediction;

    try {
      const videoResponse = await youtubeClient.getVideoDetails([videoId]);
      if (!videoResponse.items || videoResponse.items.length === 0) {
        return NextResponse.json(
          {
            error: {
              code: "VIDEO_NOT_FOUND",
              message: "해당 영상을 찾을 수 없습니다",
            },
          },
          { status: 404 }
        );
      }

      const item = videoResponse.items[0];
      const stats: VideoStats = {
        videoId: item.id,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high.url,
        publishedAt: item.snippet.publishedAt,
        views: parseInt(item.statistics.viewCount) || 0,
        likes: parseInt(item.statistics.likeCount) || 0,
        comments: parseInt(item.statistics.commentCount) || 0,
        tags: item.snippet.tags || [],
      };

      const hoursOld =
        (Date.now() - new Date(stats.publishedAt).getTime()) / 3600000;
      const viewsPerHour = stats.views / Math.max(1, hoursOld);
      const engagementRate =
        (stats.likes + stats.comments) / Math.max(1, stats.views);
      const commentsPerHour = stats.comments / Math.max(1, hoursOld);

      prediction = {
        videoId: stats.videoId,
        title: stats.title,
        thumbnail: stats.thumbnail,
        publishedAt: stats.publishedAt,
        hoursOld: Math.round(hoursOld * 10) / 10,
        currentViews: stats.views,
        currentLikes: stats.likes,
        currentComments: stats.comments,
        viralScore: calculateViralScore(stats),
        metrics: {
          viewsPerHour: Math.round(viewsPerHour),
          engagementRate: Math.round(engagementRate * 10000) / 10000,
          commentsPerHour: Math.round(commentsPerHour * 10) / 10,
          categoryMultiplier:
            Math.round(
              (viewsPerHour / Math.max(1, 500)) * 10
            ) / 10,
        },
        timeline: generateTimeline(stats),
        factors: analyzeFactors(stats),
      };
    } catch {
      return NextResponse.json(
        { error: { code: "YOUTUBE_API_ERROR", message: "YouTube API 데이터를 가져올 수 없습니다" } },
        { status: 502 }
      );
    }

    return NextResponse.json({ data: prediction });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "서버 오류가 발생했습니다",
        },
      },
      { status: 500 }
    );
  }
}
