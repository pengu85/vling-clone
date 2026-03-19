"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { AutocompleteChannel } from "@/app/api/youtube/autocomplete/route";

function formatSubscriberCount(count: number): string {
  if (count >= 10_000_000) return `${(count / 10_000_000).toFixed(1)}천만`;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}백만`;
  if (count >= 10_000) return `${(count / 10_000).toFixed(1)}만`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}천`;
  return String(count);
}

interface AutocompleteDropdownProps {
  suggestions: AutocompleteChannel[];
  activeIndex: number;
  onSelect: (channel: AutocompleteChannel) => void;
  onMouseEnter: (index: number) => void;
  isLoading?: boolean;
  query?: string;
}

export function AutocompleteDropdown({
  suggestions,
  activeIndex,
  onSelect,
  onMouseEnter,
  isLoading = false,
  query = "",
}: AutocompleteDropdownProps) {
  const router = useRouter();
  const trimmedQuery = query.trim();

  // Show the dropdown if there's a non-empty query (for "view all" row) or results/loading
  if (!trimmedQuery && suggestions.length === 0 && !isLoading) return null;
  if (!trimmedQuery) return null;

  function handleViewAll(e: React.MouseEvent) {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
  }

  return (
    <ul
      role="listbox"
      className="absolute left-0 right-0 top-full mt-1 z-50 rounded-md border border-slate-700 bg-slate-800 shadow-lg overflow-hidden"
    >
      {/* Loading indicator */}
      {isLoading && (
        <li className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-400">
          <Loader2 className="size-4 animate-spin shrink-0" />
          검색 중...
        </li>
      )}

      {/* Suggestions */}
      {!isLoading && suggestions.map((channel, index) => (
        <li
          key={channel.channelId}
          role="option"
          aria-selected={index === activeIndex}
          className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
            index === activeIndex
              ? "bg-slate-700"
              : "hover:bg-slate-700"
          }`}
          onMouseDown={(e) => {
            // Prevent input blur before click registers
            e.preventDefault();
            onSelect(channel);
          }}
          onMouseEnter={() => onMouseEnter(index)}
        >
          {/* Channel thumbnail */}
          <div className="flex-shrink-0 size-8 rounded-full overflow-hidden bg-slate-700">
            <Image
              src={channel.thumbnailUrl}
              alt={channel.title}
              width={32}
              height={32}
              className="object-cover"
            />
          </div>

          {/* Channel info */}
          <div className="flex flex-col min-w-0">
            <span className="text-sm text-slate-100 truncate font-medium leading-tight">
              {channel.title}
            </span>
            <span className="text-xs text-slate-400 leading-tight">
              구독자 {formatSubscriberCount(channel.subscriberCount)}명
            </span>
          </div>
        </li>
      ))}

      {/* View all results */}
      <li
        role="option"
        aria-selected={false}
        className="flex items-center gap-2 px-3 py-2 cursor-pointer border-t border-slate-700 text-blue-400 hover:bg-slate-700 transition-colors text-sm font-medium"
        onMouseDown={handleViewAll}
      >
        <span>&ldquo;{trimmedQuery}&rdquo; 전체 검색 →</span>
      </li>
    </ul>
  );
}
