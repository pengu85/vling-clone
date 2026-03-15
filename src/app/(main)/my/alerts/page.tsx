"use client";

import { Bell } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertList } from "@/components/alerts/AlertList";
import { MonitoringSettings } from "@/components/alerts/MonitoringSettings";
import { useAlertStore } from "@/stores/alertStore";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default function AlertsPage() {
  const unreadCount = useAlertStore((s) => s.unreadCount);
  const unread = unreadCount();

  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: "알림" }]} />
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Bell className="h-5 w-5 text-blue-400" />
        <h1 className="text-xl font-bold text-slate-100">알림</h1>
        {unread > 0 && (
          <span className="inline-flex items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
            {unread}
          </span>
        )}
      </div>

      {/* 탭 */}
      <Tabs defaultValue="alerts">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="alerts" className="data-active:bg-slate-700 data-active:text-slate-100 text-slate-400">
            알림 목록
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-active:bg-slate-700 data-active:text-slate-100 text-slate-400">
            모니터링 설정
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <AlertList />
        </TabsContent>

        <TabsContent value="settings">
          <MonitoringSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
