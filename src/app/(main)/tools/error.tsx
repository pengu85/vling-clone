"use client";

import { ErrorCard } from "@/components/ui/error-card";

export default function ToolsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <ErrorCard
        title="도구를 불러올 수 없습니다"
        onRetry={reset}
      />
    </div>
  );
}
