"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/domain/categories";
import type { Campaign, CampaignStatus } from "@/types/campaign";

interface CampaignFormData {
  title: string;
  description: string;
  budget: number;
  targetCategory: string;
  targetSubscriberMin: number;
  targetSubscriberMax: number;
  startDate: string;
  endDate: string;
  channelIds: string[];
  status: CampaignStatus;
}

interface CampaignFormProps {
  mode: "create" | "edit";
  initialData?: Partial<Campaign>;
  onSubmit: (data: CampaignFormData) => void;
  isLoading?: boolean;
}

const categoryOptions = CATEGORIES.filter((c) => c.value !== "all");

export function CampaignForm({
  mode,
  initialData,
  onSubmit,
  isLoading = false,
}: CampaignFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [budget, setBudget] = useState(
    initialData?.budget?.toString() ?? ""
  );
  const budgetDisplay = budget ? Number(budget).toLocaleString("ko-KR") : "";
  const [targetCategory, setTargetCategory] = useState(
    initialData?.targetCategory ?? "gaming"
  );
  const [subscriberMin, setSubscriberMin] = useState(
    initialData?.targetSubscriberMin?.toString() ?? "0"
  );
  const [subscriberMax, setSubscriberMax] = useState(
    initialData?.targetSubscriberMax?.toString() ?? "1000000"
  );
  const [startDate, setStartDate] = useState(initialData?.startDate ?? "");
  const [endDate, setEndDate] = useState(initialData?.endDate ?? "");
  const [errors, setErrors] = useState<Partial<Record<keyof CampaignFormData, string>>>({});

  function validate(): boolean {
    const newErrors: Partial<Record<keyof CampaignFormData, string>> = {};
    if (!title.trim()) newErrors.title = "캠페인 제목을 입력하세요.";
    if (!description.trim()) newErrors.description = "설명을 입력하세요.";
    if (!budget || isNaN(Number(budget)) || Number(budget) <= 0)
      newErrors.budget = "올바른 예산을 입력하세요.";
    if (!startDate) newErrors.startDate = "시작일을 입력하세요.";
    if (!endDate) newErrors.endDate = "종료일을 입력하세요.";
    if (startDate && endDate && startDate > endDate)
      newErrors.endDate = "종료일은 시작일 이후여야 합니다.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      budget: Number(budget),
      targetCategory,
      targetSubscriberMin: Number(subscriberMin),
      targetSubscriberMax: Number(subscriberMax),
      startDate,
      endDate,
      channelIds: initialData?.channelIds ?? [],
      status: initialData?.status ?? "draft",
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-6"
    >
      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-200">
          캠페인 제목 <span className="text-red-400">*</span>
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="캠페인 제목을 입력하세요"
          className="border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500"
        />
        {errors.title && (
          <p className="text-xs text-red-400">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-200">
          설명 <span className="text-red-400">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="캠페인 설명을 입력하세요"
          rows={3}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        {errors.description && (
          <p className="text-xs text-red-400">{errors.description}</p>
        )}
      </div>

      {/* Budget */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-200">
          예산 (원) <span className="text-red-400">*</span>
        </label>
        <Input
          type="text"
          inputMode="numeric"
          value={budgetDisplay}
          onChange={(e) => {
            const raw = e.target.value.replace(/,/g, "");
            if (raw === "" || /^\d+$/.test(raw)) {
              setBudget(raw);
            }
          }}
          placeholder="예: 5,000,000"
          className="border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500"
        />
        {errors.budget && (
          <p className="text-xs text-red-400">{errors.budget}</p>
        )}
      </div>

      {/* Target Category */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-200">
          타겟 카테고리
        </label>
        <Select
          value={targetCategory}
          onValueChange={(v) => setTargetCategory(v ?? "gaming")}
        >
          <SelectTrigger className="w-full border-slate-700 bg-slate-800 text-slate-100">
            <SelectValue placeholder="카테고리 선택" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subscriber Range */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-200">
          타겟 구독자 범위
        </label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            value={subscriberMin}
            onChange={(e) => setSubscriberMin(e.target.value)}
            placeholder="최소"
            min={0}
            className="border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500"
          />
          <span className="shrink-0 text-slate-400">~</span>
          <Input
            type="number"
            value={subscriberMax}
            onChange={(e) => setSubscriberMax(e.target.value)}
            placeholder="최대"
            min={0}
            className="border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-200">
            시작일 <span className="text-red-400">*</span>
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border-slate-700 bg-slate-800 text-slate-100"
          />
          {errors.startDate && (
            <p className="text-xs text-red-400">{errors.startDate}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-200">
            종료일 <span className="text-red-400">*</span>
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border-slate-700 bg-slate-800 text-slate-100"
          />
          {errors.endDate && (
            <p className="text-xs text-red-400">{errors.endDate}</p>
          )}
        </div>
      </div>

      {/* Channel IDs display */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <p className="text-sm text-slate-400">
          선택된 채널:{" "}
          <span className="font-medium text-slate-200">
            {initialData?.channelIds?.length ?? 0}개
          </span>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          채널은 캠페인 생성 후 채널 탐색 페이지에서 추가할 수 있습니다.
        </p>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-violet-600 px-6 hover:bg-violet-700"
        >
          {isLoading
            ? "저장 중..."
            : mode === "create"
            ? "캠페인 생성"
            : "변경사항 저장"}
        </Button>
      </div>
    </form>
  );
}
