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
import { ensureBase64, extractBase64Data } from '@/lib/utils/imageConverter'
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

    // 5. 이미지 URL → base64 변환 (갤러리에서 불러온 이미지 지원)
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
        text: "Generate a high-resolution 2K version of this image. Improve texture details, lighting, and sharpness while maintaining the exact composition, content, and style of the original. Do not alter the subject."
      }
    ]

    // 6. Gemini API로 2K 업스케일 요청
    // Note: generateContent()는 imageConfig를 지원하지 않음
    // 고해상도 이미지 재생성을 프롬프트로 요청
    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: { parts },
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
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('========================================')
    console.error('Upscale error DETAILS:')
    console.error('Message:', errorMessage)
    console.error('Stack:', errorStack)
    console.error('User ID:', session.user.id)
    console.error('========================================')

    // 친화적 에러 메시지 생성
    let userFriendlyMessage = '업스케일 중 오류가 발생했습니다.'
    let statusCode = 500

    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota')) {
      userFriendlyMessage = 'Google Gemini API 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요.'
      statusCode = 429

      // 재시도 대기 시간 추출
      const retryMatch = errorMessage.match(/retry in ([\d.]+)s/)
      if (retryMatch) {
        const retrySeconds = Math.ceil(parseFloat(retryMatch[1]))
        userFriendlyMessage = `Google Gemini API 할당량이 초과되었습니다. ${retrySeconds}초 후에 다시 시도해주세요.`
      }
    } else if (errorMessage.includes('API key') || errorMessage.includes('API_KEY')) {
      userFriendlyMessage = 'Google Gemini API 키가 유효하지 않습니다.'
      statusCode = 401
    } else if (errorMessage.includes('SAFETY') || errorMessage.includes('blocked')) {
      userFriendlyMessage = '이미지가 안전 정책에 의해 차단되었습니다. 다른 이미지로 시도해주세요.'
      statusCode = 400
    } else if (errorMessage.includes('network') || errorMessage.includes('ENOTFOUND')) {
      userFriendlyMessage = '네트워크 연결을 확인해주세요.'
      statusCode = 503
    }

    return NextResponse.json(
      { error: userFriendlyMessage },
      { status: statusCode }
    )
  }
}
