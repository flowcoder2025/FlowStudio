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
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

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
 * 특정 경로의 Storage 파일 크기를 합산
 */
async function sumStoragePath(
  supabase: ReturnType<typeof getSupabaseClient>,
  path: string
): Promise<{ bytes: number; count: number }> {
  let totalBytes = 0
  let fileCount = 0
  let offset = 0
  const limit = 1000
  let hasMore = true

  while (hasMore) {
    const { data: files, error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .list(path, {
        limit,
        offset,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error) {
      // 폴더가 없거나 접근 권한 없음 - 무시
      logger.debug('No files in path', { module: 'Storage', path, message: error.message })
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

  return { bytes: totalBytes, count: fileCount }
}

/**
 * 사용자의 Storage 사용량을 계산
 * Supabase Storage에서 사용자 폴더의 모든 파일 크기를 합산
 *
 * 저장 경로 패턴:
 * 1. images/{userId}/ - 레거시 경로 (호환성 유지)
 * 2. upscaled/{userId}/ - 4K 업스케일된 이미지
 * 3. projects/{projectId}/{userId}/ - 프로젝트별 저장 이미지
 */
async function calculateUserStorageUsage(userId: string): Promise<{ totalBytes: number; fileCount: number }> {
  const supabase = getSupabaseClient()
  let totalBytes = 0
  let fileCount = 0

  // 1. 기존 경로 스캔: images/{userId}, upscaled/{userId}
  const basicPrefixes = ['images', 'upscaled']

  const basicPathPromises = basicPrefixes.map(async (prefix) => {
    const userPath = `${prefix}/${userId}`
    try {
      return await sumStoragePath(supabase, userPath)
    } catch (err) {
      logger.error('Error listing storage path', { module: 'Storage', path: userPath }, err instanceof Error ? err : new Error(String(err)))
      return { bytes: 0, count: 0 }
    }
  })

  // 2. 프로젝트별 경로 스캔: projects/{projectId}/{userId}
  // 사용자의 모든 프로젝트 ID 조회 (deletedAt이 없는 것만)
  const userProjects = await prisma.imageProject.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    select: { id: true },
  })

  const projectPathPromises = userProjects.map(async (project) => {
    const projectPath = `projects/${project.id}/${userId}`
    try {
      return await sumStoragePath(supabase, projectPath)
    } catch (err) {
      logger.error('Error listing project path', { module: 'Storage', path: projectPath }, err instanceof Error ? err : new Error(String(err)))
      return { bytes: 0, count: 0 }
    }
  })

  // 3. 모든 경로 병렬 스캔 및 합산
  const allResults = await Promise.all([...basicPathPromises, ...projectPathPromises])

  for (const result of allResults) {
    totalBytes += result.bytes
    fileCount += result.count
  }

  logger.info('Storage usage calculated', {
    module: 'Storage',
    userId,
    fileCount,
    sizeMB: (totalBytes / 1024 / 1024).toFixed(2),
    pathCount: basicPrefixes.length + userProjects.length
  })

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
