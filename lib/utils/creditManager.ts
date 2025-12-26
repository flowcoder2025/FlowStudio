/**
 * Credit Management System
 * 크레딧 시스템 관리 유틸리티
 *
 * 가격 정책:
 * - 1 크레딧 = ₩100
 * - 2K 이미지 4장 생성: 20 크레딧 (₩2,000)
 * - 추가 2장 생성: 10 크레딧 (₩1,000)
 * - 4K 업스케일링 (1장): 10 크레딧 (₩1,000)
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
  GENERATION_4: 20,   // 2K 이미지 4장 생성 = 20 크레딧
  GENERATION_2: 10,   // 추가 2장 생성 = 10 크레딧
  UPSCALE_4K: 10,     // 4K 업스케일링 1회 (1장) = 10 크레딧
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
 * 크레딧 종류
 */
export type CreditType = 'free' | 'purchased' | 'auto'

/**
 * 크레딧 잔액 상세 정보
 */
export interface CreditBalanceDetail {
  total: number      // 전체 잔액
  free: number       // 무료 크레딧 (BONUS + REFERRAL)
  purchased: number  // 유료 크레딧 (PURCHASE)
}

/**
 * 사용자의 크레딧 잔액 상세 조회 (무료/유료 구분)
 *
 * 무료 크레딧: BONUS, REFERRAL (remainingAmount로 추적)
 * 유료 크레딧: 총 잔액 - 무료 크레딧
 */
export async function getCreditBalanceDetail(userId: string): Promise<CreditBalanceDetail> {
  // 1. 총 잔액 조회
  const total = await getCreditBalance(userId)

  // 2. 무료 크레딧(BONUS, REFERRAL)의 남은 양 합계
  const freeCreditsResult = await prisma.creditTransaction.aggregate({
    where: {
      userId,
      type: { in: ['BONUS', 'REFERRAL'] },
      remainingAmount: { gt: 0 }
    },
    _sum: {
      remainingAmount: true
    }
  })

  const freeRaw = freeCreditsResult._sum.remainingAmount ?? 0

  // 3. 무료 크레딧 보정: remainingAmount 합계가 총 잔액을 초과할 수 없음
  // (이전 버전 deductCredits가 remainingAmount를 차감하지 않은 경우 불일치 발생)
  const free = Math.min(freeRaw, total)

  // 4. 유료 크레딧 = 총 잔액 - 무료 크레딧
  const purchased = Math.max(0, total - free)

  return { total, free, purchased }
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
 * 크레딧 종류 선택하여 차감 (워터마크 정책 지원)
 *
 * @param creditType - 'free' (무료 크레딧), 'purchased' (유료 크레딧), 'auto' (FIFO)
 * @returns 차감 결과 및 워터마크 적용 여부
 */
export async function deductCreditsWithType(
  userId: string,
  amount: number,
  type: 'GENERATION' | 'UPSCALE',
  description: string,
  creditType: CreditType = 'auto',
  metadata?: CreditTransactionMetadata
): Promise<{ balance: number; usedCreditType: 'free' | 'purchased'; applyWatermark: boolean }> {
  if (amount <= 0) {
    throw new ValidationError('사용 금액은 0보다 커야 합니다')
  }

  // 현재 잔액 상세 조회
  const balanceDetail = await getCreditBalanceDetail(userId)

  // 사용할 크레딧 종류 결정
  let usedCreditType: 'free' | 'purchased'
  let availableAmount: number

  if (creditType === 'free') {
    // 무료 크레딧만 사용
    availableAmount = balanceDetail.free
    usedCreditType = 'free'
    if (availableAmount < amount) {
      throw new InsufficientCreditsError(
        `무료 크레딧이 부족합니다 (필요: ${amount}, 보유: ${availableAmount})`
      )
    }
  } else if (creditType === 'purchased') {
    // 유료 크레딧만 사용
    availableAmount = balanceDetail.purchased
    usedCreditType = 'purchased'
    if (availableAmount < amount) {
      throw new InsufficientCreditsError(
        `유료 크레딧이 부족합니다 (필요: ${amount}, 보유: ${availableAmount})`
      )
    }
  } else {
    // auto: 기존 FIFO 방식 - 무료 크레딧 우선 소진
    availableAmount = balanceDetail.total
    usedCreditType = balanceDetail.free >= amount ? 'free' :
                     balanceDetail.purchased >= amount ? 'purchased' : 'free'
    if (availableAmount < amount) {
      throw new InsufficientCreditsError(
        `크레딧이 부족합니다 (필요: ${amount}, 보유: ${availableAmount})`
      )
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. 전체 잔액 차감
    const credit = await tx.credit.update({
      where: { userId },
      data: { balance: { decrement: amount } }
    })

    // 2. 무료 크레딧 사용 시 remainingAmount 차감 (FIFO)
    if (creditType === 'free' || (creditType === 'auto' && balanceDetail.free > 0)) {
      let remaining = creditType === 'free' ? amount : Math.min(amount, balanceDetail.free)

      // 가장 오래된 무료 크레딧부터 차감
      const freeTransactions = await tx.creditTransaction.findMany({
        where: {
          userId,
          type: { in: ['BONUS', 'REFERRAL'] },
          remainingAmount: { gt: 0 }
        },
        orderBy: { createdAt: 'asc' }
      })

      for (const txn of freeTransactions) {
        if (remaining <= 0) break
        const deductFromThis = Math.min(remaining, txn.remainingAmount ?? 0)
        await tx.creditTransaction.update({
          where: { id: txn.id },
          data: { remainingAmount: { decrement: deductFromThis } }
        })
        remaining -= deductFromThis
      }
    }

    // 3. 사용 트랜잭션 기록
    await tx.creditTransaction.create({
      data: {
        userId,
        amount: -amount,
        type,
        description,
        metadata: {
          ...metadata,
          creditType: usedCreditType, // 사용된 크레딧 종류 기록
        }
      }
    })

    return credit
  })

  return {
    balance: result.balance,
    usedCreditType,
    applyWatermark: usedCreditType === 'free' // 무료 크레딧 사용 시 워터마크 적용
  }
}

/**
 * 크레딧 확인 + 차감을 단일 원자적 트랜잭션으로 수행
 *
 * [성능 최적화] 기존 hasEnoughCredits + deductCredits 2회 쿼리 → 1회 통합
 * - 크레딧 확인과 차감을 WHERE 조건으로 원자적 수행
 * - 중복 쿼리 50% 감소
 *
 * @returns success: true + balance (성공) | success: false + balance + error (실패)
 */
export async function deductCreditsAtomic(
  userId: string,
  amount: number,
  type: 'GENERATION' | 'UPSCALE',
  description: string,
  metadata?: CreditTransactionMetadata
): Promise<{ success: boolean; balance: number; error?: string }> {
  if (amount <= 0) {
    throw new ValidationError('사용 금액은 0보다 커야 합니다')
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 잔액 확인 + 차감을 원자적으로 수행
      // balance >= amount 조건이 충족될 때만 업데이트됨
      const credit = await tx.credit.update({
        where: {
          userId,
          balance: { gte: amount } // 잔액이 충분할 때만 업데이트
        },
        data: { balance: { decrement: amount } }
      })

      // 트랜잭션 기록
      await tx.creditTransaction.create({
        data: {
          userId,
          amount: -amount,
          type,
          description,
          metadata: metadata || {}
        }
      })

      return credit
    })

    return { success: true, balance: result.balance }
  } catch (error) {
    // P2025: Record not found (잔액 부족으로 WHERE 조건 불충족)
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      const balance = await getCreditBalance(userId)
      return {
        success: false,
        balance,
        error: `크레딧이 부족합니다 (필요: ${amount}, 보유: ${balance})`
      }
    }
    throw error
  }
}

/**
 * 이미지 4장 생성 크레딧 차감 (처음 생성)
 */
export async function deductForGeneration(
  userId: string,
  projectId: string
): Promise<{ balance: number }> {
  return deductCredits(
    userId,
    CREDIT_PRICES.GENERATION_4,
    'GENERATION',
    '이미지 생성 (4장)',
    {
      projectId,
      imageCount: 4,
      resolution: '2K'
    }
  )
}

/**
 * 이미지 2장 추가 생성 크레딧 차감
 */
export async function deductForAdditionalGeneration(
  userId: string,
  projectId: string
): Promise<{ balance: number }> {
  return deductCredits(
    userId,
    CREDIT_PRICES.GENERATION_2,
    'GENERATION',
    '이미지 추가 생성 (2장)',
    {
      projectId,
      imageCount: 2,
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
  const amount = signupType === 'business' ? 100 : 30
  const description = signupType === 'business'
    ? '사업자 회원 가입 보너스 (100 크레딧)'
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
 * 관리자가 보너스 크레딧 지급
 * @param adminId - 지급하는 관리자 ID (감사 추적용)
 * @param userId - 대상 사용자 ID
 * @param amount - 지급 크레딧
 * @param description - 지급 사유
 * @param expiresInDays - 만료 기간 (null이면 무기한, 기본: 30일)
 */
export async function grantAdminBonus(
  adminId: string,
  userId: string,
  amount: number,
  description: string,
  expiresInDays: number | null = 30
): Promise<{
  transaction: {
    id: string
    userId: string
    amount: number
    description: string
    expiresAt: Date | null
  }
  newBalance: number
}> {
  if (amount <= 0) {
    throw new ValidationError('지급 금액은 0보다 커야 합니다')
  }

  // 만료 시간 계산 (null이면 무기한)
  const expiresAt = expiresInDays !== null
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null

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
    const transaction = await tx.creditTransaction.create({
      data: {
        userId,
        amount,
        remainingAmount: amount, // FIFO 차감 추적용
        type: 'BONUS',
        description,
        metadata: {
          type: 'admin_bonus',
          adminId,
          grantedAt: new Date().toISOString()
        },
        expiresAt
      }
    })

    return { credit, transaction }
  })

  return {
    transaction: {
      id: result.transaction.id,
      userId: result.transaction.userId,
      amount: result.transaction.amount,
      description: result.transaction.description || '',
      expiresAt: result.transaction.expiresAt
    },
    newBalance: result.credit.balance
  }
}

/**
 * 사용자의 구매 크레딧 잔액 조회
 *
 * 계산 공식:
 * 총 잔액 - 무료 크레딧 남은 양 = 구매 크레딧 잔액
 *
 * 무료 크레딧: BONUS, REFERRAL (remainingAmount로 추적)
 * 구매 크레딧: PURCHASE (remainingAmount 없음)
 */
export async function getPurchasedCreditsRemaining(userId: string): Promise<number> {
  // 1. 총 잔액 조회
  const totalBalance = await getCreditBalance(userId)

  // 2. 무료 크레딧(BONUS, REFERRAL)의 남은 양 합계
  const freeCreditsResult = await prisma.creditTransaction.aggregate({
    where: {
      userId,
      type: { in: ['BONUS', 'REFERRAL'] },
      remainingAmount: { gt: 0 }
    },
    _sum: {
      remainingAmount: true
    }
  })

  const freeCreditsRemaining = freeCreditsResult._sum.remainingAmount ?? 0

  // 3. 구매 크레딧 잔액 = 총 잔액 - 무료 크레딧 잔액
  const purchasedCreditsRemaining = Math.max(0, totalBalance - freeCreditsRemaining)

  return purchasedCreditsRemaining
}

/**
 * 사용자가 구매 크레딧을 보유하고 있는지 확인
 * (워터마크 적용 여부 판단에 사용)
 */
export async function hasPurchasedCredits(userId: string): Promise<boolean> {
  const purchasedRemaining = await getPurchasedCreditsRemaining(userId)
  return purchasedRemaining > 0
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
