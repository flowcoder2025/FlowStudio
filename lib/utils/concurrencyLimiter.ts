/**
 * 분산 동시 생성 제한 유틸리티 (Supabase/Prisma 버전)
 *
 * 구독 플랜별 동시 생성 제한:
 * - FREE: 1건
 * - PLUS: 3건
 * - PRO: 5건
 * - BUSINESS: 10건
 *
 * PostgreSQL 트랜잭션을 사용하여 여러 Vercel 인스턴스에서도
 * 정확한 동시성 제어를 보장합니다.
 */

import { prisma } from '@/lib/prisma'
import { getConcurrentLimit } from '@/lib/utils/subscriptionManager'
import { logger } from '@/lib/logger'

// 슬롯 만료 시간 (5분 - 타임아웃 안전장치)
const SLOT_TTL_MS = 5 * 60 * 1000

/**
 * 동시 생성 슬롯 획득 시도
 * @returns requestId if successful, null if limit exceeded
 */
export async function acquireGenerationSlot(userId: string): Promise<string | null> {
  const limit = await getConcurrentLimit(userId)
  const now = new Date()

  try {
    // Serializable 트랜잭션으로 원자적 처리 (race condition 방지)
    const result = await prisma.$transaction(async (tx) => {
      // 1. 만료된 슬롯 정리 (자동 가비지 컬렉션)
      await tx.concurrencySlot.deleteMany({
        where: { expiresAt: { lt: now } }
      })

      // 2. 현재 활성 슬롯 수 확인
      const activeCount = await tx.concurrencySlot.count({
        where: {
          userId,
          expiresAt: { gt: now }
        }
      })

      // 3. 제한 초과 확인
      if (activeCount >= limit) {
        logger.debug('Concurrency limit exceeded', { module: 'Concurrency', userId, active: activeCount, limit })
        return null
      }

      // 4. 새 슬롯 생성
      const requestId = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      await tx.concurrencySlot.create({
        data: {
          userId,
          requestId,
          expiresAt: new Date(now.getTime() + SLOT_TTL_MS)
        }
      })

      logger.debug('Slot acquired', { module: 'Concurrency', userId, requestId, active: activeCount + 1, limit })
      return requestId
    }, {
      isolationLevel: 'Serializable', // 동시성 안전 보장
      timeout: 10000 // 10초 타임아웃
    })

    return result
  } catch (error) {
    // Serializable 트랜잭션 충돌 시 재시도 로직
    if (error instanceof Error && error.message.includes('could not serialize')) {
      logger.debug('Transaction conflict, retrying', { module: 'Concurrency', userId })
      // 한 번 재시도
      return acquireGenerationSlotRetry(userId, limit)
    }
    logger.error('Error acquiring slot', { module: 'Concurrency' }, error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

/**
 * 재시도 로직 (트랜잭션 충돌 시)
 */
async function acquireGenerationSlotRetry(userId: string, limit: number): Promise<string | null> {
  const now = new Date()

  const activeCount = await prisma.concurrencySlot.count({
    where: {
      userId,
      expiresAt: { gt: now }
    }
  })

  if (activeCount >= limit) {
    return null
  }

  const requestId = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  try {
    await prisma.concurrencySlot.create({
      data: {
        userId,
        requestId,
        expiresAt: new Date(now.getTime() + SLOT_TTL_MS)
      }
    })
    logger.debug('Slot acquired (retry)', { module: 'Concurrency', userId, requestId })
    return requestId
  } catch {
    // 유니크 충돌이면 null 반환
    return null
  }
}

/**
 * 동시 생성 슬롯 해제
 */
export async function releaseGenerationSlot(userId: string, requestId: string): Promise<void> {
  try {
    await prisma.concurrencySlot.deleteMany({
      where: { requestId }
    })
    logger.debug('Slot released', { module: 'Concurrency', userId, requestId })
  } catch (error) {
    // 이미 삭제된 경우 무시
    logger.warn('Slot release warning', { module: 'Concurrency' }, error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * 사용자의 현재 활성 요청 수 조회
 */
export async function getActiveRequestCount(userId: string): Promise<number> {
  const now = new Date()
  return await prisma.concurrencySlot.count({
    where: {
      userId,
      expiresAt: { gt: now }
    }
  })
}

/**
 * 사용자의 남은 슬롯 수 조회
 */
export async function getRemainingSlots(userId: string): Promise<number> {
  const limit = await getConcurrentLimit(userId)
  const active = await getActiveRequestCount(userId)
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
  const active = await getActiveRequestCount(userId)
  const remaining = Math.max(0, limit - active)

  return {
    limit,
    active,
    remaining,
    canGenerate: remaining > 0
  }
}

/**
 * 만료된 슬롯 정리 (크론 작업용 또는 수동 호출)
 */
export async function cleanupExpiredSlots(): Promise<number> {
  const now = new Date()
  const result = await prisma.concurrencySlot.deleteMany({
    where: { expiresAt: { lt: now } }
  })

  if (result.count > 0) {
    logger.info('Cleaned up expired slots', { module: 'Concurrency', count: result.count })
  }

  return result.count
}
