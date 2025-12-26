/**
 * 레퍼럴 크레딧 청구 API
 * POST /api/referral/claim
 *
 * 사업자 인증 완료 후 레퍼럴 크레딧을 수동으로 청구합니다.
 * (추천 코드를 먼저 적용하고 나중에 사업자 인증한 경우,
 *  또는 사업자 인증 후 추천 코드를 적용했는데 크레딧이 지급되지 않은 경우)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { awardReferralCredits } from '@/lib/utils/referralManager'
import { prisma } from '@/lib/prisma'
import { UnauthorizedError, ValidationError, formatApiError } from '@/lib/errors'

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new UnauthorizedError('로그인이 필요합니다')
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { businessVerified: true, referredBy: true }
    })

    if (!user?.businessVerified) {
      throw new ValidationError('사업자 인증을 먼저 완료해주세요')
    }

    if (!user?.referredBy) {
      throw new ValidationError('추천 코드를 적용한 내역이 없습니다')
    }

    // 이미 지급된 크레딧이 있는지 확인
    const existingReferral = await prisma.referral.findFirst({
      where: {
        referredId: session.user.id,
        creditsAwarded: true
      }
    })

    if (existingReferral) {
      return NextResponse.json({
        success: true,
        data: {
          alreadyAwarded: true,
          message: '이미 레퍼럴 크레딧이 지급되었습니다'
        }
      })
    }

    // 크레딧 지급 시도
    const awarded = await awardReferralCredits(session.user.id)

    if (awarded) {
      return NextResponse.json({
        success: true,
        data: {
          awarded: true,
          message: '레퍼럴 크레딧이 지급되었습니다! (각 50 크레딧)'
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: '지급할 레퍼럴 크레딧이 없습니다'
      }, { status: 400 })
    }

  } catch (error) {
    const apiError = formatApiError(error)
    return NextResponse.json(
      { success: false, error: apiError.error },
      { status: apiError.statusCode }
    )
  }
}
