"use client";

import { ErrorCard } from "@/components/ui/error-card";

export default function TrendingError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <ErrorCard
        title="트렌딩 데이터를 불러올 수 없습니다"
        onRetry={reset}
      />
    </div>
  );
}
