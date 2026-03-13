"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { CampaignForm } from "@/components/campaign/CampaignForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { CATEGORIES } from "@/domain/categories";
import type { Campaign, CampaignStatus } from "@/types/campaign";
import {
  ArrowLeftIcon,
  CalendarIcon,
  UsersIcon,
  WalletIcon,
  TagIcon,
  PencilIcon,
  Trash2Icon,
  CheckCircle2Icon,
  PlayCircleIcon,
  XCircleIcon,
} from "lucide-react";

const STATUS_DISPLAY: Record<
  CampaignStatus,
  { label: string; className: string }
> = {
  draft: { label: "초안", className: "bg-slate-700 text-slate-300" },
  active: { label: "진행중", className: "bg-emerald-900/60 text-emerald-300" },
  completed: { label: "완료", className: "bg-blue-900/60 text-blue-300" },
  cancelled: { label: "취소", className: "bg-red-900/60 text-red-300" },
};

const STATUS_TRANSITIONS: Record<
  CampaignStatus,
  { to: CampaignStatus; label: string; icon: React.ReactNode; className: string }[]
> = {
  draft: [
    {
      to: "active",
      label: "캠페인 시작",
      icon: <PlayCircleIcon className="size-4" />,
      className: "bg-emerald-700 text-white hover:bg-emerald-600",
    },
    {
      to: "cancelled",
      label: "캠페인 취소",
      icon: <XCircleIcon className="size-4" />,
      className: "bg-red-900/40 text-red-300 hover:bg-red-900/60",
    },
  ],
  active: [
    {
      to: "completed",
      label: "캠페인 완료",
      icon: <CheckCircle2Icon className="size-4" />,
      className: "bg-blue-700 text-white hover:bg-blue-600",
    },
    {
      to: "cancelled",
      label: "캠페인 취소",
      icon: <XCircleIcon className="size-4" />,
      className: "bg-red-900/40 text-red-300 hover:bg-red-900/60",
    },
  ],
  completed: [],
  cancelled: [
    {
      to: "draft",
      label: "초안으로 복원",
      icon: <PlayCircleIcon className="size-4" />,
      className: "bg-slate-700 text-slate-200 hover:bg-slate-600",
    },
  ],
};

function getCategoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-slate-500">{icon}</span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-200">{value}</p>
      </div>
    </div>
  );
}

export default function CampaignDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const isEditMode = searchParams.get("edit") === "true";

  const { getCampaign, updateCampaign, deleteCampaign } = useCampaignStore();
  const campaign = getCampaign(id);

  const [isUpdating, setIsUpdating] = useState(false);

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-lg font-medium text-slate-300">
          캠페인을 찾을 수 없습니다.
        </p>
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/campaign/manage" />}
          className="mt-4 border-slate-700 text-slate-300"
        >
          캠페인 목록으로
        </Button>
      </div>
    );
  }

  function handleStatusChange(to: CampaignStatus) {
    setIsUpdating(true);
    updateCampaign(id, { status: to });
    setIsUpdating(false);
  }

  function handleDelete() {
    if (confirm(`"${campaign!.title}" 캠페인을 삭제하시겠습니까?`)) {
      deleteCampaign(id);
      router.push("/campaign/manage");
    }
  }

  function handleEditSubmit(
    data: Omit<Campaign, "id" | "userId" | "createdAt" | "updatedAt">
  ) {
    setIsUpdating(true);
    updateCampaign(id, data);
    setIsUpdating(false);
    router.push(`/campaign/${id}`);
  }

  const statusDisplay = STATUS_DISPLAY[campaign.status];
  const transitions = STATUS_TRANSITIONS[campaign.status];

  if (isEditMode) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            render={<Link href={`/campaign/${id}`} />}
            className="text-slate-400"
          >
            <ArrowLeftIcon />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">캠페인 수정</h1>
            <p className="mt-0.5 text-sm text-slate-400">{campaign.title}</p>
          </div>
        </div>
        <CampaignForm
          mode="edit"
          initialData={campaign}
          onSubmit={handleEditSubmit}
          isLoading={isUpdating}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            render={<Link href="/campaign/manage" />}
            className="text-slate-400"
          >
            <ArrowLeftIcon />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-100">
                {campaign.title}
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusDisplay.className}`}
              >
                {statusDisplay.label}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-400">
              {campaign.description}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            render={<Link href={`/campaign/${id}?edit=true`} />}
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
      </div>

      {/* Info grid */}
      <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl border border-slate-800 bg-slate-900 p-6 sm:grid-cols-4">
        <InfoRow
          icon={<WalletIcon className="size-4" />}
          label="예산"
          value={formatCurrency(campaign.budget)}
        />
        <InfoRow
          icon={<CalendarIcon className="size-4" />}
          label="시작일"
          value={campaign.startDate}
        />
        <InfoRow
          icon={<CalendarIcon className="size-4" />}
          label="종료일"
          value={campaign.endDate}
        />
        <InfoRow
          icon={<TagIcon className="size-4" />}
          label="카테고리"
          value={getCategoryLabel(campaign.targetCategory)}
        />
      </div>

      {/* Subscriber range */}
      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-300">
          타겟 구독자 범위
        </h2>
        <div className="flex items-center gap-2 text-slate-200">
          <UsersIcon className="size-4 text-slate-500" />
          <span className="text-sm">
            {campaign.targetSubscriberMin.toLocaleString()}명 ~{" "}
            {campaign.targetSubscriberMax.toLocaleString()}명
          </span>
        </div>
      </div>

      {/* Channels */}
      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-300">
          선택된 채널
        </h2>
        {campaign.channelIds.length === 0 ? (
          <p className="text-sm text-slate-500">선택된 채널이 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {campaign.channelIds.map((ch) => (
              <Badge
                key={ch}
                variant="outline"
                className="border-slate-700 font-mono text-slate-400"
              >
                {ch}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Status transitions */}
      {transitions.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-300">
            상태 변경
          </h2>
          <div className="flex flex-wrap gap-3">
            {transitions.map((t) => (
              <button
                key={t.to}
                disabled={isUpdating}
                onClick={() => handleStatusChange(t.to)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${t.className}`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Meta */}
      <div className="mt-4 flex gap-4 text-xs text-slate-600">
        <span>
          생성:{" "}
          {new Date(campaign.createdAt).toLocaleDateString("ko-KR")}
        </span>
        <span>
          수정:{" "}
          {new Date(campaign.updatedAt).toLocaleDateString("ko-KR")}
        </span>
      </div>
    </div>
  );
}
