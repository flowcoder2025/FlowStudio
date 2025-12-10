/**
 * 크레딧 잔액 조회 API
 * GET /api/credits/balance
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCreditBalance } from '@/lib/utils/creditManager'
import { UnauthorizedError, formatApiError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new UnauthorizedError('로그인이 필요합니다')
    }

    const balance = await getCreditBalance(session.user.id)

    return NextResponse.json({
      success: true,
      balance,
      balanceKRW: balance * 100 // 1 크레딧 = ₩100
    })

  } catch (error) {
    const apiError = formatApiError(error)
    return NextResponse.json(
      { success: false, error: apiError.error },
      { status: apiError.statusCode }
    )
  }
}
