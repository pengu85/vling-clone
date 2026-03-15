import Link from "next/link";
import { CampaignDashboard } from "@/components/campaign/CampaignDashboard";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default function CampaignManagePage() {
  return (
    <div className="px-4 py-8">
      <Breadcrumb items={[{ label: "캠페인 관리" }]} />
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">캠페인 관리</h1>
          <p className="mt-1 text-sm text-slate-400">
            생성한 마케팅 캠페인을 관리하고 성과를 추적하세요.
          </p>
        </div>
        <Button
          render={<Link href="/campaign/new" />}
          className="gap-2 bg-violet-600 hover:bg-violet-700"
        >
          <PlusIcon className="size-4" />
          새 캠페인
        </Button>
      </div>
      <CampaignDashboard />
    </div>
  );
}
