import { youtubeClient } from "@/lib/youtube";
import { NextResponse } from "next/server";

// ISO 8601 duration (PT12M34S) → "12:34" 변환
function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";
  const h = parseInt(match[1] || "0");
  const m = parseInt(match[2] || "0");
  const s = parseInt(match[3] || "0");
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Shorts 판별: duration <= 60초
function isShorts(iso: string): boolean {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return false;
  const h = parseInt(match[1] || "0");
  const m = parseInt(match[2] || "0");
  const s = parseInt(match[3] || "0");
  return h === 0 && m <= 1 && m * 60 + s <= 60;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId");
  if (!channelId)
    return NextResponse.json({ error: "channelId required" }, { status: 400 });

  try {
    // Step 1: 최근 영상 목록
    const searchResult = await youtubeClient.getChannelVideos(channelId, 15);
    const videoIds = searchResult.items
      .map((item) => item.id.videoId)
      .filter((id): id is string => !!id);

    if (videoIds.length === 0) return NextResponse.json({ data: [] });

    // Step 2: 영상 상세 (조회수, 좋아요, duration)
    const details = await youtubeClient.getVideoDetails(videoIds);

    const videos = details.items.map((item) => ({
      id: item.id,
      title: item.snippet.title,
      type: isShorts(item.contentDetails.duration) ? "shorts" : "long",
      views: parseInt(item.statistics.viewCount || "0"),
      likes: parseInt(item.statistics.likeCount || "0"),
      comments: parseInt(item.statistics.commentCount || "0"),
      publishedAt: item.snippet.publishedAt,
      thumbnailUrl: item.snippet.thumbnails.high.url,
      duration: parseDuration(item.contentDetails.duration),
      viewsGrowth: 0,
    }));

    return NextResponse.json({ data: videos });
  } catch (error) {
    console.error("Monitor videos API error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "비디오 모니터링 데이터 로딩 실패" } },
      { status: 500 }
    );
  }
}
