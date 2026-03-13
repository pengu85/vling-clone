"use client";

import { LayoutDashboard } from "lucide-react";
import { DashboardSummary } from "@/components/dashboard/DashboardSummary";
import { FavoritesSummary } from "@/components/dashboard/FavoritesSummary";
import { RecentChannels } from "@/components/dashboard/RecentChannels";

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-5 w-5 text-blue-400" />
        <h1 className="text-xl font-bold text-slate-100">대시보드</h1>
      </div>

      {/* Summary stats + Quick actions */}
      <DashboardSummary />

      {/* Two column layout for favorites & recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FavoritesSummary />
        <RecentChannels />
      </div>
    </div>
  );
}
