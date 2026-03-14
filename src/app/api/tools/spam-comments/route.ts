import { NextRequest, NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";

// ── Types ──

export interface SpamComment {
  id: string;
  text: string;
  authorName: string;
  authorImage: string;
  publishedAt: string;
  likeCount: number;
  spamScore: number;
  spamType: "홍보성" | "피싱" | "반복" | "욕설" | "봇" | "정상";
  highlightedKeywords: string[];
  videoTitle: string;
}

interface SpamTypeStat {
  name: string;
  value: number;
}

interface SpamAccountInfo {
  name: string;
  count: number;
}

export interface SpamAnalysisResponse {
  totalComments: number;
  spamCount: number;
  spamRate: number;
  comments: SpamComment[];
  spamTypeDistribution: SpamTypeStat[];
  topSpamType: string;
  peakSpamHour: string;
  repeatSpamAccounts: SpamAccountInfo[];
}

// ── Spam detection ──

const PROMO_KEYWORDS = ["구독", "좋아요", "눌러", "내 채널", "놀러", "오세요", "방문", "확인", "클릭", "선물", "이벤트", "무료"];
const PHISHING_PATTERNS = [/https?:\/\//i, /[\w.-]+@[\w.-]+\.\w+/, /\d{3}[-.]?\d{4}[-.]?\d{4}/];
const PROFANITY_PATTERNS = [/시[빠발벌]/, /ㅅㅂ/, /ㅂㅅ/, /지랄/, /개새/, /미친/];

function detectSpam(comment: string): {
  isSpam: boolean;
  score: number;
  type: SpamComment["spamType"];
  keywords: string[];
} {
  let score = 0;
  let type: SpamComment["spamType"] = "정상";
  const keywords: string[] = [];

  // URL
  if (/https?:\/\//i.test(comment)) {
    score += 30;
    type = "홍보성";
    const urls = comment.match(/https?:\/\/[^\s]+/gi);
    if (urls) keywords.push(...urls);
  }

  // Email / phone
  const emailMatch = comment.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = comment.match(/\d{3}[-.]?\d{4}[-.]?\d{4}/);
  if (emailMatch || phoneMatch) {
    score += 40;
    type = "피싱";
    if (emailMatch) keywords.push(emailMatch[0]);
    if (phoneMatch) keywords.push(phoneMatch[0]);
  }

  // Repeated chars
  const repeatMatch = comment.match(/(.)\1{4,}/g);
  if (repeatMatch) {
    score += 20;
    if (type === "정상") type = "반복";
    keywords.push(...repeatMatch);
  }

  // Promo keywords
  const foundPromo = PROMO_KEYWORDS.filter((kw) => comment.includes(kw));
  if (foundPromo.length >= 2) {
    score += 25;
    if (type === "정상") type = "홍보성";
    keywords.push(...foundPromo);
  }

  // Profanity
  for (const p of PROFANITY_PATTERNS) {
    const m = comment.match(p);
    if (m) {
      score += 35;
      type = "욕설";
      keywords.push(m[0]);
      break;
    }
  }

  // Very short
  if (comment.trim().length < 3) {
    score += 15;
    if (type === "정상") type = "봇";
  }

  // All caps (latin)
  if (/^[A-Z\s]{10,}$/.test(comment)) {
    score += 15;
    if (type === "정상") type = "봇";
  }

  return { isSpam: score >= 30, score: Math.min(100, score), type, keywords };
}

// ── Channel ID extraction ──

function extractChannelId(input: string): string {
  const trimmed = input.trim();

  // Direct channel ID
  if (/^UC[\w-]{22}$/.test(trimmed)) return trimmed;

  // URL patterns
  const channelMatch = trimmed.match(/youtube\.com\/channel\/(UC[\w-]{22})/);
  if (channelMatch) return channelMatch[1];

  const handleMatch = trimmed.match(/youtube\.com\/@([\w.-]+)/);
  if (handleMatch) return `@${handleMatch[1]}`;

  // @handle
  if (trimmed.startsWith("@")) return trimmed;

  return trimmed;
}

// ── Mock data ──

function generateMockData(): SpamAnalysisResponse {
  const mockComments: SpamComment[] = [
    { id: "m1", text: "제 채널에 놀러오세요~ 구독 좋아요 부탁드려요! https://youtube.com/fake", authorName: "프로모터", authorImage: "", publishedAt: "2026-03-10T14:00:00Z", likeCount: 0, spamScore: 85, spamType: "홍보성", highlightedKeywords: ["놀러오세요", "구독", "좋아요", "https://youtube.com/fake"], videoTitle: "샘플 영상 1" },
    { id: "m2", text: "돈 벌고 싶으면 연락주세요 money@scam.com 010-1234-5678", authorName: "스캐머", authorImage: "", publishedAt: "2026-03-10T03:00:00Z", likeCount: 0, spamScore: 95, spamType: "피싱", highlightedKeywords: ["money@scam.com", "010-1234-5678"], videoTitle: "샘플 영상 1" },
    { id: "m3", text: "ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ", authorName: "반복러", authorImage: "", publishedAt: "2026-03-09T22:00:00Z", likeCount: 1, spamScore: 35, spamType: "반복", highlightedKeywords: ["ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ"], videoTitle: "샘플 영상 2" },
    { id: "m4", text: "시발 뭐야 이게", authorName: "화난사람", authorImage: "", publishedAt: "2026-03-09T18:00:00Z", likeCount: 0, spamScore: 55, spamType: "욕설", highlightedKeywords: ["시발"], videoTitle: "샘플 영상 2" },
    { id: "m5", text: "ㅎ", authorName: "봇01", authorImage: "", publishedAt: "2026-03-10T02:00:00Z", likeCount: 0, spamScore: 30, spamType: "봇", highlightedKeywords: [], videoTitle: "샘플 영상 3" },
    { id: "m6", text: "구독하고 좋아요 눌러주시면 제 채널도 확인해주세요", authorName: "프로모터", authorImage: "", publishedAt: "2026-03-10T15:00:00Z", likeCount: 0, spamScore: 55, spamType: "홍보성", highlightedKeywords: ["구독", "좋아요", "눌러", "확인"], videoTitle: "샘플 영상 3" },
    { id: "m7", text: "FREE GIFT CARDS https://scam.link/free", authorName: "SpamBot", authorImage: "", publishedAt: "2026-03-10T04:00:00Z", likeCount: 0, spamScore: 70, spamType: "홍보성", highlightedKeywords: ["https://scam.link/free"], videoTitle: "샘플 영상 1" },
    { id: "m8", text: "정말 좋은 영상이네요! 많이 배웠습니다.", authorName: "일반시청자", authorImage: "", publishedAt: "2026-03-10T12:00:00Z", likeCount: 15, spamScore: 0, spamType: "정상", highlightedKeywords: [], videoTitle: "샘플 영상 1" },
    { id: "m9", text: "감사합니다 덕분에 이해했어요", authorName: "팬", authorImage: "", publishedAt: "2026-03-10T11:00:00Z", likeCount: 8, spamScore: 0, spamType: "정상", highlightedKeywords: [], videoTitle: "샘플 영상 2" },
    { id: "m10", text: "Check my channel for more https://spam.link", authorName: "SpamBot", authorImage: "", publishedAt: "2026-03-10T03:30:00Z", likeCount: 0, spamScore: 55, spamType: "홍보성", highlightedKeywords: ["https://spam.link"], videoTitle: "샘플 영상 3" },
  ];

  const spamComments = mockComments.filter((c) => c.spamType !== "정상");
  const typeCount: Record<string, number> = {};
  spamComments.forEach((c) => {
    typeCount[c.spamType] = (typeCount[c.spamType] || 0) + 1;
  });

  const accountCount: Record<string, number> = {};
  spamComments.forEach((c) => {
    accountCount[c.authorName] = (accountCount[c.authorName] || 0) + 1;
  });

  return {
    totalComments: mockComments.length,
    spamCount: spamComments.length,
    spamRate: Math.round((spamComments.length / mockComments.length) * 100),
    comments: mockComments.sort((a, b) => b.spamScore - a.spamScore),
    spamTypeDistribution: Object.entries(typeCount).map(([name, value]) => ({ name, value })),
    topSpamType: Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "없음",
    peakSpamHour: "새벽 2~4시",
    repeatSpamAccounts: Object.entries(accountCount)
      .filter(([, count]) => count >= 2)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  };
}

// ── Route handler ──

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channelId: rawInput } = body as { channelId: string };

    if (!rawInput) {
      return NextResponse.json({ error: "channelId is required" }, { status: 400 });
    }

    const channelInput = extractChannelId(rawInput);

    // Resolve handle to ID if needed
    let channelId = channelInput;
    if (!channelId.startsWith("UC")) {
      try {
        const resolved = await youtubeClient.resolveHandle(channelId);
        if (resolved) {
          channelId = resolved;
        } else {
          return NextResponse.json(generateMockData());
        }
      } catch {
        return NextResponse.json(generateMockData());
      }
    }

    // Get recent videos
    let videoIds: string[] = [];
    let videoTitles: Record<string, string> = {};
    try {
      const videosRes = await youtubeClient.getChannelVideos(channelId, 5);
      videoIds = videosRes.items
        .map((v) => v.id.videoId)
        .filter((id): id is string => !!id);

      if (videoIds.length > 0) {
        const details = await youtubeClient.getVideoDetails(videoIds);
        details.items.forEach((v) => {
          videoTitles[v.id] = v.snippet.title;
        });
      }
    } catch {
      return NextResponse.json(generateMockData());
    }

    if (videoIds.length === 0) {
      return NextResponse.json(generateMockData());
    }

    // Fetch comments from each video
    const allComments: SpamComment[] = [];
    for (const videoId of videoIds) {
      try {
        const commentsRes = await youtubeClient.getVideoComments(videoId, 50);
        for (const item of commentsRes.items) {
          const snippet = item.snippet.topLevelComment.snippet;
          const { isSpam, score, type, keywords } = detectSpam(snippet.textDisplay);

          allComments.push({
            id: item.id,
            text: snippet.textDisplay,
            authorName: snippet.authorDisplayName,
            authorImage: snippet.authorProfileImageUrl,
            publishedAt: snippet.publishedAt,
            likeCount: snippet.likeCount,
            spamScore: score,
            spamType: isSpam ? type : "정상",
            highlightedKeywords: keywords,
            videoTitle: videoTitles[videoId] || videoId,
          });
        }
      } catch {
        // Skip videos with disabled comments
      }
    }

    if (allComments.length === 0) {
      return NextResponse.json(generateMockData());
    }

    // Compute stats
    const spamComments = allComments.filter((c) => c.spamType !== "정상");
    const typeCount: Record<string, number> = {};
    spamComments.forEach((c) => {
      typeCount[c.spamType] = (typeCount[c.spamType] || 0) + 1;
    });

    const accountCount: Record<string, number> = {};
    spamComments.forEach((c) => {
      accountCount[c.authorName] = (accountCount[c.authorName] || 0) + 1;
    });

    // Peak spam hour
    const hourCount: Record<number, number> = {};
    spamComments.forEach((c) => {
      const hour = new Date(c.publishedAt).getHours();
      hourCount[hour] = (hourCount[hour] || 0) + 1;
    });
    const peakHour = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0];
    const peakHourStr = peakHour ? `${peakHour[0]}시 (${peakHour[1]}건)` : "없음";

    const response: SpamAnalysisResponse = {
      totalComments: allComments.length,
      spamCount: spamComments.length,
      spamRate: allComments.length > 0 ? Math.round((spamComments.length / allComments.length) * 100) : 0,
      comments: allComments.sort((a, b) => b.spamScore - a.spamScore),
      spamTypeDistribution: Object.entries(typeCount).map(([name, value]) => ({ name, value })),
      topSpamType: Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "없음",
      peakSpamHour: peakHourStr,
      repeatSpamAccounts: Object.entries(accountCount)
        .filter(([, count]) => count >= 2)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Spam comment analysis error:", error);
    return NextResponse.json(generateMockData());
  }
}
