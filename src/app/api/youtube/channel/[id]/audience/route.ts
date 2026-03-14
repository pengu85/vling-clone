import { NextRequest, NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";

const TOPIC_DEMOGRAPHICS: Record<string, { maleRatio: number; femaleRatio: number; ageDistribution: Record<string, number> }> = {
  gaming: {
    maleRatio: 72,
    femaleRatio: 28,
    ageDistribution: { "13-17": 18, "18-24": 38, "25-34": 28, "35-44": 11, "45-54": 4, "55+": 1 },
  },
  beauty: {
    maleRatio: 18,
    femaleRatio: 82,
    ageDistribution: { "13-17": 14, "18-24": 36, "25-34": 32, "35-44": 13, "45-54": 4, "55+": 1 },
  },
  music: {
    maleRatio: 52,
    femaleRatio: 48,
    ageDistribution: { "13-17": 16, "18-24": 34, "25-34": 28, "35-44": 14, "45-54": 6, "55+": 2 },
  },
  sports: {
    maleRatio: 68,
    femaleRatio: 32,
    ageDistribution: { "13-17": 10, "18-24": 28, "25-34": 32, "35-44": 18, "45-54": 9, "55+": 3 },
  },
  finance: {
    maleRatio: 65,
    femaleRatio: 35,
    ageDistribution: { "13-17": 2, "18-24": 18, "25-34": 38, "35-44": 26, "45-54": 12, "55+": 4 },
  },
  kids: {
    maleRatio: 50,
    femaleRatio: 50,
    ageDistribution: { "13-17": 5, "18-24": 10, "25-34": 42, "35-44": 32, "45-54": 9, "55+": 2 },
  },
  default: {
    maleRatio: 54,
    femaleRatio: 46,
    ageDistribution: { "13-17": 8, "18-24": 28, "25-34": 35, "35-44": 18, "45-54": 8, "55+": 3 },
  },
};

function detectCategoryFromTopics(topicCategories?: string[]): string {
  if (!topicCategories || topicCategories.length === 0) return "default";
  const joined = topicCategories.join(" ").toLowerCase();
  if (joined.includes("gaming") || joined.includes("video_game")) return "gaming";
  if (joined.includes("beauty") || joined.includes("fashion") || joined.includes("lifestyle")) return "beauty";
  if (joined.includes("music")) return "music";
  if (joined.includes("sport") || joined.includes("fitness") || joined.includes("health")) return "sports";
  if (joined.includes("finance") || joined.includes("economics") || joined.includes("business")) return "finance";
  if (joined.includes("kids") || joined.includes("children") || joined.includes("family")) return "kids";
  return "default";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await youtubeClient.getChannel(id);

    if (!result.items || result.items.length === 0) {
      return NextResponse.json({ error: "채널을 찾을 수 없습니다" }, { status: 404 });
    }

    const ch = result.items[0];
    const country = ch.snippet.country || "KR";
    const topicCategories = ch.topicDetails?.topicCategories as string[] | undefined;
    const category = detectCategoryFromTopics(topicCategories);
    const demo = TOPIC_DEMOGRAPHICS[category];

    return NextResponse.json({
      data: {
        channelId: id,
        channelTitle: ch.snippet.title,
        isEstimated: true,
        maleRatio: demo.maleRatio,
        femaleRatio: demo.femaleRatio,
        ageDistribution: demo.ageDistribution,
        topCountries: [
          { country, ratio: 72 },
          { country: "US", ratio: 12 },
          { country: "JP", ratio: 8 },
        ],
      },
    });
  } catch (error) {
    console.error("YouTube audience error:", error);
    return NextResponse.json(
      { error: "YouTube API 호출에 실패했습니다" },
      { status: 500 }
    );
  }
}
