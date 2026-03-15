export type UserRole = 'advertiser' | 'mcn' | 'youtuber' | 'agency';
export type PlanTier = 'basic' | 'standard' | 'startup' | 'professional' | 'enterprise';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  plan: PlanTier;
  planExpiresAt: Date | null;
  youtubeChannelId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Channel {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  bannerUrl: string | null;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  category: string;
  country: string;
  language: string;
  growthRate30d: number;
  dailyAvgViews: number;
  algoScore: number;
  engagementRate: number;
  estimatedRevenue: number;
  estimatedAdPrice: number;
  audienceMaleRatio: number;
  audienceAgeDistribution: Record<string, number>;
  audienceTopCountries: Array<{ country: string; ratio: number }>;
  tags: string[];
  updatedAt: Date;
}

export interface ChannelSearchResult {
  id: string;
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  subscriberCount: number;
  dailyAvgViews: number;
  growthRate30d: number;
  algoScore: number;
  estimatedRevenue: number;
  category: string;
  country: string;
  /** 일일 추정 구독자 변화 (성장률 기반) */
  subscriberChange?: number;
  latestVideo?: {
    title: string;
    publishedAt: string;
  };
}
