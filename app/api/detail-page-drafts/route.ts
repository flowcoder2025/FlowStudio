/**
 * Detail Page Drafts API
 * /api/detail-page-drafts
 *
 * GET: List all drafts for current user
 * POST: Create new draft
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

// GET - List all drafts for current user
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const drafts = await prisma.detailPageDraft.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        selectedCategoryId: true,
        detailPageSegments: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ drafts })
  } catch (error) {
    logger.error('Failed to fetch drafts', { module: 'DetailPageDrafts' }, error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: '초안 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST - Create new draft
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      title,
      selectedCategoryId,
      selectedStyleId,
      selectedLayoutId,
      prompt,
      uploadedImage,
      refImage,
      detailPageSegments,
    } = body

    if (!title) {
      return NextResponse.json(
        { error: '초안 제목을 입력해주세요.' },
        { status: 400 }
      )
    }

    const draft = await prisma.detailPageDraft.create({
      data: {
        userId: session.user.id,
        title,
        selectedCategoryId,
        selectedStyleId,
        selectedLayoutId,
        prompt,
        uploadedImage,
        refImage,
        detailPageSegments: detailPageSegments || [],
      },
    })

    return NextResponse.json({ draft })
  } catch (error) {
    logger.error('Failed to create draft', { module: 'DetailPageDrafts' }, error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: '초안 저장에 실패했습니다.' },
      { status: 500 }
    )
  }
}
