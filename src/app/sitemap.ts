import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://vling.example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    // ── 메인 ──
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },

    // ── 검색 ──
    { url: `${BASE_URL}/search`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/algorithm-score`, lastModified: now, changeFrequency: "daily", priority: 0.8 },

    // ── 순위 ──
    { url: `${BASE_URL}/ranking`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/ranking/videos`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/ranking/live`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${BASE_URL}/ranking/growth`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/ranking/categories`, lastModified: now, changeFrequency: "daily", priority: 0.7 },

    // ── 트렌드 ──
    { url: `${BASE_URL}/trending`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },

    // ── 도구 ──
    { url: `${BASE_URL}/tools/calculator`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/tools/compare`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/tools/ai-finder`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/tools/ai-content`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/tools/youtuber-tracker`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/tools/thumbnail-analyzer`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/tools/channel-dna`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/tools/viral-predictor`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/tools/revenue-simulator`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/tools/comment-analyzer`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/tools/algorithm-anatomy`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/tools/trend-surfing`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/tools/collab-score`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/tools/channel-health`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/tools/revenue-reverse`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/tools/keyword-trends`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/tools/spam-comments`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },

    // ── 광고주 ──
    { url: `${BASE_URL}/campaign/new`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/campaign/manage`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },

    // ── 즐겨찾기 ──
    { url: `${BASE_URL}/my/dashboard`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
    { url: `${BASE_URL}/my/favorites`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/my/channel-report`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },

    // ── 기타 ──
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/enterprise`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/signup`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
