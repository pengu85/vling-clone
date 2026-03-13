"use client";

import Image from "next/image";
import { X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatCurrency, formatGrowthRate } from "@/lib/formatters";
import { CATEGORIES, COUNTRIES } from "@/domain/categories";
import type { Channel } from "@/types";

interface CompareTableProps {
  channels: Channel[];
  onRemove: (id: string) => void;
}

interface RowDef {
  label: string;
  getValue: (ch: Channel) => number | string;
  format: (val: number | string) => string;
  numeric: boolean;
}

const rows: RowDef[] = [
  {
    label: "구독자 수",
    getValue: (ch) => ch.subscriberCount,
    format: (v) => formatNumber(v as number),
    numeric: true,
  },
  {
    label: "총 조회수",
    getValue: (ch) => ch.viewCount,
    format: (v) => formatNumber(v as number),
    numeric: true,
  },
  {
    label: "영상 수",
    getValue: (ch) => ch.videoCount,
    format: (v) => `${(v as number).toLocaleString()}개`,
    numeric: true,
  },
  {
    label: "일 평균 조회수",
    getValue: (ch) => ch.dailyAvgViews,
    format: (v) => formatNumber(v as number),
    numeric: true,
  },
  {
    label: "성장률 (30일)",
    getValue: (ch) => ch.growthRate30d,
    format: (v) => formatGrowthRate(v as number),
    numeric: true,
  },
  {
    label: "알고리즘 스코어",
    getValue: (ch) => ch.algoScore,
    format: (v) => `${v}점`,
    numeric: true,
  },
  {
    label: "참여율",
    getValue: (ch) => ch.engagementRate,
    format: (v) => `${(v as number).toFixed(1)}%`,
    numeric: true,
  },
  {
    label: "예상 월수익",
    getValue: (ch) => ch.estimatedRevenue,
    format: (v) => formatCurrency(v as number),
    numeric: true,
  },
  {
    label: "예상 광고단가",
    getValue: (ch) => ch.estimatedAdPrice,
    format: (v) => formatCurrency(v as number),
    numeric: true,
  },
  {
    label: "카테고리",
    getValue: (ch) =>
      CATEGORIES.find((c) => c.value === ch.category)?.label ?? ch.category,
    format: (v) => v as string,
    numeric: false,
  },
  {
    label: "국가",
    getValue: (ch) =>
      COUNTRIES.find((c) => c.value === ch.country)?.label ?? ch.country,
    format: (v) => v as string,
    numeric: false,
  },
];

export function CompareTable({ channels, onRemove }: CompareTableProps) {
  if (channels.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-500">
        비교할 채널을 추가하세요
      </div>
    );
  }

  // Find max value index per numeric row
  const getMaxIdx = (row: RowDef): number => {
    if (!row.numeric) return -1;
    const vals = channels.map((ch) => row.getValue(ch) as number);
    return vals.indexOf(Math.max(...vals));
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow className="border-slate-800 hover:bg-transparent">
            <TableHead className="w-36 bg-slate-900/80 text-slate-400 text-xs sticky left-0 z-10">
              항목
            </TableHead>
            {channels.map((ch) => (
              <TableHead key={ch.id} className="bg-slate-900/80 min-w-[160px]">
                <div className="flex items-start gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-700">
                      <Image
                        src={ch.thumbnailUrl}
                        alt={ch.title}
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="truncate text-sm font-medium text-slate-100">
                      {ch.title}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onRemove(ch.id)}
                    className="shrink-0 text-slate-500 hover:text-red-400 hover:bg-red-400/10"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const maxIdx = getMaxIdx(row);
            return (
              <TableRow key={row.label} className="border-slate-800 hover:bg-slate-800/40">
                <TableCell className="text-xs text-slate-400 font-medium bg-slate-900/50 sticky left-0 z-10">
                  {row.label}
                </TableCell>
                {channels.map((ch, i) => {
                  const val = row.getValue(ch);
                  const isTop = row.numeric && i === maxIdx && channels.length > 1;
                  return (
                    <TableCell
                      key={ch.id}
                      className={`text-sm ${
                        isTop
                          ? "font-bold text-blue-400"
                          : "text-slate-300"
                      }`}
                    >
                      {row.format(val)}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
