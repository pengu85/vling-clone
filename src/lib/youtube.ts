const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";
const BASE_URL = "https://www.googleapis.com/youtube/v3";

interface YouTubeChannelResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      thumbnails: { high: { url: string } };
      country?: string;
      defaultLanguage?: string;
    };
    statistics: {
      subscriberCount: string;
      viewCount: string;
      videoCount: string;
    };
    brandingSettings?: {
      image?: { bannerExternalUrl?: string };
    };
  }>;
  pageInfo: { totalResults: number };
}

interface YouTubeSearchResponse {
  items: Array<{
    id: { channelId?: string; videoId?: string };
    snippet: {
      channelId: string;
      title: string;
      description: string;
      thumbnails: { high: { url: string } };
      publishedAt: string;
    };
  }>;
  pageInfo: { totalResults: number };
  nextPageToken?: string;
}

export interface YouTubeCommentThreadResponse {
  items: Array<{
    id: string;
    snippet: {
      topLevelComment: {
        id: string;
        snippet: {
          textDisplay: string;
          likeCount: number;
          publishedAt: string;
          authorDisplayName: string;
          authorProfileImageUrl: string;
        };
      };
      totalReplyCount: number;
    };
  }>;
  nextPageToken?: string;
  pageInfo: { totalResults: number };
}

interface YouTubeVideoResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      thumbnails: { high: { url: string } };
      publishedAt: string;
      tags?: string[];
    };
    statistics: {
      viewCount: string;
      likeCount: string;
      commentCount: string;
    };
    contentDetails: {
      duration: string;
    };
    liveStreamingDetails?: {
      concurrentViewers?: string;
      actualStartTime?: string;
    };
  }>;
}

async function youtubeGet<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  const searchParams = new URLSearchParams({ ...params, key: YOUTUBE_API_KEY });
  const res = await fetch(`${BASE_URL}/${endpoint}?${searchParams}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(`YouTube API error: ${res.status} - ${JSON.stringify(error)}`);
  }
  return res.json();
}

export interface SearchChannelsOptions {
  regionCode?: string;
  order?: "relevance" | "date" | "rating" | "viewCount" | "title";
  relevanceLanguage?: string;
}

export const youtubeClient = {
  async searchChannels(
    query: string,
    maxResults = 20,
    options: SearchChannelsOptions = {}
  ): Promise<YouTubeSearchResponse> {
    const params: Record<string, string> = {
      part: "snippet",
      q: query,
      type: "channel",
      maxResults: String(maxResults),
    };
    if (options.regionCode) params.regionCode = options.regionCode;
    if (options.order) params.order = options.order;
    if (options.relevanceLanguage) params.relevanceLanguage = options.relevanceLanguage;
    return youtubeGet<YouTubeSearchResponse>("search", params);
  },

  async getChannel(channelId: string): Promise<YouTubeChannelResponse> {
    return youtubeGet<YouTubeChannelResponse>("channels", {
      part: "snippet,statistics,brandingSettings",
      id: channelId,
    });
  },

  async getChannelVideos(channelId: string, maxResults = 20): Promise<YouTubeSearchResponse> {
    return youtubeGet<YouTubeSearchResponse>("search", {
      part: "snippet",
      channelId,
      type: "video",
      order: "date",
      maxResults: String(maxResults),
    });
  },

  async getVideoDetails(videoIds: string[], includeLive = false): Promise<YouTubeVideoResponse> {
    const parts = ["snippet", "statistics", "contentDetails"];
    if (includeLive) parts.push("liveStreamingDetails");
    return youtubeGet<YouTubeVideoResponse>("videos", {
      part: parts.join(","),
      id: videoIds.join(","),
    });
  },

  async searchVideos(query: string, maxResults = 20): Promise<YouTubeSearchResponse> {
    return youtubeGet<YouTubeSearchResponse>("search", {
      part: "snippet",
      q: query,
      type: "video",
      order: "viewCount",
      maxResults: String(maxResults),
    });
  },

  async resolveHandle(handle: string): Promise<string | null> {
    // Try forHandle param first (works for @handle format)
    const cleanHandle = handle.startsWith("@") ? handle.slice(1) : handle;
    try {
      const result = await youtubeGet<YouTubeChannelResponse>("channels", {
        part: "id",
        forHandle: cleanHandle,
      });
      if (result.items && result.items.length > 0) {
        return result.items[0].id;
      }
    } catch {
      // forHandle may not work for /c/ custom URLs, fall through to search
    }

    // Fallback: search by name
    const searchResult = await youtubeGet<YouTubeSearchResponse>("search", {
      part: "snippet",
      q: handle,
      type: "channel",
      maxResults: "1",
    });
    if (searchResult.items && searchResult.items.length > 0) {
      return searchResult.items[0].id.channelId ?? null;
    }
    return null;
  },

  async getTrendingVideos(
    regionCode = "KR",
    categoryId?: string,
    maxResults = 20
  ): Promise<YouTubeVideoResponse> {
    const params: Record<string, string> = {
      part: "snippet,statistics,contentDetails",
      chart: "mostPopular",
      regionCode,
      maxResults: String(maxResults),
    };
    if (categoryId) params.videoCategoryId = categoryId;
    return youtubeGet<YouTubeVideoResponse>("videos", params);
  },

  async getLiveStreams(
    regionCode = "KR",
    maxResults = 20
  ): Promise<YouTubeSearchResponse> {
    return youtubeGet<YouTubeSearchResponse>("search", {
      part: "snippet",
      type: "video",
      eventType: "live",
      order: "viewCount",
      regionCode,
      maxResults: String(maxResults),
    });
  },

  async searchVideosByCategory(
    categoryId: string,
    maxResults = 20,
    order: "viewCount" | "date" | "relevance" = "viewCount"
  ): Promise<YouTubeSearchResponse> {
    return youtubeGet<YouTubeSearchResponse>("search", {
      part: "snippet",
      type: "video",
      order,
      videoCategoryId: categoryId,
      regionCode: "KR",
      maxResults: String(maxResults),
    });
  },

  async getVideoComments(
    videoId: string,
    maxResults = 100
  ): Promise<YouTubeCommentThreadResponse> {
    return youtubeGet<YouTubeCommentThreadResponse>("commentThreads", {
      part: "snippet",
      videoId,
      maxResults: String(maxResults),
      order: "relevance",
      textFormat: "plainText",
    });
  },
};
