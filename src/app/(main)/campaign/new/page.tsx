"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CampaignForm } from "@/components/campaign/CampaignForm";
import type { Campaign } from "@/types/campaign";
import { useToast } from "@/stores/toastStore";

export default function NewCampaignPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(data: Omit<Campaign, "id" | "userId" | "createdAt" | "updatedAt">) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `서버 오류 (${res.status})`);
      }

      toast("캠페인이 생성되었습니다", "success");
      router.push("/campaign/manage");
    } catch (err) {
      const message = err instanceof Error ? err.message : "캠페인 생성에 실패했습니다";
      toast(message, "error");
    } finally {
      setIsLoading(false);
    }
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
