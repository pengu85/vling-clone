import { NextRequest, NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";
import { cache } from "@/lib/cache";

/* ---------- Types ---------- */

interface TrendingKeyword {
  rank: number;
  keyword: string;
  videoCount: number;
  growth: number; // 조회 속도 기반 성장 지수
  competition: "높음" | "중간" | "낮음";
}

interface BlueOceanKeyword {
  keyword: string;
  searchVolume: number; // 추정 검색량 (조회수 기반)
  videoCount: number;
  opportunityScore: number;
}

interface TrendTimelinePoint {
  day: string;
  value: number;
}

interface TrendSurfingResponse {
  trendingKeywords: TrendingKeyword[];
  blueOceanKeywords: BlueOceanKeyword[];
  timeline: Record<string, TrendTimelinePoint[]>;
}

/* ---------- Category → YouTube Category ID ---------- */

const categoryIdMap: Record<string, string> = {
  전체: "",
  엔터: "24",  // Entertainment
  교육: "27",  // Education
  게임: "20",  // Gaming
  뷰티: "26",  // Howto & Style
  테크: "28",  // Science & Technology
  음식: "26",  // Howto & Style (음식도 여기에 포함)
  여행: "19",  // Travel & Events
  스포츠: "17", // Sports
};

// 음식 카테고리는 별도 키워드 검색으로 보완
const categoryFallbackQueries: Record<string, string[]> = {
  음식: ["먹방", "요리", "맛집", "레시피"],
  전체: [],
};

const regionCodeMap: Record<string, string> = {
  한국: "KR",
  미국: "US",
  일본: "JP",
  글로벌: "KR", // 기본값
};

/* ---------- Keyword/Tag Extraction ---------- */

interface VideoData {
  title: string;
  tags: string[];
  publishedAt: string;
  views: number;
  likes: number;
}

const STOP_WORDS = new Set([
  // Korean
  "이것", "저것", "그것", "하는", "있는", "없는", "되는", "인데",
  "에서", "으로", "한다", "이다", "니다", "습니다", "입니다",
  "영상", "구독", "좋아요", "알림", "설정", "채널", "오늘",
  "지금", "정말", "진짜", "너무", "완전", "바로", "시작",
  "해보", "해봤", "됩니다", "했습니다", "리뷰", "추천",
  "드디어", "대박", "최초", "공개", "이번", "최신",
  // English
  "the", "and", "for", "with", "this", "that", "from",
  "official", "video", "music", "shorts", "live",
]);

interface KeywordInfo {
  count: number;         // 등장 영상 수
  totalViews: number;    // 키워드 포함 영상들의 총 조회수
  totalLikes: number;    // 키워드 포함 영상들의 총 좋아요
  avgVelocity: number;   // 평균 조회 속도 (views/hour)
  publishDates: number[]; // 게시일 timestamps
}

function extractKeywordsFromVideos(videos: VideoData[]): Map<string, KeywordInfo> {
  const result = new Map<string, KeywordInfo>();
  const titlePattern = /[가-힣]{2,}|[A-Za-z]{3,}[A-Za-z0-9]*/g;
  const now = Date.now();

  for (const video of videos) {
    const hoursSincePublish = Math.max(1, (now - new Date(video.publishedAt).getTime()) / 3600000);
    const velocity = video.views / hoursSincePublish;
    const publishTime = new Date(video.publishedAt).getTime();

    // 태그에서 키워드 추출 (더 정확한 신호)
    const keywords = new Set<string>();
    for (const tag of video.tags) {
      const lower = tag.toLowerCase().trim();
      if (lower.length >= 2 && !STOP_WORDS.has(lower)) {
        keywords.add(lower);
      }
    }

    // 제목에서 추가 키워드 추출
    const titleMatches = video.title.match(titlePattern) || [];
    for (const word of titleMatches) {
      const lower = word.toLowerCase();
      if (!STOP_WORDS.has(lower)) {
        keywords.add(lower);
      }
    }

    // 각 키워드에 영상 데이터 집계
    for (const keyword of keywords) {
      const info = result.get(keyword) || {
        count: 0,
        totalViews: 0,
        totalLikes: 0,
        avgVelocity: 0,
        publishDates: [],
      };
      info.count++;
      info.totalViews += video.views;
      info.totalLikes += video.likes;
      info.avgVelocity += velocity;
      info.publishDates.push(publishTime);
      result.set(keyword, info);
    }
  }

  // 평균 velocity 계산
  for (const [, info] of result) {
    info.avgVelocity = info.count > 0 ? info.avgVelocity / info.count : 0;
  }

  return result;
}

/* ---------- Competition Level ---------- */

function getCompetitionLevel(videoCount: number): "높음" | "중간" | "낮음" {
  if (videoCount > 500000) return "높음";
  if (videoCount > 50000) return "중간";
  return "낮음";
}

/* ---------- Timeline from real dates ---------- */

function buildTimeline(dates: number[]): TrendTimelinePoint[] {
  const now = Date.now();
  const buckets = new Array(7).fill(0);

  for (const ts of dates) {
    const daysAgo = Math.floor((now - ts) / 86400000);
    if (daysAgo >= 0 && daysAgo < 7) {
      buckets[6 - daysAgo]++;
    }
  }

  return buckets.map((value, i) => ({
    day: i === 6 ? "오늘" : `${6 - i}일 전`,
    value,
  }));
}

/* ---------- Route Handler ---------- */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const category: string = body.category || "전체";
    const region: string = body.region || "한국";

    // 캐시 확인 (30분)
    const cacheKey = `trend-surfing:v3:${category}:${region}`;
    const cached = await cache.get<TrendSurfingResponse>(cacheKey);
    if (cached) {
      return NextResponse.json({ data: cached });
    }

    const regionCode = regionCodeMap[region] || "KR";
    const categoryId = categoryIdMap[category] || "";

    // ═══ Phase 1: 실제 트렌딩 영상 수집 ═══
    // 두 가지 소스를 결합: 인기급상승 + 최신 인기

    const videoDataList: VideoData[] = [];

    // 1-A: YouTube 인기 급상승 (mostPopular chart) — 실제 트렌드의 핵심
    type VideoItem = { id: string; snippet: { title: string; publishedAt: string; tags?: string[] }; statistics: { viewCount: string; likeCount: string; commentCount: string }; contentDetails: { duration: string } };
    const emptyVideos = { items: [] as VideoItem[] };

    const trendingPromise = youtubeClient
      .getTrendingVideos(regionCode, categoryId || undefined, 50)
      .catch(() => emptyVideos);

    // 1-B: 카테고리별 최신 영상 (order: date) — 떠오르는 신흥 트렌드
    let emergingPromise: ReturnType<typeof youtubeClient.searchVideos>;

    if (categoryId) {
      emergingPromise = youtubeClient
        .searchVideosByCategory(categoryId, 50, "date", regionCode)
        .catch(() => ({ items: [], pageInfo: { totalResults: 0 } }));
    } else {
      // 전체 카테고리: 최신 인기 영상 검색
      emergingPromise = youtubeClient
        .searchVideos("trending", 50)
        .catch(() => ({ items: [], pageInfo: { totalResults: 0 } }));
    }

    // 보조: 음식 등 Howto에 겹치는 카테고리는 키워드 검색 보완
    const fallbackQueries = categoryFallbackQueries[category] || [];
    type SearchItem = { id: { videoId?: string }; snippet: { title: string; channelId: string; publishedAt: string } };
    const emptySearch = { items: [] as SearchItem[], pageInfo: { totalResults: 0 } };
    const fallbackPromises = fallbackQueries.slice(0, 2).map((q) =>
      youtubeClient.searchVideos(q, 25).catch(() => emptySearch)
    );

    const [trendingResult, emergingResult, ...fallbackResults] = await Promise.all([
      trendingPromise,
      emergingPromise,
      ...fallbackPromises,
    ]);

    // ═══ Phase 2: 영상 상세 데이터 통합 ═══

    // 트렌딩 영상은 이미 상세 데이터 포함
    for (const v of trendingResult.items) {
      videoDataList.push({
        title: v.snippet.title,
        tags: v.snippet.tags || [],
        publishedAt: v.snippet.publishedAt,
        views: parseInt(v.statistics.viewCount) || 0,
        likes: parseInt(v.statistics.likeCount) || 0,
      });
    }

    // 최신 영상 + 보조 영상의 상세 정보 가져오기
    const emergingIds = new Set<string>();
    for (const item of emergingResult.items) {
      const vid = item.id.videoId;
      if (vid) emergingIds.add(vid);
    }
    for (const result of fallbackResults) {
      for (const item of result.items) {
        const vid = item.id.videoId;
        if (vid) emergingIds.add(vid);
      }
    }

    // 이미 있는 트렌딩 영상 ID 제외
    const existingIds = new Set(trendingResult.items.map((v) => v.id));
    const newIds = [...emergingIds].filter((id) => !existingIds.has(id)).slice(0, 50);

    if (newIds.length > 0) {
      try {
        const emergingDetails = await youtubeClient.getVideoDetails(newIds);
        for (const v of emergingDetails.items) {
          videoDataList.push({
            title: v.snippet.title,
            tags: v.snippet.tags || [],
            publishedAt: v.snippet.publishedAt,
            views: parseInt(v.statistics.viewCount) || 0,
            likes: parseInt(v.statistics.likeCount) || 0,
          });
        }
      } catch {
        // 상세 조회 실패 시 기본 정보만 사용
      }
    }

    if (videoDataList.length === 0) {
      return NextResponse.json({
        data: { trendingKeywords: [], blueOceanKeywords: [], timeline: {} },
      });
    }

    // ═══ Phase 3: 키워드 추출 + 조회 속도 분석 ═══

    const keywordMap = extractKeywordsFromVideos(videoDataList);

    // 최소 2회 이상 등장한 키워드만 (노이즈 제거)
    const qualifiedKeywords = [...keywordMap.entries()]
      .filter(([, info]) => info.count >= 2)
      .sort((a, b) => {
        // 조회속도 × 등장빈도 복합 점수로 정렬
        const scoreA = a[1].avgVelocity * Math.log2(a[1].count + 1);
        const scoreB = b[1].avgVelocity * Math.log2(b[1].count + 1);
        return scoreB - scoreA;
      })
      .slice(0, 25);

    // ═══ Phase 4: 경쟁도 조회 (상위 12개만 API 호출) ═══

    const videoCountMap = new Map<string, number>();

    const countPromises = qualifiedKeywords.slice(0, 12).map(async ([keyword]) => {
      try {
        const result = await youtubeClient.searchVideos(keyword, 1);
        videoCountMap.set(keyword, result.pageInfo?.totalResults || 0);
      } catch {
        videoCountMap.set(keyword, 0);
      }
    });

    await Promise.allSettled(countPromises);

    // 나머지는 추정
    for (const [keyword, info] of qualifiedKeywords) {
      if (!videoCountMap.has(keyword)) {
        videoCountMap.set(keyword, info.count * 10000);
      }
    }

    // ═══ Phase 5: 전체 평균 조회 속도 (기준선) ═══

    const allVelocities = videoDataList.map((v) => {
      const hours = Math.max(1, (Date.now() - new Date(v.publishedAt).getTime()) / 3600000);
      return v.views / hours;
    });
    const avgVelocity = allVelocities.length > 0
      ? allVelocities.reduce((a, b) => a + b, 0) / allVelocities.length
      : 1;

    // ═══ Phase 6: 트렌딩 키워드 구성 ═══
    // 성장 지수 = 해당 키워드의 평균 조회속도 / 전체 평균 조회속도 × 100

    const trendingKeywords: TrendingKeyword[] = qualifiedKeywords
      .slice(0, 10)
      .map(([keyword, info], index) => {
        const videoCount = videoCountMap.get(keyword) || 0;
        const growth = Math.round((info.avgVelocity / Math.max(avgVelocity, 1)) * 100);

        return {
          rank: index + 1,
          keyword,
          videoCount,
          growth: Math.max(0, growth),
          competition: getCompetitionLevel(videoCount),
        };
      });

    // ═══ Phase 7: 블루오션 키워드 ═══
    // 높은 조회속도(수요) + 낮은 totalResults(공급) = 높은 기회

    const blueOceanCandidates: BlueOceanKeyword[] = qualifiedKeywords
      .map(([keyword, info]) => {
        const videoCount = videoCountMap.get(keyword) || 0;

        // 추정 검색량: 키워드 포함 영상의 총 조회수 기반
        const searchVolume = Math.round(info.totalViews * 0.05 + info.count * 500);

        // 기회 점수 3요소:
        // 1. 수요 (30점): 평균 조회속도가 높을수록
        const demandScore = Math.min(30, Math.round(
          (info.avgVelocity / Math.max(avgVelocity, 1)) * 15
        ));

        // 2. 공급 부족 (40점): totalResults가 적을수록
        const supplyScore = videoCount < 5000 ? 40
          : videoCount < 20000 ? 30
          : videoCount < 100000 ? 20
          : videoCount < 500000 ? 10
          : 5;

        // 3. 참여도 (30점): 좋아요/조회수 비율
        const engagementRate = info.totalViews > 0
          ? info.totalLikes / info.totalViews
          : 0;
        const engagementScore = Math.min(30, Math.round(engagementRate * 600));

        const opportunityScore = Math.min(100, demandScore + supplyScore + engagementScore);

        return { keyword, searchVolume, videoCount, opportunityScore };
      })
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 10);

    // ═══ Phase 8: 타임라인 — 실제 게시일 기반 7일 분포 ═══

    const timeline: Record<string, TrendTimelinePoint[]> = {};
    for (const kw of [...trendingKeywords, ...blueOceanCandidates].slice(0, 5)) {
      const info = keywordMap.get(kw.keyword);
      if (info) {
        timeline[kw.keyword] = buildTimeline(info.publishDates);
      }
    }

    const response: TrendSurfingResponse = {
      trendingKeywords,
      blueOceanKeywords: blueOceanCandidates,
      timeline,
    };

    // 캐시 저장 (30분)
    await cache.set(cacheKey, response, 1800);

    return NextResponse.json({ data: response });
  } catch (err) {
    console.error("Trend surfing error:", err);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "트렌드 분석 중 오류가 발생했습니다",
        },
      },
      { status: 500 }
    );
  }
}
