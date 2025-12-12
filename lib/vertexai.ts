/**
 * GenAI Dual-Mode Client (Google AI Studio / Vertex AI)
 *
 * 환경 변수: GOOGLE_GENAI_USE_VERTEXAI
 * - false (기본값): Google AI Studio API 사용
 * - true: Vertex AI API 사용
 *
 * Google AI Studio 모드 (GOOGLE_GENAI_USE_VERTEXAI=false):
 * - GOOGLE_API_KEY 환경 변수 필요
 * - 빠른 응답 속도
 *
 * Vertex AI 모드 (GOOGLE_GENAI_USE_VERTEXAI=true):
 * - GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION 환경 변수 필요
 * - GOOGLE_APPLICATION_CREDENTIALS (서비스 계정 키) 필요
 */

import { GoogleGenAI } from '@google/genai'
import { writeFileSync } from 'fs'
import { join } from 'path'

let genAIClient: GoogleGenAI | null = null
let credentialsPath: string | null = null

// 프로덕션에서는 디버그 로그 비활성화
const isDev = process.env.NODE_ENV === 'development'
const log = (message: string) => isDev && console.log(message)
const logError = (message: string) => console.error(message) // 에러는 항상 출력

/**
 * 현재 GenAI 모드 확인
 * @returns {'google-ai-studio' | 'vertex-ai'} 현재 모드
 *
 * 환경 변수: GOOGLE_GENAI_USE_VERTEXAI
 * - true: Vertex AI 모드
 * - false 또는 미설정: Google AI Studio 모드 (기본값)
 */
export function getGenAIMode(): 'google-ai-studio' | 'vertex-ai' {
  const useVertexAI = process.env.GOOGLE_GENAI_USE_VERTEXAI?.toLowerCase()
  if (useVertexAI === 'true') {
    return 'vertex-ai'
  }
  return 'google-ai-studio' // 기본값
}

/**
 * Google AI Studio 환경 변수 검증
 * @throws {Error} 필수 환경 변수가 없을 경우
 */
function validateGoogleAIStudioConfig() {
  const apiKey = process.env.GOOGLE_API_KEY

  if (!apiKey) {
    throw new Error(
      `Google AI Studio 설정 오류: GOOGLE_API_KEY 환경 변수가 필요합니다.\n` +
      `설정 가이드: https://aistudio.google.com/apikey`
    )
  }

  return { apiKey }
}

/**
 * Vertex AI 환경 변수 검증
 * @throws {Error} 필수 환경 변수가 없을 경우
 */
function validateVertexAIConfig() {
  const requiredVars = {
    GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
    GOOGLE_CLOUD_LOCATION: process.env.GOOGLE_CLOUD_LOCATION,
  }

  const missing = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(
      `Vertex AI 설정 오류: 다음 환경 변수가 필요합니다: ${missing.join(', ')}\n` +
      `설정 가이드: https://cloud.google.com/vertex-ai/docs/start/cloud-environment`
    )
  }

  return {
    project: requiredVars.GOOGLE_CLOUD_PROJECT!,
    location: requiredVars.GOOGLE_CLOUD_LOCATION!,
  }
}

/**
 * Google AI Studio 클라이언트 초기화
 * SDK가 자동으로 generativelanguage.googleapis.com 엔드포인트 선택
 */
function initGoogleAIStudioClient(): GoogleGenAI {
  const { apiKey } = validateGoogleAIStudioConfig()

  log('[GenAI] Initializing Google AI Studio client...')

  // 공식 문서: new GoogleGenAI({ apiKey }) 또는 빈 객체 (환경변수 자동 로드)
  const client = new GoogleGenAI({ apiKey })

  log('[GenAI] ✅ Google AI Studio client initialized successfully')
  return client
}

/**
 * Vertex AI 클라이언트 초기화
 */
function initVertexAIClient(): GoogleGenAI {
  const { project, location } = validateVertexAIConfig()

  // Vercel/Cloud 환경: GOOGLE_APPLICATION_CREDENTIALS를 JSON 문자열로 받아 처리
  const credsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS
  log('[GenAI] Checking GOOGLE_APPLICATION_CREDENTIALS...')

  if (credsJson && !credentialsPath) {
    try {
      // JSON 파싱 시도 (파일 경로가 아닌 경우)
      JSON.parse(credsJson) // 유효한 JSON인지 확인
      log('[GenAI] ✅ Credentials parsed as JSON')

      // /tmp 디렉토리에 임시 credentials 파일 생성 (Vercel Lambda는 /tmp 쓰기 가능)
      credentialsPath = join('/tmp', `gcp-credentials-${Date.now()}.json`)
      writeFileSync(credentialsPath, credsJson, 'utf8')

      // 환경 변수를 파일 경로로 재설정 (GoogleGenAI가 자동으로 사용)
      process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath
      log('[GenAI] ✅ Credentials file created')
    } catch {
      // JSON 파싱 실패 = 이미 파일 경로인 경우 (로컬 개발)
      log('[GenAI] Using existing credentials file path')
    }
  } else if (!credsJson) {
    // 로컬 개발 환경: Application Default Credentials (ADC) 사용
    log('[GenAI] Using Application Default Credentials (gcloud auth)')
  } else {
    log('[GenAI] Credentials already processed')
  }

  log(`[GenAI] Initializing Vertex AI client (project: ${project}, location: ${location})`)

  const client = new GoogleGenAI({
    vertexai: true,
    project,
    location,
  })

  log('[GenAI] ✅ Vertex AI client initialized successfully')
  return client
}

/**
 * GenAI 클라이언트 싱글톤 가져오기 (듀얼 모드 지원)
 *
 * @returns {GoogleGenAI} 인증된 GoogleGenAI 클라이언트
 * @throws {Error} 환경 변수 설정이 잘못되었을 경우
 *
 * @example
 * ```typescript
 * const ai = getGenAIClient()
 * const response = await ai.models.generateContent({
 *   model: 'gemini-3-pro-image-preview',
 *   contents: 'Generate an image of a sunset',
 *   config: { responseModalities: ['IMAGE'] }
 * })
 * ```
 */
export function getGenAIClient(): GoogleGenAI {
  if (genAIClient) {
    return genAIClient
  }

  const mode = getGenAIMode()
  log(`[GenAI] Mode: ${mode}`)

  try {
    if (mode === 'google-ai-studio') {
      genAIClient = initGoogleAIStudioClient()
    } else {
      genAIClient = initVertexAIClient()
    }
    return genAIClient
  } catch (error) {
    logError(`[GenAI] ❌ Failed to initialize: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

/**
 * @deprecated getVertexAIClient는 getGenAIClient로 대체되었습니다.
 * 호환성을 위해 유지되며, 내부적으로 getGenAIClient를 호출합니다.
 */
export function getVertexAIClient(): GoogleGenAI {
  return getGenAIClient()
}

/**
 * 이미지 생성용 모델 이름 상수
 *
 * Gemini 3 Pro Image: Google AI Studio / Vertex AI 모두 지원
 * Imagen 4: Vertex AI 전용 (generateImages API)
 */
export const VERTEX_AI_MODELS = {
  /** Gemini 3 Pro Image - 최고 품질 이미지 생성/편집 모델 (Google AI Studio & Vertex AI) */
  GEMINI_3_PRO_IMAGE: 'gemini-3-pro-image-preview',

  /** Imagen 4 Fast - 최고 속도 (Vertex AI 전용) */
  IMAGEN_4_FAST: 'imagen-4.0-fast-generate-001',

  /** Imagen 4 - 표준 품질 (Vertex AI 전용) */
  IMAGEN_4: 'imagen-4.0-generate-001',

  /** Imagen 4 Ultra - 최고 품질 (Vertex AI 전용) */
  IMAGEN_4_ULTRA: 'imagen-4.0-ultra-generate-001',
} as const

/**
 * GenAI 클라이언트 재초기화 (테스트용)
 * 프로덕션에서는 사용하지 마세요.
 */
export function resetGenAIClient() {
  genAIClient = null
}

/**
 * @deprecated resetVertexAIClient는 resetGenAIClient로 대체되었습니다.
 */
export function resetVertexAIClient() {
  resetGenAIClient()
}
