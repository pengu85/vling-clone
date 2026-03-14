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

export const useAlertStore = create<AlertState>()(
  persist(
    (set, get) => ({
      alerts: [],
      rules: [],

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
