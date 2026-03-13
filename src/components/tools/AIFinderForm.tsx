"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Sparkles, Target, Users, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, COUNTRIES } from "@/domain/categories";
import { formatNumber, formatCurrency } from "@/lib/formatters";
import type { FinderRequest, FinderResponse } from "@/lib/ai";

const AGE_RANGES = [
  { value: "13-17", label: "13-17세" },
  { value: "18-24", label: "18-24세" },
  { value: "25-34", label: "25-34세" },
  { value: "35-44", label: "35-44세" },
  { value: "45-54", label: "45-54세" },
  { value: "55+", label: "55세 이상" },
];

const GENDERS = [
  { value: "all", label: "성별 무관" },
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
];

function getMatchScoreColor(score: number): string {
  if (score >= 90) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
  if (score >= 75) return "bg-blue-500/15 text-blue-400 border-blue-500/20";
  if (score >= 60) return "bg-amber-500/15 text-amber-400 border-amber-500/20";
  return "bg-slate-500/15 text-slate-400 border-slate-500/20";
}

export function AIFinderForm() {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("all");
  const [budget, setBudget] = useState<string>("");
  const [ageRange, setAgeRange] = useState("");
  const [gender, setGender] = useState("all");
  const [country, setCountry] = useState("KR");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FinderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const req: FinderRequest = {
      description: description.trim(),
      category: category !== "all" ? category : undefined,
      budget: budget ? parseInt(budget, 10) : undefined,
      targetAudience: {
        ageRange: ageRange || undefined,
        gender: gender !== "all" ? gender : undefined,
        country,
      },
    };

    try {
      const res = await fetch("/api/ai/finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message ?? "서버 오류가 발생했습니다");
        return;
      }

      setResult(json.data as FinderResponse);
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 광고 설명 */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Target className="h-4 w-4 text-violet-400" />
              광고 / 캠페인 정보
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              어떤 제품·서비스를 광고하시나요? 구체적으로 입력할수록 추천 정확도가 높아집니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 광고 설명 textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                광고 설명 <span className="text-red-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="예: 20-30대 여성을 타겟으로 하는 친환경 스킨케어 브랜드 론칭 캠페인입니다. 제품 리뷰와 일상 속 자연스러운 사용법을 보여주는 콘텐츠를 원합니다."
                rows={4}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
              />
            </div>

            {/* 카테고리 + 예산 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  선호 카테고리
                </label>
                <Select value={category} onValueChange={(v) => setCategory(v ?? "all")}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {CATEGORIES.map((c) => (
                      <SelectItem
                        key={c.value}
                        value={c.value}
                        className="text-slate-200 focus:bg-slate-700 focus:text-slate-100"
                      >
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  광고 예산 (원)
                </label>
                <Input
                  type="number"
                  min={0}
                  step={100000}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="예: 5000000"
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-violet-500"
                />
                {budget && parseInt(budget, 10) > 0 && (
                  <p className="text-[11px] text-slate-500">
                    {formatCurrency(parseInt(budget, 10))}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 타겟 오디언스 */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Users className="h-4 w-4 text-blue-400" />
              타겟 오디언스
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              광고를 보여주고 싶은 시청자층을 설정하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* 연령대 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  연령대
                </label>
                <Select value={ageRange} onValueChange={(v) => setAgeRange(v ?? "")}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100 w-full">
                    <SelectValue placeholder="연령대 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {AGE_RANGES.map((a) => (
                      <SelectItem
                        key={a.value}
                        value={a.value}
                        className="text-slate-200 focus:bg-slate-700 focus:text-slate-100"
                      >
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 성별 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  성별
                </label>
                <Select value={gender} onValueChange={(v) => setGender(v ?? "all")}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {GENDERS.map((g) => (
                      <SelectItem
                        key={g.value}
                        value={g.value}
                        className="text-slate-200 focus:bg-slate-700 focus:text-slate-100"
                      >
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 국가 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  타겟 국가
                </label>
                <Select value={country} onValueChange={(v) => setCountry(v ?? "KR")}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {COUNTRIES.map((c) => (
                      <SelectItem
                        key={c.value}
                        value={c.value}
                        className="text-slate-200 focus:bg-slate-700 focus:text-slate-100"
                      >
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 제출 버튼 */}
        <Button
          type="submit"
          disabled={loading || !description.trim()}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold h-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              AI가 분석 중입니다...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              AI 유튜버 추천받기
            </>
          )}
        </Button>
      </form>

      {/* 에러 메시지 */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 결과 섹션 */}
      {result && (
        <div className="space-y-4">
          {/* 요약 */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 shrink-0">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-1">AI 분석 결과</p>
                  <p className="text-sm text-slate-200 leading-relaxed">{result.summary}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 추천 채널 목록 */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              추천 채널 ({result.recommendations.length}개)
            </h3>

            {result.recommendations.map((rec, idx) => (
              <Card key={rec.channel.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-4">
                    {/* 순위 */}
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-400">
                      {idx + 1}
                    </div>

                    {/* 채널 썸네일 */}
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-slate-800">
                      {rec.channel.thumbnailUrl ? (
                        <Image
                          src={rec.channel.thumbnailUrl}
                          alt={rec.channel.title}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-600 text-lg font-bold">
                          {rec.channel.title.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* 채널 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-100 truncate">
                          {rec.channel.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold px-1.5 py-0 border ${getMatchScoreColor(rec.matchScore)}`}
                        >
                          매칭 {rec.matchScore}%
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed mb-3">
                        {rec.reason}
                      </p>

                      {/* 통계 그리드 */}
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div>
                          <p className="text-[10px] text-slate-500 mb-0.5">구독자</p>
                          <p className="text-xs font-semibold text-slate-200">
                            {formatNumber(rec.channel.subscriberCount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 mb-0.5">일 평균 조회수</p>
                          <p className="text-xs font-semibold text-slate-200">
                            {formatNumber(rec.channel.dailyAvgViews)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 mb-0.5">예상 광고 단가</p>
                          <p className="text-xs font-semibold text-violet-300">
                            {formatCurrency(rec.estimatedAdPrice)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 mb-0.5">예상 도달</p>
                          <p className="text-xs font-semibold text-blue-300 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {formatNumber(rec.estimatedReach)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
