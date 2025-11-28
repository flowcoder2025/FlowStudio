/**
 * Image Upscale API - 2K High Resolution
 * /api/upscale
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
    const { image } = body

    if (!image) {
      return NextResponse.json({ error: '업스케일할 이미지를 제공해주세요.' }, { status: 400 })
    }

    // 4. Gemini API 초기화
    const ai = new GoogleGenAI({ apiKey })

    // 5. 업스케일 프롬프트 구성
    const base64Data = image.split(',')[1] || image
    const mimeType = image.includes('image/jpeg') ? 'image/jpeg' : 'image/png'

    const parts = [
      {
        inlineData: {
          mimeType,
          data: base64Data
        }
      },
      {
        text: "Generate a high-resolution 2K version of this image. Improve texture details, lighting, and sharpness while maintaining the exact composition, content, and style of the original. Do not alter the subject."
      }
    ]

    // 6. Gemini API로 2K 업스케일 요청
    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: '2K'
        }
      }
    })

    // 7. 결과 이미지 추출
    let upscaledBase64: string | null = null
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        upscaledBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
        break
      }
    }

    if (!upscaledBase64) {
      return NextResponse.json({ error: '업스케일에 실패했습니다.' }, { status: 500 })
    }

    // 8. Supabase Storage에 업로드
    const storageUrls = await uploadMultipleImages(
      [upscaledBase64],
      session.user.id,
      'upscaled'
    )

    // 9. 사용량 기록
    const today = new Date().toISOString().split('T')[0]

    await prisma.usageStats.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        totalImages: 1,
        totalCostUsd: COST_PER_IMAGE_USD,
        todayUsage: 1,
        lastUsageDate: new Date(),
        history: [{ date: today, count: 1 }],
      },
      update: {
        totalImages: { increment: 1 },
        totalCostUsd: { increment: COST_PER_IMAGE_USD },
        todayUsage: { increment: 1 },
        lastUsageDate: new Date(),
        history: {
          push: { date: today, count: 1 },
        },
      },
    })

    // 10. 생성 이력 기록
    await prisma.generationHistory.create({
      data: {
        userId: session.user.id,
        mode: 'UPSCALE',
        prompt: 'Image upscale to 2K',
        imageCount: 1,
        costUsd: COST_PER_IMAGE_USD,
        status: 'success',
      },
    })

    // 11. Storage URL 반환
    return NextResponse.json({ image: storageUrls[0] })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Upscale error:', errorMessage)

    // 친화적 에러 메시지 생성
    let userFriendlyMessage = '업스케일 중 오류가 발생했습니다.'
    let statusCode = 500

    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota')) {
      userFriendlyMessage = 'Google Gemini API 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요.'
      statusCode = 429
    } else if (errorMessage.includes('API key')) {
      userFriendlyMessage = 'Google Gemini API 키가 유효하지 않습니다.'
      statusCode = 401
    }

    return NextResponse.json(
      { error: userFriendlyMessage },
      { status: statusCode }
    )
  }
}
