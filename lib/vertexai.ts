/**
 * Vertex AI Singleton Client
 *
 * Google Cloud Vertex AI를 통한 Gemini 이미지 생성 API 클라이언트
 * Application Default Credentials (ADC)를 사용하여 인증
 *
 * 인증 방법:
 * 1. 로컬 개발: gcloud auth application-default login
 * 2. 프로덕션: GOOGLE_APPLICATION_CREDENTIALS 환경 변수로 서비스 계정 키 지정
 * 3. Cloud Run/GCE: 자동으로 서비스 계정 사용
 */

import { GoogleGenAI } from '@google/genai'
import { writeFileSync } from 'fs'
import { join } from 'path'

let vertexAIClient: GoogleGenAI | null = null
let credentialsPath: string | null = null

// 프로덕션에서는 디버그 로그 비활성화
const isDev = process.env.NODE_ENV === 'development'
const log = (message: string) => isDev && console.log(message)
const logError = (message: string) => console.error(message) // 에러는 항상 출력

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
 * Vertex AI 클라이언트 싱글톤 가져오기
 *
 * @returns {GoogleGenAI} Vertex AI 인증된 GoogleGenAI 클라이언트
 * @throws {Error} 환경 변수 설정이 잘못되었을 경우
 *
 * @example
 * ```typescript
 * const ai = getVertexAIClient()
 * const response = await ai.models.generateContent({
 *   model: 'gemini-2.5-flash-image',
 *   contents: 'Generate an image of a sunset',
 *   config: { responseModalities: ['IMAGE'] }
 * })
 * ```
 */
export function getVertexAIClient(): GoogleGenAI {
  if (vertexAIClient) {
    return vertexAIClient
  }

  const { project, location } = validateVertexAIConfig()

  // Vercel/Cloud 환경: GOOGLE_APPLICATION_CREDENTIALS를 JSON 문자열로 받아 처리
  const credsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS
  log('[Vertex AI] Checking GOOGLE_APPLICATION_CREDENTIALS...')

  if (credsJson && !credentialsPath) {
    try {
      // JSON 파싱 시도 (파일 경로가 아닌 경우)
      JSON.parse(credsJson) // 유효한 JSON인지 확인
      log('[Vertex AI] ✅ Credentials parsed as JSON')

      // /tmp 디렉토리에 임시 credentials 파일 생성 (Vercel Lambda는 /tmp 쓰기 가능)
      credentialsPath = join('/tmp', `gcp-credentials-${Date.now()}.json`)
      writeFileSync(credentialsPath, credsJson, 'utf8')

      // 환경 변수를 파일 경로로 재설정 (GoogleGenAI가 자동으로 사용)
      process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath
      log('[Vertex AI] ✅ Credentials file created')
    } catch {
      // JSON 파싱 실패 = 이미 파일 경로인 경우 (로컬 개발)
      log('[Vertex AI] Using existing credentials file path')
    }
  } else if (!credsJson) {
    // 로컬 개발 환경: Application Default Credentials (ADC) 사용
    log('[Vertex AI] Using Application Default Credentials (gcloud auth)')
  } else {
    log('[Vertex AI] Credentials already processed')
  }

  // Vertex AI 클라이언트 초기화
  try {
    log(`[Vertex AI] Initializing client (project: ${project}, location: ${location})`)

    vertexAIClient = new GoogleGenAI({
      vertexai: true,
      project,
      location,
    })

    log('[Vertex AI] ✅ Client initialized successfully')
    return vertexAIClient
  } catch (error) {
    logError(`[Vertex AI] ❌ Failed to initialize: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

/**
 * 이미지 생성용 모델 이름 상수
 */
export const VERTEX_AI_MODELS = {
  /** 2K 이미지 생성 (미리보기) - 현재 사용 중 */
  GEMINI_3_PRO_IMAGE_PREVIEW: 'gemini-3-pro-image-preview',

  /** Gemini 2.5 Flash 이미지 모델 (최신) */
  GEMINI_2_5_FLASH_IMAGE: 'gemini-2.5-flash-image',
} as const

/**
 * Vertex AI 클라이언트 재초기화 (테스트용)
 * 프로덕션에서는 사용하지 마세요.
 */
export function resetVertexAIClient() {
  vertexAIClient = null
}
