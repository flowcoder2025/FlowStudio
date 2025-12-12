/**
 * 만료 예정 크레딧 조회 API
 * /api/credits/expiring
 *
 * [성능 최적화] Next.js 캐싱 적용
 * - unstable_cache로 60초 캐싱 (만료 정보는 실시간성 덜 중요)
 * - 크레딧 변경 시 revalidateTag로 무효화
 *
 * GET: 사용자의 만료 예정 크레딧 정보 조회
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { unstable_cache } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { getExpiringCredits } from '@/lib/utils/creditManager'
import { UnauthorizedError, formatApiError } from '@/lib/errors'

// 캐시된 만료 예정 크레딧 조회 함수
const getCachedExpiringCredits = unstable_cache(
  async (userId: string) => {
    return getExpiringCredits(userId)
  },
  ['credit-expiring'],
  {
    revalidate: 60, // 60초 캐시 (만료 정보는 덜 급함)
    tags: ['credits']
  }
)

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new UnauthorizedError('로그인이 필요합니다')
    }

    // 캐시된 만료 예정 크레딧 조회
    const expiringCredits = await getCachedExpiringCredits(session.user.id)

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
