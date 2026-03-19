"use client";

import Link from "next/link";
import {
  Sparkles,
  Calculator,
  GitCompare,
  FileText,
  Activity,
  Image as ImageIcon,
  Zap,
  Dna,
  LineChart,
  MessageSquareText,
  Waves,
  Calendar,
  Microscope,
  Target,
  HeartPulse,
  Handshake,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";

interface ToolItem {
  label: string;
  href: string;
  icon: React.ElementType;
  description: string;
}

const tools: ToolItem[] = [
  {
    label: "AI 파인더",
    href: "/tools/ai-finder",
    icon: Sparkles,
    description: "AI가 채널 특성을 분석해 최적의 콘텐츠 방향을 추천합니다",
  },
  {
    label: "수익 계산기",
    href: "/tools/calculator",
    icon: Calculator,
    description: "구독자 수와 조회수를 기반으로 예상 월 수익을 계산합니다",
  },
  {
    label: "채널 비교",
    href: "/tools/compare",
    icon: GitCompare,
    description: "최대 5개 채널의 주요 지표를 나란히 비교 분석합니다",
  },
  {
    label: "AI 콘텐츠",
    href: "/tools/ai-content",
    icon: FileText,
    description: "AI가 제목, 설명, 태그 등 콘텐츠 소재를 자동 생성합니다",
  },
  {
    label: "유튜버 모니터",
    href: "/tools/youtuber-tracker",
    icon: Activity,
    description: "관심 채널의 성장 지표와 최신 업로드를 실시간 추적합니다",
  },
  {
    label: "썸네일 분석",
    href: "/tools/thumbnail-analyzer",
    icon: ImageIcon,
    description: "썸네일 이미지를 분석해 클릭률 향상 인사이트를 제공합니다",
  },
  {
    label: "바이럴 예측",
    href: "/tools/viral-predictor",
    icon: Zap,
    description: "영상 제목과 주제로 바이럴 가능성을 예측합니다",
  },
  {
    label: "채널 DNA",
    href: "/tools/channel-dna",
    icon: Dna,
    description: "채널 고유의 콘텐츠 패턴과 정체성을 DNA 형태로 시각화합니다",
  },
  {
    label: "수익 시뮬레이터",
    href: "/tools/revenue-simulator",
    icon: LineChart,
    description: "성장 시나리오별 미래 수익을 시뮬레이션해 예측합니다",
  },
  {
    label: "댓글 분석",
    href: "/tools/comment-analyzer",
    icon: MessageSquareText,
    description: "댓글 감성과 키워드를 분석해 시청자 반응을 파악합니다",
  },
  {
    label: "트렌드 서핑",
    href: "/tools/trend-surfing",
    icon: Waves,
    description: "현재 유행하는 트렌드를 파악하고 콘텐츠 기회를 발굴합니다",
  },
  {
    label: "콘텐츠 캘린더",
    href: "/tools/content-calendar",
    icon: Calendar,
    description: "최적 업로드 일정을 계획하고 콘텐츠 스케줄을 관리합니다",
  },
  {
    label: "알고리즘 해부",
    href: "/tools/algorithm-anatomy",
    icon: Microscope,
    description: "유튜브 알고리즘 작동 원리를 분석해 노출 전략을 수립합니다",
  },
  {
    label: "수익 역산기",
    href: "/tools/revenue-reverse",
    icon: Target,
    description: "목표 수익을 달성하기 위해 필요한 조회수와 구독자를 역산합니다",
  },
  {
    label: "채널 건강검진",
    href: "/tools/channel-health",
    icon: HeartPulse,
    description: "채널의 전반적인 건강 상태를 진단하고 개선점을 제안합니다",
  },
  {
    label: "콜라보 궁합",
    href: "/tools/collab-score",
    icon: Handshake,
    description: "두 채널의 콜라보 시너지 점수와 예상 효과를 분석합니다",
  },
  {
    label: "키워드 추이",
    href: "/tools/keyword-trends",
    icon: TrendingUp,
    description: "특정 키워드의 검색량 변화와 경쟁도 추이를 추적합니다",
  },
  {
    label: "스팸 댓글 관리",
    href: "/tools/spam-comments",
    icon: ShieldAlert,
    description: "스팸·악성 댓글을 자동 감지하고 일괄 관리합니다",
  },
];

export default function ToolsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <Breadcrumb items={[{ label: "도구" }]} />

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">도구</h1>
        <p className="mt-1 text-sm text-slate-500">
          유튜브 분석에 필요한 다양한 도구를 활용해보세요
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className="group flex items-start gap-4 rounded-xl border border-slate-700 bg-slate-800 p-4 transition-colors hover:border-blue-500/50 hover:bg-slate-800/80"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-700 transition-colors group-hover:bg-blue-600/20">
                <Icon className="size-5 text-slate-400 transition-colors group-hover:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-slate-100 group-hover:text-blue-300 transition-colors">
                  {tool.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                  {tool.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
