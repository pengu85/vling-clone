"use client";

import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ShieldAlert,
  Loader2,
  Search,
  MessageSquare,
  AlertTriangle,
  Percent,
  Trash2,
  CheckSquare,
  Square,
  Clock,
  User,
  ArrowUpDown,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Types ──

interface SpamComment {
  id: string;
  text: string;
  authorName: string;
  authorImage: string;
  publishedAt: string;
  likeCount: number;
  spamScore: number;
  spamType: "홍보성" | "피싱" | "반복" | "욕설" | "봇" | "정상";
  highlightedKeywords: string[];
  videoTitle: string;
}

interface SpamTypeStat {
  name: string;
  value: number;
}

interface SpamAccountInfo {
  name: string;
  count: number;
}

interface SpamAnalysisResponse {
  totalComments: number;
  spamCount: number;
  spamRate: number;
  comments: SpamComment[];
  spamTypeDistribution: SpamTypeStat[];
  topSpamType: string;
  peakSpamHour: string;
  repeatSpamAccounts: SpamAccountInfo[];
}

// ── Constants ──

const SPAM_TYPE_COLORS: Record<string, string> = {
  "홍보성": "#f59e0b",
  "피싱": "#ef4444",
  "반복": "#8b5cf6",
  "욕설": "#f97316",
  "봇": "#6b7280",
};

const PIE_COLORS = ["#f59e0b", "#ef4444", "#8b5cf6", "#f97316", "#6b7280"];

const SPAM_TYPE_BADGE_STYLES: Record<string, string> = {
  "홍보성": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "피싱": "bg-red-500/20 text-red-400 border-red-500/30",
  "반복": "bg-violet-500/20 text-violet-400 border-violet-500/30",
  "욕설": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "봇": "bg-slate-500/20 text-slate-400 border-slate-500/30",
  "정상": "bg-green-500/20 text-green-400 border-green-500/30",
};

// ── Helpers ──

function highlightKeywords(text: string, keywords: string[]): React.ReactNode {
  if (!keywords.length) return text;

  // Escape special regex chars in keywords
  const escaped = keywords.map((k) =>
    k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, i) => {
    const isKw = keywords.some(
      (kw) => kw.toLowerCase() === part.toLowerCase()
    );
    if (isKw) {
      return (
        <span key={i} className="bg-red-500/30 text-red-300 rounded px-0.5">
          {part}
        </span>
      );
    }
    return part;
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Component ──

export default function SpamCommentsPage() {
  const [channelInput, setChannelInput] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortAsc, setSortAsc] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);

  const mutation = useMutation<SpamAnalysisResponse, Error>({
    mutationFn: async () => {
      const res = await fetch("/api/tools/spam-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: channelInput }),
      });
      if (!res.ok) throw new Error("분석 요청 실패");
      return res.json();
    },
  });

  const data = mutation.data;

  // Filtered + sorted comments
  const displayedComments = useMemo(() => {
    if (!data) return [];
    let list = [...data.comments];
    if (filterType) {
      list = list.filter((c) => c.spamType === filterType);
    }
    list.sort((a, b) =>
      sortAsc ? a.spamScore - b.spamScore : b.spamScore - a.spamScore
    );
    return list;
  }, [data, filterType, sortAsc]);

  const spamComments = useMemo(
    () => displayedComments.filter((c) => c.spamType !== "정상"),
    [displayedComments]
  );

  function handleScan() {
    if (!channelInput.trim()) return;
    setSelectedIds(new Set());
    setFilterType(null);
    mutation.mutate();
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === spamComments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(spamComments.map((c) => c.id)));
    }
  }

  function handleDeleteSelected() {
    // UI only - YouTube API auth required for actual deletion
    alert(
      `${selectedIds.size}개의 스팸 댓글 삭제 요청\n(실제 삭제는 YouTube API OAuth 인증이 필요합니다)`
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20">
          <ShieldAlert className="size-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">스팸 댓글 관리</h1>
          <p className="text-sm text-slate-400">
            채널의 스팸 댓글을 탐지하고 관리합니다
          </p>
        </div>
      </div>

      {/* Channel Input */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="채널 URL, @핸들, 또는 채널 ID 입력"
              value={channelInput}
              onChange={(e) => setChannelInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              className="h-10 bg-white/10 border-white/15 text-white placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-blue-400/30"
            />
            <Button
              onClick={handleScan}
              disabled={mutation.isPending || !channelInput.trim()}
              className="h-10 bg-red-500 hover:bg-red-400 text-white px-6 shrink-0"
            >
              {mutation.isPending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <Search className="size-4 mr-2" />
              )}
              스캔
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {mutation.isError && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">
          분석 중 오류가 발생했습니다. 다시 시도해주세요.
        </div>
      )}

      {/* Results */}
      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                    <MessageSquare className="size-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">총 댓글 수</p>
                    <p className="text-2xl font-bold text-white">
                      {data.totalComments.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
                    <AlertTriangle className="size-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">스팸 의심</p>
                    <p className="text-2xl font-bold text-red-400">
                      {data.spamCount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                    <Percent className="size-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">스팸 비율</p>
                    <p className="text-2xl font-bold text-amber-400">
                      {data.spamRate}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Spam Type Distribution + Pattern Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Pie Chart */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-base text-white">
                  스팸 유형 분포
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.spamTypeDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={data.spamTypeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }: { name?: string; percent?: number }) =>
                          `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {data.spamTypeDistribution.map((entry, idx) => (
                          <Cell
                            key={entry.name}
                            fill={
                              SPAM_TYPE_COLORS[entry.name] ||
                              PIE_COLORS[idx % PIE_COLORS.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Legend
                        wrapperStyle={{ color: "#94a3b8", fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-slate-500 py-12">
                    스팸 댓글이 감지되지 않았습니다
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Pattern Analysis */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-base text-white">
                  스팸 패턴 분석
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Top spam type */}
                <div>
                  <p className="text-xs text-slate-500 mb-1">
                    가장 많은 스팸 유형
                  </p>
                  <Badge
                    className={cn(
                      "text-sm",
                      SPAM_TYPE_BADGE_STYLES[data.topSpamType] ||
                        "bg-slate-500/20 text-slate-400"
                    )}
                  >
                    {data.topSpamType}
                  </Badge>
                </div>

                {/* Peak hour */}
                <div>
                  <p className="text-xs text-slate-500 mb-1">
                    스팸 활동 시간대
                  </p>
                  <div className="flex items-center gap-2 text-white">
                    <Clock className="size-4 text-slate-400" />
                    <span className="text-sm font-medium">
                      {data.peakSpamHour}
                    </span>
                  </div>
                </div>

                {/* Repeat spam accounts */}
                <div>
                  <p className="text-xs text-slate-500 mb-2">
                    반복 스팸 계정
                  </p>
                  {data.repeatSpamAccounts.length > 0 ? (
                    <div className="space-y-1.5">
                      {data.repeatSpamAccounts.map((acc) => (
                        <div
                          key={acc.name}
                          className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <User className="size-3.5 text-slate-500" />
                            <span className="text-sm text-white">
                              {acc.name}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-xs border-red-500/30 text-red-400"
                          >
                            {acc.count}건
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      반복 스팸 계정 없음
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comment List */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base text-white">
                  댓글 목록 ({displayedComments.length})
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Filter buttons */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterType(null)}
                    className={cn(
                      "text-xs h-7",
                      !filterType
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:text-white"
                    )}
                  >
                    전체
                  </Button>
                  {Object.keys(SPAM_TYPE_COLORS).map((type) => (
                    <Button
                      key={type}
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setFilterType(filterType === type ? null : type)
                      }
                      className={cn(
                        "text-xs h-7",
                        filterType === type
                          ? "bg-white/10 text-white"
                          : "text-slate-400 hover:text-white"
                      )}
                    >
                      {type}
                    </Button>
                  ))}

                  <div className="h-4 w-px bg-slate-700" />

                  {/* Sort */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSortAsc(!sortAsc)}
                    className="text-xs h-7 text-slate-400 hover:text-white gap-1"
                  >
                    <ArrowUpDown className="size-3" />
                    점수 {sortAsc ? "↑" : "↓"}
                  </Button>
                </div>
              </div>

              {/* Bulk actions */}
              {spamComments.length > 0 && (
                <div className="flex items-center gap-3 mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="text-xs h-7 text-slate-400 hover:text-white gap-1.5"
                  >
                    {selectedIds.size === spamComments.length ? (
                      <CheckSquare className="size-3.5" />
                    ) : (
                      <Square className="size-3.5" />
                    )}
                    스팸 전체 선택 ({selectedIds.size}/{spamComments.length})
                  </Button>
                  {selectedIds.size > 0 && (
                    <Button
                      size="sm"
                      onClick={handleDeleteSelected}
                      className="text-xs h-7 bg-red-500/20 text-red-400 hover:bg-red-500/30 gap-1.5"
                    >
                      <Trash2 className="size-3.5" />
                      선택 삭제 ({selectedIds.size})
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {displayedComments.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">
                    해당 유형의 댓글이 없습니다
                  </p>
                ) : (
                  displayedComments.map((comment) => (
                    <div
                      key={comment.id}
                      className={cn(
                        "flex gap-3 rounded-lg border p-3 transition-colors",
                        comment.spamType !== "정상"
                          ? "bg-red-500/5 border-red-500/10 hover:bg-red-500/10"
                          : "bg-white/5 border-white/5 hover:bg-white/10"
                      )}
                    >
                      {/* Checkbox (spam only) */}
                      {comment.spamType !== "정상" && (
                        <button
                          onClick={() => toggleSelect(comment.id)}
                          className="mt-0.5 shrink-0 text-slate-400 hover:text-white"
                        >
                          {selectedIds.has(comment.id) ? (
                            <CheckSquare className="size-4 text-red-400" />
                          ) : (
                            <Square className="size-4" />
                          )}
                        </button>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            {comment.authorName}
                          </span>
                          <Badge
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              SPAM_TYPE_BADGE_STYLES[comment.spamType]
                            )}
                          >
                            {comment.spamType}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {formatDate(comment.publishedAt)}
                          </span>
                          <span className="text-xs text-slate-600">
                            {comment.videoTitle}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 break-all">
                          {highlightKeywords(
                            comment.text,
                            comment.highlightedKeywords
                          )}
                        </p>
                      </div>

                      {/* Spam score */}
                      <div className="shrink-0 text-right">
                        <div
                          className={cn(
                            "text-lg font-bold",
                            comment.spamScore >= 70
                              ? "text-red-400"
                              : comment.spamScore >= 30
                                ? "text-amber-400"
                                : "text-green-400"
                          )}
                        >
                          {comment.spamScore}
                        </div>
                        <p className="text-[10px] text-slate-500">스팸점수</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Loading state */}
      {mutation.isPending && (
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="size-8 animate-spin text-red-400" />
          <p className="text-slate-400">스팸 댓글을 스캔하고 있습니다...</p>
        </div>
      )}

      {/* Empty state */}
      {!data && !mutation.isPending && !mutation.isError && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <ShieldAlert className="size-12 text-slate-600" />
          <p className="text-slate-400">
            채널 URL이나 ID를 입력하고 스캔 버튼을 눌러주세요
          </p>
          <p className="text-xs text-slate-600">
            최근 영상 5개의 댓글을 분석하여 스팸을 탐지합니다
          </p>
        </div>
      )}
    </div>
  );
}
