/**
 * Text Extraction API - OCR using Gemini 3 Flash
 * /api/extract-text
 *
 * 이미지에서 텍스트를 추출하는 OCR 기능을 제공합니다.
 * Gemini 3 Flash 모델을 사용하여 텍스트 생성 (OCR) 수행
 *
 * 비용: 1 크레딧
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ensureBase64, extractBase64Data } from '@/lib/utils/imageConverter'
import { getGenAIClient, getGenAIMode } from '@/lib/vertexai'
import { logger } from '@/lib/logger'

// OCR용 모델 - Gemini 3 Flash Preview (빠른 텍스트 추출)
const OCR_MODEL = 'gemini-3-flash-preview'

export const maxDuration = 60 // 최대 실행 시간 60초

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. GenAI 클라이언트 초기화
    const genAIMode = getGenAIMode()
    logger.debug('Initializing GenAI client', { module: 'ExtractText', mode: genAIMode })
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
    logger.debug('Extracting text', { module: 'ExtractText', model: OCR_MODEL, mimeType, dataLength: data.length })

    // @google/genai SDK - role/parts 구조 사용 (멀티모달 권장 형식)
    const response = await ai.models.generateContent({
      model: OCR_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data,
              },
            },
            {
              text: `Extract ALL text from this image. Return ONLY the extracted text, nothing else.
If you see Korean text (한글), extract it exactly as written.
Include: titles, descriptions, labels, buttons, numbers.`,
            },
          ],
        },
      ],
    })

    // 5. 디버깅: 전체 응답 구조 확인
    logger.debug('Response structure', { module: 'ExtractText', keys: Object.keys(response), hasText: !!response.text })

    // SDK 공식 문서: response.text 직접 사용, 없으면 candidates에서 추출
    let extractedText = response.text || ''

    // fallback: candidates에서 직접 추출
    if (!extractedText && response.candidates?.[0]?.content?.parts?.[0]?.text) {
      extractedText = response.candidates[0].content.parts[0].text
    }

    logger.info('Text extracted', { module: 'ExtractText', length: extractedText.length })

    return NextResponse.json({
      success: true,
      text: extractedText.trim(),
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('Text extraction error', { module: 'ExtractText' }, error instanceof Error ? error : new Error(errorMessage))

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
