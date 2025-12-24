/**
 * Text Extraction API - OCR using Gemini 2.0 Flash
 * /api/extract-text
 *
 * 이미지에서 텍스트를 추출하는 OCR 기능을 제공합니다.
 * Gemini 2.0 Flash 모델을 사용하여 텍스트 생성 (OCR) 수행
 *
 * 비용: 1 크레딧
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ensureBase64, extractBase64Data } from '@/lib/utils/imageConverter'
import { getGenAIClient, getGenAIMode } from '@/lib/vertexai'

// OCR용 모델 - Gemini 2.5 Flash Lite (빠르고 경량화된 텍스트 모델)
const OCR_MODEL = 'gemini-2.5-flash-lite'

export const maxDuration = 60 // 최대 실행 시간 60초

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. GenAI 클라이언트 초기화
    const genAIMode = getGenAIMode()
    console.log(`[API /extract-text] Initializing GenAI client (mode: ${genAIMode})...`)
    const ai = getGenAIClient()

    // 2. 요청 파싱
    const body = await req.json()
    const { image } = body

    if (!image) {
      return NextResponse.json(
        { error: '이미지를 제공해주세요.' },
        { status: 400 }
      )
    }

    // 3. 이미지 base64 변환
    const processedImage = await ensureBase64(image)
    const { mimeType, data } = extractBase64Data(processedImage)

    // 4. Gemini 2.0 Flash로 텍스트 추출
    console.log(`[API /extract-text] Extracting text using ${OCR_MODEL}...`)

    const response = await ai.models.generateContent({
      model: OCR_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data } },
            {
              text: `이 이미지에서 보이는 모든 텍스트를 정확히 추출해주세요.

규칙:
1. 줄바꿈과 공백을 원본 그대로 유지하세요
2. 텍스트만 반환하고 다른 설명은 추가하지 마세요
3. 텍스트가 없으면 빈 문자열을 반환하세요
4. 한국어와 영어 모두 정확히 추출하세요
5. 특수문자, 숫자, 이모지도 포함하세요`,
            },
          ],
        },
      ],
    })

    // 5. 응답에서 텍스트 추출
    const extractedText = response.candidates?.[0]?.content?.parts?.[0]?.text || ''

    console.log(`[API /extract-text] ✅ Text extracted: ${extractedText.substring(0, 50)}...`)

    return NextResponse.json({
      success: true,
      text: extractedText.trim(),
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[API /extract-text] Error:', errorMessage)

    // 사용자 친화적 에러 메시지
    let userMessage = '텍스트 추출 중 오류가 발생했습니다.'

    if (errorMessage.includes('503') || errorMessage.includes('UNAVAILABLE')) {
      userMessage = 'Google Gemini 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.'
    } else if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      userMessage = 'API 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요.'
    }

    return NextResponse.json(
      { error: userMessage },
      { status: 500 }
    )
  }
}
