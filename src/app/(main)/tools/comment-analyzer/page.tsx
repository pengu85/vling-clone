"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  MessageSquareText,
  Loader2,
  Search,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Heart,
  Minus,
  Lightbulb,
  AlertTriangle,
  MessageCircle,
  Info,
} from "lucide-react";
import Image from "next/image";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── Types ──

interface CommentItem {
  id: string;
  text: string;
  likeCount: number;
  publishedAt: string;
  authorName: string;
  authorImage: string;
  replyCount: number;
  sentiment: "positive" | "negative" | "neutral" | "question" | "support";
}

interface SentimentSummary {
  positive: number;
  negative: number;
  neutral: number;
  question: number;
  support: number;
}

interface TimeDistribution {
  period: string;
  positive: number;
  negative: number;
  neutral: number;
  question: number;
  support: number;
}

interface KeywordItem {
  text: string;
  count: number;
  sentiment: "positive" | "negative" | "neutral";
}

interface InsightData {
  summary: string;
  negativePatterns: string;
  topQuestions: string;
}

interface CommentAnalysisResponse {
  totalComments: number;
  sentimentSummary: SentimentSummary;
  timeDistribution: TimeDistribution[];
  keywords: KeywordItem[];
  representativeComments: Record<string, CommentItem[]>;
  insights: InsightData;
  videoTitle: string;
  videoPublishedAt: string;
}

// ── Constants ──

const SENTIMENT_CONFIG = {
  positive: { label: "긍정", color: "#10b981", bgClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: ThumbsUp },
  negative: { label: "부정", color: "#ef4444", bgClass: "bg-red-500/10 text-red-400 border-red-500/20", icon: ThumbsDown },
  neutral: { label: "중립", color: "#64748b", bgClass: "bg-slate-500/10 text-slate-400 border-slate-500/20", icon: Minus },
  question: { label: "질문", color: "#3b82f6", bgClass: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: HelpCircle },
  support: { label: "응원", color: "#f59e0b", bgClass: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Heart },
} as const;

const SENTIMENT_COLORS = Object.values(SENTIMENT_CONFIG).map((s) => s.color);

// ── API call ──

async function analyzeComments(videoUrl: string): Promise<CommentAnalysisResponse> {
  const res = await fetch("/api/tools/comment-analyzer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoUrl }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? "댓글 분석에 실패했습니다");
  }

  const json = await res.json();
  return json.data;
}

// ── Sub-components ──

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function SentimentDonut({
  summary,
  total,
}: {
  summary: SentimentSummary;
  total: number;
}) {
  const data = Object.entries(SENTIMENT_CONFIG).map(([key, cfg]) => ({
    name: cfg.label,
    value: summary[key as keyof SentimentSummary],
    color: cfg.color,
  }));

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-200">
          감정 요약
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="relative w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#e2e8f0",
                    fontSize: "12px",
                  }}
                  formatter={(value, name) => {
                    const num = Number(value) || 0;
                    return [
                      `${num}개 (${total > 0 ? Math.round((num / total) * 100) : 0}%)`,
                      String(name),
                    ];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-100">{total}</span>
              <span className="text-xs text-slate-500">댓글</span>
            </div>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-3 mt-3">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                <span>{d.name}</span>
                <span className="text-slate-600">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SentimentBarChart({
  timeDistribution,
}: {
  timeDistribution: TimeDistribution[];
}) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-200">
          시간대별 감정 분포
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="period"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={{ stroke: "#475569" }}
                tickLine={{ stroke: "#475569" }}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={{ stroke: "#475569" }}
                tickLine={{ stroke: "#475569" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
              />
              <Bar dataKey="positive" name="긍정" stackId="a" fill="#10b981" />
              <Bar dataKey="support" name="응원" stackId="a" fill="#f59e0b" />
              <Bar dataKey="neutral" name="중립" stackId="a" fill="#64748b" />
              <Bar dataKey="question" name="질문" stackId="a" fill="#3b82f6" />
              <Bar dataKey="negative" name="부정" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function KeywordCloud({ keywords }: { keywords: KeywordItem[] }) {
  const maxCount = Math.max(...keywords.map((k) => k.count), 1);

  function getKeywordStyle(keyword: KeywordItem) {
    const ratio = keyword.count / maxCount;
    const fontSize = 12 + ratio * 14; // 12px to 26px
    const colorMap = {
      positive: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
      negative: "bg-red-500/15 text-red-400 border-red-500/20",
      neutral: "bg-slate-500/15 text-slate-400 border-slate-500/20",
    };
    return { fontSize, className: colorMap[keyword.sentiment] };
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-200">
          키워드 클라우드
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => {
            const style = getKeywordStyle(kw);
            return (
              <span
                key={kw.text}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium transition-transform hover:scale-105 ${style.className}`}
                style={{ fontSize: `${style.fontSize}px` }}
              >
                {kw.text}
                <span className="text-[10px] opacity-60">{kw.count}</span>
              </span>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function RepresentativeComments({
  commentsByType,
}: {
  commentsByType: Record<string, CommentItem[]>;
}) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-200">
          대표 댓글 샘플
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {Object.entries(SENTIMENT_CONFIG).map(([key, cfg]) => {
            const comments = commentsByType[key] ?? [];
            if (comments.length === 0) return null;
            const Icon = cfg.icon;

            return (
              <div key={key}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon className="size-3.5" style={{ color: cfg.color }} />
                  <span
                    className="text-xs font-semibold"
                    style={{ color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                </div>
                <div className="space-y-2">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex gap-3 rounded-lg bg-slate-800/50 p-3"
                    >
                      {comment.authorImage ? (
                        <Image
                          src={comment.authorImage}
                          alt={comment.authorName}
                          width={32}
                          height={32}
                          className="size-8 rounded-full shrink-0"
                        />
                      ) : (
                        <div className="size-8 rounded-full bg-slate-700 shrink-0 flex items-center justify-center">
                          <MessageCircle className="size-4 text-slate-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-slate-300 truncate">
                            {comment.authorName}
                          </span>
                          <Badge
                            className={`text-[10px] px-1.5 py-0 h-4 border ${cfg.bgClass}`}
                          >
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                          {comment.text}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="flex items-center gap-1 text-[11px] text-slate-600">
                            <ThumbsUp className="size-3" />
                            {comment.likeCount}
                          </span>
                          <span className="text-[11px] text-slate-600">
                            {formatRelativeTime(comment.publishedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function InsightsCards({ insights }: { insights: InsightData }) {
  const cards = [
    {
      icon: Lightbulb,
      title: "시청자 반응 요약",
      text: insights.summary,
      accent: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      icon: AlertTriangle,
      title: "주의가 필요한 부정 댓글 패턴",
      text: insights.negativePatterns,
      accent: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      icon: HelpCircle,
      title: "시청자가 가장 많이 궁금해하는 것",
      text: insights.topQuestions,
      accent: "text-blue-400",
      bg: "bg-blue-500/10",
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="bg-slate-900 border-slate-800">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${card.bg}`}
                >
                  <Icon className={`size-4 ${card.accent}`} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-200 mb-1.5">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {card.text}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── Helpers ──

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  return `${months}개월 전`;
}

// ── Page ──

export default function CommentAnalyzerPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: (url: string) => analyzeComments(url),
    onMutate: () => {
      setProgress(0);
      // Simulate progress
      const steps = [10, 25, 45, 65, 80, 90];
      let i = 0;
      const timer = setInterval(() => {
        if (i < steps.length) {
          setProgress(steps[i]);
          i++;
        } else {
          clearInterval(timer);
        }
      }, 600);
      return { timer };
    },
    onSuccess: (_data, _vars, ctx) => {
      setProgress(100);
      if (ctx?.timer) clearInterval(ctx.timer);
    },
    onError: (_err, _vars, ctx) => {
      setProgress(0);
      if (ctx?.timer) clearInterval(ctx.timer);
    },
  });

  const handleAnalyze = () => {
    const trimmed = videoUrl.trim();
    if (!trimmed) return;
    mutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAnalyze();
  };

  const data = mutation.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <MessageSquareText className="h-5 w-5 text-cyan-400" />
          <h1 className="text-xl font-bold text-slate-100">
            댓글 감정 분석기
          </h1>
        </div>
        <p className="text-sm text-slate-400">
          유튜브 영상 댓글의 감정을 AI로 분석하여 긍정/부정/질문/응원
          히트맵으로 시각화합니다
        </p>
      </div>

      {/* Input */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <Input
                placeholder="YouTube 영상 URL을 입력하세요 (예: https://youtube.com/watch?v=...)"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600"
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={mutation.isPending || !videoUrl.trim()}
              className="bg-cyan-600 hover:bg-cyan-700 text-white shrink-0"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  분석 중...
                </>
              ) : (
                "댓글 분석"
              )}
            </Button>
          </div>

          {/* Progress */}
          {mutation.isPending && (
            <div className="mt-3 space-y-1.5">
              <ProgressBar progress={progress} />
              <p className="text-xs text-slate-500 text-center">
                {progress < 30
                  ? "댓글을 수집하고 있습니다..."
                  : progress < 70
                    ? "AI가 감정을 분석하고 있습니다..."
                    : "결과를 정리하고 있습니다..."}
              </p>
            </div>
          )}

          {/* Error */}
          {mutation.isError && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-400">
              <AlertTriangle className="size-4" />
              {mutation.error.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {data && (
        <>
          {/* Video title */}
          {data.videoTitle && (
            <div className="text-sm text-slate-400">
              <span className="text-slate-500">분석 대상:</span>{" "}
              <span className="text-slate-200 font-medium">
                {data.videoTitle}
              </span>
            </div>
          )}

          {/* Charts row */}
          <div className="grid gap-4 md:grid-cols-2">
            <SentimentDonut
              summary={data.sentimentSummary}
              total={data.totalComments}
            />
            <SentimentBarChart timeDistribution={data.timeDistribution} />
          </div>

          {/* Keywords */}
          <KeywordCloud keywords={data.keywords} />

          {/* Insights */}
          <InsightsCards insights={data.insights} />

          {/* Representative comments */}
          <RepresentativeComments
            commentsByType={data.representativeComments}
          />
        </>
      )}

      {/* Info card */}
      {!data && !mutation.isPending && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">
                  댓글 감정 분석 활용 팁
                </h3>
                <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
                  <p>
                    <span className="text-slate-300">영상 URL</span>을
                    입력하면 상위 100개 댓글을 수집하고 AI가 감정을
                    분석합니다.
                  </p>
                  <p>
                    <span className="text-slate-300">감정 분류</span>는
                    긍정, 부정, 중립, 질문, 응원 5가지로 나뉘며 도넛
                    차트와 시간대별 분포로 시각화됩니다.
                  </p>
                  <p>
                    <span className="text-slate-300">키워드 클라우드</span>에서
                    시청자가 자주 언급하는 단어를 한눈에 파악할 수 있습니다.
                  </p>
                  <p className="text-slate-500">
                    * 분석 결과는 AI 기반 추정치이며, 실제 감정과 다를 수
                    있습니다.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
