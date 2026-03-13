"use client";

import Link from "next/link";
import {
  Search,
  BarChart2,
  Sparkles,
  Calculator,
  Star,
  Clock,
  TrendingUp,
  Bell,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useFavoriteStore } from "@/stores/favoriteStore";
import { useRecentStore } from "@/stores/recentStore";

interface QuickActionProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}

function QuickAction({ href, icon, label, description }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl bg-slate-800 border border-slate-700 p-4 hover:bg-slate-700/70 hover:border-slate-600 transition-all group"
    >
      <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-slate-700 group-hover:bg-slate-600 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-200 group-hover:text-slate-100">
          {label}
        </p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </Link>
  );
}

export function DashboardSummary() {
  const favoriteCount = useFavoriteStore((s) => s.favorites.length);
  const recentCount = useRecentStore((s) => s.recentChannels.length);

  return (
    <div className="space-y-5">
      {/* Stats overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-yellow-500/10">
                <Star className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">{favoriteCount}</p>
                <p className="text-xs text-slate-500">즐겨찾기 채널</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500/10">
                <Clock className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">{recentCount}</p>
                <p className="text-xs text-slate-500">최근 본 채널</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">
                  {favoriteCount > 0 ? Math.ceil(favoriteCount * 0.4) : 0}
                </p>
                <p className="text-xs text-slate-500">성장 중인 채널</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500/10">
                <Bell className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">
                  {favoriteCount > 0 ? Math.ceil(favoriteCount * 0.3) : 0}
                </p>
                <p className="text-xs text-slate-500">새 알림</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          빠른 액션
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction
            href="/search"
            icon={<Search className="h-5 w-5 text-blue-400" />}
            label="채널 검색"
            description="유튜브 채널 검색"
          />
          <QuickAction
            href="/ranking"
            icon={<BarChart2 className="h-5 w-5 text-violet-400" />}
            label="유튜브 순위"
            description="구독자/조회수 순위"
          />
          <QuickAction
            href="/tools/ai-finder"
            icon={<Sparkles className="h-5 w-5 text-amber-400" />}
            label="AI 파인더"
            description="AI 기반 채널 추천"
          />
          <QuickAction
            href="/tools/calculator"
            icon={<Calculator className="h-5 w-5 text-emerald-400" />}
            label="수익 계산기"
            description="예상 수익 계산"
          />
        </div>
      </div>
    </div>
  );
}
