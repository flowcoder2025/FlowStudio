/**
 * Credit Management System
 * 크레딧 시스템 관리 유틸리티
 *
 * 가격 정책:
 * - 1 크레딧 = ₩100
 * - 2K 생성 (4장): 20 크레딧 (₩2,000)
 * - 업스케일링 (2K→4K, 1장): 10 크레딧 (₩1,000)
 */

import { prisma } from '@/lib/prisma'
import { ValidationError, InsufficientCreditsError } from '@/lib/errors'

// Prisma 트랜잭션 클라이언트 타입
type PrismaTransactionClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

// 크레딧 가격 상수
export const CREDIT_PRICES = {
  GENERATION_2K: 20,  // 2K 생성 1회 (4장) = 20 크레딧
  UPSCALE_4K: 10,     // 업스케일링 1회 (1장) = 10 크레딧
} as const

// 무료 크레딧 만료 기간 (일)
export const FREE_CREDIT_EXPIRY_DAYS = 30

// 트랜잭션 타입
export type CreditTransactionType =
  | 'PURCHASE'      // 유료 충전
  | 'BONUS'         // 가입 보너스 (일반 30, 사업자 150)
  | 'REFERRAL'      // 레퍼럴 보상 (40 크레딧)
  | 'GENERATION'    // 2K 이미지 생성 사용
  | 'UPSCALE'       // 4K 업스케일링 사용
  | 'EXPIRED'       // 만료된 무료 크레딧 차감

interface CreditTransactionMetadata {
  // PURCHASE
  packageId?: string
  paymentId?: string
  paymentProvider?: string
  pgProvider?: string

  // BONUS
  signupType?: 'general' | 'business'
  type?: string
  businessNumber?: string

  // REFERRAL
  referrerId?: string
  refereeId?: string
  referralId?: string
  referredUserId?: string
  trigger?: string

  // GENERATION / UPSCALE
  projectId?: string
  imageCount?: number
  resolution?: '2K' | '4K'

  // Index signature for Prisma JSON compatibility
  [key: string]: string | number | boolean | undefined
}

/**
 * 사용자의 크레딧 잔액 조회
 */
export async function getCreditBalance(userId: string): Promise<number> {
  const credit = await prisma.credit.findUnique({
    where: { userId },
    select: { balance: true }
  })

  return credit?.balance ?? 0
}

/**
 * 크레딧 잔액이 충분한지 확인
 */
export async function hasEnoughCredits(
  userId: string,
  requiredCredits: number
): Promise<boolean> {
  const balance = await getCreditBalance(userId)
  return balance >= requiredCredits
}

/**
 * 크레딧 추가 (충전, 보너스, 레퍼럴)
 * @param expiresAt - 만료 시간 (무료 크레딧만 해당, 유료는 null)
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: 'PURCHASE' | 'BONUS' | 'REFERRAL',
  description: string,
  metadata?: CreditTransactionMetadata,
  expiresAt?: Date | null
): Promise<{ balance: number }> {
  if (amount <= 0) {
    throw new ValidationError('충전 금액은 0보다 커야 합니다')
  }

  // 무료 크레딧 (BONUS, REFERRAL)은 remainingAmount 추적
  const trackRemaining = type === 'BONUS' || type === 'REFERRAL'

  const result = await prisma.$transaction(async (tx) => {
    // Credit 레코드가 없으면 생성
    const credit = await tx.credit.upsert({
      where: { userId },
      create: {
        userId,
        balance: amount
      },
      update: {
        balance: { increment: amount }
      }
    })

    // 트랜잭션 기록
    await tx.creditTransaction.create({
      data: {
        userId,
        amount,
        remainingAmount: trackRemaining ? amount : null,
        type,
        description,
        metadata: metadata || {},
        expiresAt: expiresAt ?? null
      }
    })

    return credit
  })

  return { balance: result.balance }
}

/**
 * 크레딧 추가 (트랜잭션 클라이언트 전달 버전)
 * 외부 트랜잭션 내에서 사용할 때 호출
 */
export async function addCreditsWithTx(
  tx: PrismaTransactionClient,
  userId: string,
  amount: number,
  type: 'PURCHASE' | 'BONUS' | 'REFERRAL',
  description: string,
  metadata?: CreditTransactionMetadata
): Promise<{ balance: number }> {
  if (amount <= 0) {
    throw new ValidationError('충전 금액은 0보다 커야 합니다')
  }

  // Credit 레코드가 없으면 생성
  const credit = await tx.credit.upsert({
    where: { userId },
    create: {
      userId,
      balance: amount
    },
    update: {
      balance: { increment: amount }
    }
  })

  // 트랜잭션 기록
  await tx.creditTransaction.create({
    data: {
      userId,
      amount,
      type,
      description,
      metadata: metadata || {}
    }
  })

  return { balance: credit.balance }
}

/**
 * 크레딧 사용 (이미지 생성, 업스케일링)
 */
export async function deductCredits(
  userId: string,
  amount: number,
  type: 'GENERATION' | 'UPSCALE',
  description: string,
  metadata?: CreditTransactionMetadata
): Promise<{ balance: number }> {
  if (amount <= 0) {
    throw new ValidationError('사용 금액은 0보다 커야 합니다')
  }

  // 잔액 확인
  const hasEnough = await hasEnoughCredits(userId, amount)
  if (!hasEnough) {
    const currentBalance = await getCreditBalance(userId)
    throw new InsufficientCreditsError(
      `크레딧이 부족합니다 (필요: ${amount}, 보유: ${currentBalance})`
    )
  }

  const result = await prisma.$transaction(async (tx) => {
    // 크레딧 차감
    const credit = await tx.credit.update({
      where: { userId },
      data: { balance: { decrement: amount } }
    })

    // 트랜잭션 기록 (음수로 저장)
    await tx.creditTransaction.create({
      data: {
        userId,
        amount: -amount,  // 사용은 음수로 기록
        type,
        description,
        metadata: metadata || {}
      }
    })

    return credit
  })

  return { balance: result.balance }
}

/**
 * 2K 이미지 생성 크레딧 차감
 */
export async function deductForGeneration(
  userId: string,
  projectId: string
): Promise<{ balance: number }> {
  return deductCredits(
    userId,
    CREDIT_PRICES.GENERATION_2K,
    'GENERATION',
    '2K 이미지 생성 (4장)',
    {
      projectId,
      imageCount: 4,
      resolution: '2K'
    }
  )
}

/**
 * 4K 업스케일링 크레딧 차감
 */
export async function deductForUpscale(
  userId: string,
  projectId: string
): Promise<{ balance: number }> {
  return deductCredits(
    userId,
    CREDIT_PRICES.UPSCALE_4K,
    'UPSCALE',
    '4K 업스케일링 (1장)',
    {
      projectId,
      imageCount: 1,
      resolution: '4K'
    }
  )
}

/**
 * 가입 보너스 크레딧 지급 (30일 후 만료)
 */
export async function grantSignupBonus(
  userId: string,
  signupType: 'general' | 'business'
): Promise<{ balance: number }> {
  const amount = signupType === 'business' ? 150 : 30
  const description = signupType === 'business'
    ? '사업자 회원 가입 보너스 (150 크레딧)'
    : '일반 회원 가입 보너스 (30 크레딧)'

  // 30일 후 만료
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + FREE_CREDIT_EXPIRY_DAYS)

  return addCredits(userId, amount, 'BONUS', description, { signupType }, expiresAt)
}

/**
 * 레퍼럴 보상 지급 (30일 후 만료)
 */
export async function grantReferralReward(
  referrerId: string,
  refereeId: string
): Promise<{ referrerBalance: number; refereeBalance: number }> {
  const REFERRAL_AMOUNT = 40

  // 30일 후 만료
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + FREE_CREDIT_EXPIRY_DAYS)

  const [referrer, referee] = await Promise.all([
    addCredits(
      referrerId,
      REFERRAL_AMOUNT,
      'REFERRAL',
      '친구 추천 보상 (40 크레딧)',
      { referrerId, refereeId },
      expiresAt
    ),
    addCredits(
      refereeId,
      REFERRAL_AMOUNT,
      'REFERRAL',
      '추천인 가입 보상 (40 크레딧)',
      { referrerId, refereeId },
      expiresAt
    )
  ])

  return {
    referrerBalance: referrer.balance,
    refereeBalance: referee.balance
  }
}

/**
 * 크레딧 트랜잭션 히스토리 조회
 */
export async function getCreditTransactions(
  userId: string,
  options?: {
    limit?: number
    offset?: number
    type?: CreditTransactionType
  }
) {
  const { limit = 50, offset = 0, type } = options ?? {}

  const transactions = await prisma.creditTransaction.findMany({
    where: {
      userId,
      ...(type && { type })
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset
  })

  const total = await prisma.creditTransaction.count({
    where: {
      userId,
      ...(type && { type })
    }
  })

  return {
    transactions,
    total,
    hasMore: total > offset + transactions.length
  }
}

/**
 * 크레딧 사용 통계 조회
 */
export async function getCreditStats(userId: string) {
  const [balance, transactions] = await Promise.all([
    getCreditBalance(userId),
    prisma.creditTransaction.findMany({
      where: { userId },
      select: { amount: true, type: true }
    })
  ])

  const stats = transactions.reduce((acc, t) => {
    if (t.amount > 0) {
      acc.totalAdded += t.amount
      if (t.type === 'PURCHASE') acc.totalPurchased += t.amount
      if (t.type === 'BONUS') acc.totalBonus += t.amount
      if (t.type === 'REFERRAL') acc.totalReferral += t.amount
    } else {
      acc.totalUsed += Math.abs(t.amount)
      if (t.type === 'GENERATION') acc.totalGeneration += Math.abs(t.amount)
      if (t.type === 'UPSCALE') acc.totalUpscale += Math.abs(t.amount)
    }
    return acc
  }, {
    balance,
    totalAdded: 0,
    totalUsed: 0,
    totalPurchased: 0,
    totalBonus: 0,
    totalReferral: 0,
    totalGeneration: 0,
    totalUpscale: 0
  })

  return stats
}

/**
 * 초기 크레딧 레코드 생성 (신규 회원)
 */
export async function initializeCredit(userId: string): Promise<void> {
  await prisma.credit.upsert({
    where: { userId },
    create: { userId, balance: 0 },
    update: {} // 이미 있으면 아무것도 하지 않음
  })
}

/**
 * 만료된 무료 크레딧 처리
 * - 만료된 트랜잭션의 remainingAmount를 찾아 차감
 * - EXPIRED 트랜잭션 기록 생성
 *
 * @returns 처리된 사용자 수와 총 만료 크레딧
 */
export async function processExpiredCredits(): Promise<{
  processedUsers: number
  totalExpired: number
}> {
  const now = new Date()

  // 만료된 크레딧이 있는 트랜잭션 조회
  const expiredTransactions = await prisma.creditTransaction.findMany({
    where: {
      expiresAt: { lte: now },
      remainingAmount: { gt: 0 },
      type: { in: ['BONUS', 'REFERRAL'] }
    },
    orderBy: { createdAt: 'asc' }
  })

  if (expiredTransactions.length === 0) {
    return { processedUsers: 0, totalExpired: 0 }
  }

  // 사용자별로 그룹화
  const userExpiredMap = new Map<string, { transactionIds: string[]; totalAmount: number }>()
  for (const tx of expiredTransactions) {
    const existing = userExpiredMap.get(tx.userId) || { transactionIds: [], totalAmount: 0 }
    existing.transactionIds.push(tx.id)
    existing.totalAmount += tx.remainingAmount ?? 0
    userExpiredMap.set(tx.userId, existing)
  }

  let processedUsers = 0
  let totalExpired = 0

  // 각 사용자별로 만료 처리
  for (const [userId, { transactionIds, totalAmount }] of userExpiredMap) {
    try {
      await prisma.$transaction(async (tx) => {
        // 1. 만료된 트랜잭션들의 remainingAmount를 0으로 설정
        await tx.creditTransaction.updateMany({
          where: { id: { in: transactionIds } },
          data: { remainingAmount: 0 }
        })

        // 2. 사용자 크레딧 잔액 차감
        await tx.credit.update({
          where: { userId },
          data: { balance: { decrement: totalAmount } }
        })

        // 3. EXPIRED 트랜잭션 기록 생성
        await tx.creditTransaction.create({
          data: {
            userId,
            amount: -totalAmount,
            type: 'EXPIRED',
            description: `무료 크레딧 만료 (${totalAmount} 크레딧)`,
            metadata: {
              expiredTransactionIds: transactionIds,
              expiredAt: now.toISOString()
            }
          }
        })
      })

      processedUsers++
      totalExpired += totalAmount
      console.log(`[CreditManager] Expired ${totalAmount} credits for user ${userId}`)
    } catch (error) {
      console.error(`[CreditManager] Failed to process expired credits for user ${userId}:`, error)
    }
  }

  return { processedUsers, totalExpired }
}

/**
 * 사용자의 만료 예정 크레딧 조회
 */
export async function getExpiringCredits(userId: string): Promise<{
  expiringWithin7Days: number
  expiringWithin30Days: number
  transactions: Array<{
    id: string
    amount: number
    remainingAmount: number
    expiresAt: Date
    type: string
  }>
}> {
  const now = new Date()
  const in7Days = new Date()
  in7Days.setDate(in7Days.getDate() + 7)
  const in30Days = new Date()
  in30Days.setDate(in30Days.getDate() + 30)

  const transactions = await prisma.creditTransaction.findMany({
    where: {
      userId,
      expiresAt: { gt: now },
      remainingAmount: { gt: 0 },
      type: { in: ['BONUS', 'REFERRAL'] }
    },
    select: {
      id: true,
      amount: true,
      remainingAmount: true,
      expiresAt: true,
      type: true
    },
    orderBy: { expiresAt: 'asc' }
  })

  let expiringWithin7Days = 0
  let expiringWithin30Days = 0

  for (const tx of transactions) {
    if (tx.expiresAt && tx.expiresAt <= in7Days) {
      expiringWithin7Days += tx.remainingAmount ?? 0
    }
    if (tx.expiresAt && tx.expiresAt <= in30Days) {
      expiringWithin30Days += tx.remainingAmount ?? 0
    }
  }

  return {
    expiringWithin7Days,
    expiringWithin30Days,
    transactions: transactions.map(tx => ({
      id: tx.id,
      amount: tx.amount,
      remainingAmount: tx.remainingAmount ?? 0,
      expiresAt: tx.expiresAt!,
      type: tx.type
    }))
  }
}
