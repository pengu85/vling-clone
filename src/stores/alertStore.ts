"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Alert {
  id: string;
  channelId: string;
  channelTitle: string;
  type: "subscriber" | "view" | "revenue";
  message: string;
  timestamp: string;
  read: boolean;
}

export interface MonitorRule {
  channelId: string;
  channelTitle: string;
  enabled: boolean;
  subscriberThreshold: number;
  viewThreshold: number;
}

interface AlertState {
  alerts: Alert[];
  rules: MonitorRule[];
  addAlert: (alert: Omit<Alert, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeAlert: (id: string) => void;
  addRule: (rule: Omit<MonitorRule, "enabled" | "subscriberThreshold" | "viewThreshold"> & Partial<Pick<MonitorRule, "enabled" | "subscriberThreshold" | "viewThreshold">>) => void;
  updateRule: (channelId: string, updates: Partial<MonitorRule>) => void;
  removeRule: (channelId: string) => void;
  getRule: (channelId: string) => MonitorRule | undefined;
  unreadCount: () => number;
}

// Mock alerts for demo
const mockAlerts: Alert[] = [
  {
    id: "alert-1",
    channelId: "UC_x5XG1OV2P6uZZ5FSM9Ttw",
    channelTitle: "Google Developers",
    type: "subscriber",
    message: "구독자 수가 10,000명 증가하여 2,350,000명에 도달했습니다.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
  },
  {
    id: "alert-2",
    channelId: "UCupvZG-5ko_eiXAupbDfxWw",
    channelTitle: "CNN",
    type: "view",
    message: "최근 24시간 조회수가 500,000회를 돌파했습니다.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: false,
  },
  {
    id: "alert-3",
    channelId: "UC-lHJZR3Gqxm24_Vd_AJ5Yw",
    channelTitle: "PewDiePie",
    type: "revenue",
    message: "예상 월 수익이 $150,000를 초과했습니다.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    read: true,
  },
  {
    id: "alert-4",
    channelId: "UCq-Fj5jknLsUf-MWSy4_brA",
    channelTitle: "T-Series",
    type: "subscriber",
    message: "구독자 수가 50,000명 증가하여 268,000,000명에 도달했습니다.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    read: true,
  },
  {
    id: "alert-5",
    channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
    channelTitle: "MrBeast",
    type: "view",
    message: "최근 영상이 24시간 내 1,000만 조회수를 달성했습니다.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: false,
  },
];

const mockRules: MonitorRule[] = [
  {
    channelId: "UC_x5XG1OV2P6uZZ5FSM9Ttw",
    channelTitle: "Google Developers",
    enabled: true,
    subscriberThreshold: 10000,
    viewThreshold: 500000,
  },
  {
    channelId: "UCupvZG-5ko_eiXAupbDfxWw",
    channelTitle: "CNN",
    enabled: true,
    subscriberThreshold: 5000,
    viewThreshold: 300000,
  },
  {
    channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
    channelTitle: "MrBeast",
    enabled: false,
    subscriberThreshold: 50000,
    viewThreshold: 1000000,
  },
];

export const useAlertStore = create<AlertState>()(
  persist(
    (set, get) => ({
      alerts: mockAlerts,
      rules: mockRules,

      addAlert: (alert) =>
        set((state) => ({
          alerts: [
            {
              ...alert,
              id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              timestamp: new Date().toISOString(),
              read: false,
            },
            ...state.alerts,
          ],
        })),

      markAsRead: (id) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, read: true } : a
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          alerts: state.alerts.map((a) => ({ ...a, read: true })),
        })),

      removeAlert: (id) =>
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== id),
        })),

      addRule: (rule) =>
        set((state) => {
          if (state.rules.find((r) => r.channelId === rule.channelId))
            return state;
          return {
            rules: [
              ...state.rules,
              {
                enabled: true,
                subscriberThreshold: 10000,
                viewThreshold: 500000,
                ...rule,
              },
            ],
          };
        }),

      updateRule: (channelId, updates) =>
        set((state) => ({
          rules: state.rules.map((r) =>
            r.channelId === channelId ? { ...r, ...updates } : r
          ),
        })),

      removeRule: (channelId) =>
        set((state) => ({
          rules: state.rules.filter((r) => r.channelId !== channelId),
        })),

      getRule: (channelId) =>
        get().rules.find((r) => r.channelId === channelId),

      unreadCount: () => get().alerts.filter((a) => !a.read).length,
    }),
    { name: "vling-alerts" }
  )
);
