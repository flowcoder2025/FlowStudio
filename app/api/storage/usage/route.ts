/**
 * Storage 용량 조회 API
 * /api/storage/usage
 *
 * GET: 현재 사용자의 Storage 사용량 조회
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSupabaseClient, IMAGE_BUCKET } from '@/lib/supabase'
import { getUserSubscription } from '@/lib/utils/subscriptionManager'
import { UnauthorizedError, formatApiError } from '@/lib/errors'

interface StorageUsageResponse {
  usedBytes: number
  usedMB: number
  usedGB: number
  quotaGB: number
  quotaBytes: number
  usagePercent: number
  fileCount: number
}

/**
 * 사용자의 Storage 사용량을 계산
 * Supabase Storage에서 사용자 폴더의 모든 파일 크기를 합산
 */
async function calculateUserStorageUsage(userId: string): Promise<{ totalBytes: number; fileCount: number }> {
  const supabase = getSupabaseClient()
  let totalBytes = 0
  let fileCount = 0

  // 사용자의 이미지 폴더들을 검색 (images/{userId}, upscaled/{userId})
  const prefixes = ['images', 'upscaled']

  for (const prefix of prefixes) {
    const userPath = `${prefix}/${userId}`

    try {
      // 폴더 내 파일 목록 조회 (최대 1000개씩 페이지네이션)
      let offset = 0
      const limit = 1000
      let hasMore = true

      while (hasMore) {
        const { data: files, error } = await supabase.storage
          .from(IMAGE_BUCKET)
          .list(userPath, {
            limit,
            offset,
            sortBy: { column: 'created_at', order: 'desc' },
          })

        if (error) {
          // 폴더가 없거나 접근 권한 없음 - 무시
          console.log(`[Storage] No files in ${userPath}:`, error.message)
          break
        }

        if (!files || files.length === 0) {
          break
        }

        // 파일 크기 합산 (폴더는 제외)
        for (const file of files) {
          if (file.metadata && typeof file.metadata.size === 'number') {
            totalBytes += file.metadata.size
            fileCount++
          }
        }

        // 다음 페이지 확인
        if (files.length < limit) {
          hasMore = false
        } else {
          offset += limit
        }
      }
    } catch (err) {
      console.error(`[Storage] Error listing ${userPath}:`, err)
    }
  }

  return { totalBytes, fileCount }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new UnauthorizedError('로그인이 필요합니다')
    }

    const userId = session.user.id

    // 병렬로 사용량 계산 및 구독 정보 조회
    const [storageResult, subscription] = await Promise.all([
      calculateUserStorageUsage(userId),
      getUserSubscription(userId)
    ])

    const { totalBytes, fileCount } = storageResult
    const quotaGB = subscription.storageQuotaGB
    const quotaBytes = quotaGB * 1024 * 1024 * 1024 // GB → Bytes

    const usedMB = totalBytes / (1024 * 1024)
    const usedGB = totalBytes / (1024 * 1024 * 1024)
    const usagePercent = quotaBytes > 0 ? (totalBytes / quotaBytes) * 100 : 0

    const response: StorageUsageResponse = {
      usedBytes: totalBytes,
      usedMB: Math.round(usedMB * 100) / 100,  // 소수점 2자리
      usedGB: Math.round(usedGB * 100) / 100,
      quotaGB,
      quotaBytes,
      usagePercent: Math.round(usagePercent * 10) / 10, // 소수점 1자리
      fileCount,
    }

    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error) {
    const apiError = formatApiError(error)
    return NextResponse.json(
      { success: false, error: apiError.error },
      { status: apiError.statusCode }
    )
  }
}
