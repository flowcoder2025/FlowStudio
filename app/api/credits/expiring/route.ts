/**
 * 만료 예정 크레딧 조회 API
 * /api/credits/expiring
 *
 * GET: 사용자의 만료 예정 크레딧 정보 조회
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getExpiringCredits } from '@/lib/utils/creditManager'
import { UnauthorizedError, formatApiError } from '@/lib/errors'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new UnauthorizedError('로그인이 필요합니다')
    }

    const expiringCredits = await getExpiringCredits(session.user.id)

    return NextResponse.json({
      success: true,
      data: expiringCredits
    })
  } catch (error) {
    const apiError = formatApiError(error)
    return NextResponse.json(
      { success: false, error: apiError.error },
      { status: apiError.statusCode }
    )
  }
}
