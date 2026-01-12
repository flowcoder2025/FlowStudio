/**
 * OpenRouter Image Generation Client
 *
 * OpenRouter API를 통한 이미지 생성 클라이언트
 * Google AI Studio/Vertex AI의 분당 생성량 제한을 우회하기 위한 대안
 *
 * 지원 모델:
 * - google/gemini-3-pro-image-preview (Nano Banana Pro) - Gemini와 동일 품질
 * - black-forest-labs/flux.2-pro - FLUX 2 Pro
 * - openai/gpt-5-image - GPT-5 Image
 *
 * API 문서: https://openrouter.ai/docs/guides/overview/multimodal/image-generation
 */

// 프로덕션에서는 디버그 로그 비활성화
const isDev = process.env.NODE_ENV === 'development'
const log = (message: string) => isDev && console.log(message)
const logError = (message: string) => console.error(message)

/**
 * OpenRouter 설정 검증
 */
function validateOpenRouterConfig() {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error(
      `OpenRouter 설정 오류: OPENROUTER_API_KEY 환경 변수가 필요합니다.\n` +
      `설정 가이드: https://openrouter.ai/keys`
    )
  }

  return { apiKey }
}

/**
 * OpenRouter 이미지 생성 모델
 */
export const OPENROUTER_MODELS = {
  /** Gemini 3 Pro Image - Google의 최고 품질 이미지 생성 모델 */
  GEMINI_3_PRO_IMAGE: 'google/gemini-3-pro-image-preview',

  /** FLUX 2 Pro - Black Forest Labs의 고품질 모델 */
  FLUX_2_PRO: 'black-forest-labs/flux.2-pro',

  /** FLUX 2 Flex - Black Forest Labs의 유연한 모델 */
  FLUX_2_FLEX: 'black-forest-labs/flux.2-flex',

  /** GPT-5 Image - OpenAI의 이미지 생성 모델 */
  GPT_5_IMAGE: 'openai/gpt-5-image',

  /** Riverflow V2 - Sourceful의 이미지 생성 모델 */
  RIVERFLOW_V2: 'sourceful/riverflow-v2-standard-preview',
} as const

export type OpenRouterModel = typeof OPENROUTER_MODELS[keyof typeof OPENROUTER_MODELS]

/**
 * 종횡비 옵션 (Gemini 모델 전용)
 */
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9' | '9:21' | '3:2' | '2:3' | '5:4' | '4:5'

/**
 * 이미지 해상도 옵션 (Gemini 모델 전용)
 */
export type ImageSize = '1K' | '2K' | '4K'

/**
 * OpenRouter 이미지 생성 옵션
 */
export interface OpenRouterImageOptions {
  /** 사용할 모델 (기본값: gemini-3-pro-image-preview) */
  model?: OpenRouterModel
  /** 종횡비 (기본값: 1:1) */
  aspectRatio?: AspectRatio
  /** 이미지 해상도 (기본값: 2K) */
  imageSize?: ImageSize
  /** 소스 이미지 (편집 모드용, base64) */
  sourceImage?: string
  /** 참조 이미지 (base64) */
  refImages?: string[]
  /** 마스크 이미지 (DETAIL_EDIT 모드용, base64) */
  maskImage?: string
}

/**
 * OpenRouter API 응답 타입
 */
interface OpenRouterResponse {
  id: string
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content?: string
      images?: Array<{
        image_url: {
          url: string
        }
      }>
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  error?: {
    message: string
    type: string
    code: string
  }
}

/**
 * Base64 데이터에서 MIME 타입과 순수 데이터 추출
 */
function extractBase64Data(base64String: string): { mimeType: string; data: string } {
  const match = base64String.match(/^data:([^;]+);base64,(.+)$/)
  if (match) {
    return { mimeType: match[1], data: match[2] }
  }
  // data: prefix가 없는 경우 기본값
  return { mimeType: 'image/png', data: base64String }
}

/**
 * OpenRouter를 통한 이미지 생성
 *
 * @param prompt 이미지 생성 프롬프트
 * @param options 생성 옵션
 * @returns base64 인코딩된 이미지 (data URL 형식)
 *
 * @example
 * ```typescript
 * const image = await generateImageWithOpenRouter(
 *   '아름다운 일몰 풍경',
 *   { aspectRatio: '16:9', imageSize: '2K' }
 * )
 * ```
 */
export async function generateImageWithOpenRouter(
  prompt: string,
  options: OpenRouterImageOptions = {}
): Promise<string | null> {
  const { apiKey } = validateOpenRouterConfig()

  const {
    model = OPENROUTER_MODELS.GEMINI_3_PRO_IMAGE,
    aspectRatio = '1:1',
    imageSize = '2K',
    sourceImage,
    refImages,
    maskImage,
  } = options

  log(`[OpenRouter] Generating image with model: ${model}`)

  // 메시지 컨텐츠 구성
  type MessageContent = string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>
  let content: MessageContent = prompt

  // 이미지가 있는 경우 멀티모달 형식으로 변환
  const hasImages = sourceImage || (refImages && refImages.length > 0) || maskImage

  if (hasImages) {
    const parts: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = []

    // 소스 이미지 추가 (편집 모드)
    if (sourceImage) {
      const { mimeType, data } = extractBase64Data(sourceImage)
      parts.push({
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${data}` }
      })
    }

    // 마스크 이미지 추가 (DETAIL_EDIT 모드)
    if (maskImage) {
      const { mimeType, data } = extractBase64Data(maskImage)
      parts.push({
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${data}` }
      })
    }

    // 참조 이미지들 추가
    if (refImages && refImages.length > 0) {
      for (const img of refImages) {
        const { mimeType, data } = extractBase64Data(img)
        parts.push({
          type: 'image_url',
          image_url: { url: `data:${mimeType};base64,${data}` }
        })
      }
    }

    // 프롬프트 추가
    parts.push({ type: 'text', text: prompt })

    content = parts
  }

  // API 요청 본문 구성
  const requestBody: {
    model: string
    messages: Array<{ role: string; content: MessageContent }>
    modalities: string[]
    image_config?: {
      aspect_ratio?: string
      image_size?: string
    }
  } = {
    model,
    messages: [
      {
        role: 'user',
        content,
      }
    ],
    modalities: ['image', 'text'], // 이미지 생성 활성화 필수
  }

  // Gemini 모델인 경우 image_config 추가
  if (model.includes('gemini')) {
    requestBody.image_config = {
      aspect_ratio: aspectRatio,
      image_size: imageSize,
    }
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://flowstudio.app',
        'X-Title': 'FlowStudio',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logError(`[OpenRouter] API error: ${response.status} - ${errorText}`)
      throw new Error(`OpenRouter API 오류: ${response.status} - ${errorText}`)
    }

    const result: OpenRouterResponse = await response.json()

    // 에러 응답 처리
    if (result.error) {
      logError(`[OpenRouter] Error: ${result.error.message}`)
      throw new Error(`OpenRouter 오류: ${result.error.message}`)
    }

    // 이미지 추출
    const images = result.choices?.[0]?.message?.images
    if (images && images.length > 0) {
      const imageUrl = images[0].image_url.url
      log(`[OpenRouter] ✅ Image generated successfully (${imageUrl.substring(0, 50)}...)`)
      return imageUrl
    }

    // 이미지가 없는 경우 텍스트 응답 확인
    const textContent = result.choices?.[0]?.message?.content
    if (textContent) {
      log(`[OpenRouter] Text response received instead of image: ${textContent.substring(0, 100)}...`)
    }

    logError('[OpenRouter] No image in response')
    return null
  } catch (error) {
    logError(`[OpenRouter] Generation failed: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

/**
 * OpenRouter를 통한 배치 이미지 생성
 *
 * @param prompt 이미지 생성 프롬프트
 * @param count 생성할 이미지 수 (1-4)
 * @param options 생성 옵션
 * @returns base64 인코딩된 이미지 배열
 */
export async function generateImagesBatchWithOpenRouter(
  prompt: string,
  count: number = 4,
  options: OpenRouterImageOptions = {}
): Promise<string[]> {
  const imageCount = Math.min(Math.max(count, 1), 4)

  log(`[OpenRouter] Starting batch generation: ${imageCount} images`)

  // 병렬로 이미지 생성
  const promises = Array.from({ length: imageCount }, () =>
    generateImageWithOpenRouter(prompt, options)
  )

  const results = await Promise.all(promises)
  const validImages = results.filter((r): r is string => r !== null)

  log(`[OpenRouter] Batch complete: ${validImages.length}/${imageCount} images generated`)

  return validImages
}

/**
 * OpenRouter를 통한 4K 업스케일
 *
 * @param imageBase64 업스케일할 이미지 (base64)
 * @returns 4K 업스케일된 이미지 (base64 data URL)
 */
export async function upscaleImageWithOpenRouter(
  imageBase64: string
): Promise<string | null> {
  const { apiKey } = validateOpenRouterConfig()

  log('[OpenRouter] Starting 4K upscale')

  const { mimeType, data } = extractBase64Data(imageBase64)

  const requestBody = {
    model: OPENROUTER_MODELS.GEMINI_3_PRO_IMAGE,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${data}` }
          },
          {
            type: 'text',
            text: 'Generate a high-resolution 4K version of this image. Improve texture details, lighting, and sharpness while maintaining the exact composition, content, and style of the original. Do not alter the subject.'
          }
        ]
      }
    ],
    modalities: ['image', 'text'],
    image_config: {
      image_size: '4K',
    },
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://flowstudio.app',
        'X-Title': 'FlowStudio',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logError(`[OpenRouter] Upscale API error: ${response.status} - ${errorText}`)
      throw new Error(`OpenRouter 업스케일 오류: ${response.status} - ${errorText}`)
    }

    const result: OpenRouterResponse = await response.json()

    if (result.error) {
      logError(`[OpenRouter] Upscale error: ${result.error.message}`)
      throw new Error(`OpenRouter 업스케일 오류: ${result.error.message}`)
    }

    const images = result.choices?.[0]?.message?.images
    if (images && images.length > 0) {
      const imageUrl = images[0].image_url.url
      log(`[OpenRouter] ✅ 4K upscale successful`)
      return imageUrl
    }

    logError('[OpenRouter] No image in upscale response')
    return null
  } catch (error) {
    logError(`[OpenRouter] Upscale failed: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

/**
 * OpenRouter API 키 유효성 검사
 */
export function isOpenRouterConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY
}
