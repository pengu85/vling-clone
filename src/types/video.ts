export interface Video {
  id: string;
  youtubeId: string;
  channelId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
  publishedAt: Date;
  algoScore: number;
  isShort: boolean;
  tags: string[];
  updatedAt: Date;
}
