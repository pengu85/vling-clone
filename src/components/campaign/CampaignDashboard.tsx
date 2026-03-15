"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCampaignStore } from "@/stores/campaignStore";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { CATEGORIES } from "@/domain/categories";
import type { Campaign, CampaignStatus } from "@/types/campaign";
import { CalendarIcon, UsersIcon, Trash2Icon, PencilIcon } from "lucide-react";

const STATUS_TABS: { value: "all" | CampaignStatus; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "draft", label: "초안" },
  { value: "active", label: "진행중" },
  { value: "completed", label: "완료" },
  { value: "cancelled", label: "취소" },
];

const STATUS_BADGE: Record<
  CampaignStatus,
  { label: string; className: string }
> = {
  draft: { label: "초안", className: "bg-slate-700 text-slate-300" },
  active: { label: "진행중", className: "bg-emerald-900/60 text-emerald-300" },
  completed: { label: "완료", className: "bg-blue-900/60 text-blue-300" },
  cancelled: { label: "취소", className: "bg-red-900/60 text-red-300" },
};

function getCategoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const { deleteCampaign } = useCampaignStore();
  const badge = STATUS_BADGE[campaign.status];

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (confirm(`"${campaign.title}" 캠페인을 삭제하시겠습니까?`)) {
      await deleteCampaign(campaign.id);
    }
  }

  return (
    <Card className="border-slate-800 bg-slate-900 transition-colors hover:border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-100">{campaign.title}</CardTitle>
        <CardAction>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="line-clamp-2 text-sm text-slate-400">
          {campaign.description}
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
          <span className="font-medium text-violet-400">
            {formatCurrency(campaign.budget)}
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarIcon className="size-3.5" />
            {campaign.startDate} ~ {campaign.endDate}
          </span>
          <span className="inline-flex items-center gap-1">
            <UsersIcon className="size-3.5" />
            채널 {campaign.channelIds.length}개
          </span>
          <Badge variant="outline" className="border-slate-700 text-slate-400">
            {getCategoryLabel(campaign.targetCategory)}
          </Badge>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            render={<Link href={`/campaign/${campaign.id}`} />}
            className="text-slate-400 hover:text-slate-200"
          >
            상세보기
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            render={<Link href={`/campaign/${campaign.id}?edit=true`} />}
            className="text-slate-400 hover:text-slate-200"
          >
            <PencilIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleDelete}
            className="text-red-400 hover:text-red-300"
          >
            <Trash2Icon />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ status }: { status: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 py-16 text-center">
      <p className="text-slate-400">
        {status === "all"
          ? "아직 생성된 캠페인이 없습니다."
          : `${STATUS_TABS.find((t) => t.value === status)?.label ?? status} 상태의 캠페인이 없습니다.`}
      </p>
      <Button
        variant="outline"
        size="sm"
        render={<Link href="/campaign/new" />}
        className="mt-4 border-slate-700 text-slate-300"
      >
        새 캠페인 만들기
      </Button>
    </div>
  );
}

export function CampaignDashboard() {
  const { campaigns, fetchCampaigns, isLoading } = useCampaignStore();
  const [activeTab, setActiveTab] = useState<"all" | CampaignStatus>("all");

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const filtered =
    activeTab === "all"
      ? campaigns
      : campaigns.filter((c) => c.status === activeTab);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-400">캠페인을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab((v ?? "all") as "all" | CampaignStatus)}
    >
      <TabsList className="mb-6">
        {STATUS_TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
            {tab.value === "all" ? (
              <span className="ml-1.5 rounded-full bg-slate-700 px-1.5 py-0.5 text-xs text-slate-300">
                {campaigns.length}
              </span>
            ) : (
              <span className="ml-1.5 rounded-full bg-slate-700 px-1.5 py-0.5 text-xs text-slate-300">
                {campaigns.filter((c) => c.status === tab.value).length}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      {STATUS_TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {filtered.length === 0 ? (
            <EmptyState status={tab.value} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
