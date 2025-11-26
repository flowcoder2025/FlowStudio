/**
 * Image Generation API - Gemini Proxy with Supabase Storage Upload
 * /api/generate
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/utils/encryption'
import { uploadMultipleImages } from '@/lib/utils/imageStorage'
import { GoogleGenAI } from '@google/genai'

const PRO_MODEL = 'gemini-3-pro-image-preview'
const COST_PER_IMAGE_USD = 0.04

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. 사용자의 API 키 조회
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { userId: session.user.id },
    })

    if (!apiKeyRecord) {
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다. 프로필에서 API 키를 설정해주세요.' },
        { status: 400 }
      )
    }

    // 2. API 키 복호화
    const apiKey = decrypt(apiKeyRecord.encryptedKey)

    // 3. 요청 파싱
    const body = await req.json()
    const { projectId, prompt, sourceImage, refImage, category, style, aspectRatio, mode } = body

    if (!prompt) {
      return NextResponse.json({ error: '프롬프트를 입력해주세요.' }, { status: 400 })
    }

    // 4. 프롬프트 구성
    let finalPrompt = prompt

    if (category) {
      finalPrompt += ` Context: ${category}. `
    }

    if (style) {
      finalPrompt += ` Style: ${style}. `
    }

    // 5. Gemini API 초기화
    const ai = new GoogleGenAI({ apiKey })

    // 6. 이미지 생성 함수 (base64로 생성)
    const generateSingle = async () => {
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: finalPrompt }]

      // Source image 추가 (EDIT, DETAIL_EDIT 모드)
      if (sourceImage) {
        const base64Data = sourceImage.split(',')[1] || sourceImage
        const mimeType = sourceImage.includes('image/jpeg') ? 'image/jpeg' : 'image/png'
        parts.push({ inlineData: { mimeType, data: base64Data } })
      }

      // Reference image 추가 (CREATE 모드)
      if (refImage) {
        const base64DataRef = refImage.split(',')[1] || refImage
        const mimeTypeRef = refImage.includes('image/jpeg') ? 'image/jpeg' : 'image/png'
        parts.push({ inlineData: { mimeType: mimeTypeRef, data: base64DataRef } })
      }

      const response = await ai.models.generateContent({
        model: PRO_MODEL,
        contents: { parts },
        config: {
          imageConfig: { aspectRatio: aspectRatio || '1:1' },
        },
      })

      // Extract generated image (base64)
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
        }
      }

      return null
    }

    // 7. 4장 병렬 생성 (base64)
    const promises = Array.from({ length: 4 }, () => generateSingle())
    const results = await Promise.all(promises)
    const base64Images = results.filter((img): img is string => img !== null)

    if (base64Images.length === 0) {
      // 생성 실패 이력 기록
      await prisma.generationHistory.create({
        data: {
          userId: session.user.id,
          projectId,
          mode: mode || 'CREATE',
          prompt: finalPrompt,
          category,
          style,
          imageCount: 0,
          costUsd: 0,
          status: 'failed',
          errorMessage: 'No images generated',
        },
      })

      return NextResponse.json({ error: '이미지 생성에 실패했습니다.' }, { status: 500 })
    }

    // 8. Supabase Storage에 업로드 (base64 → URL 변환)
    const storageUrls = await uploadMultipleImages(
      base64Images,
      session.user.id,
      projectId ? `projects/${projectId}` : 'generations'
    )

    // 9. 프로젝트 업데이트 (projectId가 있는 경우)
    if (projectId) {
      await prisma.imageProject.update({
        where: { id: projectId },
        data: {
          resultImages: storageUrls,
          status: 'completed',
        },
      })
    }

    // 10. 사용량 기록
    const totalCost = base64Images.length * COST_PER_IMAGE_USD
    const today = new Date().toISOString().split('T')[0]

    await prisma.usageStats.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        totalImages: base64Images.length,
        totalCostUsd: totalCost,
        todayUsage: base64Images.length,
        lastUsageDate: new Date(),
        history: [{ date: today, count: base64Images.length }],
      },
      update: {
        totalImages: { increment: base64Images.length },
        totalCostUsd: { increment: totalCost },
        todayUsage: { increment: base64Images.length },
        lastUsageDate: new Date(),
        history: {
          push: { date: today, count: base64Images.length },
        },
      },
    })

    // 11. 생성 성공 이력 기록
    await prisma.generationHistory.create({
      data: {
        userId: session.user.id,
        projectId,
        mode: mode || 'CREATE',
        prompt: finalPrompt,
        category,
        style,
        imageCount: base64Images.length,
        costUsd: totalCost,
        status: 'success',
      },
    })

    // 12. Storage URL 반환 (클라이언트는 URL로 이미지 표시)
    return NextResponse.json({ images: storageUrls })
  } catch (error: unknown) {
    console.error('Image generation error:', error)

    // 실패 이력 기록
    try {
      await prisma.generationHistory.create({
        data: {
          userId: session.user.id,
          mode: 'CREATE',
          imageCount: 0,
          costUsd: 0,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      })
    } catch (historyError) {
      console.error('Failed to record generation history:', historyError)
    }

    return NextResponse.json(
      { error: '이미지 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
