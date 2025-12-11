/**
 * 만료된 무료 크레딧 처리 Cron API
 * /api/cron/expire-credits
 *
 * Vercel Cron Jobs 또는 외부 스케줄러에서 매일 호출
 *
 * 설정 예시 (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/expire-credits",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 *
 * 보안: CRON_SECRET 환경변수로 인증
 */

import { NextRequest, NextResponse } from 'next/server'
import { processExpiredCredits } from '@/lib/utils/creditManager'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 최대 5분

export async function GET(request: NextRequest) {
  try {
    // Vercel Cron 인증 확인
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // CRON_SECRET이 설정된 경우에만 인증 검사
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Cron] Unauthorized access attempt to expire-credits')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Cron] Starting expired credits processing...')
    const startTime = Date.now()

    const result = await processExpiredCredits()

    const duration = Date.now() - startTime
    console.log(`[Cron] Expired credits processing completed in ${duration}ms:`, result)

    return NextResponse.json({
      success: true,
      message: '만료된 크레딧 처리 완료',
      data: {
        processedUsers: result.processedUsers,
        totalExpired: result.totalExpired,
        durationMs: duration
      }
    })
  } catch (error) {
    console.error('[Cron] Failed to process expired credits:', error)
    return NextResponse.json(
      {
        success: false,
        error: '만료 크레딧 처리 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
