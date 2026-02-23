/**
 * 관리자 오류 내역 조회 API
 * GET /api/admin/errors
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/permissions/admin'
import { prisma } from '@/lib/db'
import { formatApiError } from '@/lib/errors'
import type { AdminError, AdminErrorsResponse } from '@/types/admin'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const mode = searchParams.get('mode')
    const dateFilter = searchParams.get('date')

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)
    const monthStart = new Date(todayStart)
    monthStart.setMonth(monthStart.getMonth() - 1)

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

    if (dateFilter === 'today') {
      whereClause.createdAt = { gte: todayStart }
    } else if (dateFilter === 'week') {
      whereClause.createdAt = { gte: weekStart }
    } else if (dateFilter === 'month') {
      whereClause.createdAt = { gte: monthStart }
    }

    const [errors, total, todayCount, weekCount, monthCount] = await Promise.all([
      prisma.generationHistory.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      }),
      prisma.generationHistory.count({
        where: whereClause,
      }),
      prisma.generationHistory.count({
        where: { status: 'failed', createdAt: { gte: todayStart } },
      }),
      prisma.generationHistory.count({
        where: { status: 'failed', createdAt: { gte: weekStart } },
      }),
      prisma.generationHistory.count({
        where: { status: 'failed', createdAt: { gte: monthStart } },
      }),
    ])

    const adminErrors: AdminError[] = errors.map((err) => ({
      id: err.id,
      user: {
        id: err.User.id,
        name: err.User.name,
        email: err.User.email,
        image: err.User.image,
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
