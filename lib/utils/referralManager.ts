/**
 * 레퍼럴(추천) 시스템 관리 유틸리티
 *
 * 추천 로직:
 * - 추천받은 가입자가 사업자 인증 완료 시
 * - 추천인과 가입자 각각 150 크레딧 지급
 */

import { prisma } from '@/lib/prisma'
import { addCreditsWithTx } from '@/lib/utils/creditManager'

// 레퍼럴 보너스 크레딧
export const REFERRAL_BONUS_CREDITS = 150

/**
 * 랜덤 추천 코드 생성 (8자리 영숫자)
 */
export function generateReferralCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return code
}

/**
 * 사용자에게 추천 코드 할당 (가입 시 자동 호출)
 * @param userId - 사용자 ID
 * @returns 생성된 추천 코드
 */
export async function assignReferralCode(userId: string): Promise<string> {
  // 이미 추천 코드가 있는지 확인
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true }
  })

  if (user?.referralCode) {
    return user.referralCode
  }

  // 고유한 추천 코드 생성 (최대 5회 재시도)
  let code = generateReferralCode()
  let attempts = 0

  while (attempts < 5) {
    const existing = await prisma.user.findUnique({
      where: { referralCode: code }
    })

    if (!existing) {
      break
    }

    code = generateReferralCode()
    attempts++
  }

  if (attempts >= 5) {
    throw new Error('추천 코드 생성 실패 (중복)')
  }

  // 추천 코드 저장
  await prisma.user.update({
    where: { id: userId },
    data: { referralCode: code }
  })

  return code
}

/**
 * 추천 관계 생성 (가입 시 추천 코드 입력)
 * @param referredUserId - 가입자 ID
 * @param referralCode - 입력된 추천 코드
 * @returns 추천 관계 ID
 */
export async function createReferral(
  referredUserId: string,
  referralCode: string
): Promise<string> {
  // 추천 코드로 추천인 찾기
  const referrer = await prisma.user.findUnique({
    where: { referralCode }
  })

  if (!referrer) {
    throw new Error('유효하지 않은 추천 코드입니다')
  }

  if (referrer.id === referredUserId) {
    throw new Error('자기 자신을 추천할 수 없습니다')
  }

  // 이미 추천 관계가 있는지 확인
  const existing = await prisma.referral.findFirst({
    where: {
      referrerId: referrer.id,
      referredId: referredUserId
    }
  })

  if (existing) {
    return existing.id
  }

  // 추천 관계 생성
  const referral = await prisma.referral.create({
    data: {
      referrerId: referrer.id,
      referredId: referredUserId,
      status: 'PENDING'
    }
  })

  // User 테이블에도 referredBy 저장
  await prisma.user.update({
    where: { id: referredUserId },
    data: { referredBy: referrer.id }
  })

  console.log('[Referral] Created:', {
    referralId: referral.id,
    referrer: referrer.id,
    referred: referredUserId
  })

  return referral.id
}

/**
 * 사업자 인증 완료 시 레퍼럴 크레딧 지급
 * @param referredUserId - 사업자 인증 완료한 가입자 ID
 * @returns 지급 성공 여부
 */
export async function awardReferralCredits(
  referredUserId: string
): Promise<boolean> {
  // 가입자가 추천받았는지 확인
  const referral = await prisma.referral.findFirst({
    where: {
      referredId: referredUserId,
      status: 'PENDING',
      creditsAwarded: false
    },
    include: {
      referrer: true,
      referred: true
    }
  })

  if (!referral) {
    console.log('[Referral] No pending referral found for user:', referredUserId)
    return false
  }

  try {
    // 단일 트랜잭션으로 양쪽 크레딧 지급 + 상태 업데이트 (원자성 보장)
    await prisma.$transaction(async (tx) => {
      // 추천인에게 150 크레딧 지급
      await addCreditsWithTx(
        tx,
        referral.referrerId,
        REFERRAL_BONUS_CREDITS,
        'REFERRAL',
        `추천 보너스 - ${referral.referred.name || referral.referred.email || '사용자'}님이 사업자 인증 완료`,
        {
          referralId: referral.id,
          referredUserId,
          trigger: 'business_verification'
        }
      )

      // 가입자에게 150 크레딧 지급
      await addCreditsWithTx(
        tx,
        referredUserId,
        REFERRAL_BONUS_CREDITS,
        'REFERRAL',
        `추천 보너스 - ${referral.referrer.name || referral.referrer.email || '추천인'}님의 추천으로 가입`,
        {
          referralId: referral.id,
          referrerId: referral.referrerId,
          trigger: 'business_verification'
        }
      )

      // Referral 상태 업데이트
      await tx.referral.update({
        where: { id: referral.id },
        data: {
          status: 'COMPLETED',
          creditsAwarded: true,
          awardedAt: new Date()
        }
      })
    })

    console.log('[Referral] Credits awarded:', {
      referralId: referral.id,
      referrer: referral.referrerId,
      referred: referredUserId,
      credits: REFERRAL_BONUS_CREDITS
    })

    return true
  } catch (error) {
    console.error('[Referral] Credit award failed:', error)
    throw error
  }
}

/**
 * 레퍼럴 통계 조회 (내가 추천한 사람들)
 * @param userId - 사용자 ID
 */
export async function getReferralStats(userId: string) {
  // 내가 추천한 사람들
  const referralsGiven = await prisma.referral.findMany({
    where: { referrerId: userId },
    include: {
      referred: {
        select: {
          id: true,
          name: true,
          email: true,
          businessVerified: true,
          createdAt: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // 통계 계산
  const totalReferrals = referralsGiven.length
  const completedReferrals = referralsGiven.filter(r => r.status === 'COMPLETED').length
  const pendingReferrals = referralsGiven.filter(r => r.status === 'PENDING').length
  const totalCreditsEarned = completedReferrals * REFERRAL_BONUS_CREDITS

  // 나를 추천한 사람
  const referredBy = await prisma.referral.findFirst({
    where: { referredId: userId },
    include: {
      referrer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })

  // 내 정보 조회 (추천 코드 + 사업자 인증 상태)
  const myInfo = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true, businessVerified: true, referredBy: true }
  })

  return {
    myReferralCode: myInfo?.referralCode || null,
    myBusinessVerified: myInfo?.businessVerified || false,
    hasReferrer: !!myInfo?.referredBy,
    totalReferrals,
    completedReferrals,
    pendingReferrals,
    totalCreditsEarned,
    referralsGiven,
    referredBy: referredBy ? {
      user: referredBy.referrer,
      status: referredBy.status,
      creditsAwarded: referredBy.creditsAwarded,
      awardedAt: referredBy.awardedAt
    } : null
  }
}

/**
 * 추천 코드로 추천인 조회
 * @param referralCode - 추천 코드
 */
export async function getReferrerByCode(referralCode: string) {
  return prisma.user.findUnique({
    where: { referralCode },
    select: {
      id: true,
      name: true,
      email: true,
      referralCode: true
    }
  })
}
