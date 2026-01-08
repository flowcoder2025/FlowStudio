/**
 * Image Generation API - Vertex AI Gemini 3 Pro Image (Base64 Return)
 * /api/generate
 *
 * Returns base64 images directly for preview.
 * Images are NOT auto-saved to storage - users must explicitly save via /api/images/save.
 * This reduces storage costs by only saving images the user actually wants.
 *
 * 모델: Gemini 3 Pro Image (Nano Banana Pro)
 * - Google의 최신 최고 품질 이미지 생성 모델
 * - 모든 모드(CREATE, EDIT, DETAIL_EDIT)에서 통일 사용
 * - generateContent API로 1장 생성 (Vertex AI 타임아웃 방지)
 * - 2K 해상도 (2048x2048) 기본 출력
 * - JPEG 출력으로 파일 크기 최적화 (PNG 대비 50-70% 감소)
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
import { ensureBase64, extractBase64Data } from '@/lib/utils/imageConverter'
import { getGenAIClient, getGenAIMode, VERTEX_AI_MODELS } from '@/lib/vertexai'
import {
  hasEnoughCredits,
  deductForGeneration,
  deductCreditsWithType,
  getCreditBalanceDetail,
  CREDIT_PRICES,
  type CreditType
} from '@/lib/utils/creditManager'
import {
  acquireGenerationSlot,
  releaseGenerationSlot,
  getConcurrencyStatus
} from '@/lib/utils/concurrencyLimiter'
import { getUserTier } from '@/lib/utils/subscriptionManager'
import { SUBSCRIPTION_TIERS } from '@/lib/constants'
import { addWatermarkBatch } from '@/lib/utils/watermark'

// 모델 선택: 모드에 따라 자동 선택
// - Google AI Studio: gemini-2.0-flash-exp (빠름)
// - Vertex AI: gemini-3-pro-image-preview (최고 품질)
const COST_PER_IMAGE_USD = 0.14

// Next.js 15+ App Router Configuration
// Note: Body size is now handled by imageConverter.ts compression (target: <2MB)
// All images are automatically compressed server-side with sharp before API calls
export const maxDuration = 120 // Maximum execution time in seconds (Vercel Pro)
export const dynamic = 'force-dynamic' // Force dynamic rendering (no caching)

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 동시 생성 슬롯 ID (에러 시에도 해제하기 위해 함수 스코프에서 선언)
  let generationRequestId: string | null = null

  try {
    // 1. GenAI 클라이언트 초기화 (Google AI Studio 또는 Vertex AI)
    const genAIMode = getGenAIMode()
    genaiLogger.debug('Initializing GenAI client', { mode: genAIMode, userId: session.user.id })
    const ai = getGenAIClient()
    genaiLogger.info('GenAI client initialized successfully', { mode: genAIMode })

    // 3. 동시 생성 제한 확인
    const concurrencyStatus = await getConcurrencyStatus(session.user.id)
    generationRequestId = await acquireGenerationSlot(session.user.id)

    if (!generationRequestId) {
      return NextResponse.json(
        {
          error: `동시 생성 제한에 도달했습니다. 현재 ${concurrencyStatus.active}건의 생성이 진행 중입니다. (최대 ${concurrencyStatus.limit}건)`,
          concurrency: concurrencyStatus
        },
        { status: 429 } // Too Many Requests
      )
    }

    // 4. 요청 파싱
    const body = await req.json()
    const {
      projectId,
      prompt,
      sourceImage,
      refImage,
      refImages,
      logoImage,
      maskImage,
      category,
      style,
      aspectRatio,
      mode,
      imageCount: rawImageCount,
      creditType = 'auto' as CreditType
    } = body

    const imageCount = Math.min(Math.max(Number(rawImageCount) || 1, 1), 4)

    if (!prompt) {
      return NextResponse.json({ error: '프롬프트를 입력해주세요.' }, { status: 400 })
    }

    const balanceDetail = await getCreditBalanceDetail(session.user.id)
    const requiredCredits = CREDIT_PRICES.GENERATION_PER_IMAGE * imageCount

    if (creditType === 'free' && balanceDetail.free < requiredCredits) {
      return NextResponse.json(
        {
          error: `무료 크레딧이 부족합니다. (필요: ${requiredCredits}, 보유: ${balanceDetail.free})`,
          required: requiredCredits,
          balance: balanceDetail
        },
        { status: 402 }
      )
    } else if (creditType === 'purchased' && balanceDetail.purchased < requiredCredits) {
      return NextResponse.json(
        {
          error: `유료 크레딧이 부족합니다. (필요: ${requiredCredits}, 보유: ${balanceDetail.purchased})`,
          required: requiredCredits,
          balance: balanceDetail
        },
        { status: 402 }
      )
    } else if (creditType === 'auto' && balanceDetail.total < requiredCredits) {
      return NextResponse.json(
        {
          error: `크레딧이 부족합니다. 이미지 ${imageCount}장 생성에는 ${requiredCredits} 크레딧이 필요합니다.`,
          required: requiredCredits,
          balance: balanceDetail
        },
        { status: 402 }
      )
    }

    // 4. 프롬프트 구성
    let finalPrompt = prompt

    if (category) {
      finalPrompt += ` Context: ${category}. `
    }

    if (style) {
      finalPrompt += ` Style: ${style}. `
    }

    // 5. 이미지 URL → base64 변환 (갤러리에서 불러온 이미지 지원)
    let processedSourceImage: string | null = null
    let processedRefImage: string | null = null
    let processedRefImages: string[] = []
    let processedLogoImage: string | null = null
    let processedMaskImage: string | null = null

    if (sourceImage) {
      processedSourceImage = await ensureBase64(sourceImage)
    }
    if (refImage) {
      processedRefImage = await ensureBase64(refImage)
    }
    // COMPOSITE 모드: 다중 이미지 배열 처리
    if (refImages && Array.isArray(refImages)) {
      processedRefImages = await Promise.all(
        refImages.map((img: string) => ensureBase64(img))
      )
    }
    if (logoImage) {
      processedLogoImage = await ensureBase64(logoImage)
    }
    // DETAIL_EDIT 모드: 마스크 이미지 처리
    if (maskImage) {
      processedMaskImage = await ensureBase64(maskImage)
    }

    // 6. Gemini 3 Pro Image 모델로 이미지 생성
    // Google AI Studio / Vertex AI 모두 동일 모델 사용
    let base64Images: string[] = []
    const imageModel = VERTEX_AI_MODELS.GEMINI_3_PRO_IMAGE

    genaiLogger.debug('Using model', { model: imageModel, mode: genAIMode })

    const generateWithGemini = async () => {
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

      // Source image 추가 (EDIT, DETAIL_EDIT, POSTER 모드)
      if (processedSourceImage) {
        const { mimeType, data } = extractBase64Data(processedSourceImage)
        parts.push({ inlineData: { mimeType, data } })
      }

      // DETAIL_EDIT 모드: 마스크 이미지 추가 (편집 영역 시각화)
      // 마스크 이미지는 원본과 동일 크기이며, 편집할 영역이 빨간색 반투명 오버레이로 표시됨
      if (processedMaskImage && mode === 'DETAIL_EDIT') {
        const { mimeType, data } = extractBase64Data(processedMaskImage)
        parts.push({ inlineData: { mimeType, data } })
      }

      // COMPOSITE 모드: 다중 이미지 배열 추가
      if (processedRefImages.length > 0) {
        for (const img of processedRefImages) {
          const { mimeType, data } = extractBase64Data(img)
          parts.push({ inlineData: { mimeType, data } })
        }
      }

      // Reference image 또는 Logo image 추가 (단일 이미지 모드)
      const secondaryImage = processedRefImage || processedLogoImage
      if (secondaryImage && processedRefImages.length === 0) {
        const { mimeType, data } = extractBase64Data(secondaryImage)
        parts.push({ inlineData: { mimeType, data } })
      }

      // DETAIL_EDIT 모드에서 마스크 사용 시 프롬프트 보강
      let enhancedPrompt = finalPrompt
      if (processedMaskImage && mode === 'DETAIL_EDIT') {
        enhancedPrompt = `You are given two images:
1. The ORIGINAL image (first image)
2. The MASK image (second image) - shows a RED semi-transparent overlay on the area to be edited

TASK: Edit ONLY the area marked with the RED overlay in the original image.

User's edit instruction: ${finalPrompt}

CRITICAL RULES:
- ONLY modify the red-highlighted area
- Keep ALL other areas EXACTLY the same as the original
- Blend the edited area seamlessly with surroundings
- Match lighting, colors, and style of the original
- Output the complete edited image at the same size as the original`
      }

      // Text prompt 추가
      parts.push({ text: enhancedPrompt })

      // 공식 문서 기반 설정: https://ai.google.dev/gemini-api/docs/gemini-3
      const response = await ai.models.generateContent({
        model: imageModel,
        contents: parts,
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || '1:1',
            imageSize: '2K', // 2048px 해상도 (기본값 1K=1024px)
          },
        },
      })

      // Gemini 응답에서 이미지 추출
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
        }
      }
      return null
    }

    const generationStartTime = Date.now()
    genaiLogger.info('Starting parallel generation', { mode: genAIMode, userId: session.user.id, imageCount })
    const generationPromises = Array.from({ length: imageCount }, () => generateWithGemini())
    const results = await Promise.all(generationPromises)
    const generationDuration = Date.now() - generationStartTime
    genaiLogger.info('Image generation completed', { durationMs: generationDuration, imageCount: results.filter(r => r !== null).length })
    base64Images = results.filter((r): r is string => r !== null)

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

    const actualCredits = CREDIT_PRICES.GENERATION_PER_IMAGE * base64Images.length
    const deductResult = await deductCreditsWithType(
      session.user.id,
      actualCredits,
      'GENERATION',
      `이미지 생성 (${base64Images.length}장)`,
      creditType,
      { projectId: projectId || 'no-project-id', imageCount: base64Images.length, resolution: '2K' }
    )
    genaiLogger.info('Credits deducted', { amount: actualCredits, creditType: deductResult.usedCreditType, applyWatermark: deductResult.applyWatermark, userId: session.user.id })

    // 9. 사용량 기록 (API 호출 비용 추적)
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

    // 10. 생성 성공 이력 기록
    await prisma.generationHistory.create({
      data: {
        userId: session.user.id,
        projectId: projectId || null,
        mode: mode || 'CREATE',
        prompt: finalPrompt,
        category,
        style,
        imageCount: base64Images.length,
        costUsd: totalCost,
        status: 'success',
      },
    })

    // 10.5. 워터마크 적용 (크레딧 차감 결과 기반)
    // - 로고 이미지(FlowStudio_icon-removebg.png)를 우측 하단에 반투명하게 합성
    // - 싱글톤 캐싱으로 Vercel 타임아웃 방지 (로고 로딩 ~50ms, 합성 ~100ms/장)
    //
    // 워터마크 적용 조건:
    // - 무료 크레딧(free) 사용 → 워터마크 O
    // - 유료 크레딧(purchased) 사용 → 워터마크 X
    // - PLUS/PRO/BUSINESS 구독자 → 워터마크 X (크레딧 종류 무관)
    let finalImages = base64Images
    const WATERMARK_ENABLED = true

    // 구독자 확인 - 유료 구독자는 항상 워터마크 없음
    const userTier = await getUserTier(session.user.id)
    const isSubscriberWatermarkFree = SUBSCRIPTION_TIERS[userTier].watermarkFree

    // 워터마크 적용 여부: 기능 활성화 AND 구독자 아님 AND 무료 크레딧 사용
    const applyWatermark = WATERMARK_ENABLED && !isSubscriberWatermarkFree && deductResult.applyWatermark

    if (applyWatermark) {
      genaiLogger.debug('Applying watermark (free credits used)')
      const watermarkStartTime = Date.now()
      finalImages = await addWatermarkBatch(base64Images)
      genaiLogger.debug('Watermark applied', { durationMs: Date.now() - watermarkStartTime })
    } else {
      const reason = isSubscriberWatermarkFree ? `${userTier} subscriber` : `${deductResult.usedCreditType} credits used`
      genaiLogger.debug('Watermark skipped', { reason })
    }

    // 11. 동시 생성 슬롯 해제 (성공 시)
    releaseGenerationSlot(session.user.id, generationRequestId)

    // 12. Base64 이미지 직접 반환 (Storage 자동 저장 없음)
    // 사용자가 원하는 이미지만 /api/images/save로 선택 저장 가능
    return NextResponse.json({ images: finalImages })
  } catch (error: unknown) {
    // 동시 생성 슬롯 해제 (에러 시)
    if (generationRequestId) {
      releaseGenerationSlot(session.user.id, generationRequestId)
    }

    // 실패 이력 기록
    try {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      await prisma.generationHistory.create({
        data: {
          userId: session.user.id,
          mode: 'CREATE',
          imageCount: 0,
          costUsd: 0,
          status: 'failed',
          errorMessage: errorMessage,
        },
      })
    } catch (historyError) {
      genaiLogger.error('Failed to record generation history', {}, historyError instanceof Error ? historyError : new Error(String(historyError)))
    }

    // 표준화된 에러 응답 반환 (로깅 + 분류 + 응답 포함)
    return apiErrorResponse(error, {
      userId: session.user.id,
      operation: 'image-generation',
      metadata: {
        genaiMode: getGenAIMode(),
        hasApiKey: !!process.env.GOOGLE_API_KEY,
        hasCloudProject: !!process.env.GOOGLE_CLOUD_PROJECT,
      }
    })
  }
}
