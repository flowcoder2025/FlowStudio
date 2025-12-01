/**
 * Image Save API - Selective Cloud Storage
 * /api/images/save
 *
 * Saves user-selected images to Supabase Storage.
 * This allows users to only save images they actually want,
 * reducing storage costs compared to auto-saving all generated images.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadMultipleImages } from '@/lib/utils/imageStorage'
import { isBase64DataUrl } from '@/lib/utils/imageConverter'
import { grantImageProjectOwnership } from '@/lib/permissions'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { images, projectId, mode, prompt, category, style, aspectRatio } = body

    // Validate images
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: '저장할 이미지를 제공해주세요.' },
        { status: 400 }
      )
    }

    // Validate all images are base64
    const base64Images: string[] = []
    for (const img of images) {
      if (typeof img !== 'string') {
        return NextResponse.json(
          { error: '유효하지 않은 이미지 형식입니다.' },
          { status: 400 }
        )
      }
      // Accept both base64 data URLs and raw base64
      if (isBase64DataUrl(img)) {
        base64Images.push(img)
      } else if (img.length > 100 && !img.includes(' ') && !img.startsWith('http')) {
        // Likely raw base64, add data URL prefix
        base64Images.push(`data:image/png;base64,${img}`)
      } else {
        return NextResponse.json(
          { error: 'base64 형식의 이미지만 저장 가능합니다. URL은 지원하지 않습니다.' },
          { status: 400 }
        )
      }
    }

    // Create or use existing project
    let finalProjectId = projectId

    if (!finalProjectId) {
      // Create new project for saved images
      const modeLabel = {
        CREATE: '이미지 생성',
        EDIT: '간편 편집',
        DETAIL_PAGE: '상세페이지',
        DETAIL_EDIT: '상세 편집',
      }[mode as string] || '이미지 저장'

      const newProject = await prisma.imageProject.create({
        data: {
          userId: session.user.id,
          title: `${modeLabel} - ${new Date().toLocaleDateString('ko-KR')}`,
          mode: mode || 'CREATE',
          prompt: prompt || '',
          category,
          style,
          aspectRatio: aspectRatio || '1:1',
          status: 'completed',
        },
      })

      // Grant ownership permission
      await grantImageProjectOwnership(newProject.id, session.user.id)
      finalProjectId = newProject.id
    }

    // Upload to Supabase Storage
    const storageUrls = await uploadMultipleImages(
      base64Images,
      session.user.id,
      `projects/${finalProjectId}`
    )

    // Update project with saved images
    const existingProject = await prisma.imageProject.findUnique({
      where: { id: finalProjectId },
      select: { resultImages: true },
    })

    const existingImages = existingProject?.resultImages || []
    const updatedImages = [...existingImages, ...storageUrls]

    await prisma.imageProject.update({
      where: { id: finalProjectId },
      data: {
        resultImages: updatedImages,
        status: 'completed',
      },
    })

    return NextResponse.json({
      success: true,
      urls: storageUrls,
      projectId: finalProjectId,
      message: `${storageUrls.length}개의 이미지가 클라우드에 저장되었습니다.`,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Image save error:', errorMessage)

    return NextResponse.json(
      { error: '이미지 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
