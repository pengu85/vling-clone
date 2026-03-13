"use client";

import { Bell, Eye, Users, DollarSign, Check, CheckCheck, Trash2 } from "lucide-react";
import { useAlertStore, type Alert } from "@/stores/alertStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${days}일 전`;
}

function getTypeIcon(type: Alert["type"]) {
  switch (type) {
    case "subscriber":
      return <Users className="size-4 text-blue-400" />;
    case "view":
      return <Eye className="size-4 text-green-400" />;
    case "revenue":
      return <DollarSign className="size-4 text-yellow-400" />;
  }
}

function getTypeLabel(type: Alert["type"]) {
  switch (type) {
    case "subscriber":
      return "구독자";
    case "view":
      return "조회수";
    case "revenue":
      return "수익";
  }
}

function getTypeBadgeClass(type: Alert["type"]) {
  switch (type) {
    case "subscriber":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "view":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "revenue":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  }
}

export function AlertList() {
  const alerts = useAlertStore((s) => s.alerts);
  const markAsRead = useAlertStore((s) => s.markAsRead);
  const markAllAsRead = useAlertStore((s) => s.markAllAsRead);
  const removeAlert = useAlertStore((s) => s.removeAlert);
  const unreadCount = useAlertStore((s) => s.unreadCount);

  const unread = unreadCount();

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Bell className="size-10 mb-3 opacity-40" />
        <p className="text-sm">알림이 없습니다</p>
        <p className="text-xs mt-1">채널 모니터링을 설정하면 알림을 받을 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {unread > 0 ? (
            <>
              읽지 않은 알림 <span className="text-blue-400 font-medium">{unread}개</span>
            </>
          ) : (
            "모든 알림을 확인했습니다"
          )}
        </p>
        {unread > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-slate-400 hover:text-slate-100"
          >
            <CheckCheck className="size-3.5 mr-1" />
            모두 읽음
          </Button>
        )}
      </div>

      {/* Alert items */}
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              "group relative flex items-start gap-3 rounded-lg border p-3 transition-colors",
              alert.read
                ? "border-slate-800 bg-slate-900/50"
                : "border-slate-700 bg-slate-800/80"
            )}
          >
            {/* Unread dot */}
            {!alert.read && (
              <div className="absolute top-3 left-1.5 size-1.5 rounded-full bg-blue-400" />
            )}

            {/* Type icon */}
            <div className="mt-0.5 shrink-0 pl-2">{getTypeIcon(alert.type)}</div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-slate-100 truncate">
                  {alert.channelTitle}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                    getTypeBadgeClass(alert.type)
                  )}
                >
                  {getTypeLabel(alert.type)}
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                {alert.message}
              </p>
              <p className="text-xs text-slate-600 mt-1.5">
                {formatRelativeTime(alert.timestamp)}
              </p>
            </div>

            {/* Actions */}
            <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!alert.read && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => markAsRead(alert.id)}
                  className="text-slate-500 hover:text-slate-300"
                  title="읽음 표시"
                >
                  <Check className="size-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => removeAlert(alert.id)}
                className="text-slate-500 hover:text-red-400"
                title="삭제"
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
