import { NextRequest, NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";

export interface AutocompleteChannel {
  channelId: string;
  title: string;
  thumbnailUrl: string;
  subscriberCount: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") || "";

  if (!q.trim()) {
    return NextResponse.json({ data: [] });
  }

  try {
    // Search for channels
    const searchResult = await youtubeClient.searchChannels(q, 5);

    if (!searchResult.items || searchResult.items.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Collect channel IDs from search results
    const channelIds = searchResult.items
      .map((item) => item.id.channelId || item.snippet.channelId)
      .filter(Boolean);

    if (channelIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Get channel details including subscriber counts
    const channelDetails = await youtubeClient.getChannel(channelIds.join(","));

    const data: AutocompleteChannel[] = channelDetails.items.map((ch) => ({
      channelId: ch.id,
      title: ch.snippet.title,
      thumbnailUrl: ch.snippet.thumbnails.high.url,
      subscriberCount: parseInt(ch.statistics.subscriberCount) || 0,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Autocomplete API error:", error);
    return NextResponse.json(
      { error: "자동완성 데이터를 불러오지 못했습니다", details: String(error) },
      { status: 500 }
    );
  }
}
