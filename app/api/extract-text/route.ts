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

// OCR용 모델 - Gemini 2.5 Flash (Google AI Studio에서 빠른 텍스트 모델)
const OCR_MODEL = 'gemini-2.5-flash'

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

    // 4. Gemini로 텍스트 추출 (OCR)
    console.log(`[API /extract-text] Extracting text using ${OCR_MODEL}...`)

    // @google/genai SDK 공식 문서에 따른 올바른 API 호출 방식
    // contents는 배열 또는 문자열, Part 객체 배열 가능
    const response = await ai.models.generateContent({
      model: OCR_MODEL,
      contents: [
        {
          inlineData: {
            mimeType,
            data,
          },
        },
        {
          text: `You are an OCR text extraction tool. Extract ALL visible text from this image.

IMPORTANT RULES:
1. Extract EVERY piece of text you can see, including:
   - Headlines and titles (대제목, 소제목)
   - Body text and descriptions (본문, 설명)
   - Labels and captions
   - Buttons and UI elements
   - Numbers and special characters
2. Preserve line breaks as they appear
3. Return ONLY the extracted text, no explanations
4. If you see Korean text, extract it exactly as written
5. Do NOT say "없음" or "no text" - look carefully for any text

Extract all text now:`,
        },
      ],
    })

    // 5. 응답에서 텍스트 추출 - SDK 공식 문서: response.text 직접 사용
    const extractedText = response.text || ''

    console.log(`[API /extract-text] ✅ Text extracted (length: ${extractedText.length}): ${extractedText.substring(0, 100)}...`)

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
