const memoryCache = new Map<string, { data: string; expiresAt: number }>();

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    // Upstash Redis 연동 시 여기를 교체
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    try {
      return JSON.parse(entry.data) as T;
    } catch {
      memoryCache.delete(key);
      return null;
    }
  },

  async set(key: string, data: unknown, ttlSeconds = 3600): Promise<void> {
    memoryCache.set(key, {
      data: JSON.stringify(data),
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },

  async delete(key: string): Promise<void> {
    memoryCache.delete(key);
  },

  async flush(): Promise<void> {
    memoryCache.clear();
  },
};
