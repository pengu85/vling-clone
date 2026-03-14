import { NextRequest, NextResponse } from "next/server";
import { youtubeClient } from "@/lib/youtube";
import { cache } from "@/lib/cache";
import { calculateAlgoScore } from "@/domain/algoScore";

interface VideoRankingItem {
  rank: number;
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  viewCount: number;
  likeCount: number;
  publishedAt: string;
  duration: string;
  isShort: boolean;
  algoScore: number;
}

const YOUTUBE_CATEGORY_MAP: Record<string, string> = {
  all: "",
  gaming: "20",
  music: "10",
  entertainment: "24",
  education: "27",
  sports: "17",
  news: "25",
  science: "28",
  howto: "26",
  film: "1",
  autos: "2",
  pets: "15",
  comedy: "23",
  kids: "24",
};

function parseDurationToSeconds(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

function isShortVideo(duration: string): boolean {
  return parseDurationToSeconds(duration) <= 60;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMockVideoRankings(type: "longform" | "shorts", count = 20): VideoRankingItem[] {
  const titles = type === "longform"
    ? [
        "이것이 진짜 맛집이다! 전국 투어 베스트 10",
        "2026년 최신 스마트폰 완벽 비교 리뷰",
        "프로게이머가 알려주는 실전 꿀팁",
        "해외여행 필수 준비물 총정리",
        "인기 아이돌 컴백 무대 리액션",
        "자취생 한 달 식비 10만원 도전기",
        "초보자를 위한 운동 루틴 가이드",
        "역대급 드라마 명장면 모음",
        "강아지와 고양이의 일상 브이로그",
        "주식 투자 초보 가이드",
        "올해 최고의 영화 TOP 10",
        "K-POP 댄스 커버 메들리",
        "자동차 시승 리뷰 - 신차 출시",
        "과학으로 풀어보는 일상의 비밀",
        "요즘 핫한 카페 투어",
        "게임 실황 - 신작 RPG 플레이",
        "프로그래밍 입문 강좌",
        "다이어트 식단 일주일 도전",
        "인테리어 셀프 리모델링",
        "최신 가전제품 비교 분석",
      ]
    : [
        "이거 실화? #shorts",
        "30초만에 배우는 요리 꿀팁 #shorts",
        "강아지 리액션 모음 #shorts",
        "갓생 모닝루틴 #shorts",
        "충격적인 반전 #shorts",
        "1분 운동 챌린지 #shorts",
        "K-POP 댄스 챌린지 #shorts",
        "알뜰 쇼핑 꿀팁 #shorts",
        "ASMR 먹방 #shorts",
        "일상 브이로그 #shorts",
        "고양이 일상 #shorts",
        "게임 하이라이트 #shorts",
        "메이크업 변신 #shorts",
        "길거리 음식 #shorts",
        "여행지 추천 #shorts",
        "라이프 해킹 #shorts",
        "핫플레이스 탐방 #shorts",
        "웃긴 영상 모음 #shorts",
        "신기한 과학 실험 #shorts",
        "커플 일상 #shorts",
      ];

  const channelNames = [
    "테크수다", "뷰티로그", "게임왕국", "쿡방TV", "여행가자",
    "음악천재", "스포츠매니아", "교육의정석", "코미디빅뱅", "반려동물TV",
    "IT리뷰어", "패션위크", "먹방스타", "과학쿠키", "키즈플레이",
    "자동차리뷰", "영화리뷰어", "운동루틴", "독서클럽", "부동산톡",
  ];

  return Array.from({ length: count }, (_, i) => {
    const viewCount = randomBetween(
      type === "longform" ? 100000 : 500000,
      type === "longform" ? 10000000 : 50000000
    );
    const likeCount = Math.round(viewCount * (Math.random() * 0.05 + 0.02));
    const durationSec = type === "longform"
      ? randomBetween(180, 3600)
      : randomBetween(15, 60);
    const hours = Math.floor(durationSec / 3600);
    const mins = Math.floor((durationSec % 3600) / 60);
    const secs = durationSec % 60;
    const duration = `PT${hours > 0 ? hours + "H" : ""}${mins}M${secs}S`;

    return {
      rank: i + 1,
      videoId: `mock_vid_${type}_${i}`,
      title: titles[i % titles.length],
      thumbnailUrl: `https://placehold.co/480x270/4f46e5/white?text=${encodeURIComponent(`Video ${i + 1}`)}`,
      channelId: `UC_mock_${i}`,
      channelTitle: channelNames[i % channelNames.length],
      viewCount,
      likeCount,
      publishedAt: new Date(Date.now() - randomBetween(1, 90) * 86400000).toISOString(),
      duration,
      isShort: type === "shorts",
      algoScore: randomBetween(30, 98),
    };
  }).sort((a, b) => b.viewCount - a.viewCount)
    .map((item, i) => ({ ...item, rank: i + 1 }));
}

const CACHE_TTL = 3600;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = (searchParams.get("type") || "longform") as "longform" | "shorts";
  const category = searchParams.get("category") || "all";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const cacheKey = `video-ranking:v1:${type}:${category}`;
  let items: VideoRankingItem[];

  const hasApiKey = !!process.env.YOUTUBE_API_KEY;

  if (hasApiKey) {
    const cached = await cache.get<VideoRankingItem[]>(cacheKey);
    if (cached) {
      items = cached;
    } else {
      try {
        const categoryId = YOUTUBE_CATEGORY_MAP[category] || "";
        // Search for videos ordered by view count
        const searchParams: Record<string, string> = {
          part: "snippet",
          type: "video",
          order: "viewCount",
          regionCode: "KR",
          maxResults: "50",
        };
        if (categoryId) searchParams.videoCategoryId = categoryId;

        const searchRes = await youtubeClient.searchVideos(
          category === "all" ? "한국 인기 영상" : `한국 ${category}`,
          50
        );

        const videoIds = searchRes.items
          .map((item) => item.id.videoId)
          .filter((id): id is string => !!id);

        if (videoIds.length === 0) throw new Error("No videos found");

        const detailRes = await youtubeClient.getVideoDetails(videoIds);

        const allVideos: VideoRankingItem[] = detailRes.items.map((v, i) => {
          const viewCount = parseInt(v.statistics.viewCount || "0", 10);
          const likeCount = parseInt(v.statistics.likeCount || "0", 10);
          const commentCount = parseInt(v.statistics.commentCount || "0", 10);
          const daysAgo = Math.max(
            1,
            Math.floor((Date.now() - new Date(v.snippet.publishedAt).getTime()) / 86400000)
          );

          return {
            rank: i + 1,
            videoId: v.id,
            title: v.snippet.title,
            thumbnailUrl: v.snippet.thumbnails?.high?.url || "",
            channelId: "",
            channelTitle: "",
            viewCount,
            likeCount,
            publishedAt: v.snippet.publishedAt,
            duration: v.contentDetails.duration,
            isShort: isShortVideo(v.contentDetails.duration),
            algoScore: calculateAlgoScore({
              viewCount,
              likeCount,
              commentCount,
              subscriberCount: viewCount * 2,
              publishedDaysAgo: daysAgo,
              videoCount: 100,
            }),
          };
        });

        // Filter by type
        const filtered = allVideos.filter((v) =>
          type === "shorts" ? v.isShort : !v.isShort
        );

        items = filtered
          .sort((a, b) => b.viewCount - a.viewCount)
          .map((item, i) => ({ ...item, rank: i + 1 }));

        await cache.set(cacheKey, items, CACHE_TTL);
      } catch {
        items = generateMockVideoRankings(type);
      }
    }
  } else {
    items = generateMockVideoRankings(type);
  }

  const total = items.length;
  const start = (page - 1) * limit;
  const paginated = items.slice(start, start + limit);

  return NextResponse.json({
    data: paginated,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
