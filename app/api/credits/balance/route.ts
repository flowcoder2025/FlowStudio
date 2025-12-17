/**
 * Credit Balance Detail API
 * /api/credits/balance
 *
 * 사용자의 크레딧 잔액 상세 정보를 반환합니다.
 * - 전체 잔액
 * - 무료 크레딧 (BONUS + REFERRAL)
 * - 유료 크레딧 (PURCHASE)
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCreditBalanceDetail } from '@/lib/utils/creditManager'
import { getUserTier } from '@/lib/utils/subscriptionManager'
import { SUBSCRIPTION_TIERS } from '@/lib/constants'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    // 크레딧 잔액 상세 조회
    const creditDetail = await getCreditBalanceDetail(session.user.id)

    // 구독 티어 확인 (워터마크 정책용)
    const tier = await getUserTier(session.user.id)
    const tierConfig = SUBSCRIPTION_TIERS[tier]

    return NextResponse.json({
      success: true,
      // 총 잔액 (호환성을 위해 balance와 total 모두 제공)
      balance: creditDetail.total,
      balanceKRW: creditDetail.total * 100, // 1 크레딧 = ₩100
      // 상세 잔액
      total: creditDetail.total,
      free: creditDetail.free,
      purchased: creditDetail.purchased,
      // 구독 정보
      tier,
      watermarkFree: tierConfig.watermarkFree,
      // 워터마크 적용 조건 안내
      watermarkPolicy: {
        // 유료 구독자는 항상 워터마크 없음
        isSubscriber: tierConfig.watermarkFree,
        // FREE 플랜이고 유료 크레딧이 있으면 워터마크 없이 사용 가능
        canUsePurchasedWithoutWatermark: !tierConfig.watermarkFree && creditDetail.purchased > 0,
        // FREE 플랜이고 무료 크레딧만 있으면 워터마크 적용
        freeCreditsHaveWatermark: !tierConfig.watermarkFree && creditDetail.free > 0,
      }
    })
  } catch (error) {
    console.error('[API /credits/balance] Error:', error)
    return NextResponse.json(
      { error: '크레딧 정보를 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
