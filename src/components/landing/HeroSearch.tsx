"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function HeroSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  }

  return (
    <form
      onSubmit={handleSearch}
      className="mx-auto mb-10 flex max-w-xl items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm"
    >
      <Search className="ml-2 h-5 w-5 shrink-0 text-slate-400" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="채널명 또는 키워드를 검색하세요"
        className="border-0 bg-transparent text-white placeholder:text-slate-500 focus-visible:ring-0 text-base flex-1"
      />
      <Button
        type="submit"
        className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white border-none h-9 px-5 rounded-xl"
      >
        검색
      </Button>
    </form>
  );
}
