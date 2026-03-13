"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Campaign, CampaignStatus } from "@/types/campaign";

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "camp-001",
    userId: "user-001",
    title: "게임 채널 Q1 캠페인",
    description: "2024년 1분기 게임 카테고리 인플루언서 협업 캠페인입니다.",
    budget: 5000000,
    status: "active",
    targetCategory: "gaming",
    targetSubscriberMin: 100000,
    targetSubscriberMax: 1000000,
    channelIds: ["ch-001", "ch-002", "ch-003"],
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    createdAt: new Date("2023-12-15"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "camp-002",
    userId: "user-001",
    title: "뷰티 브랜드 론칭 캠페인",
    description: "신규 뷰티 제품 출시를 위한 유튜브 인플루언서 마케팅.",
    budget: 10000000,
    status: "draft",
    targetCategory: "beauty",
    targetSubscriberMin: 50000,
    targetSubscriberMax: 500000,
    channelIds: ["ch-010", "ch-011"],
    startDate: "2024-04-01",
    endDate: "2024-06-30",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    id: "camp-003",
    userId: "user-001",
    title: "음식 배달 서비스 캠페인",
    description: "음식 카테고리 채널과의 협업으로 배달 서비스 홍보.",
    budget: 3000000,
    status: "completed",
    targetCategory: "food",
    targetSubscriberMin: 10000,
    targetSubscriberMax: 100000,
    channelIds: ["ch-020"],
    startDate: "2023-10-01",
    endDate: "2023-12-31",
    createdAt: new Date("2023-09-15"),
    updatedAt: new Date("2024-01-05"),
  },
];

interface CampaignState {
  campaigns: Campaign[];
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  getCampaign: (id: string) => Campaign | undefined;
}

export const useCampaignStore = create<CampaignState>()(
  persist(
    (set, get) => ({
      campaigns: MOCK_CAMPAIGNS,
      addCampaign: (campaign) =>
        set((state) => ({ campaigns: [...state.campaigns, campaign] })),
      updateCampaign: (id, updates) =>
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
          ),
        })),
      deleteCampaign: (id) =>
        set((state) => ({
          campaigns: state.campaigns.filter((c) => c.id !== id),
        })),
      getCampaign: (id) => get().campaigns.find((c) => c.id === id),
    }),
    {
      name: "campaign-store",
    }
  )
);
