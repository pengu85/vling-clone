import { NextRequest, NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url 파라미터가 필요합니다" }, { status: 400 });
  }

  try {
    const channelId = await resolveToChannelId(url.trim());
    if (!channelId) {
      return NextResponse.json({ error: "채널을 찾을 수 없습니다" }, { status: 404 });
    }
    return NextResponse.json({ channelId });
  } catch (error) {
    console.error("Resolve channel error:", error);
    return NextResponse.json(
      { error: "채널 조회에 실패했습니다", details: String(error) },
      { status: 500 }
    );
  }
}

async function resolveToChannelId(input: string): Promise<string | null> {
  // Pattern: https://www.youtube.com/channel/UCxxxx
  const channelUrlMatch = input.match(/youtube\.com\/channel\/(UC[\w-]{22})/);
  if (channelUrlMatch) {
    return channelUrlMatch[1];
  }

  // Raw channel ID: starts with UC, 24 chars total
  if (/^UC[\w-]{22}$/.test(input)) {
    return input;
  }

  // Pattern: https://www.youtube.com/@handle
  const handleMatch = input.match(/youtube\.com\/@([\w.-]+)/);
  if (handleMatch) {
    return youtubeClient.resolveHandle(`@${handleMatch[1]}`);
  }

  // Pattern: https://www.youtube.com/c/channelname or /user/username
  const customUrlMatch = input.match(/youtube\.com\/(?:c|user)\/([\w.-]+)/);
  if (customUrlMatch) {
    return youtubeClient.resolveHandle(customUrlMatch[1]);
  }

  return null;
}
