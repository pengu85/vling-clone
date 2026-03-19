"use client";

import { FileSearch, Home, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NotFound() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-800">
        <FileSearch className="w-8 h-8 text-slate-400" />
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-5xl font-bold text-slate-500">404</p>
        <h2 className="text-xl font-semibold text-slate-100">
          페이지를 찾을 수 없습니다
        </h2>
        <p className="text-sm text-slate-400 max-w-md">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
      </div>
      <Link
        href="/"
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-medium transition-colors"
      >
        <Home className="w-4 h-4" />
        홈으로 돌아가기
      </Link>
      <form onSubmit={handleSearch} className="flex items-center gap-2 w-full max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색어를 입력하세요..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-medium transition-colors whitespace-nowrap"
        >
          검색
        </button>
      </form>
    </div>
  );
}
