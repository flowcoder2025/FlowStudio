/**
 * Single Detail Page Draft API
 * /api/detail-page-drafts/[id]
 *
 * GET: Get single draft
 * PUT: Update draft
 * DELETE: Delete draft
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get single draft
export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const draft = await prisma.detailPageDraft.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!draft) {
      return NextResponse.json(
        { error: '초안을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ draft })
  } catch (error) {
    console.error('Failed to fetch draft:', error)
    return NextResponse.json(
      { error: '초안을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// PUT - Update draft
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Check ownership
    const existing = await prisma.detailPageDraft.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: '초안을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

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

    const draft = await prisma.detailPageDraft.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        selectedCategoryId:
          selectedCategoryId !== undefined
            ? selectedCategoryId
            : existing.selectedCategoryId,
        selectedStyleId:
          selectedStyleId !== undefined
            ? selectedStyleId
            : existing.selectedStyleId,
        selectedLayoutId:
          selectedLayoutId !== undefined
            ? selectedLayoutId
            : existing.selectedLayoutId,
        prompt: prompt !== undefined ? prompt : existing.prompt,
        uploadedImage:
          uploadedImage !== undefined ? uploadedImage : existing.uploadedImage,
        refImage: refImage !== undefined ? refImage : existing.refImage,
        detailPageSegments:
          detailPageSegments !== undefined
            ? detailPageSegments
            : existing.detailPageSegments,
      },
    })

    return NextResponse.json({ draft })
  } catch (error) {
    console.error('Failed to update draft:', error)
    return NextResponse.json(
      { error: '초안 업데이트에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE - Delete draft
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Check ownership
    const existing = await prisma.detailPageDraft.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: '초안을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    await prisma.detailPageDraft.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete draft:', error)
    return NextResponse.json(
      { error: '초안 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
