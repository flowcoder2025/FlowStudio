/**
 * 레퍼럴 통계 조회 API
 * GET /api/referral/stats
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getReferralStats } from '@/lib/utils/referralManager'
import { UnauthorizedError, formatApiError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new UnauthorizedError('로그인이 필요합니다')
    }

    // 레퍼럴 통계 조회
    const stats = await getReferralStats(session.user.id)

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    const apiError = formatApiError(error)
    return NextResponse.json(
      { success: false, error: apiError.error },
      { status: apiError.statusCode }
    )
  }
}
