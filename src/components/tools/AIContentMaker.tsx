"use client";

import { useState } from "react";
import {
  Loader2,
  Search,
  BarChart2,
  FileText,
  CheckCircle2,
  Hash,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { ContentResponse } from "@/lib/ai";

type ContentType = "long-form" | "short-form" | "live";
type Tone = "informative" | "entertaining" | "review" | "tutorial";

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "long-form", label: "롱폼 (Long-form)" },
  { value: "short-form", label: "숏폼 (Short-form)" },
  { value: "live", label: "라이브 (Live)" },
];

const TONES: { value: Tone; label: string }[] = [
  { value: "informative", label: "정보 전달형" },
  { value: "entertaining", label: "엔터테인먼트형" },
  { value: "review", label: "리뷰/비교형" },
  { value: "tutorial", label: "튜토리얼형" },
];

function competitionColor(score: number) {
  if (score < 50) return "bg-emerald-500";
  if (score < 70) return "bg-yellow-500";
  return "bg-red-500";
}

function competitionLabel(score: number) {
  if (score < 50) return { text: "낮음", className: "bg-emerald-500/10 text-emerald-400" };
  if (score < 70) return { text: "보통", className: "bg-yellow-500/10 text-yellow-400" };
  return { text: "높음", className: "bg-red-500/10 text-red-400" };
}

export function AIContentMaker() {
  const [keyword, setKeyword] = useState("");
  const [contentType, setContentType] = useState<ContentType>("long-form");
  const [tone, setTone] = useState<Tone>("informative");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ContentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), contentType, tone }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json?.error?.message ?? "오류가 발생했습니다");
        return;
      }

      setResult(json.data as ContentResponse);
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  const comp = result ? competitionLabel(result.keywordAnalysis.competitionScore) : null;

  return (
    <div className="space-y-6">
      {/* 입력 폼 */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-base text-slate-100">키워드 및 콘텐츠 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 키워드 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                키워드 <span className="text-red-400">*</span>
              </label>
              <Input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="예: 아이폰 16 리뷰, 주식 투자 방법..."
                className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-violet-500"
                disabled={loading}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* 콘텐츠 유형 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  콘텐츠 유형
                </label>
                <Select
                  value={contentType}
                  onValueChange={(v) => setContentType((v ?? "long-form") as ContentType)}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-100 focus:ring-violet-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {CONTENT_TYPES.map((ct) => (
                      <SelectItem
                        key={ct.value}
                        value={ct.value}
                        className="text-slate-200 focus:bg-slate-700 focus:text-slate-100"
                      >
                        {ct.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 톤 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  콘텐츠 톤
                </label>
                <Select
                  value={tone}
                  onValueChange={(v) => setTone((v ?? "informative") as Tone)}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-100 focus:ring-violet-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {TONES.map((t) => (
                      <SelectItem
                        key={t.value}
                        value={t.value}
                        className="text-slate-200 focus:bg-slate-700 focus:text-slate-100"
                      >
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading || !keyword.trim()}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  콘텐츠 분석 시작
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 결과 */}
      {result && (
        <div className="space-y-4">
          {/* Mock data banner */}
          {result.isMock && (
            <div className="flex items-center gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
              <p className="text-sm text-amber-300">
                AI API 키가 설정되지 않아 샘플 데이터입니다
              </p>
            </div>
          )}

          {/* A. 키워드 분석 */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-slate-100">
                <BarChart2 className="h-4 w-4 text-blue-400" />
                키워드 분석
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* 경쟁도 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">경쟁도</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`border-0 text-[11px] ${comp!.className}`}
                    >
                      {comp!.text}
                    </Badge>
                    <span className="text-sm font-bold text-slate-200">
                      {result.keywordAnalysis.competitionScore}점
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${competitionColor(result.keywordAnalysis.competitionScore)}`}
                    style={{ width: `${result.keywordAnalysis.competitionScore}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>낮음</span>
                  <span>높음</span>
                </div>
              </div>

              <Separator className="bg-slate-800" />

              {/* 검색량 */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">검색량</span>
                <Badge
                  variant="secondary"
                  className="bg-blue-500/10 text-blue-400 border-0 text-xs"
                >
                  {result.keywordAnalysis.searchVolume}
                </Badge>
              </div>

              <Separator className="bg-slate-800" />

              {/* 연관 키워드 */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-xs font-medium text-slate-400">연관 키워드</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.keywordAnalysis.relatedKeywords.map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => setKeyword(kw)}
                      className="cursor-pointer"
                    >
                      <Badge
                        variant="outline"
                        className="border-slate-700 text-slate-300 hover:border-violet-500 hover:text-violet-300 transition-colors text-xs"
                      >
                        {kw}
                      </Badge>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-600">키워드를 클릭하면 해당 키워드로 재분석합니다</p>
              </div>
            </CardContent>
          </Card>

          {/* B. 스크립트 생성 */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-slate-100">
                <FileText className="h-4 w-4 text-violet-400" />
                스크립트 생성
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* 제목 */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  제목
                </span>
                <p className="text-sm font-semibold text-slate-100 leading-snug">
                  {result.script.title}
                </p>
              </div>

              <Separator className="bg-slate-800" />

              {/* 후킹 문구 */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  후킹 문구
                </span>
                <blockquote className="border-l-2 border-violet-500 pl-3 py-1">
                  <p className="text-sm text-slate-200 italic leading-relaxed">
                    {result.script.hook}
                  </p>
                </blockquote>
              </div>

              <Separator className="bg-slate-800" />

              {/* 아웃라인 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    아웃라인
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px]"
                  >
                    예상 {result.script.estimatedLength}
                  </Badge>
                </div>
                <ol className="space-y-2">
                  {result.script.outline.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[11px] font-bold text-violet-400">
                        {i + 1}
                      </span>
                      <span className="text-sm text-slate-300 leading-snug pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <Separator className="bg-slate-800" />

              {/* 팁 */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  제작 팁
                </span>
                <ul className="space-y-2">
                  {result.script.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                      <span className="text-sm text-slate-300 leading-snug">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
