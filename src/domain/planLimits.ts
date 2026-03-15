import type { PlanTier } from '@/types';

interface PlanLimit {
  dailySearch: number;
  rankingVisible: number;
  audienceAnalysis: number;
  channelCompare: number;
  aiFinder: number;
  aiContent: number;
  campaignProposal: number;
  favorites: number;
  dataDownload: boolean;
  adPrice: boolean;
  apiAccess: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimit> = {
  basic: {
    dailySearch: 3,
    rankingVisible: 20,
    audienceAnalysis: 0,
    channelCompare: 0,
    aiFinder: 0,
    aiContent: 0,
    campaignProposal: 0,
    favorites: 10,
    dataDownload: false,
    adPrice: false,
    apiAccess: false,
  },
  standard: {
    dailySearch: 50,
    rankingVisible: 100,
    audienceAnalysis: 10,
    channelCompare: 2,
    aiFinder: 0,
    aiContent: 0,
    campaignProposal: 10,
    favorites: 50,
    dataDownload: false,
    adPrice: true,
    apiAccess: false,
  },
  startup: {
    dailySearch: Infinity,
    rankingVisible: Infinity,
    audienceAnalysis: Infinity,
    channelCompare: 5,
    aiFinder: 10,
    aiContent: 0,
    campaignProposal: 100,
    favorites: 200,
    dataDownload: true,
    adPrice: true,
    apiAccess: false,
  },
  professional: {
    dailySearch: Infinity,
    rankingVisible: Infinity,
    audienceAnalysis: Infinity,
    channelCompare: 5,
    aiFinder: 50,
    aiContent: 20,
    campaignProposal: 500,
    favorites: 500,
    dataDownload: true,
    adPrice: true,
    apiAccess: false,
  },
  enterprise: {
    dailySearch: Infinity,
    rankingVisible: Infinity,
    audienceAnalysis: Infinity,
    channelCompare: 10,
    aiFinder: Infinity,
    aiContent: Infinity,
    campaignProposal: Infinity,
    favorites: Infinity,
    dataDownload: true,
    adPrice: true,
    apiAccess: true,
  },
};
