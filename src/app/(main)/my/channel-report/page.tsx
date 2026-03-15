import { BarChart2 } from "lucide-react";
import { ChannelReport } from "@/components/my/ChannelReport";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default function ChannelReportPage() {
  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: "채널 리포트" }]} />
      {/* 헤더 */}
      <div className="flex items-start gap-3">
        <BarChart2 className="h-5 w-5 text-indigo-400 mt-0.5 shrink-0" />
        <div>
          <h1 className="text-xl font-bold text-slate-100">내 채널 리포트</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            채널 성과를 한눈에 확인하고 AI 기반 성장 인사이트를 받아보세요.
          </p>
        </div>
      </div>

      {/* 리포트 본문 */}
      <ChannelReport />
    </div>
  );
}
