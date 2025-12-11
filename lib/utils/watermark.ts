/**
 * 워터마크 유틸리티
 *
 * FREE 플랜 사용자의 이미지에 워터마크를 추가합니다.
 * 워터마크는 이미지 우하단에 반투명 텍스트로 표시됩니다.
 *
 * 구독 플랜별 워터마크 정책:
 * - FREE: 워터마크 포함
 * - PLUS/PRO/BUSINESS: 워터마크 제거
 */

import sharp from 'sharp'

const WATERMARK_TEXT = 'FlowStudio'
const WATERMARK_OPACITY = 0.5
const WATERMARK_FONT_SIZE_RATIO = 0.04 // 이미지 높이의 4%
const WATERMARK_PADDING_RATIO = 0.02 // 이미지 크기의 2%

/**
 * Base64 이미지에 워터마크를 추가합니다.
 * @param base64Image - data:image/...;base64,... 형식의 base64 이미지
 * @returns 워터마크가 추가된 base64 이미지
 */
export async function addWatermark(base64Image: string): Promise<string> {
  try {
    // base64 데이터 추출
    const matches = base64Image.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) {
      console.error('[Watermark] Invalid base64 image format')
      return base64Image // 원본 반환
    }

    const format = matches[1] as 'png' | 'jpeg' | 'webp'
    const base64Data = matches[2]
    const imageBuffer = Buffer.from(base64Data, 'base64')

    // 이미지 메타데이터 가져오기
    const metadata = await sharp(imageBuffer).metadata()
    const { width = 1024, height = 1024 } = metadata

    // 워터마크 크기 계산
    const fontSize = Math.max(16, Math.round(height * WATERMARK_FONT_SIZE_RATIO))
    const padding = Math.round(Math.min(width, height) * WATERMARK_PADDING_RATIO)

    // SVG 워터마크 생성 (우하단 배치)
    const svgWidth = width
    const svgHeight = height
    const textX = svgWidth - padding
    const textY = svgHeight - padding

    const svgWatermark = Buffer.from(`
      <svg width="${svgWidth}" height="${svgHeight}">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="1" stdDeviation="1" flood-color="black" flood-opacity="0.5"/>
          </filter>
        </defs>
        <text
          x="${textX}"
          y="${textY}"
          font-family="Arial, sans-serif"
          font-size="${fontSize}px"
          font-weight="bold"
          fill="rgba(255, 255, 255, ${WATERMARK_OPACITY})"
          text-anchor="end"
          filter="url(#shadow)"
        >${WATERMARK_TEXT}</text>
      </svg>
    `)

    // 이미지에 워터마크 합성
    const watermarkedBuffer = await sharp(imageBuffer)
      .composite([
        {
          input: svgWatermark,
          top: 0,
          left: 0,
        },
      ])
      .toFormat(format, { quality: 95 })
      .toBuffer()

    // base64로 변환하여 반환
    const watermarkedBase64 = watermarkedBuffer.toString('base64')
    return `data:image/${format};base64,${watermarkedBase64}`
  } catch (error) {
    console.error('[Watermark] Failed to add watermark:', error)
    return base64Image // 에러 시 원본 반환
  }
}

/**
 * 여러 이미지에 워터마크를 일괄 추가합니다.
 * @param base64Images - base64 이미지 배열
 * @returns 워터마크가 추가된 base64 이미지 배열
 */
export async function addWatermarkBatch(base64Images: string[]): Promise<string[]> {
  return Promise.all(base64Images.map(addWatermark))
}
