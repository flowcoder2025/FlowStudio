/**
 * 레퍼럴 코드 생성 API
 * POST /api/referral/code
 *
 * 사용자의 레퍼럴 코드가 없을 때 새로 생성합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { assignReferralCode } from '@/lib/utils/referralManager'
import { UnauthorizedError, formatApiError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new UnauthorizedError('로그인이 필요합니다')
    }

    // 레퍼럴 코드 생성 (이미 있으면 기존 코드 반환)
    const referralCode = await assignReferralCode(session.user.id)

    return NextResponse.json({
      success: true,
      data: { referralCode }
    })

  } catch (error) {
    const apiError = formatApiError(error)
    return NextResponse.json(
      { success: false, error: apiError.error },
      { status: apiError.statusCode }
    )
  }
}
