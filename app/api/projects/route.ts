/**
 * Image Projects API - CRUD with ReBAC
 * /api/projects
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { grantImageProjectOwnership, listAccessible } from '@/lib/permissions'

// POST /api/projects - 새 프로젝트 생성
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { title, mode, prompt, category, style, sourceImage, aspectRatio } = body

    // 1. 프로젝트 생성
    const project = await prisma.imageProject.create({
      data: {
        userId: session.user.id,
        title: title || `${mode} 프로젝트`,
        mode,
        prompt,
        category,
        style,
        sourceImage,
        aspectRatio: aspectRatio || '1:1',
        status: 'draft',
      },
    })

    // 2. Owner 권한 자동 부여
    await grantImageProjectOwnership(project.id, session.user.id)

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Project creation error:', error)
    return NextResponse.json({ error: '프로젝트 생성에 실패했습니다.' }, { status: 500 })
  }
}

// GET /api/projects - 내 프로젝트 + 공유받은 프로젝트 조회
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // ReBAC로 접근 가능한 프로젝트 ID 조회
    const accessibleIds = await listAccessible(
      session.user.id,
      'image_project',
      'viewer'
    )

    // 프로젝트 조회
    const projects = await prisma.imageProject.findMany({
      where: {
        id: { in: accessibleIds },
        deletedAt: null,
      },
      orderBy: { updatedAt: 'desc' },
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
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Projects fetch error:', error)
    return NextResponse.json({ error: '프로젝트 조회에 실패했습니다.' }, { status: 500 })
  }
}
