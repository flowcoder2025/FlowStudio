/**
 * User Images List API
 * /api/images/list
 *
 * Retrieves all generated images from user's projects
 * Supports filtering by mode and pagination
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiErrorResponse } from '@/lib/errors'
import { listAccessible } from '@/lib/permissions'

export interface UserImage {
  url: string
  projectId: string
  projectTitle: string
  mode: string
  createdAt: string
  index: number
  tags: string[]
  isUpscaled: boolean // 4K 업스케일된 이미지 여부 (URL 기반 판별)
}

export interface ImagesListResponse {
  images: UserImage[]
  total: number
}

// GET /api/images/list - 사용자의 모든 생성 이미지 조회
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const mode = searchParams.get('mode') // CREATE, EDIT, DETAIL_PAGE, DETAIL_EDIT
    const tag = searchParams.get('tag') // 단일 태그 필터
    const dateFrom = searchParams.get('dateFrom') // ISO 날짜 문자열
    const dateTo = searchParams.get('dateTo') // ISO 날짜 문자열
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // ReBAC로 접근 가능한 프로젝트 ID 조회
    let accessibleIds = await listAccessible(
      session.user.id,
      'image_project',
      'viewer'
    )

    // ReBAC 권한이 없는 경우 (기존 데이터 호환성) userId 기반으로 폴백
    // 사용자가 직접 생성한 모든 프로젝트를 조회
    if (accessibleIds.length === 0) {
      const userProjects = await prisma.imageProject.findMany({
        where: {
          userId: session.user.id,
          deletedAt: null,
        },
        select: { id: true },
      })
      accessibleIds = userProjects.map((p) => p.id)
    }

    // 프로젝트 조회 조건
    const whereClause: {
      id: { in: string[] }
      deletedAt: null
      resultImages: { isEmpty: boolean }
      mode?: string
      tags?: { has: string }
      createdAt?: { gte?: Date; lte?: Date }
    } = {
      id: { in: accessibleIds },
      deletedAt: null,
      resultImages: { isEmpty: false }, // 결과 이미지가 있는 프로젝트만
    }

    if (mode) {
      whereClause.mode = mode
    }

    if (tag) {
      whereClause.tags = { has: tag }
    }

    if (dateFrom || dateTo) {
      whereClause.createdAt = {}
      if (dateFrom) {
        whereClause.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        // dateTo는 해당 날짜의 끝까지 포함하도록 다음날 00:00:00으로 설정
        const endDate = new Date(dateTo)
        endDate.setDate(endDate.getDate() + 1)
        whereClause.createdAt.lte = endDate
      }
    }

    // 프로젝트 조회 (결과 이미지가 있는 것만)
    const projects = await prisma.imageProject.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        mode: true,
        resultImages: true,
        tags: true,
        createdAt: true,
      },
      take: limit,
      skip: offset,
    })

    // 이미지 목록 변환 (ImageProject)
    const images: UserImage[] = []

    for (const project of projects) {
      for (let i = 0; i < project.resultImages.length; i++) {
        const imageUrl = project.resultImages[i]
        images.push({
          url: imageUrl,
          projectId: project.id,
          projectTitle: project.title,
          mode: project.mode,
          createdAt: project.createdAt.toISOString(),
          index: i,
          tags: project.tags,
          isUpscaled: imageUrl.includes('/upscaled/'), // URL에 upscaled 경로 포함 시 4K
        })
      }
    }

    // DetailPageDraft 조회 (DETAIL_PAGE 모드이거나 전체 모드일 때만)
    if (!mode || mode === 'DETAIL_PAGE') {
      const detailPageDrafts = await prisma.detailPageDraft.findMany({
        where: {
          userId: session.user.id,
          detailPageSegments: { isEmpty: false },
          ...(dateFrom || dateTo
            ? {
                createdAt: {
                  ...(dateFrom && { gte: new Date(dateFrom) }),
                  ...(dateTo && {
                    lte: (() => {
                      const endDate = new Date(dateTo)
                      endDate.setDate(endDate.getDate() + 1)
                      return endDate
                    })(),
                  }),
                },
              }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          detailPageSegments: true,
          createdAt: true,
        },
        take: limit,
        skip: offset,
      })

      // DetailPageDraft를 UserImage 형식으로 변환
      for (const draft of detailPageDrafts) {
        for (let i = 0; i < draft.detailPageSegments.length; i++) {
          const segmentUrl = draft.detailPageSegments[i]
          images.push({
            url: segmentUrl,
            projectId: `draft_${draft.id}`,
            projectTitle: draft.title,
            mode: 'DETAIL_PAGE',
            createdAt: draft.createdAt.toISOString(),
            index: i,
            tags: [],
            isUpscaled: segmentUrl.includes('/upscaled/'), // URL에 upscaled 경로 포함 시 4K
          })
        }
      }

    }

    // 생성일 기준 정렬 (최신순)
    images.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // URL 기반 중복 제거 (ImageProject와 DetailPageDraft 간 중복 방지)
    const seenUrls = new Set<string>()
    const deduplicatedImages: UserImage[] = []
    for (const image of images) {
      if (!seenUrls.has(image.url)) {
        seenUrls.add(image.url)
        deduplicatedImages.push(image)
      }
    }

    const response: ImagesListResponse = {
      images: deduplicatedImages,
      total: deduplicatedImages.length, // 중복 제거 후 실제 개수 반환
    }

    return NextResponse.json(response)
  } catch (error) {
    return apiErrorResponse(error, { userId: session.user.id, operation: 'images-list' })
  }
}
