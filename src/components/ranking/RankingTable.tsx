"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatGrowthRate, formatCurrency } from "@/lib/formatters";
import type { RankingItem } from "@/hooks/useRanking";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/domain/categories";

function getCategoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

interface RankingTableProps {
  data: RankingItem[];
  isLoading: boolean;
}

function MedalBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return (
    <span className="text-sm font-semibold tabular-nums text-slate-500">
      {rank}
    </span>
  );
}

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell className="w-12">
        <div className="h-5 w-6 rounded bg-slate-800 animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-slate-800 animate-pulse shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 rounded bg-slate-800 animate-pulse" />
            <div className="h-3 w-16 rounded bg-slate-800 animate-pulse" />
          </div>
        </div>
      </TableCell>
      {[...Array(4)].map((_, i) => (
        <TableCell key={i}>
          <div className="h-3.5 w-16 rounded bg-slate-800 animate-pulse" />
        </TableCell>
      ))}
    </TableRow>
  );
}

function MobileSkeletonCard() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 last:border-0">
      <div className="h-5 w-5 rounded bg-slate-800 animate-pulse shrink-0" />
      <div className="h-9 w-9 rounded-full bg-slate-800 animate-pulse shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-32 rounded bg-slate-800 animate-pulse" />
        <div className="h-3 w-16 rounded bg-slate-800 animate-pulse" />
      </div>
      <div className="text-right space-y-1.5">
        <div className="h-3.5 w-14 rounded bg-slate-800 animate-pulse ml-auto" />
        <div className="h-3 w-10 rounded bg-slate-800 animate-pulse ml-auto" />
      </div>
    </div>
  );
}

export function RankingTable({ data, isLoading }: RankingTableProps) {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-slate-800 overflow-hidden">
      {/* Mobile card list */}
      <div className="block md:hidden">
        {isLoading ? (
          [...Array(10)].map((_, i) => <MobileSkeletonCard key={i} />)
        ) : data.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            순위 데이터가 없습니다.
          </div>
        ) : (
          data.map((item) => {
            const ch = item.channel;
            const isTop3 = item.rank <= 3;
            return (
              <div
                key={item.id}
                onClick={() => router.push(`/channel/${ch.id}`)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`/channel/${ch.id}`); } }}
                role="link"
                tabIndex={0}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 border-b border-slate-800 last:border-0 cursor-pointer transition-colors",
                  isTop3 ? "bg-slate-800/40 hover:bg-slate-800/70" : "hover:bg-slate-800/30"
                )}
              >
                {isTop3 && (
                  <span
                    className={cn(
                      "absolute left-0 top-0 bottom-0 w-0.5",
                      item.rank === 1 && "bg-yellow-400",
                      item.rank === 2 && "bg-slate-400",
                      item.rank === 3 && "bg-amber-600"
                    )}
                  />
                )}
                {/* 순위 */}
                <div className="w-6 text-center shrink-0">
                  <MedalBadge rank={item.rank} />
                </div>
                {/* 썸네일 */}
                <div className="relative h-9 w-9 shrink-0 rounded-full overflow-hidden bg-slate-700">
                  {ch.thumbnailUrl ? (
                    <Image
                      src={ch.thumbnailUrl}
                      alt={ch.title}
                      fill
                      className="object-cover"

                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs font-bold text-slate-400">
                      {ch.title.slice(0, 1)}
                    </div>
                  )}
                </div>
                {/* 채널명 + 카테고리 */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-100 truncate">
                    {ch.title}
                  </p>
                  <Badge
                    variant="secondary"
                    className="mt-0.5 h-4 px-1.5 text-[10px] bg-slate-700 text-slate-400 border-0"
                  >
                    {getCategoryLabel(ch.category)}
                  </Badge>
                </div>
                {/* 구독자 + 성장률 */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-slate-200 tabular-nums">
                    {formatNumber(ch.subscriberCount)}
                  </p>
                  <span
                    className={cn(
                      "text-xs font-medium tabular-nums",
                      ch.growthRate30d >= 0 ? "text-emerald-400" : "text-red-400"
                    )}
                  >
                    {ch.growthRate30d >= 0 ? "▲" : "▼"}{formatGrowthRate(ch.growthRate30d)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 bg-slate-900/50 hover:bg-slate-900/50">
              <TableHead className="w-14 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                순위
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                채널
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                구독자
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                성장률(30일)
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                일 조회수
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                <span className="flex items-center justify-end gap-1.5">
                  예상 수익
                  <span className="text-[10px] font-normal text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded normal-case tracking-normal">추정</span>
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? [...Array(10)].map((_, i) => <SkeletonRow key={i} />)
              : data.map((item) => {
                  const ch = item.channel;
                  const isTop3 = item.rank <= 3;
                  return (
                    <TableRow
                      key={item.id}
                      onClick={() => router.push(`/channel/${ch.id}`)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`/channel/${ch.id}`); } }}
                      role="link"
                      tabIndex={0}
                      className={cn(
                        "border-slate-800 cursor-pointer transition-colors",
                        isTop3
                          ? "bg-slate-800/40 hover:bg-slate-800/70"
                          : "hover:bg-slate-800/30"
                      )}
                    >
                      {/* 순위 */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          {isTop3 && (
                            <span
                              className={cn(
                                "absolute left-0 top-0 bottom-0 w-0.5",
                                item.rank === 1 && "bg-yellow-400",
                                item.rank === 2 && "bg-slate-400",
                                item.rank === 3 && "bg-amber-600"
                              )}
                            />
                          )}
                          <MedalBadge rank={item.rank} />
                        </div>
                      </TableCell>

                      {/* 채널 */}
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative h-9 w-9 shrink-0 rounded-full overflow-hidden bg-slate-700">
                            {ch.thumbnailUrl ? (
                              <Image
                                src={ch.thumbnailUrl}
                                alt={ch.title}
                                fill
                                className="object-cover"
          
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs font-bold text-slate-400">
                                {ch.title.slice(0, 1)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-100 truncate max-w-[180px]">
                              {ch.title}
                            </p>
                            <Badge
                              variant="secondary"
                              className="mt-0.5 h-4 px-1.5 text-xs bg-slate-700 text-slate-400 border-0"
                            >
                              {getCategoryLabel(ch.category)}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>

                      {/* 구독자 */}
                      <TableCell className="text-right text-sm font-medium text-slate-200 tabular-nums">
                        {formatNumber(ch.subscriberCount)}
                      </TableCell>

                      {/* 성장률 */}
                      <TableCell className="text-right tabular-nums">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            ch.growthRate30d >= 0 ? "text-emerald-400" : "text-red-400"
                          )}
                        >
                          {ch.growthRate30d >= 0 ? "▲" : "▼"}{formatGrowthRate(ch.growthRate30d)}
                        </span>
                      </TableCell>

                      {/* 일 조회수 */}
                      <TableCell className="text-right text-sm text-slate-300 tabular-nums">
                        {formatNumber(ch.dailyAvgViews)}
                      </TableCell>

                      {/* 예상 수익 */}
                      <TableCell className="text-right text-sm text-slate-300 tabular-nums">
                        {formatCurrency(ch.estimatedRevenue)}
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>

        {!isLoading && data.length === 0 && (
          <div className="py-16 text-center text-slate-500 text-sm">
            순위 데이터가 없습니다.
          </div>
        )}
      </div>

      {!isLoading && data.length > 0 && (
        <div className="px-4 py-2 text-xs text-slate-600 text-right border-t border-slate-800">
          마지막 업데이트: {new Date().toLocaleString("ko-KR", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
        </div>
      )}
    </div>
  );
}
