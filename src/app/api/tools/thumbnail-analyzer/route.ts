import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { youtubeClient } from "@/lib/youtube";
import { requireAuth, checkRateLimit, getClientIp } from "@/lib/apiAuth";
import { parseChannelInput } from "@/lib/parseChannel";

// ── Types ──

interface ThumbnailItem {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  views: number;
  score: number;
  highlights: string[];
}

interface AnalysisResult {
  colorPattern: string;
  textPlacement: string;
  facialExpression: string;
  composition: string;
  summary: string;
  suggestions: string[];
}

interface ThumbnailAnalysisResponse {
  thumbnails: ThumbnailItem[];
  analysis: AnalysisResult;
}

// ── Channel ID resolution ──

async function resolveChannelId(input: string): Promise<string | null> {
  const parsed = parseChannelInput(input);

  if (parsed.type === "id") {
    return parsed.value;
  }

  try {
    return await youtubeClient.resolveHandle(parsed.value);
  } catch {
    return null;
  }
}

// ── Route handler ──

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  const rateLimited = checkRateLimit(getClientIp(request), { limit: 10, windowSeconds: 60 });
  if (rateLimited) return rateLimited;

  let body: { channelInput?: string; imageUrl?: string };

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

  const { channelInput, imageUrl } = body;

  if (!channelInput && !imageUrl) {
    return NextResponse.json(
      {
        error: {
          code: "MISSING_INPUT",
          message: "채널 URL/ID 또는 이미지 URL을 입력하세요",
        },
      },
      { status: 400 }
    );
  }

  // ── Collect thumbnails from YouTube ──
  let videoThumbnails: {
    videoId: string;
    title: string;
    thumbnailUrl: string;
    views: number;
  }[] = [];

  if (channelInput) {
    const hasYouTubeKey = !!process.env.YOUTUBE_API_KEY;

    if (hasYouTubeKey) {
      try {
        const channelId = await resolveChannelId(channelInput);
        if (!channelId) {
          return NextResponse.json(
            {
              error: {
                code: "CHANNEL_NOT_FOUND",
                message: "채널을 찾을 수 없습니다. URL이나 ID를 확인해주세요.",
              },
            },
            { status: 404 }
          );
        }

        // Get recent videos
        const videosRes = await youtubeClient.getChannelVideos(channelId, 12);
        const videoIds = videosRes.items
          .map((item) => item.id.videoId)
          .filter(Boolean) as string[];

        if (videoIds.length > 0) {
          const detailRes = await youtubeClient.getVideoDetails(videoIds);
          videoThumbnails = detailRes.items.map((item) => ({
            videoId: item.id,
            title: item.snippet.title,
            thumbnailUrl:
              item.snippet.thumbnails?.high?.url ??
              `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
            views: parseInt(item.statistics.viewCount ?? "0", 10),
          }));
        }
      } catch {
        return NextResponse.json(
          { error: { code: "YOUTUBE_API_ERROR", message: "YouTube API 데이터를 가져올 수 없습니다" } },
          { status: 502 }
        );
      }
    }
  }

  // ── Single image analysis ──
  if (imageUrl && videoThumbnails.length === 0) {
    videoThumbnails = [
      {
        videoId: "uploaded",
        title: "업로드된 이미지",
        thumbnailUrl: imageUrl,
        views: 0,
      },
    ];
  }

  // ── AI Analysis ──
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: { code: "AI_UNAVAILABLE", message: "AI 분석 서비스를 사용할 수 없습니다" } },
      { status: 503 }
    );
  }

  const client = new Anthropic({ apiKey });

  const thumbnailSummary = videoThumbnails.map((t, i) => ({
    index: i,
    title: t.title,
    thumbnailUrl: t.thumbnailUrl,
    views: t.views,
  }));

  const prompt = `당신은 유튜브 썸네일 분석 전문가입니다. 다음 영상 목록의 썸네일을 분석해주세요.

영상 목록:
${JSON.stringify(thumbnailSummary, null, 2)}

각 썸네일의 URL을 참고하여 다음을 분석하세요:
1. 각 썸네일에 1-100점 점수 부여 (색상 대비, 텍스트 가독성, 인물 표정, 구도 종합)
2. 각 썸네일의 주요 특징 2개씩 (한국어, 짧게)
3. 전체적인 색상 패턴 분석
4. 텍스트 배치 분석
5. 인물/표정 분석
6. 구도 분석
7. 전체 요약
8. 개선 제안 3가지

다음 JSON 형식으로만 응답하세요:
{
  "thumbnails": [
    {
      "index": 0,
      "score": 85,
      "highlights": ["밝은 색상", "큰 텍스트"]
    }
  ],
  "analysis": {
    "colorPattern": "색상 패턴 분석 (2-3문장)",
    "textPlacement": "텍스트 배치 분석 (2-3문장)",
    "facialExpression": "인물/표정 분석 (2-3문장)",
    "composition": "구도 분석 (2-3문장)",
    "summary": "전체 요약 (2-3문장)",
    "suggestions": ["개선 제안 1", "개선 제안 2", "개선 제안 3"]
  }
}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);

    const aiThumbnails: Array<{
      index: number;
      score: number;
      highlights: string[];
    }> = parsed.thumbnails ?? [];

    const result: ThumbnailAnalysisResponse = {
      thumbnails: videoThumbnails.map((t, i) => {
        const aiData = aiThumbnails.find((a) => a.index === i);
        return {
          ...t,
          score: aiData?.score ?? 50,
          highlights: aiData?.highlights ?? ["분석 중"],
        };
      }),
      analysis: {
        colorPattern:
          parsed.analysis?.colorPattern ??
          "색상 패턴 데이터가 부족합니다.",
        textPlacement:
          parsed.analysis?.textPlacement ??
          "텍스트 배치 데이터가 부족합니다.",
        facialExpression:
          parsed.analysis?.facialExpression ??
          "인물/표정 데이터가 부족합니다.",
        composition:
          parsed.analysis?.composition ?? "구도 데이터가 부족합니다.",
        summary:
          parsed.analysis?.summary ?? "분석 요약 데이터가 부족합니다.",
        suggestions: parsed.analysis?.suggestions ?? [],
      },
    };

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json(
      { error: { code: "AI_UNAVAILABLE", message: "AI 분석 서비스를 사용할 수 없습니다" } },
      { status: 503 }
    );
  }
}
