/**
 * 워터마크 유틸리티
 *
 * FREE 플랜 사용자의 이미지에 로고 워터마크를 추가합니다.
 * 워터마크는 이미지 우하단에 반투명 로고로 표시됩니다.
 *
 * 구독 플랜별 워터마크 정책:
 * - FREE: 워터마크 포함
 * - PLUS/PRO/BUSINESS: 워터마크 제거
 *
 * Vercel 배포 환경 최적화:
 * - 로고 Buffer 싱글톤 캐싱으로 I/O 최소화
 * - 리사이즈된 로고 캐싱으로 처리 시간 단축
 * - 4장 이미지 병렬 처리
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { logger } from '@/lib/logger'

// 워터마크 설정
const WATERMARK_OPACITY = 0.5 // 로고 투명도 (50%)
const WATERMARK_SIZE_RATIO = 0.08 // 이미지 높이의 8%
const WATERMARK_MIN_SIZE = 32 // 최소 로고 크기 (px)
const WATERMARK_MAX_SIZE = 150 // 최대 로고 크기 (px)
const WATERMARK_PADDING_RATIO = 0.02 // 이미지 크기의 2% 패딩

// 로고 Buffer 싱글톤 캐시 (Vercel Serverless 콜드 스타트 최적화)
let logoBufferCache: Buffer | null = null
let logoLoadError: Error | null = null

/**
 * 로고 파일을 로드하고 캐싱합니다.
 * Vercel 환경에서도 안정적으로 작동합니다.
 */
async function getLogoBuffer(): Promise<Buffer | null> {
  // 이미 로드된 경우 캐시 반환
  if (logoBufferCache) {
    return logoBufferCache
  }

  // 이전에 로드 실패한 경우 null 반환 (재시도 방지)
  if (logoLoadError) {
    return null
  }

  try {
    // Vercel 환경: process.cwd()는 프로젝트 루트
    const logoPath = path.join(process.cwd(), 'public', 'FlowStudio_icon-removebg.png')

    // 동기 로드로 일관된 동작 보장
    logoBufferCache = fs.readFileSync(logoPath)
    logger.debug('Logo loaded successfully', { module: 'Watermark', path: logoPath })
    return logoBufferCache
  } catch (error) {
    logoLoadError = error as Error
    logger.error('Failed to load logo', { module: 'Watermark' }, error instanceof Error ? error : new Error(String(error)))
    return null
  }
}

/**
 * 로고에 투명도를 적용하고 리사이즈합니다.
 */
async function prepareWatermarkLogo(
  logoBuffer: Buffer,
  targetSize: number
): Promise<Buffer> {
  // 로고 리사이즈 (비율 유지)
  const resizedLogo = await sharp(logoBuffer)
    .resize(targetSize, targetSize, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .ensureAlpha() // 알파 채널 보장
    .toBuffer()

  // 투명도 적용: 픽셀별 알파 값 조정
  const { data, info } = await sharp(resizedLogo)
    .raw()
    .toBuffer({ resolveWithObject: true })

  // RGBA 데이터에서 알파 채널 조정
  const adjustedData = Buffer.from(data)
  for (let i = 3; i < adjustedData.length; i += 4) {
    // 알파 채널 (4번째 바이트)에 투명도 적용
    adjustedData[i] = Math.round(adjustedData[i] * WATERMARK_OPACITY)
  }

  // 조정된 데이터를 PNG로 변환
  return sharp(adjustedData, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer()
}

/**
 * Base64 이미지에 로고 워터마크를 추가합니다.
 * @param base64Image - data:image/...;base64,... 형식의 base64 이미지
 * @returns 워터마크가 추가된 base64 이미지
 */
export async function addWatermark(base64Image: string): Promise<string> {
  try {
    // 로고 로드 (캐시됨)
    const logoBuffer = await getLogoBuffer()
    if (!logoBuffer) {
      logger.warn('Logo not available, returning original image', { module: 'Watermark' })
      return base64Image
    }

    // base64 데이터 추출
    const matches = base64Image.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) {
      logger.error('Invalid base64 image format', { module: 'Watermark' })
      return base64Image
    }

    const format = matches[1] as 'png' | 'jpeg' | 'webp'
    const base64Data = matches[2]
    const imageBuffer = Buffer.from(base64Data, 'base64')

    // 이미지 메타데이터 가져오기
    const metadata = await sharp(imageBuffer).metadata()
    const { width = 1024, height = 1024 } = metadata

    // 워터마크 크기 계산 (이미지 높이 기준)
    const logoSize = Math.max(
      WATERMARK_MIN_SIZE,
      Math.min(WATERMARK_MAX_SIZE, Math.round(height * WATERMARK_SIZE_RATIO))
    )
    const padding = Math.round(Math.min(width, height) * WATERMARK_PADDING_RATIO)

    // 로고 준비 (리사이즈 + 투명도)
    const preparedLogo = await prepareWatermarkLogo(logoBuffer, logoSize)

    // 준비된 로고의 실제 크기 확인
    const logoMeta = await sharp(preparedLogo).metadata()
    const actualLogoWidth = logoMeta.width || logoSize
    const actualLogoHeight = logoMeta.height || logoSize

    // 우측 하단 위치 계산
    const left = width - actualLogoWidth - padding
    const top = height - actualLogoHeight - padding

    // 이미지에 워터마크 합성
    const watermarkedBuffer = await sharp(imageBuffer)
      .composite([
        {
          input: preparedLogo,
          top: Math.max(0, top),
          left: Math.max(0, left),
        },
      ])
      .toFormat(format, { quality: 95 })
      .toBuffer()

    // base64로 변환하여 반환
    const watermarkedBase64 = watermarkedBuffer.toString('base64')
    return `data:image/${format};base64,${watermarkedBase64}`
  } catch (error) {
    logger.error('Failed to add watermark', { module: 'Watermark' }, error instanceof Error ? error : new Error(String(error)))
    return base64Image // 에러 시 원본 반환
  }
}

/**
 * 여러 이미지에 워터마크를 일괄 추가합니다.
 * 병렬 처리로 성능을 최적화합니다.
 * @param base64Images - base64 이미지 배열
 * @returns 워터마크가 추가된 base64 이미지 배열
 */
export async function addWatermarkBatch(base64Images: string[]): Promise<string[]> {
  // 로고 사전 로드 (첫 번째 이미지 처리 전에 캐싱)
  await getLogoBuffer()

  // 병렬 처리
  return Promise.all(base64Images.map(addWatermark))
}

/**
 * 로고 캐시를 초기화합니다. (테스트용)
 */
export function clearLogoCache(): void {
  logoBufferCache = null
  logoLoadError = null
}
