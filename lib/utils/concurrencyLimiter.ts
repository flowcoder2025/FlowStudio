/**
 * 동시 생성 제한 유틸리티
 *
 * 구독 플랜별 동시 생성 제한:
 * - FREE: 1건
 * - PLUS: 3건
 * - PRO: 5건
 * - BUSINESS: 10건
 *
 * Redis 없이 메모리 기반으로 구현 (Vercel serverless 환경 고려)
 * 주의: 여러 인스턴스에서는 완벽하게 작동하지 않을 수 있음
 */

import { getConcurrentLimit } from '@/lib/utils/subscriptionManager'

// 메모리 기반 동시성 추적
// Map<userId, Set<requestId>>
const activeRequests = new Map<string, Set<string>>()

// 요청 만료 시간 (5분 - 타임아웃 안전장치)
const REQUEST_TIMEOUT_MS = 5 * 60 * 1000

// 요청별 타이머 추적
const requestTimers = new Map<string, NodeJS.Timeout>()

/**
 * 동시 생성 슬롯 획득 시도
 * @returns requestId if successful, null if limit exceeded
 */
export async function acquireGenerationSlot(userId: string): Promise<string | null> {
  const limit = await getConcurrentLimit(userId)

  // 사용자의 활성 요청 Set 가져오기
  if (!activeRequests.has(userId)) {
    activeRequests.set(userId, new Set())
  }
  const userRequests = activeRequests.get(userId)!

  // 제한 확인
  if (userRequests.size >= limit) {
    console.log('[Concurrency] Limit exceeded:', { userId, active: userRequests.size, limit })
    return null
  }

  // 새 요청 ID 생성
  const requestId = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  userRequests.add(requestId)

  // 타임아웃 설정 (안전장치 - 요청이 비정상 종료되어도 슬롯 해제)
  const timer = setTimeout(() => {
    releaseGenerationSlot(userId, requestId)
    console.log('[Concurrency] Auto-released expired slot:', { userId, requestId })
  }, REQUEST_TIMEOUT_MS)
  requestTimers.set(requestId, timer)

  console.log('[Concurrency] Slot acquired:', { userId, requestId, active: userRequests.size, limit })
  return requestId
}

/**
 * 동시 생성 슬롯 해제
 */
export function releaseGenerationSlot(userId: string, requestId: string): void {
  const userRequests = activeRequests.get(userId)
  if (userRequests) {
    userRequests.delete(requestId)

    // 빈 Set 정리
    if (userRequests.size === 0) {
      activeRequests.delete(userId)
    }
  }

  // 타이머 정리
  const timer = requestTimers.get(requestId)
  if (timer) {
    clearTimeout(timer)
    requestTimers.delete(requestId)
  }

  console.log('[Concurrency] Slot released:', { userId, requestId })
}

/**
 * 사용자의 현재 활성 요청 수 조회
 */
export function getActiveRequestCount(userId: string): number {
  return activeRequests.get(userId)?.size ?? 0
}

/**
 * 사용자의 남은 슬롯 수 조회
 */
export async function getRemainingSlots(userId: string): Promise<number> {
  const limit = await getConcurrentLimit(userId)
  const active = getActiveRequestCount(userId)
  return Math.max(0, limit - active)
}

/**
 * 동시성 제한 상태 조회 (디버깅용)
 */
export async function getConcurrencyStatus(userId: string): Promise<{
  limit: number
  active: number
  remaining: number
  canGenerate: boolean
}> {
  const limit = await getConcurrentLimit(userId)
  const active = getActiveRequestCount(userId)
  const remaining = Math.max(0, limit - active)

  return {
    limit,
    active,
    remaining,
    canGenerate: remaining > 0
  }
}
