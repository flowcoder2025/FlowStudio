/**
 * 관리자 생성 내역 조회 API
 * GET /api/admin/generations
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/permissions/admin'
import { prisma } from '@/lib/db'
import { formatApiError } from '@/lib/errors'
import type { AdminGeneration, AdminGenerationsResponse } from '@/types/admin'

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
    const status = searchParams.get('status')
    const mode = searchParams.get('mode')
    const dateFilter = searchParams.get('date')

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)
    const monthStart = new Date(todayStart)
    monthStart.setMonth(monthStart.getMonth() - 1)

    const whereClause: {
      status?: string
      mode?: string
      createdAt?: { gte: Date }
    } = {}

    if (status === 'success' || status === 'failed') {
      whereClause.status = status
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

    const [generations, total, todaySummary] = await Promise.all([
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
      prisma.generationHistory.groupBy({
        by: ['status'],
        where: { createdAt: { gte: todayStart } },
        _count: true,
      }),
    ])

    // 프로젝트 ID로 이미지 조회
    const projectIds = generations
      .filter((g) => g.status === 'success' && g.projectId)
      .map((g) => g.projectId as string)

    const projects =
      projectIds.length > 0
        ? await prisma.imageProject.findMany({
            where: { id: { in: projectIds } },
            select: { id: true, resultImages: true },
          })
        : []

    const projectMap = new Map(projects.map((p) => [p.id, p.resultImages]))

    // projectId가 없는 생성 건에 대해 시간 근처 프로젝트 찾기
    const generationsWithoutProject = generations.filter(
      (g) => g.status === 'success' && !g.projectId
    )

    const userProjectsMap = new Map<string, Map<string, string[]>>()

    if (generationsWithoutProject.length > 0) {
      const userIds = [...new Set(generationsWithoutProject.map((g) => g.userId))]

      const minTime = new Date(
        Math.min(...generationsWithoutProject.map((g) => g.createdAt.getTime())) - 5 * 60 * 1000
      )
      const maxTime = new Date(
        Math.max(...generationsWithoutProject.map((g) => g.createdAt.getTime())) + 5 * 60 * 1000
      )

      const userProjects = await prisma.imageProject.findMany({
        where: {
          userId: { in: userIds },
          createdAt: { gte: minTime, lte: maxTime },
          resultImages: { isEmpty: false },
          deletedAt: null,
        },
        select: { id: true, userId: true, createdAt: true, resultImages: true },
        orderBy: { createdAt: 'desc' },
      })

      for (const project of userProjects) {
        if (!userProjectsMap.has(project.userId)) {
          userProjectsMap.set(project.userId, new Map())
        }
        const userMap = userProjectsMap.get(project.userId)!
        const timeKey = Math.floor(project.createdAt.getTime() / 60000).toString()
        if (!userMap.has(timeKey)) {
          userMap.set(timeKey, project.resultImages)
        }
      }
    }

    const findNearbyProjectImages = (userId: string, createdAt: Date): string[] => {
      const userMap = userProjectsMap.get(userId)
      if (!userMap) return []

      const targetTime = Math.floor(createdAt.getTime() / 60000)

      for (let offset = 0; offset <= 5; offset++) {
        const images = userMap.get((targetTime + offset).toString()) ||
                       userMap.get((targetTime - offset).toString())
        if (images && images.length > 0) return images
      }
      return []
    }

    const adminGenerations: AdminGeneration[] = generations.map((gen) => ({
      id: gen.id,
      user: {
        id: gen.User.id,
        name: gen.User.name,
        email: gen.User.email,
        image: gen.User.image,
      },
      mode: gen.mode,
      prompt: gen.prompt,
      category: gen.category,
      style: gen.style,
      imageCount: gen.imageCount,
      costUsd: Number(gen.costUsd),
      status: gen.status as 'success' | 'failed',
      errorMessage: gen.errorMessage,
      createdAt: gen.createdAt.toISOString(),
      projectImages: gen.projectId
        ? projectMap.get(gen.projectId) || []
        : findNearbyProjectImages(gen.userId, gen.createdAt),
    }))

    const successToday =
      todaySummary.find((s) => s.status === 'success')?._count || 0
    const failedToday =
      todaySummary.find((s) => s.status === 'failed')?._count || 0

    const response: AdminGenerationsResponse = {
      success: true,
      generations: adminGenerations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalToday: successToday + failedToday,
        successToday,
        failedToday,
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
