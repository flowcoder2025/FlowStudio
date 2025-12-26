/**
 * Image Project Detail API - GET, PUT, DELETE with ReBAC
 * /api/projects/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { check } from '@/lib/permissions'
import { logger } from '@/lib/logger'

// GET /api/projects/[id] - 프로젝트 상세 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Viewer 권한 확인
    const canView = await check(session.user.id, 'image_project', id, 'viewer')

    if (!canView) {
      return NextResponse.json({ error: '프로젝트에 대한 권한이 없습니다.' }, { status: 403 })
    }

    const project = await prisma.imageProject.findUnique({
      where: { id },
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

    if (!project || project.deletedAt) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    logger.error('Project fetch error', { module: 'Projects' }, error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json({ error: '프로젝트 조회에 실패했습니다.' }, { status: 500 })
  }
}

// PUT /api/projects/[id] - 프로젝트 수정
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Editor 권한 확인
    const canEdit = await check(session.user.id, 'image_project', id, 'editor')

    if (!canEdit) {
      return NextResponse.json({ error: '편집 권한이 없습니다.' }, { status: 403 })
    }

    const body = await req.json()
    const { title, description, resultImages, status } = body

    const project = await prisma.imageProject.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(resultImages && { resultImages }),
        ...(status && { status }),
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    logger.error('Project update error', { module: 'Projects' }, error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json({ error: '프로젝트 수정에 실패했습니다.' }, { status: 500 })
  }
}

// DELETE /api/projects/[id] - 프로젝트 삭제 (Soft Delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Owner 권한 확인 (삭제는 소유자만 가능)
    const isOwner = await check(session.user.id, 'image_project', id, 'owner')

    if (!isOwner) {
      return NextResponse.json({ error: '프로젝트 소유자만 삭제할 수 있습니다.' }, { status: 403 })
    }

    // Soft Delete
    await prisma.imageProject.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Project delete error', { module: 'Projects' }, error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json({ error: '프로젝트 삭제에 실패했습니다.' }, { status: 500 })
  }
}
