/**
 * 관리자 오류 내역 조회 API
 * GET /api/admin/errors
 *
 * 이미지 생성 실패 내역과 에러 메시지 제공
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAdmin } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { formatApiError } from '@/lib/errors'
import type { AdminError, AdminErrorsResponse } from '@/types/api'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // 관리자 권한 확인
    await requireAdmin(session?.user?.id)

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const mode = searchParams.get('mode') // 'CREATE', 'EDIT', etc.
    const dateFilter = searchParams.get('date') // 'today', 'week', 'month', or null for all

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)
    const monthStart = new Date(todayStart)
    monthStart.setMonth(monthStart.getMonth() - 1)

    // 필터 조건 구성 (실패만)
    const whereClause: {
      status: 'failed'
      mode?: string
      createdAt?: { gte: Date }
    } = {
      status: 'failed',
    }

    if (mode) {
      whereClause.mode = mode
    }

    // 날짜 필터
    if (dateFilter === 'today') {
      whereClause.createdAt = { gte: todayStart }
    } else if (dateFilter === 'week') {
      whereClause.createdAt = { gte: weekStart }
    } else if (dateFilter === 'month') {
      whereClause.createdAt = { gte: monthStart }
    }

    // 병렬 쿼리 실행
    const [errors, total, todayCount, weekCount, monthCount] = await Promise.all([
      // 오류 내역 조회
      prisma.generationHistory.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      }),

      // 전체 개수 (현재 필터 기준)
      prisma.generationHistory.count({
        where: whereClause,
      }),

      // 오늘 오류 수
      prisma.generationHistory.count({
        where: { status: 'failed', createdAt: { gte: todayStart } },
      }),

      // 이번 주 오류 수
      prisma.generationHistory.count({
        where: { status: 'failed', createdAt: { gte: weekStart } },
      }),

      // 이번 달 오류 수
      prisma.generationHistory.count({
        where: { status: 'failed', createdAt: { gte: monthStart } },
      }),
    ])

    // 응답 데이터 구성
    const adminErrors: AdminError[] = errors.map((err) => ({
      id: err.id,
      user: {
        id: err.user.id,
        name: err.user.name,
        email: err.user.email,
        image: err.user.image,
      },
      mode: err.mode,
      prompt: err.prompt,
      errorMessage: err.errorMessage,
      createdAt: err.createdAt.toISOString(),
    }))

    const response: AdminErrorsResponse = {
      success: true,
      errors: adminErrors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalToday: todayCount,
        totalThisWeek: weekCount,
        totalThisMonth: monthCount,
      },
    }

    // 캐시 헤더 추가 (30초)
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    const apiError = formatApiError(error)
    return NextResponse.json(
      { success: false, error: apiError.error },
      { status: apiError.statusCode }
    )
  }
}
