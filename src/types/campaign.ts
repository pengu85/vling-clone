export type CampaignStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface Campaign {
  id: string;
  userId: string;
  title: string;
  description: string;
  budget: number;
  status: CampaignStatus;
  targetCategory: string;
  targetSubscriberMin: number;
  targetSubscriberMax: number;
  channelIds: string[];
  startDate: string;
  endDate: string;
  createdAt: Date;
  updatedAt: Date;
}
