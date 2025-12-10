/**
 * 크레딧 사용 내역 조회 API
 * GET /api/credits/history
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCreditTransactions, CreditTransactionType } from '@/lib/utils/creditManager'
import { UnauthorizedError, formatApiError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new UnauthorizedError('로그인이 필요합니다')
    }

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const typeParam = searchParams.get('type')

    // 크레딧 트랜잭션 조회
    const result = await getCreditTransactions(session.user.id, {
      limit,
      offset,
      ...(typeParam && { type: typeParam as CreditTransactionType })
    })

    return NextResponse.json({
      success: true,
      ...result
    })

  } catch (error) {
    const apiError = formatApiError(error)
    return NextResponse.json(
      { success: false, error: apiError.error },
      { status: apiError.statusCode }
    )
  }
}
