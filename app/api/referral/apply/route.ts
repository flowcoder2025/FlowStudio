/**
 * 레퍼럴 코드 적용 API
 * POST /api/referral/apply
 *
 * 가입 후 추천 코드를 입력하여 추천 관계를 생성합니다.
 * - 이미 추천인이 있으면 에러
 * - 유효하지 않은 코드면 에러
 * - 자기 자신의 코드면 에러
 * - 이미 사업자 인증이 완료된 경우 즉시 크레딧 지급
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createReferral, getReferrerByCode, awardReferralCredits } from '@/lib/utils/referralManager'
import { prisma } from '@/lib/prisma'
import { UnauthorizedError, ValidationError, formatApiError } from '@/lib/errors'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new UnauthorizedError('로그인이 필요합니다')
    }

    const body = await request.json()
    const { referralCode } = body

    if (!referralCode || typeof referralCode !== 'string') {
      throw new ValidationError('추천 코드를 입력해주세요')
    }

    const code = referralCode.trim().toUpperCase()

    if (code.length !== 8) {
      throw new ValidationError('추천 코드는 8자리입니다')
    }

    // 이미 추천인이 있는지 확인 + 사업자 인증 상태 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { referredBy: true, referralCode: true, businessVerified: true }
    })

    if (user?.referredBy) {
      throw new ValidationError('이미 추천 코드를 사용했습니다')
    }

    // 자기 자신의 코드인지 확인
    if (user?.referralCode === code) {
      throw new ValidationError('자기 자신의 추천 코드는 사용할 수 없습니다')
    }

    // 추천 코드로 추천인 조회
    const referrer = await getReferrerByCode(code)

    if (!referrer) {
      throw new ValidationError('유효하지 않은 추천 코드입니다')
    }

    // 추천 관계 생성
    const referralId = await createReferral(session.user.id, code)

    // 이미 사업자 인증이 완료된 경우 즉시 크레딧 지급
    let creditsAwarded = false
    if (user?.businessVerified) {
      try {
        creditsAwarded = await awardReferralCredits(session.user.id)
        if (creditsAwarded) {
          logger.info('Referral credits awarded immediately', { module: 'ReferralApply', reason: 'already business verified' })
        }
      } catch (awardError) {
        logger.error('Referral credit award failed', { module: 'ReferralApply' }, awardError instanceof Error ? awardError : new Error(String(awardError)))
      }
    }

    const message = creditsAwarded
      ? '추천 코드가 적용되었습니다. 크레딧이 지급되었습니다!'
      : '추천 코드가 적용되었습니다. 사업자 인증을 완료하면 크레딧이 지급됩니다.'

    return NextResponse.json({
      success: true,
      data: {
        referralId,
        referrerName: referrer.name || referrer.email || '추천인',
        creditsAwarded,
        message
      }
    })

  } catch (error) {
    const apiError = formatApiError(error)
    return NextResponse.json(
      { success: false, error: apiError.error },
      { status: apiError.statusCode }
    )
  }
}
