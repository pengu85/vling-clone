"use client";

import { useState, KeyboardEvent } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  onSearch: (query: string) => void;
  defaultValue?: string;
}

// Returns channel ID if input is a direct /channel/UC... URL or raw UC... ID
function extractDirectChannelId(input: string): string | null {
  const trimmed = input.trim();

  // Raw channel ID: UC + 22 word chars = 24 chars total
  if (/^UC[\w-]{22}$/.test(trimmed)) {
    return trimmed;
  }

  // https://www.youtube.com/channel/UCxxxx
  const match = trimmed.match(/youtube\.com\/channel\/(UC[\w-]{22})/);
  if (match) {
    return match[1];
  }

  return null;
}

// Returns true if input looks like a YouTube URL that needs server-side resolution
function isResolvableYouTubeUrl(input: string): boolean {
  const trimmed = input.trim();
  return (
    /youtube\.com\/@[\w.-]+/.test(trimmed) ||
    /youtube\.com\/(?:c|user)\/[\w.-]+/.test(trimmed)
  );
}

export function SearchBar({ onSearch, defaultValue = "" }: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSearch() {
    const trimmed = value.trim();
    if (!trimmed) return;

    setResolveError(null);

    // Case 1: direct channel ID or /channel/UC... URL
    const directId = extractDirectChannelId(trimmed);
    if (directId) {
      router.push(`/channel/${directId}`);
      return;
    }

    // Case 2: @handle or /c/ URL — resolve via API
    if (isResolvableYouTubeUrl(trimmed)) {
      setResolving(true);
      try {
        const res = await fetch(
          `/api/youtube/resolve?url=${encodeURIComponent(trimmed)}`
        );
        const data = await res.json();
        if (res.ok && data.channelId) {
          router.push(`/channel/${data.channelId}`);
        } else {
          setResolveError("채널을 찾을 수 없습니다. 다시 확인해주세요.");
        }
      } catch {
        setResolveError("채널 조회 중 오류가 발생했습니다.");
      } finally {
        setResolving(false);
      }
      return;
    }

    // Case 3: normal keyword search
    onSearch(trimmed);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500/30 transition-all">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setResolveError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="채널명 또는 키워드를 검색하세요"
          className="border-0 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus-visible:ring-0 h-auto p-0 flex-1"
          disabled={resolving}
        />
        <Button
          size="sm"
          onClick={handleSearch}
          disabled={resolving}
          className="h-7 shrink-0 bg-violet-600 hover:bg-violet-500 text-white border-none px-4 text-xs rounded-lg disabled:opacity-60"
        >
          {resolving ? "검색 중..." : "검색"}
        </Button>
      </div>
      {resolveError ? (
        <p className="text-xs text-red-400 px-1">{resolveError}</p>
      ) : (
        <p className="text-xs text-slate-500 px-1">
          채널 URL을 직접 붙여넣어 바로 이동할 수도 있습니다
        </p>
      )}
    </div>
  );
}
