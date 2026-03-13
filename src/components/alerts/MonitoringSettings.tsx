"use client";

import { useState } from "react";
import {
  Settings2,
  Trash2,
  Plus,
  Users,
  Eye,
  Activity,
} from "lucide-react";
import { useAlertStore, type MonitorRule } from "@/stores/alertStore";
import { useFavoriteStore } from "@/stores/favoriteStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function ToggleSwitch({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
        enabled ? "bg-blue-600" : "bg-slate-700"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform",
          enabled ? "translate-x-[18px]" : "translate-x-[3px]"
        )}
      />
    </button>
  );
}

function RuleCard({ rule }: { rule: MonitorRule }) {
  const updateRule = useAlertStore((s) => s.updateRule);
  const removeRule = useAlertStore((s) => s.removeRule);
  const [editing, setEditing] = useState(false);
  const [subThreshold, setSubThreshold] = useState(
    rule.subscriberThreshold.toString()
  );
  const [viewThreshold, setViewThreshold] = useState(
    rule.viewThreshold.toString()
  );

  const handleSave = () => {
    updateRule(rule.channelId, {
      subscriberThreshold: parseInt(subThreshold) || 0,
      viewThreshold: parseInt(viewThreshold) || 0,
    });
    setEditing(false);
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        rule.enabled
          ? "border-slate-700 bg-slate-800/60"
          : "border-slate-800 bg-slate-900/50 opacity-60"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <Activity
            className={cn(
              "size-4",
              rule.enabled ? "text-green-400" : "text-slate-600"
            )}
          />
          <span className="text-sm font-medium text-slate-100">
            {rule.channelTitle}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ToggleSwitch
            enabled={rule.enabled}
            onChange={(val) => updateRule(rule.channelId, { enabled: val })}
          />
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => removeRule(rule.channelId)}
            className="text-slate-500 hover:text-red-400"
            title="규칙 삭제"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>

      {/* Thresholds */}
      {editing ? (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Users className="size-3.5 text-blue-400 shrink-0" />
            <label className="text-xs text-slate-400 w-20 shrink-0">
              구독자 변동
            </label>
            <Input
              type="number"
              value={subThreshold}
              onChange={(e) => setSubThreshold(e.target.value)}
              className="h-7 text-xs bg-slate-900 border-slate-700"
              placeholder="10000"
            />
            <span className="text-xs text-slate-500 shrink-0">명 이상</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="size-3.5 text-green-400 shrink-0" />
            <label className="text-xs text-slate-400 w-20 shrink-0">
              조회수 변동
            </label>
            <Input
              type="number"
              value={viewThreshold}
              onChange={(e) => setViewThreshold(e.target.value)}
              className="h-7 text-xs bg-slate-900 border-slate-700"
              placeholder="500000"
            />
            <span className="text-xs text-slate-500 shrink-0">회 이상</span>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(false)}
              className="text-slate-400"
            >
              취소
            </Button>
            <Button size="sm" onClick={handleSave}>
              저장
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Users className="size-3 text-blue-400" />
            <span>
              구독자 변동{" "}
              <span className="text-slate-300 font-medium">
                {rule.subscriberThreshold.toLocaleString()}명
              </span>{" "}
              이상 시 알림
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Eye className="size-3 text-green-400" />
            <span>
              조회수 변동{" "}
              <span className="text-slate-300 font-medium">
                {rule.viewThreshold.toLocaleString()}회
              </span>{" "}
              이상 시 알림
            </span>
          </div>
          <div className="pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
              className="text-slate-500 hover:text-slate-300 text-xs h-6"
            >
              <Settings2 className="size-3 mr-1" />
              임계값 수정
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function MonitoringSettings() {
  const rules = useAlertStore((s) => s.rules);
  const addRule = useAlertStore((s) => s.addRule);
  const favorites = useFavoriteStore((s) => s.favorites);

  // Channels that are favorited but don't have a rule yet
  const availableChannels = favorites.filter(
    (f) => !rules.find((r) => r.channelId === f.channel.id)
  );

  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          모니터링 중인 채널{" "}
          <span className="text-blue-400 font-medium">{rules.length}개</span>
        </p>
        {availableChannels.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdd(!showAdd)}
            className="text-slate-300 border-slate-700 hover:bg-slate-800"
          >
            <Plus className="size-3.5 mr-1" />
            채널 추가
          </Button>
        )}
      </div>

      {/* Add from favorites */}
      {showAdd && availableChannels.length > 0 && (
        <div className="rounded-lg border border-dashed border-slate-700 p-3 space-y-2">
          <p className="text-xs text-slate-500 mb-2">
            즐겨찾기 채널에서 모니터링할 채널을 선택하세요
          </p>
          <div className="flex flex-wrap gap-2">
            {availableChannels.map((fav) => (
              <Button
                key={fav.channel.id}
                variant="outline"
                size="sm"
                onClick={() => {
                  addRule({
                    channelId: fav.channel.id,
                    channelTitle: fav.channel.title,
                  });
                }}
                className="text-xs text-slate-300 border-slate-700 hover:bg-slate-800 hover:border-blue-500/50"
              >
                <Plus className="size-3 mr-1" />
                {fav.channel.title}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Rules list */}
      {rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <Settings2 className="size-10 mb-3 opacity-40" />
          <p className="text-sm">모니터링 규칙이 없습니다</p>
          <p className="text-xs mt-1">
            즐겨찾기한 채널을 추가하여 모니터링을 시작하세요.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <RuleCard key={rule.channelId} rule={rule} />
          ))}
        </div>
      )}
    </div>
  );
}
