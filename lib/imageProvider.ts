/**
 * Unified Image Generation Provider
 *
 * 이미지 생성 프로바이더 통합 레이어
 * - Google GenAI (Google AI Studio / Vertex AI)
 * - OpenRouter (Gemini, FLUX, GPT-5 Image 등)
 *
 * 환경 변수: IMAGE_PROVIDER
 * - 'google' (기본값): Google GenAI 사용 (GOOGLE_GENAI_USE_VERTEXAI로 세부 모드 선택)
 * - 'openrouter': OpenRouter API 사용 (OPENROUTER_API_KEY 필요)
 * - 'hybrid': 하이브리드 전략 (배치 크기 기반 자동 선택 + fallback)
 *
 * 하이브리드 전략 환경 변수:
 * - IMAGE_HYBRID_THRESHOLD: 이 값 이상 배치 시 OpenRouter 우선 (기본값: 2)
 * - IMAGE_FALLBACK_ENABLED: 실패 시 다른 프로바이더로 재시도 (기본값: true)
 */

import { getGenAIClient, getGenAIMode, VERTEX_AI_MODELS } from './vertexai'
import {
  generateImageWithOpenRouter,
  upscaleImageWithOpenRouter,
  OPENROUTER_MODELS,
  isOpenRouterConfigured,
  type OpenRouterImageOptions,
  type AspectRatio,
} from './openrouter'
import { extractBase64Data } from './utils/imageConverter'
import { genaiLogger } from './logger'

// 프로덕션에서는 디버그 로그 비활성화
const isDev = process.env.NODE_ENV === 'development'
const log = (message: string) => isDev && console.log(message)
const logError = (message: string) => console.error(message)

/**
 * 이미지 프로바이더 타입
 */
export type ImageProvider = 'google' | 'openrouter'

/**
 * 이미지 프로바이더 전략 타입
 */
export type ImageProviderStrategy = 'google' | 'openrouter' | 'hybrid'

/**
 * 배치 생성 결과 (프로바이더 메타데이터 포함)
 */
export interface BatchGenerationResult {
  /** 생성된 이미지 배열 (base64 data URL) */
  images: string[]
  /** 실제 사용된 프로바이더 */
  provider: ImageProvider
  /** fallback 사용 여부 */
  fallbackUsed: boolean
}

/**
 * Google GenAI 설정 여부 확인
 */
export function isGoogleConfigured(): boolean {
  const useVertexAI = process.env.GOOGLE_GENAI_USE_VERTEXAI === 'true'
  if (useVertexAI) {
    return !!process.env.GOOGLE_CLOUD_PROJECT
  }
  return !!process.env.GOOGLE_API_KEY
}

/**
 * Rate limit 관련 에러인지 확인
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    return (
      msg.includes('rate') ||
      msg.includes('quota') ||
      msg.includes('resource exhausted') ||
      msg.includes('429') ||
      msg.includes('too many requests') ||
      msg.includes('limit exceeded')
    )
  }
  return false
}

/**
 * 현재 프로바이더 전략 확인
 */
export function getProviderStrategy(): ImageProviderStrategy {
  const strategy = process.env.IMAGE_PROVIDER?.toLowerCase()
  if (strategy === 'openrouter' || strategy === 'hybrid') {
    return strategy
  }
  return 'google' // 기본값
}

/**
 * 배치 크기 기반 프로바이더 선택 (Hybrid 전략)
 *
 * @param batchCount 생성할 이미지 수
 * @returns 선택된 프로바이더
 */
export function selectProviderForBatch(batchCount: number = 1): ImageProvider {
  const strategy = getProviderStrategy()

  // 단일 프로바이더 모드
  if (strategy === 'google') {
    return isGoogleConfigured() ? 'google' : 'openrouter'
  }
  if (strategy === 'openrouter') {
    return isOpenRouterConfigured() ? 'openrouter' : 'google'
  }

  // Hybrid 모드: 배치 크기 기반 선택
  const threshold = parseInt(process.env.IMAGE_HYBRID_THRESHOLD || '2', 10)

  // 배치 크기가 threshold 이상이면 OpenRouter 우선 (rate limit 방지)
  if (batchCount >= threshold) {
    if (isOpenRouterConfigured()) {
      log(`[ImageProvider/Hybrid] Batch ${batchCount} >= threshold ${threshold} → OpenRouter`)
      return 'openrouter'
    }
    log(`[ImageProvider/Hybrid] OpenRouter not configured, falling back to Google`)
    return 'google'
  }

  // 단일/소량 요청은 Google 우선 (빠른 응답)
  if (isGoogleConfigured()) {
    log(`[ImageProvider/Hybrid] Batch ${batchCount} < threshold ${threshold} → Google`)
    return 'google'
  }
  log(`[ImageProvider/Hybrid] Google not configured, falling back to OpenRouter`)
  return 'openrouter'
}

/**
 * Fallback 활성화 여부 확인
 */
function isFallbackEnabled(): boolean {
  return process.env.IMAGE_FALLBACK_ENABLED !== 'false'
}

/**
 * 대체 프로바이더 반환
 */
function getAlternativeProvider(current: ImageProvider): ImageProvider | null {
  if (current === 'google' && isOpenRouterConfigured()) {
    return 'openrouter'
  }
  if (current === 'openrouter' && isGoogleConfigured()) {
    return 'google'
  }
  return null
}

/**
 * 현재 이미지 프로바이더 확인
 */
export function getImageProvider(): ImageProvider {
  const provider = process.env.IMAGE_PROVIDER?.toLowerCase()

  if (provider === 'openrouter') {
    if (!isOpenRouterConfigured()) {
      logError('[ImageProvider] OpenRouter selected but OPENROUTER_API_KEY not configured. Falling back to Google.')
      return 'google'
    }
    return 'openrouter'
  }

  return 'google' // 기본값
}

/**
 * 현재 프로바이더의 상세 모드 정보
 */
export function getProviderMode(): string {
  const provider = getImageProvider()

  if (provider === 'openrouter') {
    return 'openrouter'
  }

  // Google 프로바이더인 경우 세부 모드 확인
  return getGenAIMode()
}

/**
 * 이미지 생성 옵션
 */
export interface ImageGenerationOptions {
  /** 종횡비 */
  aspectRatio?: AspectRatio
  /** 이미지 해상도 (2K 기본값) */
  imageSize?: '1K' | '2K' | '4K'
  /** 소스 이미지 (편집 모드용, base64) */
  sourceImage?: string | null
  /** 참조 이미지 (base64) */
  refImage?: string | null
  /** 참조 이미지 배열 (COMPOSITE 모드) */
  refImages?: string[]
  /** 로고 이미지 (base64) */
  logoImage?: string | null
  /** 마스크 이미지 (DETAIL_EDIT 모드용, base64) */
  maskImage?: string | null
  /** 생성 모드 */
  mode?: string
}

/**
 * 특정 프로바이더로 이미지 생성 (내부용)
 */
async function generateWithProvider(
  provider: ImageProvider,
  prompt: string,
  options: ImageGenerationOptions
): Promise<string | null> {
  if (provider === 'openrouter') {
    return generateWithOpenRouter(prompt, options)
  }
  return generateWithGoogle(prompt, options)
}

/**
 * 통합 이미지 생성 함수
 *
 * 환경 변수에 따라 Google GenAI 또는 OpenRouter를 사용하여 이미지 생성
 *
 * @param prompt 이미지 생성 프롬프트
 * @param options 생성 옵션
 * @returns base64 인코딩된 이미지 (data URL 형식) 또는 null
 */
export async function generateImage(
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<string | null> {
  const provider = getImageProvider()

  log(`[ImageProvider] Generating with provider: ${provider}`)

  if (provider === 'openrouter') {
    return generateWithOpenRouter(prompt, options)
  }

  return generateWithGoogle(prompt, options)
}

/**
 * Fallback을 포함한 단일 이미지 생성 (내부용)
 *
 * Rate limit 에러 발생 시 대체 프로바이더로 재시도
 */
async function generateImageWithFallback(
  primaryProvider: ImageProvider,
  prompt: string,
  options: ImageGenerationOptions
): Promise<{ image: string | null; provider: ImageProvider; fallbackUsed: boolean }> {
  try {
    const image = await generateWithProvider(primaryProvider, prompt, options)
    return { image, provider: primaryProvider, fallbackUsed: false }
  } catch (error) {
    // Fallback이 활성화되어 있고, rate limit 에러인 경우에만 재시도
    if (isFallbackEnabled() && isRateLimitError(error)) {
      const alternativeProvider = getAlternativeProvider(primaryProvider)
      if (alternativeProvider) {
        log(`[ImageProvider/Fallback] ${primaryProvider} rate limited, trying ${alternativeProvider}`)
        try {
          const image = await generateWithProvider(alternativeProvider, prompt, options)
          return { image, provider: alternativeProvider, fallbackUsed: true }
        } catch (fallbackError) {
          logError(`[ImageProvider/Fallback] ${alternativeProvider} also failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`)
          throw fallbackError
        }
      }
    }
    throw error
  }
}

/**
 * 배치 이미지 생성 (여러 장 동시 생성) - 하이브리드 전략 지원
 *
 * @param prompt 이미지 생성 프롬프트
 * @param count 생성할 이미지 수 (1-4)
 * @param options 생성 옵션
 * @returns base64 인코딩된 이미지 배열
 */
export async function generateImagesBatch(
  prompt: string,
  count: number = 4,
  options: ImageGenerationOptions = {}
): Promise<string[]> {
  const result = await generateImagesBatchWithMeta(prompt, count, options)
  return result.images
}

/**
 * 배치 이미지 생성 (메타데이터 포함) - 하이브리드 전략 지원
 *
 * @param prompt 이미지 생성 프롬프트
 * @param count 생성할 이미지 수 (1-4)
 * @param options 생성 옵션
 * @returns 생성 결과 (이미지 배열 + 프로바이더 정보)
 */
export async function generateImagesBatchWithMeta(
  prompt: string,
  count: number = 4,
  options: ImageGenerationOptions = {}
): Promise<BatchGenerationResult> {
  const imageCount = Math.min(Math.max(count, 1), 4)

  // 하이브리드 전략: 배치 크기 기반 프로바이더 선택
  const primaryProvider = selectProviderForBatch(imageCount)

  log(`[ImageProvider] Batch generating ${imageCount} images with provider: ${primaryProvider} (strategy: ${getProviderStrategy()})`)

  // 병렬로 이미지 생성 (각각 fallback 포함)
  const promises = Array.from({ length: imageCount }, () =>
    generateImageWithFallback(primaryProvider, prompt, options)
  )

  // Promise.allSettled로 개별 실패 허용
  const settledResults = await Promise.allSettled(promises)

  const validImages: string[] = []
  let usedProvider: ImageProvider = primaryProvider
  let fallbackUsed = false

  for (const result of settledResults) {
    if (result.status === 'fulfilled' && result.value.image) {
      validImages.push(result.value.image)
      // 마지막으로 성공한 프로바이더 기록
      usedProvider = result.value.provider
      if (result.value.fallbackUsed) {
        fallbackUsed = true
      }
    } else if (result.status === 'rejected') {
      logError(`[ImageProvider] Individual generation failed: ${result.reason}`)
    }
  }

  log(`[ImageProvider] Batch complete: ${validImages.length}/${imageCount} images (provider: ${usedProvider}, fallback: ${fallbackUsed})`)

  return {
    images: validImages,
    provider: usedProvider,
    fallbackUsed,
  }
}

/**
 * Google GenAI를 통한 이미지 생성
 */
async function generateWithGoogle(
  prompt: string,
  options: ImageGenerationOptions
): Promise<string | null> {
  const ai = getGenAIClient()
  const imageModel = VERTEX_AI_MODELS.GEMINI_3_PRO_IMAGE

  const {
    aspectRatio = '1:1',
    imageSize = '2K',
    sourceImage,
    refImage,
    refImages,
    logoImage,
    maskImage,
    mode,
  } = options

  log(`[ImageProvider/Google] Using model: ${imageModel}`)

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  // Source image 추가 (EDIT, DETAIL_EDIT, POSTER 모드)
  if (sourceImage) {
    const { mimeType, data } = extractBase64Data(sourceImage)
    parts.push({ inlineData: { mimeType, data } })
  }

  // 마스크 이미지 추가 (DETAIL_EDIT 모드)
  if (maskImage && mode === 'DETAIL_EDIT') {
    const { mimeType, data } = extractBase64Data(maskImage)
    parts.push({ inlineData: { mimeType, data } })
  }

  // COMPOSITE 모드: 다중 이미지 배열 추가
  if (refImages && refImages.length > 0) {
    for (const img of refImages) {
      const { mimeType, data } = extractBase64Data(img)
      parts.push({ inlineData: { mimeType, data } })
    }
  }

  // Reference image 또는 Logo image 추가 (단일 이미지 모드)
  const secondaryImage = refImage || logoImage
  if (secondaryImage && (!refImages || refImages.length === 0)) {
    const { mimeType, data } = extractBase64Data(secondaryImage)
    parts.push({ inlineData: { mimeType, data } })
  }

  // DETAIL_EDIT 모드에서 마스크 사용 시 프롬프트 보강
  let enhancedPrompt = prompt
  if (maskImage && mode === 'DETAIL_EDIT') {
    enhancedPrompt = `You are given two images:
1. The ORIGINAL image (first image)
2. The MASK image (second image) - shows a RED semi-transparent overlay on the area to be edited

TASK: Edit ONLY the area marked with the RED overlay in the original image.

User's edit instruction: ${prompt}

CRITICAL RULES:
- ONLY modify the red-highlighted area
- Keep ALL other areas EXACTLY the same as the original
- Blend the edited area seamlessly with surroundings
- Match lighting, colors, and style of the original
- Output the complete edited image at the same size as the original`
  }

  // Text prompt 추가
  parts.push({ text: enhancedPrompt })

  try {
    const response = await ai.models.generateContent({
      model: imageModel,
      contents: parts,
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: imageSize,
        },
      },
    })

    // Gemini 응답에서 이미지 추출
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
      }
    }

    log('[ImageProvider/Google] No image in response')
    return null
  } catch (error) {
    logError(`[ImageProvider/Google] Generation failed: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

/**
 * OpenRouter를 통한 이미지 생성
 */
async function generateWithOpenRouter(
  prompt: string,
  options: ImageGenerationOptions
): Promise<string | null> {
  const {
    aspectRatio = '1:1',
    imageSize: requestedSize = '2K',
    sourceImage,
    refImage,
    refImages,
    logoImage,
    maskImage,
    mode,
  } = options

  // OpenRouter 해상도 설정
  // - Fluid Compute (maxDuration: 300초) 적용으로 2K 사용 가능
  // - 로컬: ~10초, Vercel: ~100초
  const imageSize = requestedSize

  log('[ImageProvider/OpenRouter] Generating image')
  genaiLogger.info('OpenRouter generation', { imageSize, aspectRatio, mode })

  // DETAIL_EDIT 모드에서 마스크 사용 시 프롬프트 보강
  let enhancedPrompt = prompt
  if (maskImage && mode === 'DETAIL_EDIT') {
    enhancedPrompt = `You are given two images:
1. The ORIGINAL image (first image)
2. The MASK image (second image) - shows a RED semi-transparent overlay on the area to be edited

TASK: Edit ONLY the area marked with the RED overlay in the original image.

User's edit instruction: ${prompt}

CRITICAL RULES:
- ONLY modify the red-highlighted area
- Keep ALL other areas EXACTLY the same as the original
- Blend the edited area seamlessly with surroundings
- Match lighting, colors, and style of the original
- Output the complete edited image at the same size as the original`
  }

  // OpenRouter 옵션 구성
  const openRouterOptions: OpenRouterImageOptions = {
    model: OPENROUTER_MODELS.GEMINI_3_PRO_IMAGE, // Gemini와 동일 모델 사용
    aspectRatio: aspectRatio as AspectRatio,
    imageSize: imageSize as '1K' | '2K' | '4K',
    sourceImage: sourceImage || undefined,
    maskImage: maskImage || undefined,
    refImages: [],
  }

  // 참조 이미지 구성
  if (refImages && refImages.length > 0) {
    openRouterOptions.refImages = refImages
  } else if (refImage) {
    openRouterOptions.refImages = [refImage]
  } else if (logoImage) {
    openRouterOptions.refImages = [logoImage]
  }

  genaiLogger.info('Calling OpenRouter API', { model: openRouterOptions.model, imageSize: openRouterOptions.imageSize, aspectRatio: openRouterOptions.aspectRatio })
  return generateImageWithOpenRouter(enhancedPrompt, openRouterOptions)
}

/**
 * 프로바이더 설정 상태 확인
 */
export function getProviderStatus(): {
  provider: ImageProvider
  strategy: ImageProviderStrategy
  mode: string
  configured: boolean
  hybridConfig: {
    threshold: number
    fallbackEnabled: boolean
  }
  details: Record<string, boolean>
} {
  const strategy = getProviderStrategy()
  const provider = getImageProvider()
  const mode = getProviderMode()

  const details: Record<string, boolean> = {
    googleApiKey: !!process.env.GOOGLE_API_KEY,
    googleCloudProject: !!process.env.GOOGLE_CLOUD_PROJECT,
    openRouterApiKey: !!process.env.OPENROUTER_API_KEY,
  }

  // Hybrid 모드에서는 둘 중 하나라도 설정되어 있으면 configured
  let configured = false
  if (strategy === 'hybrid') {
    configured = details.googleApiKey || details.googleCloudProject || details.openRouterApiKey
  } else if (provider === 'openrouter') {
    configured = details.openRouterApiKey
  } else {
    // Google 프로바이더
    if (mode === 'vertex-ai') {
      configured = details.googleCloudProject
    } else {
      configured = details.googleApiKey
    }
  }

  const hybridConfig = {
    threshold: parseInt(process.env.IMAGE_HYBRID_THRESHOLD || '2', 10),
    fallbackEnabled: isFallbackEnabled(),
  }

  return { provider, strategy, mode, configured, hybridConfig, details }
}

/**
 * 이미지당 예상 비용 (USD)
 * OpenRouter Gemini: $0.067 (입력) + 출력 비용
 * Google AI Studio: $0.14 (추정)
 */
export function getEstimatedCostPerImage(): number {
  const provider = getImageProvider()

  if (provider === 'openrouter') {
    return 0.07 // OpenRouter Gemini 대략적 비용
  }

  return 0.14 // Google GenAI 비용
}

/**
 * 4K 업스케일
 *
 * 업스케일은 항상 Google GenAI를 사용 (OpenRouter는 느리고 품질이 낮음)
 *
 * @param imageBase64 업스케일할 이미지 (base64)
 * @returns 4K 업스케일된 이미지 (base64 data URL)
 */
export async function upscaleImage(imageBase64: string): Promise<string | null> {
  // 업스케일은 Google이 빠르고 품질이 좋으므로 항상 Google 사용
  // OpenRouter 업스케일: ~235초, 품질 낮음
  // Google 업스케일: ~10초, 품질 좋음
  log('[ImageProvider] Upscaling with Google (always)')

  return upscaleWithGoogle(imageBase64)
}

/**
 * Google GenAI를 통한 4K 업스케일
 */
async function upscaleWithGoogle(imageBase64: string): Promise<string | null> {
  const ai = getGenAIClient()
  const imageModel = VERTEX_AI_MODELS.GEMINI_3_PRO_IMAGE

  log(`[ImageProvider/Google] Upscaling with model: ${imageModel}`)

  const { mimeType, data } = extractBase64Data(imageBase64)

  const parts = [
    {
      inlineData: {
        mimeType,
        data,
      }
    },
    {
      text: 'Generate a high-resolution 4K version of this image. Improve texture details, lighting, and sharpness while maintaining the exact composition, content, and style of the original. Do not alter the subject.'
    }
  ]

  try {
    const response = await ai.models.generateContent({
      model: imageModel,
      contents: { parts },
      config: {
        imageConfig: {
          imageSize: '4K',
        },
      }
    })

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
      }
    }

    log('[ImageProvider/Google] No image in upscale response')
    return null
  } catch (error) {
    logError(`[ImageProvider/Google] Upscale failed: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

/**
 * OpenRouter를 통한 4K 업스케일
 */
async function upscaleWithOpenRouter(imageBase64: string): Promise<string | null> {
  log('[ImageProvider/OpenRouter] Upscaling image')
  return upscaleImageWithOpenRouter(imageBase64)
}
