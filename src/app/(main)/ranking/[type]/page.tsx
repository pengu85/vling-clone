"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import { BarChart2, TrendingUp, Users, DollarSign, Gift, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RankingTable } from "@/components/ranking/RankingTable";
import { Pagination } from "@/components/ranking/Pagination";
import { useRanking } from "@/hooks/useRanking";
import { CATEGORIES } from "@/domain/categories";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import type { RankType } from "@/types";
import { useRouter } from "next/navigation";

const RANK_TABS: { value: RankType; label: string; icon: React.ElementType }[] = [
  { value: "subscriber", label: "구독자", icon: Users },
  { value: "view", label: "조회수", icon: BarChart2 },
  { value: "growth", label: "성장률", icon: TrendingUp },
  { value: "revenue", label: "수익", icon: DollarSign },
  { value: "superchat", label: "슈퍼챗", icon: Gift },
];

const VALID_TYPES = new Set<RankType>([
  "subscriber",
  "view",
  "growth",
  "revenue",
  "superchat",
]);

const LIMIT = 20;

interface PageProps {
  params: Promise<{ type: string }>;
}

export default function RankingTypePage({ params }: PageProps) {
  const { type: rawType } = use(params);
  const router = useRouter();

  // 유효하지 않은 type이면 404
  if (!VALID_TYPES.has(rawType as RankType)) {
    notFound();
  }

  const rankType = rawType as RankType;
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useRanking({
    type: rankType,
    category,
    page,
    limit: LIMIT,
  });

  const items = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  function handleTypeChange(type: RankType) {
    router.push(`/ranking/${type}`);
    setPage(1);
  }

  function handleCategoryChange(val: string | null) {
    setCategory(val ?? "all");
    setPage(1);
  }

  const activeTab = RANK_TABS.find((t) => t.value === rankType);

  return (
    <div className="text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "랭킹", href: "/ranking/subscriber" }, { label: activeTab?.label ?? rankType }]} />
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-100">
            유튜브 순위 &mdash; {activeTab?.label}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            카테고리별, 지표별 채널 순위를 확인하세요.
          </p>
        </div>

        {/* 순위 유형 탭 */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {RANK_TABS.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant="ghost"
              size="sm"
              onClick={() => handleTypeChange(value)}
              className={cn(
                "h-8 gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors",
                rankType === value
                  ? "bg-blue-600 text-white hover:bg-blue-500"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </Button>
          ))}
        </div>

        {/* 필터 바 */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="h-8 w-36 border-slate-700 bg-slate-800 text-slate-300 text-xs">
              <SelectValue placeholder="카테고리" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value} className="text-xs">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 에러 상태 */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <AlertTriangle className="w-12 h-12 mb-4 text-yellow-500" />
            <p className="text-lg mb-2">데이터를 불러올 수 없습니다</p>
            <p className="text-sm mb-4">잠시 후 다시 시도해주세요</p>
            <button onClick={() => refetch()} className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors">
              다시 시도
            </button>
          </div>
        )}

        {/* 테이블 */}
        {!isError && <RankingTable data={items} isLoading={isLoading} />}

        {/* 페이지네이션 */}
        {!isLoading && !isError && totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}

