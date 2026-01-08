/**
 * 구독 업그레이드 API
 * /api/subscription/upgrade
 *
 * POST: 구독 업그레이드 (결제 완료 후 호출)
 *
 * 참고: 실제 결제는 Paddle 웹훅에서 처리되어야 합니다.
 * 이 API는 테스트용 또는 관리자용으로 사용됩니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createOrUpgradeSubscription } from '@/lib/utils/subscriptionManager'
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from '@/lib/constants'
import { UnauthorizedError, ValidationError, formatApiError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new UnauthorizedError('로그인이 필요합니다')
    }

    const body = await request.json()
    const { tier, durationMonths = 1, paymentId } = body as {
      tier: SubscriptionTier
      durationMonths?: number
      paymentId?: string
    }

    // 유효한 티어인지 확인
    if (!tier || !SUBSCRIPTION_TIERS[tier]) {
      throw new ValidationError('유효하지 않은 구독 플랜입니다')
    }

    // FREE 티어로 업그레이드 요청은 다운그레이드로 처리
    if (tier === 'FREE') {
      throw new ValidationError('무료 플랜으로 변경은 구독 취소를 이용해주세요')
    }

    // 구독 생성/업그레이드
    const subscription = await createOrUpgradeSubscription(
      session.user.id,
      tier,
      durationMonths,
      paymentId ? 'PADDLE' : undefined,
      paymentId
    )

    return NextResponse.json({
      success: true,
      message: `${SUBSCRIPTION_TIERS[tier].name} 플랜으로 업그레이드되었습니다`,
      data: subscription
    })

  } catch (error) {
    const apiError = formatApiError(error)
    return NextResponse.json(
      { success: false, error: apiError.error },
      { status: apiError.statusCode }
    )
  }
}
