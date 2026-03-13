import type { UserRole, PlanTier } from './channel';

export interface Favorite {
  id: string;
  userId: string;
  channelId: string;
  folderName: string;
  createdAt: Date;
}

export interface FavoriteFolder {
  id: string;
  userId: string;
  name: string;
  channelCount: number;
  createdAt: Date;
}

export { type UserRole, type PlanTier };
