import { NextRequest, NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";
import { cache } from "@/lib/cache";

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

// ── Route handler ──

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawInput = body.channelId;

    if (!rawInput || typeof rawInput !== "string" || rawInput.trim().length === 0) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "channelId는 비어있지 않은 문자열이어야 합니다" } },
        { status: 400 }
      );
    }

    const cacheKey = `spam-comments:v1:${rawInput.trim()}`;
    const cachedResult = await cache.get<SpamAnalysisResponse>(cacheKey);
    if (cachedResult) {
      return NextResponse.json(cachedResult);
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
          return NextResponse.json({ error: "채널을 찾을 수 없습니다" }, { status: 404 });
        }
      } catch {
        return NextResponse.json({ error: "채널을 찾을 수 없습니다" }, { status: 404 });
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
      return NextResponse.json({ error: "댓글을 가져오는데 실패했습니다" }, { status: 500 });
    }

    if (videoIds.length === 0) {
      return NextResponse.json({ data: { totalComments: 0, spamComments: [], spamRate: 0, summary: "분석할 댓글이 없습니다" } });
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
      return NextResponse.json({ data: { totalComments: 0, spamComments: [], spamRate: 0, summary: "분석할 댓글이 없습니다" } });
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

    await cache.set(cacheKey, response, 3600);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Spam comment analysis error:", error);
    return NextResponse.json({ error: "스팸 댓글 분석 중 오류가 발생했습니다" }, { status: 500 });
  }
}
