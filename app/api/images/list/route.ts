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
import { listAccessible } from '@/lib/permissions'

export interface UserImage {
  url: string
  projectId: string
  projectTitle: string
  mode: string
  createdAt: string
  index: number
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
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // ReBAC로 접근 가능한 프로젝트 ID 조회
    const accessibleIds = await listAccessible(
      session.user.id,
      'image_project',
      'viewer'
    )

    // 프로젝트 조회 조건
    const whereClause: {
      id: { in: string[] }
      deletedAt: null
      resultImages: { isEmpty: boolean }
      mode?: string
    } = {
      id: { in: accessibleIds },
      deletedAt: null,
      resultImages: { isEmpty: false }, // 결과 이미지가 있는 프로젝트만
    }

    if (mode) {
      whereClause.mode = mode
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
        createdAt: true,
      },
      take: limit,
      skip: offset,
    })

    // 전체 개수 조회
    const totalProjects = await prisma.imageProject.count({
      where: whereClause,
    })

    // 이미지 목록 변환
    const images: UserImage[] = []

    for (const project of projects) {
      for (let i = 0; i < project.resultImages.length; i++) {
        images.push({
          url: project.resultImages[i],
          projectId: project.id,
          projectTitle: project.title,
          mode: project.mode,
          createdAt: project.createdAt.toISOString(),
          index: i,
        })
      }
    }

    const response: ImagesListResponse = {
      images,
      total: totalProjects,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Images list fetch error:', error)
    return NextResponse.json(
      { error: '이미지 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
