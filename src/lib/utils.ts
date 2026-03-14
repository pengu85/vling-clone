import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * channelId를 시드로 사용해 -5.0 ~ 5.0 범위의 결정적 성장률을 반환합니다.
 * 같은 channelId면 항상 같은 값을 반환합니다.
 */
export function deterministicGrowthRate(channelId: string): number {
  let hash = 0;
  for (let i = 0; i < channelId.length; i++) {
    hash = ((hash << 5) - hash + channelId.charCodeAt(i)) | 0;
  }
  const normalized = (hash % 500) / 100; // -5.0 ~ 5.0 범위
  return parseFloat(normalized.toFixed(1));
}
