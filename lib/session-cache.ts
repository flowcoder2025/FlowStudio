/**
 * Session Cache (3-Tier: In-Memory LRU → Optional Redis → DB)
 * Contract: Graceful degradation — works without Redis
 */

// --- Tier 1: In-Memory LRU Cache ---

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const MAX_ENTRIES = 100;
const DEFAULT_TTL_MS = 60_000; // 1 minute

class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void {
    if (this.cache.size >= MAX_ENTRIES) {
      // Evict oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

const memoryCache = new LRUCache<unknown>();

// --- Tier 2: Optional Redis Layer ---

type RedisClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { ex?: number }): Promise<unknown>;
  del(key: string): Promise<unknown>;
};

let redisClient: RedisClient | null = null;

async function getRedis(): Promise<RedisClient | null> {
  if (redisClient) return redisClient;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  try {
    // Dynamic import — @upstash/redis is an optional peer dependency
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import("@upstash/redis");
    const Redis = mod.Redis ?? mod.default?.Redis;
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }) as RedisClient;
    return redisClient;
  } catch {
    return null;
  }
}

const REDIS_TTL_SECONDS = 300; // 5 minutes

// --- Public API ---

/**
 * Get session data with 3-tier cache fallback:
 * 1. In-Memory LRU (1 min TTL)
 * 2. Redis (5 min TTL, if configured)
 * 3. DB via fetcher function
 */
export async function getSessionData<T>(
  userId: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cacheKey = `session:${userId}`;

  // Tier 1: Memory
  const memResult = memoryCache.get(cacheKey) as T | undefined;
  if (memResult !== undefined) return memResult;

  // Tier 2: Redis
  const redis = await getRedis();
  if (redis) {
    try {
      const redisResult = await redis.get(cacheKey);
      if (redisResult) {
        const parsed = JSON.parse(redisResult) as T;
        memoryCache.set(cacheKey, parsed);
        return parsed;
      }
    } catch {
      // Redis failure — continue to DB
    }
  }

  // Tier 3: DB
  const dbResult = await fetcher();
  memoryCache.set(cacheKey, dbResult);
  if (redis) {
    redis.set(cacheKey, JSON.stringify(dbResult), { ex: REDIS_TTL_SECONDS }).catch(() => {});
  }
  return dbResult;
}

/**
 * Invalidate session cache for a user.
 * Call after credit/subscription changes.
 */
export async function invalidateSession(userId: string): Promise<void> {
  const cacheKey = `session:${userId}`;
  memoryCache.delete(cacheKey);
  const redis = await getRedis();
  if (redis) {
    redis.del(cacheKey).catch(() => {});
  }
}
