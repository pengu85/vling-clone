import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { youtubeClient } from "@/lib/youtube";

// ── Types ──

export interface CommentItem {
  id: string;
  text: string;
  likeCount: number;
  publishedAt: string;
  authorName: string;
  authorImage: string;
  replyCount: number;
  sentiment: "positive" | "negative" | "neutral" | "question" | "support";
}

interface SentimentSummary {
  positive: number;
  negative: number;
  neutral: number;
  question: number;
  support: number;
}

interface TimeDistribution {
  period: string;
  positive: number;
  negative: number;
  neutral: number;
  question: number;
  support: number;
}

interface KeywordItem {
  text: string;
  count: number;
  sentiment: "positive" | "negative" | "neutral";
}

interface InsightData {
  summary: string;
  negativePatterns: string;
  topQuestions: string;
}

export interface CommentAnalysisResponse {
  totalComments: number;
  sentimentSummary: SentimentSummary;
  timeDistribution: TimeDistribution[];
  keywords: KeywordItem[];
  representativeComments: Record<string, CommentItem[]>;
  insights: InsightData;
  videoTitle: string;
  videoPublishedAt: string;
}

// ── Video ID extraction ──

function extractVideoId(input: string): string | null {
  const trimmed = input.trim();

  // Direct video ID (11 chars)
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;

  // Various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([\w-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }

  return null;
}

// ── Time bucket classification ──

function getTimeBucket(commentDate: string, videoDate: string): string {
  const commentTime = new Date(commentDate).getTime();
  const videoTime = new Date(videoDate).getTime();
  const diffHours = (commentTime - videoTime) / (1000 * 60 * 60);

  if (diffHours < 1) return "1시간 이내";
  if (diffHours < 6) return "1-6시간";
  if (diffHours < 24) return "6-24시간";
  if (diffHours < 48) return "24-48시간";
  if (diffHours < 168) return "2-7일";
  return "7일 이후";
}

const TIME_PERIODS = [
  "1시간 이내",
  "1-6시간",
  "6-24시간",
  "24-48시간",
  "2-7일",
  "7일 이후",
];

// ── Route handler ──

export async function POST(request: NextRequest) {
  let body: { videoUrl?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_JSON",
          message: "요청 본문을 파싱할 수 없습니다",
        },
      },
      { status: 400 }
    );
  }

  const { videoUrl } = body;
  if (!videoUrl) {
    return NextResponse.json(
      {
        error: {
          code: "MISSING_INPUT",
          message: "영상 URL을 입력하세요",
        },
      },
      { status: 400 }
    );
  }

  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_URL",
          message: "올바른 YouTube 영상 URL을 입력하세요",
        },
      },
      { status: 400 }
    );
  }

  // ── Fetch comments & video info from YouTube ──
  const hasYouTubeKey = !!process.env.YOUTUBE_API_KEY;
  let rawComments: Array<{
    id: string;
    text: string;
    likeCount: number;
    publishedAt: string;
    authorName: string;
    authorImage: string;
    replyCount: number;
  }> = [];
  let videoTitle = "";
  let videoPublishedAt = "";

  if (hasYouTubeKey) {
    try {
      const [commentRes, videoRes] = await Promise.all([
        youtubeClient.getVideoComments(videoId, 100),
        youtubeClient.getVideoDetails([videoId]),
      ]);

      if (videoRes.items.length > 0) {
        videoTitle = videoRes.items[0].snippet.title;
        videoPublishedAt = videoRes.items[0].snippet.publishedAt;
      }

      rawComments = commentRes.items.map((item) => {
        const s = item.snippet.topLevelComment.snippet;
        return {
          id: item.id,
          text: s.textDisplay,
          likeCount: s.likeCount,
          publishedAt: s.publishedAt,
          authorName: s.authorDisplayName,
          authorImage: s.authorProfileImageUrl,
          replyCount: item.snippet.totalReplyCount,
        };
      });
    } catch {
      // Fall through to mock
    }
  }

  if (!hasYouTubeKey) {
    return NextResponse.json({ error: { code: "API_KEY_REQUIRED", message: "YouTube API 키가 설정되지 않았습니다" } }, { status: 503 });
  }

  if (rawComments.length === 0) {
    return NextResponse.json({ error: { code: "NO_COMMENTS", message: "분석할 댓글이 없습니다" } }, { status: 404 });
  }

  // ── AI sentiment analysis ──
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: { code: "API_KEY_REQUIRED", message: "AI 분석 API 키가 설정되지 않았습니다" } }, { status: 503 });
  }

  const client = new Anthropic({ apiKey });

  const commentTexts = rawComments.map((c, i) => ({
    index: i,
    text: c.text.slice(0, 200),
    likes: c.likeCount,
  }));

  const prompt = `당신은 유튜브 댓글 감정 분석 전문가입니다. 다음 댓글들의 감정을 분석해주세요.

댓글 목록:
${JSON.stringify(commentTexts, null, 2)}

각 댓글을 다음 5가지 감정 중 하나로 분류하세요:
- positive (긍정: 칭찬, 만족, 좋아함)
- negative (부정: 불만, 비판, 실망)
- neutral (중립: 정보성, 단순 반응)
- question (질문: 궁금증, 요청)
- support (응원: 격려, 팬심, 구독 관련)

또한 다음 정보를 추출하세요:
1. 자주 등장하는 키워드 (최대 15개, 각 키워드의 감정 포함)
2. 전체 시청자 반응 요약 (2-3문장)
3. 주의가 필요한 부정 댓글 패턴 (2-3문장)
4. 시청자가 가장 많이 궁금해하는 것 (2-3문장)

다음 JSON 형식으로만 응답하세요:
{
  "sentiments": [
    { "index": 0, "sentiment": "positive" }
  ],
  "keywords": [
    { "text": "감사", "count": 5, "sentiment": "positive" }
  ],
  "insights": {
    "summary": "전체 반응 요약",
    "negativePatterns": "부정 댓글 패턴",
    "topQuestions": "시청자 궁금증"
  }
}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);

    // Map sentiments to comments
    const aiSentiments: Array<{
      index: number;
      sentiment: CommentItem["sentiment"];
    }> = parsed.sentiments ?? [];

    const comments: CommentItem[] = rawComments.map((c, i) => {
      const aiData = aiSentiments.find((a) => a.index === i);
      return {
        ...c,
        sentiment: aiData?.sentiment ?? "neutral",
      };
    });

    // Build sentiment summary
    const sentimentSummary: SentimentSummary = {
      positive: 0,
      negative: 0,
      neutral: 0,
      question: 0,
      support: 0,
    };
    for (const c of comments) {
      sentimentSummary[c.sentiment]++;
    }

    // Build time distribution
    const timeDistribution: TimeDistribution[] = TIME_PERIODS.map(
      (period) => ({
        period,
        positive: 0,
        negative: 0,
        neutral: 0,
        question: 0,
        support: 0,
      })
    );

    for (const c of comments) {
      const bucket = getTimeBucket(c.publishedAt, videoPublishedAt);
      const entry = timeDistribution.find((t) => t.period === bucket);
      if (entry) entry[c.sentiment]++;
    }

    // Representative comments per sentiment
    const representativeComments: Record<string, CommentItem[]> = {};
    const sentimentTypes: CommentItem["sentiment"][] = [
      "positive",
      "negative",
      "neutral",
      "question",
      "support",
    ];
    for (const s of sentimentTypes) {
      representativeComments[s] = comments
        .filter((c) => c.sentiment === s)
        .sort((a, b) => b.likeCount - a.likeCount)
        .slice(0, 3);
    }

    const result: CommentAnalysisResponse = {
      totalComments: comments.length,
      sentimentSummary,
      timeDistribution,
      keywords: parsed.keywords ?? [],
      representativeComments,
      insights: {
        summary:
          parsed.insights?.summary ?? "분석 데이터가 부족합니다.",
        negativePatterns:
          parsed.insights?.negativePatterns ??
          "부정 댓글 패턴 데이터가 부족합니다.",
        topQuestions:
          parsed.insights?.topQuestions ?? "질문 데이터가 부족합니다.",
      },
      videoTitle,
      videoPublishedAt,
    };

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json({ error: { code: "ANALYSIS_FAILED", message: "댓글 감정 분석 중 오류가 발생했습니다" } }, { status: 500 });
  }
}
