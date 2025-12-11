/**
 * Image Generation API - Vertex AI Gemini (Base64 Return)
 * /api/generate
 *
 * Returns base64 images directly for preview.
 * Images are NOT auto-saved to storage - users must explicitly save via /api/images/save.
 * This reduces storage costs by only saving images the user actually wants.
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
import { ensureBase64, extractBase64Data } from '@/lib/utils/imageConverter'
import { getVertexAIClient, VERTEX_AI_MODELS } from '@/lib/vertexai'
import {
  hasEnoughCredits,
  deductForGeneration,
  CREDIT_PRICES
} from '@/lib/utils/creditManager'
import {
  acquireGenerationSlot,
  releaseGenerationSlot,
  getConcurrencyStatus
} from '@/lib/utils/concurrencyLimiter'
import { hasWatermarkFree } from '@/lib/utils/subscriptionManager'
import { addWatermarkBatch } from '@/lib/utils/watermark'

const PRO_MODEL = VERTEX_AI_MODELS.GEMINI_3_PRO_IMAGE_PREVIEW
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
    // 1. Vertex AI 클라이언트 초기화 (Application Default Credentials 사용)
    console.log('[API /generate] Initializing Vertex AI client...')
    const ai = getVertexAIClient()
    console.log('[API /generate] ✅ Vertex AI client initialized successfully')

    // 2. 크레딧 잔액 확인 (2K 생성 1회 = 20 크레딧)
    const hasEnough = await hasEnoughCredits(session.user.id, CREDIT_PRICES.GENERATION_2K)

    if (!hasEnough) {
      return NextResponse.json(
        {
          error: `크레딧이 부족합니다. 2K 이미지 생성에는 ${CREDIT_PRICES.GENERATION_2K} 크레딧이 필요합니다.`,
          required: CREDIT_PRICES.GENERATION_2K
        },
        { status: 402 } // Payment Required
      )
    }

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
    const { projectId, prompt, sourceImage, refImage, logoImage, category, style, aspectRatio, mode } = body

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

    // 5. 이미지 URL → base64 변환 (갤러리에서 불러온 이미지 지원)
    let processedSourceImage: string | null = null
    let processedRefImage: string | null = null
    let processedLogoImage: string | null = null

    if (sourceImage) {
      processedSourceImage = await ensureBase64(sourceImage)
    }
    if (refImage) {
      processedRefImage = await ensureBase64(refImage)
    }
    if (logoImage) {
      processedLogoImage = await ensureBase64(logoImage)
    }

    // 6. 이미지 생성 함수 (base64로 생성)
    const generateSingle = async () => {
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

      // Source image 먼저 추가 (EDIT, DETAIL_EDIT, POSTER 모드)
      if (processedSourceImage) {
        const { mimeType, data } = extractBase64Data(processedSourceImage)
        parts.push({ inlineData: { mimeType, data } })
      }

      // Reference image 또는 Logo image 추가
      // Priority: refImage > logoImage (모드에 따라 상호 배타적)
      const secondaryImage = processedRefImage || processedLogoImage
      if (secondaryImage) {
        const { mimeType, data } = extractBase64Data(secondaryImage)
        parts.push({ inlineData: { mimeType, data } })
      }

      // Text prompt는 마지막에 추가
      parts.push({ text: finalPrompt })

      const response = await ai.models.generateContent({
        model: PRO_MODEL,
        contents: parts, // ✅ 배열 직접 전달 [{ text: ... }, { inlineData: ... }]
        config: {
          responseModalities: ['TEXT', 'IMAGE'], // 이미지 응답 명시
          imageConfig: {
            aspectRatio: aspectRatio || '1:1',
            imageSize: '2K' // 기본 2K 해상도 설정
          },
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

    // 7. 2장 생성 (타임아웃 회피 - 추가 생성은 "더보기" 버튼으로 가능)
    console.log('[API /generate] Generating 2 images...')
    const results = await Promise.all([generateSingle(), generateSingle()])
    console.log('[API /generate] Generation completed')
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

    // 8. 크레딧 차감 (2K 생성 1회 = 20 크레딧)
    await deductForGeneration(session.user.id, projectId || 'no-project-id')

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

    // 10.5. 워터마크 적용 (FREE 플랜 사용자만)
    let finalImages = base64Images
    const isWatermarkFree = await hasWatermarkFree(session.user.id)
    if (!isWatermarkFree) {
      console.log('[API /generate] Applying watermark for FREE tier user...')
      finalImages = await addWatermarkBatch(base64Images)
      console.log('[API /generate] Watermark applied')
    }

    // 11. 동시 생성 슬롯 해제 (성공 시)
    releaseGenerationSlot(session.user.id, generationRequestId)

    // 12. Base64 이미지 직접 반환 (Storage 자동 저장 없음)
    // 사용자가 원하는 이미지만 /api/images/save로 선택 저장 가능
    return NextResponse.json({ images: finalImages })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('========================================')
    console.error('Image generation error DETAILS:')
    console.error('Message:', errorMessage)
    console.error('Stack:', errorStack)
    console.error('User ID:', session.user.id)
    console.error('Error Type:', error?.constructor?.name)
    console.error('Full Error Object:', JSON.stringify(error, null, 2))
    console.error('========================================')

    // Vercel 배포 디버깅용: 환경 변수 확인
    console.error('[DEBUG] GOOGLE_CLOUD_PROJECT:', process.env.GOOGLE_CLOUD_PROJECT)
    console.error('[DEBUG] GOOGLE_CLOUD_LOCATION:', process.env.GOOGLE_CLOUD_LOCATION)
    console.error('[DEBUG] GOOGLE_GENAI_USE_VERTEXAI:', process.env.GOOGLE_GENAI_USE_VERTEXAI)

    // 할당량 초과 에러 감지 및 친화적 메시지 생성
    let userFriendlyMessage = '이미지 생성 중 오류가 발생했습니다.'
    let statusCode = 500

    if (errorMessage.includes('503') || errorMessage.includes('UNAVAILABLE') || errorMessage.includes('overloaded')) {
      userFriendlyMessage = 'Google Gemini 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요. (보통 30초~1분 후 복구)'
      statusCode = 503
    } else if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota')) {
      userFriendlyMessage = 'Google Gemini API 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요. (무료 티어: 분당/일일 요청 제한)'
      statusCode = 429

      // 재시도 대기 시간 추출
      const retryMatch = errorMessage.match(/retry in ([\d.]+)s/)
      if (retryMatch) {
        const retrySeconds = Math.ceil(parseFloat(retryMatch[1]))
        userFriendlyMessage = `Google Gemini API 할당량이 초과되었습니다. ${retrySeconds}초 후에 다시 시도해주세요.`
      }
    } else if (errorMessage.includes('API key') || errorMessage.includes('authentication') || errorMessage.includes('UNAUTHENTICATED')) {
      userFriendlyMessage = 'Google Cloud 인증 오류가 발생했습니다. 서버 관리자에게 문의하세요.'
      statusCode = 500
    } else if (errorMessage.includes('network') || errorMessage.includes('ENOTFOUND')) {
      userFriendlyMessage = '네트워크 연결을 확인해주세요. Google AI 서비스에 접근할 수 없습니다.'
      statusCode = 503
    } else if (errorMessage.includes('413') || errorMessage.includes('Payload') || errorMessage.includes('too large')) {
      userFriendlyMessage = '이미지 파일이 너무 큽니다. 4MB 이하의 이미지를 사용해주세요. (고화질 이미지는 자동으로 압축됩니다)'
      statusCode = 413
    } else if (errorMessage.includes('body size') || errorMessage.includes('entity too large')) {
      userFriendlyMessage = '전송된 데이터가 너무 큽니다. 이미지 크기를 줄여주세요. (권장: 3MB 이하)'
      statusCode = 413
    }

    // 실패 이력 기록
    try {
      await prisma.generationHistory.create({
        data: {
          userId: session.user.id,
          mode: 'CREATE',
          imageCount: 0,
          costUsd: 0,
          status: 'failed',
          errorMessage: userFriendlyMessage,
        },
      })
    } catch (historyError) {
      console.error('Failed to record generation history:', historyError)
    }

    // 동시 생성 슬롯 해제 (에러 시)
    if (generationRequestId) {
      releaseGenerationSlot(session.user.id, generationRequestId)
    }

    return NextResponse.json(
      { error: userFriendlyMessage },
      { status: statusCode }
    )
  }
}
