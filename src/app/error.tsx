"use client";

import { ErrorCard } from "@/components/ui/error-card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <ErrorCard
        title="오류가 발생했습니다"
        message={error.message || "예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."}
        onRetry={reset}
      />
    </div>
  );
}
