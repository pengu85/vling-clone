export type RankType = 'subscriber' | 'view' | 'growth' | 'revenue' | 'superchat';

export interface ChannelRanking {
  id: string;
  channelId: string;
  rankType: RankType;
  category: string;
  rank: number;
  score: number;
  date: string;
}
