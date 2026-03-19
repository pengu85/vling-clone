"use client";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorCardProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorCard({
  title = "오류가 발생했습니다",
  message = "잠시 후 다시 시도해주세요",
  onRetry,
}: ErrorCardProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <AlertTriangle className="w-12 h-12 mb-4 text-yellow-500" />
      <p className="text-lg font-medium mb-2 text-slate-200">{title}</p>
      <p className="text-sm mb-6">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          다시 시도
        </Button>
      )}
    </div>
  );
}
