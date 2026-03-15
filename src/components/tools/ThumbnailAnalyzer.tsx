"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Loader2,
  Upload,
  Search,
  Palette,
  Type,
  Smile,
  Grid3X3,
  Lightbulb,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ── Types ──

interface ThumbnailItem {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  views: number;
  score: number;
  highlights: string[];
}

interface AnalysisResult {
  colorPattern: string;
  textPlacement: string;
  facialExpression: string;
  composition: string;
  summary: string;
  suggestions: string[];
}

interface ThumbnailAnalysisResponse {
  thumbnails: ThumbnailItem[];
  analysis: AnalysisResult;
}

// ── Helpers ──

function scoreColor(score: number) {
  if (score >= 90) return "bg-emerald-500";
  if (score >= 70) return "bg-blue-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function scoreTextColor(score: number) {
  if (score >= 90) return "text-emerald-400";
  if (score >= 70) return "text-blue-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function formatViews(views: number): string {
  if (views >= 10000) return `${(views / 10000).toFixed(1)}만`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}천`;
  return String(views);
}

function isHighCTR(thumbnail: ThumbnailItem, avgViews: number): boolean {
  return thumbnail.views > avgViews * 1.3 && thumbnail.score >= 75;
}

// ── API call ──

async function analyzeThumbnails(
  payload: { channelInput?: string; imageUrl?: string }
): Promise<ThumbnailAnalysisResponse> {
  const res = await fetch("/api/tools/thumbnail-analyzer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message ?? "분석 요청에 실패했습니다"
    );
  }

  const json = await res.json();
  return json.data;
}

// ── Analysis cards config ──

const ANALYSIS_CARDS = [
  {
    key: "colorPattern" as const,
    title: "색상 패턴",
    icon: Palette,
    iconColor: "text-rose-400",
    bgColor: "bg-rose-500/10",
  },
  {
    key: "textPlacement" as const,
    title: "텍스트 배치",
    icon: Type,
    iconColor: "text-sky-400",
    bgColor: "bg-sky-500/10",
  },
  {
    key: "facialExpression" as const,
    title: "인물 표정",
    icon: Smile,
    iconColor: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  {
    key: "composition" as const,
    title: "구도 분석",
    icon: Grid3X3,
    iconColor: "text-violet-400",
    bgColor: "bg-violet-500/10",
  },
];

// ── Component ──

export function ThumbnailAnalyzer() {
  const [channelInput, setChannelInput] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  // Cleanup object URL on unmount or when a new one is created
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const mutation = useMutation({
    mutationFn: analyzeThumbnails,
  });

  const handleAnalyze = () => {
    if (!channelInput.trim()) return;
    mutation.mutate({ channelInput: channelInput.trim() });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAnalyze();
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const file = e.dataTransfer.files[0];
      if (!file || !file.type.startsWith("image/")) return;

      // Revoke previous object URL if any
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      // Create object URL for preview (in real app, would upload to storage)
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      mutation.mutate({ imageUrl: url });
    },
    [mutation]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const data = mutation.data;
  const avgViews =
    data && data.thumbnails.length > 0
      ? data.thumbnails.reduce((sum, t) => sum + t.views, 0) /
        data.thumbnails.length
      : 0;

  return (
    <div className="space-y-6">
      {/* ── Input Section ── */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-5 space-y-4">
          {/* Channel URL input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="채널 URL 또는 @핸들을 입력하세요"
                className="pl-9 bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500"
                disabled={mutation.isPending}
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={mutation.isPending || !channelInput.trim()}
              className="bg-rose-600 hover:bg-rose-700 text-white shrink-0"
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Search className="h-4 w-4 mr-1.5" />
              )}
              분석
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Separator className="flex-1 bg-slate-800" />
            <span className="text-xs text-slate-600">또는</span>
            <Separator className="flex-1 bg-slate-800" />
          </div>

          {/* Drag & drop upload */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed
              py-8 transition-colors cursor-pointer
              ${
                dragOver
                  ? "border-rose-500 bg-rose-500/5"
                  : "border-slate-700 hover:border-slate-600 bg-slate-950/50"
              }
            `}
          >
            <Upload
              className={`h-8 w-8 ${
                dragOver ? "text-rose-400" : "text-slate-600"
              }`}
            />
            <p className="text-sm text-slate-400">
              내 썸네일 분석하기
            </p>
            <p className="text-xs text-slate-600">
              이미지를 드래그앤드롭하세요
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Loading ── */}
      {mutation.isPending && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
              <p className="text-sm text-slate-300">
                AI가 썸네일을 분석하고 있습니다...
              </p>
              <p className="text-xs text-slate-500">
                잠시만 기다려 주세요
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Error ── */}
      {mutation.isError && (
        <Card className="bg-slate-900 border-red-900/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="text-sm">{mutation.error.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Thumbnail Grid ── */}
      {data && (
        <>
          <div>
            <h2 className="text-sm font-semibold text-slate-300 mb-3">
              채널 썸네일 ({data.thumbnails.length}개)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {data.thumbnails.map((thumb) => (
                <div
                  key={thumb.videoId}
                  className="group relative rounded-lg overflow-hidden bg-slate-800 border border-slate-700/50"
                >
                  {/* Thumbnail image */}
                  <div className="relative aspect-video">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumb.thumbnailUrl}
                      alt={thumb.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Score overlay */}
                    <div className="absolute bottom-1.5 left-1.5">
                      <div
                        className={`
                          flex items-center gap-1 rounded px-1.5 py-0.5
                          bg-black/70 backdrop-blur-sm
                        `}
                      >
                        <div
                          className={`h-2 w-2 rounded-full ${scoreColor(
                            thumb.score
                          )}`}
                        />
                        <span
                          className={`text-xs font-bold ${scoreTextColor(
                            thumb.score
                          )}`}
                        >
                          {thumb.score}
                        </span>
                      </div>
                    </div>

                    {/* HIGH CTR badge */}
                    {isHighCTR(thumb, avgViews) && (
                      <div className="absolute top-1.5 right-1.5">
                        <Badge className="bg-emerald-500/90 text-white text-[10px] px-1.5 py-0 font-semibold border-0">
                          HIGH CTR
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2">
                    <p className="text-xs text-slate-300 line-clamp-1 mb-1">
                      {thumb.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">
                        {thumb.views > 0
                          ? `${formatViews(thumb.views)}회`
                          : ""}
                      </span>
                      <div className="flex gap-1">
                        {thumb.highlights.map((h) => (
                          <span
                            key={h}
                            className="text-[10px] text-slate-500 bg-slate-800 px-1 rounded"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Analysis Cards ── */}
          <div>
            <h2 className="text-sm font-semibold text-slate-300 mb-3">
              AI 분석 결과
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ANALYSIS_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <Card
                    key={card.key}
                    className="bg-slate-900 border-slate-800"
                  >
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.bgColor}`}
                        >
                          <Icon className={`h-3.5 w-3.5 ${card.iconColor}`} />
                        </div>
                        <span className="text-slate-200">{card.title}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {data.analysis[card.key]}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* ── Summary ── */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <span className="text-slate-200">
                  이 채널의 썸네일 특징
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                {data.analysis.summary}
              </p>
            </CardContent>
          </Card>

          {/* ── Suggestions ── */}
          {data.analysis.suggestions.length > 0 && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <span className="text-slate-200">개선 제안</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ul className="space-y-2">
                  {data.analysis.suggestions.map((suggestion, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-slate-400"
                    >
                      <span className="text-amber-500 font-bold mt-px">
                        {i + 1}.
                      </span>
                      <span className="leading-relaxed">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
