/**
 * Image Upscale API - 4K Ultra High Resolution (Vertex AI)
 * /api/upscale
 *
 * 모델: Gemini 3 Pro Image (Nano Banana Pro) - 최고 품질 이미지 편집 모델
 *
 * 변경사항 (Vertex AI 전환):
 * - 사용자 개별 API 키 불필요 → 중앙화된 Vertex AI 인증
 * - Application Default Credentials (ADC) 사용
 * - 크레딧 시스템은 동일하게 유지
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { genaiLogger } from '@/lib/logger'
import { apiErrorResponse } from '@/lib/errors'
import { uploadMultipleImages } from '@/lib/utils/imageStorage'
import { ensureBase64, extractBase64Data } from '@/lib/utils/imageConverter'
import { getGenAIClient, VERTEX_AI_MODELS } from '@/lib/vertexai'
import {
  hasEnoughCredits,
  deductCredits,
  CREDIT_PRICES
} from '@/lib/utils/creditManager'

const COST_PER_IMAGE_USD = 0.14

// Next.js App Router Configuration
export const maxDuration = 120 // Maximum execution time in seconds (Vercel Pro)
export const dynamic = 'force-dynamic' // Force dynamic rendering (no caching)

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. GenAI 클라이언트 초기화
    genaiLogger.debug('Initializing GenAI client for upscale', { userId: session.user.id })
    const ai = getGenAIClient()

    // 2. 크레딧 잔액 확인 (업스케일 1회 = 10 크레딧)
    const hasEnough = await hasEnoughCredits(session.user.id, CREDIT_PRICES.UPSCALE_4K)

    if (!hasEnough) {
      return NextResponse.json(
        {
          error: `크레딧이 부족합니다. 업스케일링에는 ${CREDIT_PRICES.UPSCALE_4K} 크레딧이 필요합니다.`,
          required: CREDIT_PRICES.UPSCALE_4K
        },
        { status: 402 } // Payment Required
      )
    }

    // 3. 요청 파싱
    const body = await req.json()
    const { image } = body

    if (!image) {
      return NextResponse.json({ error: '업스케일할 이미지를 제공해주세요.' }, { status: 400 })
    }

    // 4. 이미지 URL → base64 변환 (갤러리에서 불러온 이미지 지원)
    const processedImage = await ensureBase64(image)
    const { mimeType, data: base64Data } = extractBase64Data(processedImage)

    const parts = [
      {
        inlineData: {
          mimeType,
          data: base64Data
        }
      },
      {
        text: "Generate a high-resolution 4K version of this image. Improve texture details, lighting, and sharpness while maintaining the exact composition, content, and style of the original. Do not alter the subject."
      }
    ]

    // 5. Gemini API로 4K 업스케일 요청
    // 공식 문서: imageSize로 4K 해상도 요청 가능
    const response = await ai.models.generateContent({
      model: VERTEX_AI_MODELS.GEMINI_3_PRO_IMAGE,
      contents: { parts },
      config: {
        imageConfig: {
          imageSize: '4K', // 4K 해상도 출력
        },
      }
    })

    // 6. 결과 이미지 추출
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

    // 7. Supabase Storage에 업로드
    const storageUrls = await uploadMultipleImages(
      [upscaledBase64],
      session.user.id,
      'upscaled'
    )

    // 8. 크레딧 차감 (10 크레딧)
    await deductCredits(
      session.user.id,
      CREDIT_PRICES.UPSCALE_4K,
      'UPSCALE',
      '4K 업스케일링 (1장)',
      {
        imageCount: 1,
        resolution: '4K'
      }
    )

    genaiLogger.info('Upscale credits deducted', { amount: CREDIT_PRICES.UPSCALE_4K, userId: session.user.id })

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
        prompt: 'Image upscale to 4K',
        imageCount: 1,
        costUsd: COST_PER_IMAGE_USD,
        status: 'success',
      },
    })

    // 11. Storage URL 반환
    return NextResponse.json({ image: storageUrls[0] })
  } catch (error: unknown) {
    return apiErrorResponse(error, {
      userId: session.user.id,
      operation: 'image-upscale'
    })
  }
}
