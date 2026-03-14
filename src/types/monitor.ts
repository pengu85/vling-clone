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
