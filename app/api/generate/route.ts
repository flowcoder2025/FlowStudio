/**
 * Image Generation API - Gemini Proxy (Base64 Return)
 * /api/generate
 *
 * Returns base64 images directly for preview.
 * Images are NOT auto-saved to storage - users must explicitly save via /api/images/save.
 * This reduces storage costs by only saving images the user actually wants.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/utils/encryption'
import { ensureBase64, extractBase64Data } from '@/lib/utils/imageConverter'
import { GoogleGenAI } from '@google/genai'

const PRO_MODEL = 'gemini-3-pro-image-preview'
const COST_PER_IMAGE_USD = 0.14

// Next.js 15+ App Router Configuration
// Note: Body size is now handled by imageConverter.ts compression (target: <2MB)
// All images are automatically compressed server-side with sharp before API calls
export const maxDuration = 60 // Maximum execution time in seconds
export const dynamic = 'force-dynamic' // Force dynamic rendering (no caching)

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

    // 6. 이미지 URL → base64 변환 (갤러리에서 불러온 이미지 지원)
    let processedSourceImage: string | null = null
    let processedRefImage: string | null = null

    if (sourceImage) {
      processedSourceImage = await ensureBase64(sourceImage)
    }
    if (refImage) {
      processedRefImage = await ensureBase64(refImage)
    }

    // 7. 이미지 생성 함수 (base64로 생성)
    const generateSingle = async () => {
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: finalPrompt }]

      // Source image 추가 (EDIT, DETAIL_EDIT 모드)
      if (processedSourceImage) {
        const { mimeType, data } = extractBase64Data(processedSourceImage)
        parts.push({ inlineData: { mimeType, data } })
      }

      // Reference image 추가 (CREATE 모드)
      if (processedRefImage) {
        const { mimeType, data } = extractBase64Data(processedRefImage)
        parts.push({ inlineData: { mimeType, data } })
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

    // 8. 사용량 기록 (API 호출 비용 추적)
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

    // 9. 생성 성공 이력 기록
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

    // 10. Base64 이미지 직접 반환 (Storage 자동 저장 없음)
    // 사용자가 원하는 이미지만 /api/images/save로 선택 저장 가능
    return NextResponse.json({ images: base64Images })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('========================================')
    console.error('Image generation error DETAILS:')
    console.error('Message:', errorMessage)
    console.error('Stack:', errorStack)
    console.error('User ID:', session.user.id)
    console.error('========================================')

    // 할당량 초과 에러 감지 및 친화적 메시지 생성
    let userFriendlyMessage = '이미지 생성 중 오류가 발생했습니다.'
    let statusCode = 500

    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota')) {
      userFriendlyMessage = 'Google Gemini API 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요. (무료 티어: 분당/일일 요청 제한)'
      statusCode = 429

      // 재시도 대기 시간 추출
      const retryMatch = errorMessage.match(/retry in ([\d.]+)s/)
      if (retryMatch) {
        const retrySeconds = Math.ceil(parseFloat(retryMatch[1]))
        userFriendlyMessage = `Google Gemini API 할당량이 초과되었습니다. ${retrySeconds}초 후에 다시 시도해주세요.`
      }
    } else if (errorMessage.includes('API key')) {
      userFriendlyMessage = 'Google Gemini API 키가 유효하지 않습니다. 프로필에서 API 키를 확인해주세요.'
      statusCode = 401
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

    return NextResponse.json(
      { error: userFriendlyMessage },
      { status: statusCode }
    )
  }
}
