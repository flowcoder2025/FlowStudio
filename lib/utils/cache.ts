/**
 * Simple TTL Cache Utility
 * 간단한 TTL 기반 인메모리 캐시 (LRU 근사)
 *
 * 사용 예:
 * - 구독 티어 조회: 60초 TTL
 * - 크레딧 잔액 조회: 30초 TTL
 *
 * [최적화] Vercel Best Practice: server-cache-lru
 * - 동일 요청 내 중복 DB 쿼리 방지
 * - 서버리스 함수 콜드 스타트 간 캐시 공유
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export class TTLCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private ttlMs: number
  private maxSize: number

  constructor(ttlSeconds: number = 60, maxSize: number = 1000) {
    this.ttlMs = ttlSeconds * 1000
    this.maxSize = maxSize
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }

    return entry.value
  }

  set(key: string, value: T): void {
    // LRU eviction: if cache is full, delete oldest entries
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    })
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }

  invalidateAll(): void {
    this.cache.clear()
  }

  // 디버그용: 캐시 상태 확인
  getStats(): { size: number; maxSize: number; ttlMs: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttlMs: this.ttlMs,
    }
  }
}

// ========================================
// Singleton Cache Instances
// ========================================

import type { SubscriptionTier } from '@/lib/constants'

// 구독 티어 캐시: 60초 TTL (구독 정보는 자주 변경되지 않음)
export const subscriptionTierCache = new TTLCache<SubscriptionTier>(60, 1000)

// 크레딧 잔액 캐시: 30초 TTL (결제/사용 시 무효화 필요)
export const creditBalanceCache = new TTLCache<number>(30, 1000)

// 크레딧 상세 잔액 캐시: 30초 TTL
export interface CreditBalanceDetail {
  free: number
  purchased: number
  total: number
}
export const creditBalanceDetailCache = new TTLCache<CreditBalanceDetail>(30, 1000)
