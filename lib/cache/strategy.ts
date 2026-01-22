/**
 * API Caching Strategy
 * Contract: PERF_FUNC_CACHE_STRATEGY
 *
 * 기능:
 * - 인메모리 캐시 (LRU 패턴)
 * - SWR (Stale-While-Revalidate) 패턴
 * - 캐시 무효화 전략
 * - 캐시 통계 및 모니터링
 */

// =====================================================
// Types
// =====================================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  staleAt: number;
  hits: number;
  tags: string[];
}

export interface CacheOptions {
  /** TTL in milliseconds (default: 5 minutes) */
  ttl?: number;
  /** Stale time in milliseconds (default: 1 minute) */
  staleTime?: number;
  /** Tags for cache invalidation */
  tags?: string[];
  /** Skip cache read */
  skipCache?: boolean;
  /** Force revalidation */
  revalidate?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export type CachePredicate<T> = (entry: CacheEntry<T>) => boolean;

// =====================================================
// Cache Configuration
// =====================================================

export const cacheStrategy = {
  // Default TTLs by resource type
  ttl: {
    /** 업종 목록 - 자주 변경되지 않음 (1시간) */
    industries: 60 * 60 * 1000,
    /** 워크플로우 세션 - 짧은 캐싱 (5분) */
    workflowSession: 5 * 60 * 1000,
    /** 사용자 프로필 - 중간 캐싱 (10분) */
    userProfile: 10 * 60 * 1000,
    /** 크레딧 잔액 - 짧은 캐싱 (1분) */
    creditBalance: 60 * 1000,
    /** 가격 정보 - 긴 캐싱 (1시간) */
    pricing: 60 * 60 * 1000,
    /** 이미지 목록 - 중간 캐싱 (5분) */
    images: 5 * 60 * 1000,
    /** 권한 정보 - 짧은 캐싱 (2분) */
    permissions: 2 * 60 * 1000,
  },

  // Stale time (SWR pattern)
  staleTime: {
    industries: 30 * 60 * 1000,
    workflowSession: 2 * 60 * 1000,
    userProfile: 5 * 60 * 1000,
    creditBalance: 30 * 1000,
    pricing: 30 * 60 * 1000,
    images: 2 * 60 * 1000,
    permissions: 60 * 1000,
  },

  // Max cache size per resource type
  maxSize: {
    default: 100,
    images: 500,
    industries: 50,
    workflowSession: 50,
  },
};

// =====================================================
// LRU Cache Implementation
// =====================================================

class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    hitRate: 0,
  };

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: string): CacheEntry<T> | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    entry.hits++;
    this.cache.set(key, entry);

    this.stats.hits++;
    this.updateHitRate();

    return entry;
  }

  set(key: string, data: T, options: CacheOptions = {}): void {
    const {
      ttl = 5 * 60 * 1000,
      staleTime = 60 * 1000,
      tags = [],
    } = options;

    const now = Date.now();

    // Evict if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      staleAt: now + staleTime,
      hits: 0,
      tags,
    });

    this.stats.size = this.cache.size;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;
    return Date.now() > entry.staleAt;
  }

  delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.stats.size = this.cache.size;
    return result;
  }

  invalidateByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    this.stats.size = this.cache.size;
    return count;
  }

  invalidateByPredicate(predicate: CachePredicate<T>): number {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (predicate(entry)) {
        this.cache.delete(key);
        count++;
      }
    }
    this.stats.size = this.cache.size;
    return count;
  }

  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
}

// =====================================================
// Global Cache Instances
// =====================================================

const caches = {
  industries: new LRUCache<unknown>(cacheStrategy.maxSize.industries),
  workflowSession: new LRUCache<unknown>(cacheStrategy.maxSize.workflowSession),
  images: new LRUCache<unknown>(cacheStrategy.maxSize.images),
  default: new LRUCache<unknown>(cacheStrategy.maxSize.default),
};

type CacheType = keyof typeof caches;

// =====================================================
// Cache Manager
// =====================================================

export const cacheManager = {
  /**
   * Get from cache
   */
  get<T>(cacheType: CacheType, key: string): T | undefined {
    const cache = caches[cacheType] || caches.default;
    const entry = cache.get(key);
    return entry?.data as T | undefined;
  },

  /**
   * Set to cache
   */
  set<T>(cacheType: CacheType, key: string, data: T, options?: CacheOptions): void {
    const cache = caches[cacheType] || caches.default;
    const defaultTtl = cacheStrategy.ttl[cacheType as keyof typeof cacheStrategy.ttl];
    const defaultStale = cacheStrategy.staleTime[cacheType as keyof typeof cacheStrategy.staleTime];

    cache.set(key, data, {
      ttl: options?.ttl ?? defaultTtl ?? 5 * 60 * 1000,
      staleTime: options?.staleTime ?? defaultStale ?? 60 * 1000,
      tags: options?.tags ?? [],
    });
  },

  /**
   * Check if entry exists and is fresh
   */
  has(cacheType: CacheType, key: string): boolean {
    const cache = caches[cacheType] || caches.default;
    return cache.has(key);
  },

  /**
   * Check if entry is stale (but not expired)
   */
  isStale(cacheType: CacheType, key: string): boolean {
    const cache = caches[cacheType] || caches.default;
    return cache.isStale(key);
  },

  /**
   * Delete from cache
   */
  delete(cacheType: CacheType, key: string): boolean {
    const cache = caches[cacheType] || caches.default;
    return cache.delete(key);
  },

  /**
   * Invalidate all entries with a specific tag
   */
  invalidateByTag(tag: string): number {
    let total = 0;
    for (const cache of Object.values(caches)) {
      total += cache.invalidateByTag(tag);
    }
    return total;
  },

  /**
   * Clear specific cache or all caches
   */
  clear(cacheType?: CacheType): void {
    if (cacheType) {
      const cache = caches[cacheType];
      cache?.clear();
    } else {
      for (const cache of Object.values(caches)) {
        cache.clear();
      }
    }
  },

  /**
   * Get cache statistics
   */
  getStats(): Record<CacheType, CacheStats> {
    const stats: Record<string, CacheStats> = {};
    for (const [name, cache] of Object.entries(caches)) {
      stats[name] = cache.getStats();
    }
    return stats as Record<CacheType, CacheStats>;
  },
};

// =====================================================
// SWR Pattern Helper
// =====================================================

export interface SWRResult<T> {
  data: T | undefined;
  isStale: boolean;
  isLoading: boolean;
  error: Error | null;
  revalidate: () => Promise<void>;
}

/**
 * Fetch with SWR pattern (server-side)
 */
export async function fetchWithCache<T>(
  cacheType: CacheType,
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { skipCache = false, revalidate = false } = options;

  // Try to get from cache
  if (!skipCache && !revalidate) {
    const cached = cacheManager.get<T>(cacheType, key);
    if (cached !== undefined) {
      // If stale, revalidate in background
      if (cacheManager.isStale(cacheType, key)) {
        // Fire and forget revalidation
        fetcher()
          .then((data) => cacheManager.set(cacheType, key, data, options))
          .catch(() => {}); // Ignore revalidation errors
      }
      return cached;
    }
  }

  // Fetch fresh data
  const data = await fetcher();
  cacheManager.set(cacheType, key, data, options);
  return data;
}

// =====================================================
// Cache Tags
// =====================================================

export const cacheTags = {
  user: (userId: string) => `user:${userId}`,
  workflow: (workflowId: string) => `workflow:${workflowId}`,
  image: (imageId: string) => `image:${imageId}`,
  credits: (userId: string) => `credits:${userId}`,
  permissions: (resourceId: string) => `permissions:${resourceId}`,
};

// =====================================================
// Cache Invalidation Helpers
// =====================================================

export const invalidateCache = {
  /**
   * Invalidate all user-related caches
   */
  user: (userId: string): number => {
    return cacheManager.invalidateByTag(cacheTags.user(userId));
  },

  /**
   * Invalidate workflow cache
   */
  workflow: (workflowId: string): number => {
    return cacheManager.invalidateByTag(cacheTags.workflow(workflowId));
  },

  /**
   * Invalidate credit balance cache
   */
  credits: (userId: string): number => {
    return cacheManager.invalidateByTag(cacheTags.credits(userId));
  },

  /**
   * Invalidate permissions cache
   */
  permissions: (resourceId: string): number => {
    return cacheManager.invalidateByTag(cacheTags.permissions(resourceId));
  },

  /**
   * Invalidate all caches (nuclear option)
   */
  all: (): void => {
    cacheManager.clear();
  },
};

// =====================================================
// Next.js Route Handler Helpers
// =====================================================

/**
 * Create cache headers for API response
 */
export function getCacheHeaders(
  cacheType: keyof typeof cacheStrategy.ttl,
  isPrivate: boolean = true
): Record<string, string> {
  const maxAge = Math.floor(cacheStrategy.ttl[cacheType] / 1000);
  const staleWhileRevalidate = Math.floor(
    (cacheStrategy.staleTime[cacheType] || cacheStrategy.ttl[cacheType] / 2) / 1000
  );

  const directive = isPrivate ? 'private' : 'public';

  return {
    'Cache-Control': `${directive}, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
  };
}

/**
 * Create no-cache headers
 */
export function getNoCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
}

// =====================================================
// Export
// =====================================================

export default cacheManager;
