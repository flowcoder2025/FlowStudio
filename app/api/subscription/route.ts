/**
 * 구독(Subscription) API
 * /api/subscription
 *
 * GET: 현재 사용자의 구독 정보 조회
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserSubscription } from '@/lib/utils/subscriptionManager'
import { SUBSCRIPTION_TIERS } from '@/lib/constants'
import { UnauthorizedError, formatApiError } from '@/lib/errors'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new UnauthorizedError('로그인이 필요합니다')
    }

    const subscription = await getUserSubscription(session.user.id)
    const tierConfig = SUBSCRIPTION_TIERS[subscription.tier]

    return NextResponse.json({
      success: true,
      data: {
        ...subscription,
        tierConfig: {
          name: tierConfig.name.ko,
          priceKRW: tierConfig.priceKRW,
          priceUSD: tierConfig.priceUSD,
          features: tierConfig.features.ko,
          historyDays: tierConfig.historyDays,
        }
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
