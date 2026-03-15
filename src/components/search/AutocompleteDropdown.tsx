"use client";

import Image from "next/image";
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
}

export function AutocompleteDropdown({
  suggestions,
  activeIndex,
  onSelect,
  onMouseEnter,
}: AutocompleteDropdownProps) {
  if (suggestions.length === 0) return null;

  return (
    <ul
      role="listbox"
      className="absolute left-0 right-0 top-full mt-1 z-50 rounded-md border border-slate-700 bg-slate-800 shadow-lg overflow-hidden"
    >
      {suggestions.map((channel, index) => (
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
    </ul>
  );
}
