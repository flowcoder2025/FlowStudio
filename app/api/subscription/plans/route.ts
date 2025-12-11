/**
 * 구독 플랜 목록 API
 * /api/subscription/plans
 *
 * GET: 사용 가능한 모든 구독 플랜 조회
 */

import { NextResponse } from 'next/server'
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from '@/lib/constants'

export async function GET() {
  const plans = (Object.keys(SUBSCRIPTION_TIERS) as SubscriptionTier[]).map(tier => ({
    tier,
    ...SUBSCRIPTION_TIERS[tier],
  }))

  return NextResponse.json({
    success: true,
    data: plans
  })
}
