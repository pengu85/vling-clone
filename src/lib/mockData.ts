import type { ChannelSearchResult, Channel, Video, ChannelRanking } from "@/types";

const channelNames = [
  "테크수다", "뷰티로그", "게임왕국", "쿡방TV", "여행가자",
  "음악천재", "스포츠매니아", "교육의정석", "코미디빅뱅", "반려동물TV",
  "IT리뷰어", "패션위크", "먹방스타", "과학쿠키", "키즈플레이",
  "자동차리뷰", "영화리뷰어", "운동루틴", "독서클럽", "부동산톡",
];

const categories = ["tech", "beauty", "gaming", "food", "travel", "music", "sports", "education", "comedy", "pets"];
const countries = ["KR", "US", "JP", "KR", "KR", "US", "KR", "KR", "KR", "KR"];

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateMockChannels(count = 20): ChannelSearchResult[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `ch_${String(i + 1).padStart(3, "0")}`,
    youtubeId: `UC${Math.random().toString(36).substring(2, 15)}`,
    title: channelNames[i % channelNames.length] + (i >= channelNames.length ? ` ${Math.floor(i / channelNames.length) + 1}` : ""),
    thumbnailUrl: `https://placehold.co/88x88/6366f1/white?text=${encodeURIComponent(channelNames[i % channelNames.length].charAt(0))}`,
    subscriberCount: randomBetween(10000, 5000000),
    dailyAvgViews: randomBetween(5000, 500000),
    growthRate30d: parseFloat((Math.random() * 10 - 2).toFixed(1)),
    algoScore: randomBetween(30, 98),
    estimatedRevenue: randomBetween(500, 50000),
    category: categories[i % categories.length],
    country: countries[i % countries.length],
    latestVideo: {
      title: `최신 영상 제목 #${randomBetween(1, 999)}`,
      publishedAt: new Date(Date.now() - randomBetween(1, 30) * 86400000).toISOString(),
    },
  }));
}

export function generateMockChannel(id: string): Channel {
  const idx = parseInt(id.replace("ch_", "")) || 0;
  const name = channelNames[idx % channelNames.length];
  return {
    id,
    youtubeId: `UC${Math.random().toString(36).substring(2, 15)}`,
    title: name,
    description: `${name} 채널입니다. 매일 새로운 콘텐츠를 업로드합니다.`,
    thumbnailUrl: `https://placehold.co/176x176/6366f1/white?text=${encodeURIComponent(name.charAt(0))}`,
    bannerUrl: `https://placehold.co/1200x200/4f46e5/white?text=${encodeURIComponent(name)}`,
    subscriberCount: randomBetween(50000, 5000000),
    viewCount: randomBetween(10000000, 500000000),
    videoCount: randomBetween(50, 2000),
    category: categories[idx % categories.length],
    country: countries[idx % countries.length],
    language: "ko",
    growthRate30d: parseFloat((Math.random() * 8 - 1).toFixed(1)),
    dailyAvgViews: randomBetween(10000, 500000),
    algoScore: randomBetween(40, 98),
    engagementRate: parseFloat((Math.random() * 8 + 1).toFixed(1)),
    estimatedRevenue: randomBetween(1000, 50000),
    estimatedAdPrice: randomBetween(500000, 10000000),
    audienceMaleRatio: parseFloat((Math.random() * 40 + 30).toFixed(0)),
    audienceAgeDistribution: { "13-17": 8, "18-24": 28, "25-34": 35, "35-44": 18, "45-54": 8, "55+": 3 },
    audienceTopCountries: [
      { country: "KR", ratio: 72 },
      { country: "US", ratio: 12 },
      { country: "JP", ratio: 8 },
    ],
    tags: ["유튜브", name, categories[idx % categories.length]],
    updatedAt: new Date(),
  };
}

export function generateMockVideos(channelId: string, count = 12): Video[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `vid_${channelId}_${i + 1}`,
    youtubeId: Math.random().toString(36).substring(2, 15),
    channelId,
    title: `영상 제목 ${i + 1} - 흥미로운 콘텐츠`,
    description: `영상 설명입니다.`,
    thumbnailUrl: `https://placehold.co/320x180/4f46e5/white?text=Video+${i + 1}`,
    viewCount: randomBetween(1000, 1000000),
    likeCount: randomBetween(100, 50000),
    commentCount: randomBetween(10, 5000),
    duration: `PT${randomBetween(3, 30)}M${randomBetween(0, 59)}S`,
    publishedAt: new Date(Date.now() - randomBetween(1, 180) * 86400000),
    algoScore: randomBetween(20, 95),
    isShort: i % 5 === 0,
    tags: ["태그1", "태그2"],
    updatedAt: new Date(),
  }));
}

export function generateMockRankings(type: string, count = 50): (ChannelRanking & { channel: ChannelSearchResult })[] {
  const channels = generateMockChannels(count);
  const sorted = [...channels].sort((a, b) => {
    switch (type) {
      case "subscriber": return b.subscriberCount - a.subscriberCount;
      case "view": return b.dailyAvgViews - a.dailyAvgViews;
      case "growth": return b.growthRate30d - a.growthRate30d;
      case "revenue": return b.estimatedRevenue - a.estimatedRevenue;
      default: return b.subscriberCount - a.subscriberCount;
    }
  });
  return sorted.map((ch, i) => ({
    id: `rank_${type}_${i + 1}`,
    channelId: ch.id,
    rankType: type as ChannelRanking["rankType"],
    category: "all",
    rank: i + 1,
    score: type === "subscriber" ? ch.subscriberCount : type === "view" ? ch.dailyAvgViews : type === "growth" ? ch.growthRate30d : ch.estimatedRevenue,
    date: new Date().toISOString().split("T")[0],
    channel: ch,
  }));
}
