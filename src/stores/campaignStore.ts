"use client";
import { create } from "zustand";
import type { Campaign } from "@/types/campaign";

interface CampaignState {
  campaigns: Campaign[];
  isLoading: boolean;
  error: string | null;
  fetchCampaigns: (status?: string) => Promise<void>;
  addCampaign: (campaign: Partial<Campaign>) => Promise<Campaign | null>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  getCampaign: (id: string) => Campaign | undefined;
}

export const useCampaignStore = create<CampaignState>()((set, get) => ({
  campaigns: [],
  isLoading: false,
  error: null,

  fetchCampaigns: async (status?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params = status ? `?status=${status}` : "";
      const res = await fetch(`/api/campaign${params}`);
      if (!res.ok) throw new Error("캠페인 목록을 불러올 수 없습니다");
      const json = await res.json();
      set({ campaigns: json.data ?? [], isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  addCampaign: async (campaign) => {
    try {
      const res = await fetch("/api/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaign),
      });
      if (!res.ok) throw new Error("캠페인 생성에 실패했습니다");
      const json = await res.json();
      const newCampaign = json.data as Campaign;
      set((state) => ({ campaigns: [...state.campaigns, newCampaign] }));
      return newCampaign;
    } catch {
      return null;
    }
  },

  updateCampaign: async (id, updates) => {
    try {
      const res = await fetch(`/api/campaign/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("캠페인 수정에 실패했습니다");
      const json = await res.json();
      const updated = json.data as Campaign;
      set((state) => ({
        campaigns: state.campaigns.map((c) => (c.id === id ? updated : c)),
      }));
    } catch {
      // silently fail
    }
  },

  deleteCampaign: async (id) => {
    try {
      const res = await fetch(`/api/campaign/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("캠페인 삭제에 실패했습니다");
      set((state) => ({
        campaigns: state.campaigns.filter((c) => c.id !== id),
      }));
    } catch {
      // silently fail
    }
  },

  getCampaign: (id) => get().campaigns.find((c) => c.id === id),
}));
