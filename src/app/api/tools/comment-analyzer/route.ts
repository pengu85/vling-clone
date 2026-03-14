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

// ── Mock fallback ──

function getMockAnalysis(): CommentAnalysisResponse {
  const sentiments: Array<CommentItem["sentiment"]> = [
    "positive",
    "negative",
    "neutral",
    "question",
    "support",
  ];

  const mockCommentTexts: Record<string, string[]> = {
    positive: [
      "진짜 도움 많이 됐어요! 감사합니다",
      "이런 영상 너무 좋아요 ㅠㅠ",
      "퀄리티가 미쳤다...",
    ],
    negative: [
      "좀 아쉬운 부분이 있네요",
      "이건 좀 별로인 것 같아요",
      "기대했는데 실망이에요",
    ],
    neutral: [
      "오 그렇군요",
      "참고하겠습니다",
      "나중에 봐야겠다",
    ],
    question: [
      "이거 어디서 살 수 있나요?",
      "다음 영상은 언제 나오나요?",
      "초보자도 따라할 수 있을까요?",
    ],
    support: [
      "항상 응원합니다! 화이팅!",
      "구독 누르고 갑니다 ❤️",
      "최고의 크리에이터!",
    ],
  };

  const mockNames = [
    "유튜브팬", "시청자A", "구독자123", "댓글러", "팬클럽",
    "뷰어킹", "시청왕", "댓글요정", "구독요정", "시청매니아",
    "팬보이", "시청자B", "댓글마스터", "구독신", "시청Pro",
  ];

  const mockComments: CommentItem[] = [];
  for (let i = 0; i < 30; i++) {
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    const texts = mockCommentTexts[sentiment];
    mockComments.push({
      id: `mock_${i}`,
      text: texts[Math.floor(Math.random() * texts.length)],
      likeCount: Math.floor(Math.random() * 200),
      publishedAt: new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      authorName: mockNames[i % mockNames.length],
      authorImage: "",
      replyCount: Math.floor(Math.random() * 5),
      sentiment,
    });
  }

  const sentimentSummary: SentimentSummary = {
    positive: mockComments.filter((c) => c.sentiment === "positive").length,
    negative: mockComments.filter((c) => c.sentiment === "negative").length,
    neutral: mockComments.filter((c) => c.sentiment === "neutral").length,
    question: mockComments.filter((c) => c.sentiment === "question").length,
    support: mockComments.filter((c) => c.sentiment === "support").length,
  };

  const videoPublishedAt = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const timeDistribution: TimeDistribution[] = TIME_PERIODS.map((period) => ({
    period,
    positive: Math.floor(Math.random() * 5),
    negative: Math.floor(Math.random() * 3),
    neutral: Math.floor(Math.random() * 4),
    question: Math.floor(Math.random() * 2),
    support: Math.floor(Math.random() * 3),
  }));

  const representativeComments: Record<string, CommentItem[]> = {};
  for (const s of sentiments) {
    representativeComments[s] = mockComments
      .filter((c) => c.sentiment === s)
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, 3);
  }

  return {
    totalComments: 30,
    sentimentSummary,
    timeDistribution,
    keywords: [
      { text: "감사", count: 8, sentiment: "positive" },
      { text: "도움", count: 6, sentiment: "positive" },
      { text: "좋아요", count: 5, sentiment: "positive" },
      { text: "응원", count: 4, sentiment: "positive" },
      { text: "아쉬운", count: 3, sentiment: "negative" },
      { text: "실망", count: 2, sentiment: "negative" },
      { text: "궁금", count: 4, sentiment: "neutral" },
      { text: "참고", count: 3, sentiment: "neutral" },
      { text: "다음", count: 3, sentiment: "neutral" },
      { text: "구독", count: 5, sentiment: "positive" },
    ],
    representativeComments,
    insights: {
      summary:
        "전반적으로 긍정적인 반응이 우세하며, 시청자들이 콘텐츠의 유용성을 높이 평가하고 있습니다. 응원 댓글도 상당수 존재합니다.",
      negativePatterns:
        "부정 댓글은 주로 기대와 실제 내용의 차이에서 비롯됩니다. 영상 초반에 명확한 목차를 제시하면 개선될 수 있습니다.",
      topQuestions:
        "시청자들은 구매처, 다음 영상 일정, 난이도에 대한 질문이 많습니다. FAQ 고정 댓글을 활용해보세요.",
    },
    videoTitle: "샘플 영상 (Mock 데이터)",
    videoPublishedAt,
  };
}

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

  if (rawComments.length === 0) {
    await new Promise((r) => setTimeout(r, 1000));
    return NextResponse.json({ data: getMockAnalysis() });
  }

  // ── AI sentiment analysis ──
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ data: getMockAnalysis() });
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
    return NextResponse.json({ data: getMockAnalysis() });
  }
}
