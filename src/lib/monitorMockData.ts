export interface ChannelSnapshot {
  channelId: string;
  date: string; // YYYY-MM-DD
  subscribers: number;
  dailyViews: number;
  totalViews: number;
  algoScore: number;
  videoCount: number;
}

export interface VideoInsight {
  id: string;
  title: string;
  type: "long" | "shorts";
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
  thumbnailUrl: string;
  duration: string; // "12:34" or "0:45"
  viewsGrowth: number; // % change in last 7 days
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

export function generateChannelHistory(
  channelId: string,
  days: number = 30
): ChannelSnapshot[] {
  const rand = seededRandom(hashString(channelId));
  const snapshots: ChannelSnapshot[] = [];

  // Base values vary by channel
  const baseSubs = Math.floor(rand() * 4500000) + 50000;
  const baseDailyViews = Math.floor(rand() * 450000) + 10000;
  const baseTotalViews = Math.floor(rand() * 400000000) + 10000000;
  const baseAlgoScore = Math.floor(rand() * 50) + 40;
  const baseVideoCount = Math.floor(rand() * 1500) + 100;

  let currentSubs = baseSubs;
  let currentTotalViews = baseTotalViews;
  let currentAlgoScore = baseAlgoScore;
  let currentVideoCount = baseVideoCount;

  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const dayOfWeek = date.getDay(); // 0=Sun

    // Subscribers: gradual growth with occasional jumps
    const subGrowth = Math.floor(rand() * 800) + 100;
    const hasJump = rand() < 0.08; // 8% chance of viral jump
    currentSubs += hasJump ? subGrowth * 10 : subGrowth;

    // Daily views: fluctuating with weekly patterns (weekends higher)
    const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.3 : 1.0;
    const viewFluctuation = 0.7 + rand() * 0.6; // 0.7 - 1.3x
    const dailyViews = Math.floor(
      baseDailyViews * weekendMultiplier * viewFluctuation
    );

    currentTotalViews += dailyViews;

    // Algo score: slowly drifting
    const scoreDrift = (rand() - 0.48) * 2; // slight upward bias
    currentAlgoScore = Math.min(
      98,
      Math.max(20, currentAlgoScore + scoreDrift)
    );

    // Video count: increment 0-2 per week (roughly every 3-4 days)
    if (rand() < 0.3) {
      currentVideoCount += 1;
    }

    snapshots.push({
      channelId,
      date: dateStr,
      subscribers: currentSubs,
      dailyViews,
      totalViews: currentTotalViews,
      algoScore: Math.round(currentAlgoScore),
      videoCount: currentVideoCount,
    });
  }

  return snapshots;
}

const longFormTitles = [
  "이 방법 알면 인생 바뀝니다 | 완벽 정리",
  "전문가도 몰랐던 숨겨진 비밀 대공개",
  "요즘 난리난 트렌드 총정리 2026",
  "100만원으로 시작하는 현실적인 방법",
  "직접 해봤습니다.. 결과가 충격적",
];

const shortsTitles = [
  "이거 실화..? #shorts",
  "30초만에 알려드림 #shorts",
  "아직도 이렇게 하세요? #shorts",
  "역대급 반전 ㄷㄷ #shorts",
  "이건 꼭 알아야 합니다 #shorts",
];

export function generateVideoInsights(channelId: string): VideoInsight[] {
  const rand = seededRandom(hashString(channelId + "_videos"));
  const insights: VideoInsight[] = [];

  // 5 long-form videos
  for (let i = 0; i < 5; i++) {
    const minutes = Math.floor(rand() * 25) + 5;
    const seconds = Math.floor(rand() * 60);
    const daysAgo = Math.floor(rand() * 60) + 1;
    const views = Math.floor(rand() * 900000) + 10000;

    insights.push({
      id: `${channelId}_long_${i}`,
      title: longFormTitles[i],
      type: "long",
      views,
      likes: Math.floor(views * (rand() * 0.06 + 0.02)),
      comments: Math.floor(views * (rand() * 0.005 + 0.001)),
      publishedAt: new Date(
        Date.now() - daysAgo * 86400000
      ).toISOString(),
      thumbnailUrl: `https://placehold.co/320x180/4f46e5/white?text=Long+${i + 1}`,
      duration: `${minutes}:${String(seconds).padStart(2, "0")}`,
      viewsGrowth: parseFloat(((rand() * 40 - 5)).toFixed(1)),
    });
  }

  // 5 shorts videos
  for (let i = 0; i < 5; i++) {
    const seconds = Math.floor(rand() * 50) + 10;
    const daysAgo = Math.floor(rand() * 30) + 1;
    const views = Math.floor(rand() * 2000000) + 50000;

    insights.push({
      id: `${channelId}_short_${i}`,
      title: shortsTitles[i],
      type: "shorts",
      views,
      likes: Math.floor(views * (rand() * 0.08 + 0.03)),
      comments: Math.floor(views * (rand() * 0.003 + 0.0005)),
      publishedAt: new Date(
        Date.now() - daysAgo * 86400000
      ).toISOString(),
      thumbnailUrl: `https://placehold.co/180x320/6366f1/white?text=Short+${i + 1}`,
      duration: `0:${String(seconds).padStart(2, "0")}`,
      viewsGrowth: parseFloat(((rand() * 80 - 10)).toFixed(1)),
    });
  }

  return insights;
}
