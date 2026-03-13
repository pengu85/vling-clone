import { NextRequest, NextResponse } from "next/server";
import { runAIInsight } from "@/lib/ai";

interface RouteParams {
  params: Promise<{ channelId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { channelId } = await params;

  if (!channelId || channelId.trim().length === 0) {
    return NextResponse.json(
      { error: { code: "MISSING_CHANNEL_ID", message: "채널 ID가 없습니다" } },
      { status: 400 }
    );
  }

  try {
    const result = await runAIInsight(channelId);
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[AI Insight] error:", err);
    return NextResponse.json(
      { error: { code: "INSIGHT_FAILED", message: "AI 분석 중 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}
