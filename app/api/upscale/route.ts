/**
 * Image Upscale API - 4K Ultra High Resolution (Multi-Provider)
 * /api/upscale
 *
 * 모델: Gemini 3 Pro Image (Nano Banana Pro) - 최고 품질 이미지 편집 모델
 *
 * 지원 프로바이더:
 * 1. Google GenAI (Google AI Studio / Vertex AI)
 * 2. OpenRouter (Gemini, FLUX, GPT-5 Image 등)
 *
 * 환경 변수: IMAGE_PROVIDER
 * - 'google' (기본값): Google GenAI 사용
 * - 'openrouter': OpenRouter API 사용 (분당 생성량 제한 우회)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { genaiLogger } from '@/lib/logger'
import { apiErrorResponse } from '@/lib/errors'
import { uploadMultipleImages } from '@/lib/utils/imageStorage'
import { ensureBase64 } from '@/lib/utils/imageConverter'
import {
  upscaleImage,
  getImageProvider,
  getProviderMode,
  getEstimatedCostPerImage,
} from '@/lib/imageProvider'
import {
  hasEnoughCredits,
  deductCredits,
  CREDIT_PRICES
} from '@/lib/utils/creditManager'

// Next.js App Router Configuration
// maxDuration은 vercel.json에서 300초로 오버라이드됨 (Fluid Compute)
export const maxDuration = 300 // Maximum execution time in seconds (Vercel Pro)
export const dynamic = 'force-dynamic' // Force dynamic rendering (no caching)

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. 이미지 프로바이더 확인 (Google GenAI 또는 OpenRouter)
    const imageProvider = getImageProvider()
    const providerMode = getProviderMode()
    genaiLogger.debug('Image provider initialized for upscale', { provider: imageProvider, mode: providerMode, userId: session.user.id })

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

    // 5. 통합 프로바이더로 4K 업스케일 요청
    genaiLogger.info('Starting 4K upscale', { provider: imageProvider, mode: providerMode, userId: session.user.id })
    const upscaledBase64 = await upscaleImage(processedImage)

    if (!upscaledBase64) {
      return NextResponse.json({ error: '업스케일에 실패했습니다.' }, { status: 500 })
    }

    // 6. Supabase Storage에 업로드
    const storageUrls = await uploadMultipleImages(
      [upscaledBase64],
      session.user.id,
      'upscaled'
    )

    // 7. 크레딧 차감 (10 크레딧)
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

    // 8. 사용량 기록
    const costPerImage = getEstimatedCostPerImage()
    const today = new Date().toISOString().split('T')[0]

    await prisma.usageStats.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        totalImages: 1,
        totalCostUsd: costPerImage,
        todayUsage: 1,
        lastUsageDate: new Date(),
        history: [{ date: today, count: 1 }],
      },
      update: {
        totalImages: { increment: 1 },
        totalCostUsd: { increment: costPerImage },
        todayUsage: { increment: 1 },
        lastUsageDate: new Date(),
        history: {
          push: { date: today, count: 1 },
        },
      },
    })

    // 9. 생성 이력 기록
    await prisma.generationHistory.create({
      data: {
        userId: session.user.id,
        mode: 'UPSCALE',
        prompt: 'Image upscale to 4K',
        imageCount: 1,
        costUsd: costPerImage,
        status: 'success',
      },
    })

    // 10. Storage URL 반환
    return NextResponse.json({ image: storageUrls[0] })
  } catch (error: unknown) {
    return apiErrorResponse(error, {
      userId: session.user.id,
      operation: 'image-upscale',
      metadata: {
        imageProvider: getImageProvider(),
        providerMode: getProviderMode(),
      }
    })
  }
}
