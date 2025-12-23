/**
 * 관리자 생성 내역 조회 API
 * GET /api/admin/generations
 *
 * 오늘 생성된 이미지 내역, 사용자 정보, 프로젝트 이미지 미리보기 제공
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAdmin } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { formatApiError } from '@/lib/errors'
import type { AdminGeneration, AdminGenerationsResponse } from '@/types/api'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // 관리자 권한 확인
    await requireAdmin(session?.user?.id)

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const status = searchParams.get('status') // 'success', 'failed', or null for all
    const mode = searchParams.get('mode') // 'CREATE', 'EDIT', etc.
    const dateFilter = searchParams.get('date') // 'today', 'week', 'month', or null for all

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)
    const monthStart = new Date(todayStart)
    monthStart.setMonth(monthStart.getMonth() - 1)

    // 필터 조건 구성
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

    // 날짜 필터
    if (dateFilter === 'today') {
      whereClause.createdAt = { gte: todayStart }
    } else if (dateFilter === 'week') {
      whereClause.createdAt = { gte: weekStart }
    } else if (dateFilter === 'month') {
      whereClause.createdAt = { gte: monthStart }
    }

    // 병렬 쿼리 실행
    const [generations, total, todaySummary] = await Promise.all([
      // 생성 내역 조회 (사용자 정보 포함)
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

      // 전체 개수
      prisma.generationHistory.count({
        where: whereClause,
      }),

      // 오늘 요약 통계
      prisma.generationHistory.groupBy({
        by: ['status'],
        where: { createdAt: { gte: todayStart } },
        _count: true,
      }),
    ])

    // 프로젝트 ID로 이미지 조회 (성공한 생성만)
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

    // projectId가 없는 생성 건에 대해, 해당 사용자의 비슷한 시간대 프로젝트 찾기
    const generationsWithoutProject = generations.filter(
      (g) => g.status === 'success' && !g.projectId
    )

    // 각 사용자별로 해당 시간 근처(±5분)의 프로젝트 조회
    const userProjectsMap = new Map<string, Map<string, string[]>>()

    if (generationsWithoutProject.length > 0) {
      // 고유한 userId들 추출
      const userIds = [...new Set(generationsWithoutProject.map((g) => g.userId))]

      // 시간 범위 계산 (모든 생성 건을 포함하는 범위)
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

      // 사용자별, 시간별로 프로젝트 매핑
      for (const project of userProjects) {
        if (!userProjectsMap.has(project.userId)) {
          userProjectsMap.set(project.userId, new Map())
        }
        const userMap = userProjectsMap.get(project.userId)!
        // 시간을 분 단위로 반올림하여 키로 사용
        const timeKey = Math.floor(project.createdAt.getTime() / 60000).toString()
        if (!userMap.has(timeKey)) {
          userMap.set(timeKey, project.resultImages)
        }
      }
    }

    // 시간 근처 프로젝트 이미지 찾기 헬퍼 함수
    const findNearbyProjectImages = (userId: string, createdAt: Date): string[] => {
      const userMap = userProjectsMap.get(userId)
      if (!userMap) return []

      const targetTime = Math.floor(createdAt.getTime() / 60000)

      // ±5분 범위 내에서 가장 가까운 프로젝트 찾기
      for (let offset = 0; offset <= 5; offset++) {
        const images = userMap.get((targetTime + offset).toString()) ||
                       userMap.get((targetTime - offset).toString())
        if (images && images.length > 0) return images
      }
      return []
    }

    // 응답 데이터 구성
    const adminGenerations: AdminGeneration[] = generations.map((gen) => ({
      id: gen.id,
      user: {
        id: gen.user.id,
        name: gen.user.name,
        email: gen.user.email,
        image: gen.user.image,
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

    // 오늘 요약 계산
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
