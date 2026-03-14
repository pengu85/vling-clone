"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CampaignForm } from "@/components/campaign/CampaignForm";
import { useCampaignStore } from "@/stores/campaignStore";
import type { Campaign } from "@/types/campaign";

export default function NewCampaignPage() {
  const router = useRouter();
  const { addCampaign } = useCampaignStore();
  const [isLoading, setIsLoading] = useState(false);

  function handleSubmit(data: Omit<Campaign, "id" | "userId" | "createdAt" | "updatedAt">) {
    setIsLoading(true);
    const now = new Date();
    const newCampaign: Campaign = {
      id: `camp-${Date.now()}`,
      userId: "",
      createdAt: now,
      updatedAt: now,
      ...data,
    };
    addCampaign(newCampaign);
    setIsLoading(false);
    router.push("/campaign/manage");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">새 캠페인 만들기</h1>
        <p className="mt-1 text-sm text-slate-400">
          유튜브 채널과 협업할 새 마케팅 캠페인을 설정하세요.
        </p>
      </div>
      <CampaignForm mode="create" onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
