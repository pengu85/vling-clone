/**
 * AI Client - Real Claude API implementation with mock fallback
 */

import Anthropic from "@anthropic-ai/sdk";
import { youtubeClient } from "./youtube";
import { calculateAlgoScore } from "@/domain/algoScore";
import { estimateMonthlyRevenue } from "@/domain/revenueEstimate";
import type { ChannelSearchResult } from "@/types";

const getClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
};

// ── AI Finder ──

export interface FinderRequest {
  description: string;
  category?: string;
  budget?: number;
  targetAudience?: {
    ageRange?: string;
    gender?: string;
    country?: string;
  };
}

export interface FinderRecommendation {
  channel: ChannelSearchResult;
  matchScore: number;
  reason: string;
  estimatedAdPrice: number;
  estimatedReach: number;
}

export interface FinderResponse {
  recommendations: FinderRecommendation[];
  summary: string;
}

const FINDER_REASONS = [
  "타겟 시청자 연령/성별 일치율이 높고, 해당 카테고리 전문 채널입니다",
  "높은 참여율과 안정적인 구독자 성장세를 보이는 채널입니다",
  "예산 대비 효율적인 광고 집행이 가능한 최적의 채널입니다",
  "타겟 국가 시청자 비율이 높고 콘텐츠 품질이 우수합니다",
  "알고리즘 스코어가 높아 노출 효과가 뛰어난 채널입니다",
];

// Category keyword map for YouTube search
const CATEGORY_SEARCH_KEYWORDS: Record<string, string> = {
  tech: "IT 테크 리뷰",
  beauty: "뷰티 화장",
  gaming: "게임 방송",
  food: "먹방 요리",
  travel: "여행 브이로그",
  music: "음악 노래",
  sports: "스포츠 운동",
  education: "교육 강의",
  comedy: "예능 코미디",
  pets: "동물 반려동물",
  news: "뉴스 시사",
  kids: "키즈 어린이",
};

async function fetchRealChannels(
  description: string,
  category?: string
): Promise<ChannelSearchResult[]> {
  const hasYouTubeKey = !!process.env.YOUTUBE_API_KEY;
  if (!hasYouTubeKey) return [];

  try {
    // Build search query from description + category
    const categoryKeyword = category && category !== "all"
      ? CATEGORY_SEARCH_KEYWORDS[category] || category
      : "";
    const query = `${description} ${categoryKeyword} 유튜버`.trim();

    const searchRes = await youtubeClient.searchChannels(query, 15, {
      regionCode: "KR",
      relevanceLanguage: "ko",
      order: "relevance",
    });

    const channelIds = searchRes.items
      .map((item) => item.id.channelId ?? item.snippet.channelId)
      .filter(Boolean);

    if (channelIds.length === 0) return [];

    const detailRes = await youtubeClient.getChannel(channelIds.join(","));

    const channels: ChannelSearchResult[] = detailRes.items.map((item) => {
      const subscriberCount = parseInt(item.statistics.subscriberCount ?? "0", 10) || 0;
      const totalViewCount = parseInt(item.statistics.viewCount ?? "0", 10) || 0;
      const videoCount = parseInt(item.statistics.videoCount ?? "0", 10) || 1;
      const country = item.snippet.country ?? "KR";
      const cat = category && category !== "all" ? category : "entertainment";

      const estimatedDays = Math.max(videoCount * 7, 30);
      const dailyAvgViews = Math.round(totalViewCount / estimatedDays);

      const algoScore = calculateAlgoScore({
        viewCount: dailyAvgViews * 7,
        likeCount: Math.round(dailyAvgViews * 0.04),
        commentCount: Math.round(dailyAvgViews * 0.005),
        subscriberCount,
        publishedDaysAgo: 180,
        videoCount,
      });

      const estimatedRevenue = estimateMonthlyRevenue({ dailyViews: dailyAvgViews, country, category: cat });

      const growthRate30d = dailyAvgViews > 0 && subscriberCount > 0
        ? parseFloat((dailyAvgViews / subscriberCount * 100).toFixed(1))
        : 0;

      return {
        id: item.id,
        youtubeId: item.id,
        title: item.snippet.title,
        thumbnailUrl: item.snippet.thumbnails?.high?.url ?? "",
        subscriberCount,
        dailyAvgViews,
        growthRate30d,
        algoScore,
        estimatedRevenue,
        category: cat,
        country,
      };
    });

    // Remove duplicates and sort by algoScore
    const seen = new Set<string>();
    return channels
      .filter((ch) => {
        if (seen.has(ch.youtubeId)) return false;
        seen.add(ch.youtubeId);
        return true;
      })
      .sort((a, b) => b.algoScore - a.algoScore);
  } catch {
    return [];
  }
}

export async function runAIFinder(req: FinderRequest): Promise<FinderResponse> {
  const client = getClient();

  if (!client) {
    return { recommendations: [], summary: "" };
  }

  // Try to fetch real channels from YouTube API
  let channelPool = await fetchRealChannels(req.description, req.category);

  const top5 = channelPool.slice(0, 5);

  const channelSummaries = top5.map((ch, i) => ({
    index: i,
    name: ch.title,
    subscriberCount: ch.subscriberCount,
    dailyAvgViews: ch.dailyAvgViews,
    category: ch.category,
    algoScore: ch.algoScore,
  }));

  const prompt = `당신은 유튜브 채널 광고 매칭 전문가입니다. 다음 광고주 조건과 채널 목록을 분석하여 각 채널에 대한 추천 이유, 매칭 점수, 예상 광고비, 예상 도달수를 JSON으로 반환하세요.

광고주 조건:
- 광고 설명: ${req.description}
- 카테고리: ${req.category || "전체"}
- 예산: ${req.budget ? `${req.budget.toLocaleString()}원` : "미정"}
- 타겟 오디언스: ${JSON.stringify(req.targetAudience || {})}

채널 목록:
${JSON.stringify(channelSummaries, null, 2)}

각 채널(index 0~4)에 대해 다음 JSON 형식으로만 응답하세요:
{
  "channels": [
    {
      "index": 0,
      "matchScore": 90,
      "reason": "한국어로 된 구체적인 추천 이유 (2~3문장)",
      "estimatedAdPrice": 1500000,
      "estimatedReach": 50000
    }
  ],
  "summary": "전체 추천 요약 문장 (한국어)"
}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const parsed = JSON.parse(jsonMatch[0]);
    const aiChannels: Array<{
      index: number;
      matchScore: number;
      reason: string;
      estimatedAdPrice: number;
      estimatedReach: number;
    }> = parsed.channels;

    const recommendations: FinderRecommendation[] = top5.map((channel, i) => {
      const aiData = aiChannels.find((c) => c.index === i);
      return {
        channel,
        matchScore: aiData?.matchScore ?? Math.max(95 - i * 5, 60),
        reason: aiData?.reason ?? FINDER_REASONS[i % FINDER_REASONS.length],
        estimatedAdPrice:
          aiData?.estimatedAdPrice ??
          Math.round(channel.subscriberCount * 0.01 + channel.dailyAvgViews * 0.05),
        estimatedReach:
          aiData?.estimatedReach ??
          Math.round(channel.dailyAvgViews * 30 * 0.3),
      };
    });

    return {
      recommendations,
      summary: parsed.summary ?? `"${req.description}" 조건에 맞는 상위 ${recommendations.length}개 채널을 추천합니다.`,
    };
  } catch {
    return { recommendations: [], summary: "" };
  }
}

// ── AI Insight ──

export interface InsightResponse {
  channelSummary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  contentStrategy: string[];
  audienceInsight: string;
  growthPrediction: string;
  competitorChannels: string[];
}

function getMockInsightResult(): InsightResponse {
  const STRENGTHS = [
    "꾸준한 업로드 주기로 알고리즘 노출 극대화",
    "높은 시청자 참여율 (좋아요/댓글 비율 상위 10%)",
    "타겟 오디언스와 높은 일치도",
    "트렌디한 콘텐츠 기획력",
    "멀티 플랫폼 시너지 효과",
  ];

  const WEAKNESSES = [
    "최근 30일 구독자 성장률이 카테고리 평균 대비 낮음",
    "영상 길이가 알고리즘 최적 길이(8-12분)보다 짧음",
    "썸네일 클릭률(CTR) 개선 필요",
    "해외 시청자 확보 전략 부재",
  ];

  const OPPORTUNITIES = [
    "숏폼 콘텐츠 확대로 신규 유입 가능",
    "관련 카테고리 콜라보 기회 다수",
    "시즌별 키워드 트렌드 활용 여지 높음",
    "라이브 스트리밍을 통한 팬 커뮤니티 강화",
  ];

  const STRATEGIES = [
    "주 3회 이상 정기 업로드 유지",
    "키워드 리서치 기반 제목/설명 최적화",
    "첫 30초 후킹 구조 강화",
    "커뮤니티 탭 적극 활용",
    "시리즈 콘텐츠로 시청 지속 시간 증가",
  ];

  return {
    channelSummary: `해당 채널은 꾸준한 성장세를 보이며, 특히 최근 90일간 조회수가 크게 증가했습니다. 알고리즘 적합도가 높고 시청자 충성도가 우수한 채널로 분석됩니다.`,
    strengths: STRENGTHS.slice(0, 4),
    weaknesses: WEAKNESSES.slice(0, 3),
    opportunities: OPPORTUNITIES.slice(0, 3),
    contentStrategy: STRATEGIES.slice(0, 4),
    audienceInsight:
      "주 시청자는 18-34세 남성으로, 테크/라이프스타일에 관심이 높습니다. 평균 시청 시간은 4분 30초이며, 재방문율이 카테고리 평균 대비 15% 높습니다.",
    growthPrediction:
      "현재 성장 추세를 유지할 경우, 6개월 후 구독자 수가 약 20-30% 증가할 것으로 예측됩니다. 숏폼 콘텐츠 강화 시 30-50% 추가 성장 가능합니다.",
    competitorChannels: ["테크수다", "IT리뷰어", "과학쿠키"],
  };
}

export async function runAIInsight(channelId: string): Promise<InsightResponse> {
  const client = getClient();

  if (!client) {
    await new Promise((r) => setTimeout(r, 600));
    return getMockInsightResult();
  }

  const prompt = `당신은 유튜브 채널 분석 전문가입니다. 채널 ID "${channelId}"에 대한 SWOT 분석과 성장 전략을 제공하세요.

다음 JSON 형식으로만 응답하세요 (모든 내용은 한국어):
{
  "channelSummary": "채널 전체 요약 (2~3문장)",
  "strengths": ["강점1", "강점2", "강점3"],
  "weaknesses": ["약점1", "약점2"],
  "opportunities": ["기회1", "기회2", "기회3"],
  "contentStrategy": ["전략1", "전략2", "전략3", "전략4"],
  "audienceInsight": "시청자 분석 설명 (2~3문장)",
  "growthPrediction": "성장 예측 설명 (2~3문장)",
  "competitorChannels": ["경쟁채널1", "경쟁채널2", "경쟁채널3"]
}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const parsed = JSON.parse(jsonMatch[0]) as InsightResponse;

    return {
      channelSummary: parsed.channelSummary ?? "",
      strengths: parsed.strengths ?? [],
      weaknesses: parsed.weaknesses ?? [],
      opportunities: parsed.opportunities ?? [],
      contentStrategy: parsed.contentStrategy ?? [],
      audienceInsight: parsed.audienceInsight ?? "",
      growthPrediction: parsed.growthPrediction ?? "",
      competitorChannels: parsed.competitorChannels ?? [],
    };
  } catch {
    return getMockInsightResult();
  }
}

// ── AI Content Maker ──

export interface ContentRequest {
  keyword: string;
  channelId?: string;
  contentType: "long-form" | "short-form" | "live";
  tone: "informative" | "entertaining" | "review" | "tutorial";
}

export interface ContentResponse {
  keywordAnalysis: {
    competitionScore: number;
    searchVolume: string;
    relatedKeywords: string[];
  };
  script: {
    title: string;
    hook: string;
    outline: string[];
    estimatedLength: string;
    tips: string[];
  };
}

function getMockContentResult(req: ContentRequest): ContentResponse {
  const lengthMap = {
    "long-form": "8-12분",
    "short-form": "30-60초",
    live: "30-60분",
  };

  const toneMap = {
    informative: "정보 전달형",
    entertaining: "엔터테인먼트형",
    review: "리뷰/비교형",
    tutorial: "튜토리얼형",
  };

  return {
    keywordAnalysis: {
      competitionScore: 60,
      searchVolume: "보통",
      relatedKeywords: [
        `${req.keyword} 추천`,
        `${req.keyword} 비교`,
        `${req.keyword} 2026`,
        `${req.keyword} 후기`,
        `${req.keyword} 가이드`,
      ],
    },
    script: {
      title: `${req.keyword} 완벽 가이드 - 꼭 알아야 할 핵심 포인트`,
      hook: `"${req.keyword}"에 대해 잘못 알려진 사실이 있습니다. 오늘 영상에서 전부 파헤쳐 보겠습니다!`,
      outline: [
        "인트로: 주제 소개 및 후킹",
        `${req.keyword}의 현재 트렌드 분석`,
        "핵심 포인트 3가지 상세 설명",
        `실전 활용법 / ${toneMap[req.tone]} 접근`,
        "시청자 참여 유도 및 마무리",
      ],
      estimatedLength: lengthMap[req.contentType],
      tips: [
        "첫 3초 내 시청자 관심을 끌 수 있는 파격적인 오프닝 사용",
        "8분 이상의 영상에서는 챕터 마커를 활용해 시청 편의 제공",
        "CTA(구독/좋아요)는 영상 중간과 마지막에 각각 1회씩 배치",
        "관련 키워드를 제목, 설명, 태그에 자연스럽게 포함",
      ],
    },
  };
}

export async function runAIContent(req: ContentRequest): Promise<ContentResponse> {
  const client = getClient();

  if (!client) {
    await new Promise((r) => setTimeout(r, 700));
    return getMockContentResult(req);
  }

  const lengthMap = {
    "long-form": "8-12분",
    "short-form": "30-60초",
    live: "30-60분",
  };

  const toneMap = {
    informative: "정보 전달형",
    entertaining: "엔터테인먼트형",
    review: "리뷰/비교형",
    tutorial: "튜토리얼형",
  };

  const prompt = `당신은 유튜브 콘텐츠 전략가입니다. 다음 정보를 바탕으로 키워드 분석과 영상 스크립트 구성을 JSON으로 제공하세요.

키워드: ${req.keyword}
콘텐츠 유형: ${req.contentType} (${lengthMap[req.contentType]})
톤앤매너: ${req.tone} (${toneMap[req.tone]})

다음 JSON 형식으로만 응답하세요 (모든 내용은 한국어):
{
  "keywordAnalysis": {
    "competitionScore": 65,
    "searchVolume": "높음",
    "relatedKeywords": ["관련키워드1", "관련키워드2", "관련키워드3", "관련키워드4", "관련키워드5"]
  },
  "script": {
    "title": "매력적인 영상 제목",
    "hook": "시청자를 끌어당기는 오프닝 멘트 (1~2문장)",
    "outline": ["섹션1", "섹션2", "섹션3", "섹션4", "섹션5"],
    "estimatedLength": "${lengthMap[req.contentType]}",
    "tips": ["팁1", "팁2", "팁3", "팁4"]
  }
}

competitionScore는 0~100 사이 정수. searchVolume은 "낮음", "보통", "높음", "매우 높음" 중 하나.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const parsed = JSON.parse(jsonMatch[0]) as ContentResponse;

    return {
      keywordAnalysis: {
        competitionScore: parsed.keywordAnalysis?.competitionScore ?? 50,
        searchVolume: parsed.keywordAnalysis?.searchVolume ?? "보통",
        relatedKeywords: parsed.keywordAnalysis?.relatedKeywords ?? [],
      },
      script: {
        title: parsed.script?.title ?? `${req.keyword} 완벽 가이드`,
        hook: parsed.script?.hook ?? "",
        outline: parsed.script?.outline ?? [],
        estimatedLength: lengthMap[req.contentType],
        tips: parsed.script?.tips ?? [],
      },
    };
  } catch {
    return getMockContentResult(req);
  }
}
