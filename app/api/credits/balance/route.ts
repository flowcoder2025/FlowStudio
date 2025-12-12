/**
 * 크레딧 잔액 조회 API
 * GET /api/credits/balance
 *
 * [성능 최적화] Next.js 캐싱 적용
 * - unstable_cache로 30초 캐싱
 * - 크레딧 변경 시 revalidateTag로 무효화
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { unstable_cache } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { getCreditBalance } from '@/lib/utils/creditManager'
import { UnauthorizedError, formatApiError } from '@/lib/errors'

// 캐시된 크레딧 잔액 조회 함수
const getCachedBalance = unstable_cache(
  async (userId: string) => {
    return getCreditBalance(userId)
  },
  ['credit-balance'],
  {
    revalidate: 30, // 30초 캐시
    tags: ['credits']
  }
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new UnauthorizedError('로그인이 필요합니다')
    }

    // 캐시된 잔액 조회
    const balance = await getCachedBalance(session.user.id)

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
