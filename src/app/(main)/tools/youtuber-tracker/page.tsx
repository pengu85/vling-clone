import { Activity, Bell, RefreshCw, BarChart2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MonitorDashboard } from "@/components/tools/MonitorDashboard";

export default function YoutuberTrackerPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20">
            <Activity className="size-5 text-blue-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">유튜버 모니터</h1>
        </div>
        <p className="text-sm text-slate-500 pl-0.5">
          관심 채널의 구독자, 조회수, 성장률 변동을 실시간으로 추적합니다
        </p>
      </div>

      {/* Dashboard */}
      <MonitorDashboard />

      {/* Info Card */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="py-4">
          <p className="text-xs font-medium text-slate-400 mb-3">모니터링 기능 안내</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                <Bell className="size-3.5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-300">실시간 변동 추적</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  구독자·조회수의 일간 증감을 한눈에 파악합니다
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                <RefreshCw className="size-3.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-300">최대 20개 채널</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  관심 채널을 최대 20개까지 등록하여 동시에 추적합니다
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                <BarChart2 className="size-3.5 text-violet-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-300">알고리즘 점수</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  채널의 알고리즘 노출 점수 변화를 실시간으로 확인합니다
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
