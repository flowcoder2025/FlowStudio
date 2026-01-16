/**
 * 구독(Subscription) 시스템 관리 유틸리티
 *
 * 구독 플랜별 기능 제한:
 * - FREE: 1GB 저장, 동시 1건, 워터마크 포함
 * - PLUS: 100GB 저장, 동시 3건, 워터마크 제거, 우선 처리
 * - PRO: 500GB 저장, 동시 5건, API 접근
 * - BUSINESS: 1TB 저장, 동시 10건, 팀 협업
 */

import { prisma } from '@/lib/prisma'
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from '@/lib/constants'
import { logger } from '@/lib/logger'
import { subscriptionTierCache } from '@/lib/utils/cache'

export interface UserSubscription {
  tier: SubscriptionTier
  status: string
  storageQuotaGB: number
  concurrentLimit: number
  watermarkFree: boolean
  priorityQueue: boolean
  startDate: Date
  endDate: Date | null
}

/**
 * 사용자의 현재 구독 정보 조회
 * 구독 레코드가 없으면 FREE 플랜 반환
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId }
  })

  if (!subscription) {
    // 구독 레코드가 없으면 FREE 플랜 기본값
    return {
      tier: 'FREE',
      status: 'ACTIVE',
      storageQuotaGB: SUBSCRIPTION_TIERS.FREE.storageQuotaGB,
      concurrentLimit: SUBSCRIPTION_TIERS.FREE.concurrentLimit,
      watermarkFree: SUBSCRIPTION_TIERS.FREE.watermarkFree,
      priorityQueue: SUBSCRIPTION_TIERS.FREE.priorityQueue,
      startDate: new Date(),
      endDate: null,
    }
  }

  return {
    tier: subscription.tier as SubscriptionTier,
    status: subscription.status,
    storageQuotaGB: subscription.storageQuotaGB,
    concurrentLimit: subscription.concurrentLimit,
    watermarkFree: subscription.watermarkFree,
    priorityQueue: subscription.priorityQueue,
    startDate: subscription.startDate,
    endDate: subscription.endDate,
  }
}

/**
 * 사용자의 구독 티어 조회 (간단 버전)
 * [최적화] TTL 캐시 적용 (60초) - 동일 요청 내 중복 DB 조회 방지
 */
export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  // 캐시 확인
  const cached = subscriptionTierCache.get(userId)
  if (cached !== undefined) return cached

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { tier: true, status: true, endDate: true }
  })

  // 구독이 없거나 만료됨
  let tier: SubscriptionTier = 'FREE'
  if (subscription && subscription.status === 'ACTIVE') {
    if (!subscription.endDate || subscription.endDate >= new Date()) {
      tier = subscription.tier as SubscriptionTier
    }
  }

  // 캐시 저장
  subscriptionTierCache.set(userId, tier)
  return tier
}

/**
 * 구독 티어 캐시 무효화 (구독 변경 시 호출)
 */
export function invalidateUserTierCache(userId: string): void {
  subscriptionTierCache.invalidate(userId)
}

/**
 * 사용자의 동시 생성 제한 수 조회
 */
export async function getConcurrentLimit(userId: string): Promise<number> {
  const tier = await getUserTier(userId)
  return SUBSCRIPTION_TIERS[tier].concurrentLimit
}

/**
 * 사용자가 워터마크 제거 권한이 있는지 확인 (구독 티어 기준)
 */
export async function hasWatermarkFree(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId)
  return SUBSCRIPTION_TIERS[tier].watermarkFree
}

/**
 * 워터마크 적용 여부 결정 (옵션 2: 크레딧 종류 기반)
 *
 * 워터마크 적용 조건:
 * - FREE 플랜 AND 구매 크레딧이 없음 (무료 크레딧만 보유)
 *
 * 워터마크 미적용 조건:
 * - PLUS/PRO/BUSINESS 구독자
 * - FREE 플랜이지만 구매 크레딧 보유 중
 *
 * @returns true = 워터마크 적용, false = 워터마크 미적용
 */
export async function shouldApplyWatermark(userId: string): Promise<boolean> {
  // 1. 구독 티어 확인 - 유료 구독자는 항상 워터마크 없음
  const tier = await getUserTier(userId)
  if (SUBSCRIPTION_TIERS[tier].watermarkFree) {
    return false // 워터마크 미적용
  }

  // 2. FREE 플랜인 경우 - 구매 크레딧 보유 여부 확인
  // 동적 import로 순환 의존성 방지
  const { hasPurchasedCredits } = await import('./creditManager')
  const hasPurchased = await hasPurchasedCredits(userId)

  if (hasPurchased) {
    return false // 구매 크레딧 있음 → 워터마크 미적용
  }

  // 3. FREE 플랜 + 무료 크레딧만 보유 → 워터마크 적용
  return true
}

/**
 * 사용자가 우선 처리 권한이 있는지 확인
 */
export async function hasPriorityQueue(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId)
  return SUBSCRIPTION_TIERS[tier].priorityQueue
}

/**
 * 구독 생성 또는 업그레이드
 * (결제 완료 후 호출)
 */
export async function createOrUpgradeSubscription(
  userId: string,
  tier: SubscriptionTier,
  durationMonths: number = 1,
  paymentProvider?: string,
  externalId?: string
): Promise<UserSubscription> {
  const tierConfig = SUBSCRIPTION_TIERS[tier]
  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + durationMonths)

  const subscription = await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      tier,
      status: 'ACTIVE',
      storageQuotaGB: tierConfig.storageQuotaGB,
      concurrentLimit: tierConfig.concurrentLimit,
      watermarkFree: tierConfig.watermarkFree,
      priorityQueue: tierConfig.priorityQueue,
      startDate: new Date(),
      endDate: tier === 'FREE' ? null : endDate,
      paymentProvider,
      externalId,
    },
    update: {
      tier,
      status: 'ACTIVE',
      storageQuotaGB: tierConfig.storageQuotaGB,
      concurrentLimit: tierConfig.concurrentLimit,
      watermarkFree: tierConfig.watermarkFree,
      priorityQueue: tierConfig.priorityQueue,
      endDate: tier === 'FREE' ? null : endDate,
      paymentProvider,
      externalId,
      cancelledAt: null, // 재활성화 시 취소 기록 제거
    },
  })

  logger.info('Subscription created/updated', {
    module: 'Subscription',
    userId,
    tier,
    endDate: subscription.endDate
  })

  return {
    tier: subscription.tier as SubscriptionTier,
    status: subscription.status,
    storageQuotaGB: subscription.storageQuotaGB,
    concurrentLimit: subscription.concurrentLimit,
    watermarkFree: subscription.watermarkFree,
    priorityQueue: subscription.priorityQueue,
    startDate: subscription.startDate,
    endDate: subscription.endDate,
  }
}

/**
 * 구독 취소
 */
export async function cancelSubscription(userId: string): Promise<void> {
  await prisma.subscription.update({
    where: { userId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    }
  })

  logger.info('Subscription cancelled', { module: 'Subscription', userId })
}

/**
 * 구독 다운그레이드 (FREE로)
 * 만료 시 자동 호출
 */
export async function downgradeToFree(userId: string): Promise<void> {
  const freeConfig = SUBSCRIPTION_TIERS.FREE

  await prisma.subscription.update({
    where: { userId },
    data: {
      tier: 'FREE',
      status: 'ACTIVE',
      storageQuotaGB: freeConfig.storageQuotaGB,
      concurrentLimit: freeConfig.concurrentLimit,
      watermarkFree: freeConfig.watermarkFree,
      priorityQueue: freeConfig.priorityQueue,
      endDate: null,
      paymentProvider: null,
      externalId: null,
    }
  })

  logger.info('Subscription downgraded to FREE', { module: 'Subscription', userId })
}

/**
 * 만료된 구독 처리 (Cron 작업에서 호출)
 */
export async function processExpiredSubscriptions(): Promise<number> {
  const now = new Date()

  const expiredSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      tier: { not: 'FREE' },
      endDate: { lt: now }
    }
  })

  for (const sub of expiredSubscriptions) {
    await downgradeToFree(sub.userId)
  }

  logger.info('Processed expired subscriptions', { module: 'Subscription', count: expiredSubscriptions.length })
  return expiredSubscriptions.length
}

/**
 * 구독 초기화 (신규 가입 시)
 */
export async function initializeSubscription(userId: string): Promise<void> {
  const existing = await prisma.subscription.findUnique({
    where: { userId }
  })

  if (!existing) {
    await prisma.subscription.create({
      data: {
        userId,
        tier: 'FREE',
        status: 'ACTIVE',
        storageQuotaGB: SUBSCRIPTION_TIERS.FREE.storageQuotaGB,
        concurrentLimit: SUBSCRIPTION_TIERS.FREE.concurrentLimit,
        watermarkFree: SUBSCRIPTION_TIERS.FREE.watermarkFree,
        priorityQueue: SUBSCRIPTION_TIERS.FREE.priorityQueue,
      }
    })
  }
}
