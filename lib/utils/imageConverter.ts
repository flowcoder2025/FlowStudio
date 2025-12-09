/**
 * Image Converter Utility
 * Handles conversion between URLs and base64 for Gemini API compatibility
 *
 * Features:
 * - Automatic server-side image compression with sharp
 * - Reduces high-resolution images to <2MB for API compatibility
 * - Maintains quality while preventing 413 Payload Too Large errors
 */

import sharp from 'sharp'

/**
 * Check if the input is a URL (not base64)
 */
export function isImageUrl(input: string): boolean {
  return input.startsWith('http://') || input.startsWith('https://')
}

/**
 * Check if the input is a base64 data URL
 */
export function isBase64DataUrl(input: string): boolean {
  return input.startsWith('data:image/')
}

/**
 * Convert image URL to base64 data URL with automatic compression
 * Fetches the image from URL, compresses if needed, and converts to base64
 *
 * Server-side compression ensures images stay under 2MB for API compatibility
 */
export async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Detect MIME type from content-type header or URL
    let mimeType = response.headers.get('content-type') || 'image/png'

    // Clean up MIME type (remove charset if present)
    if (mimeType.includes(';')) {
      mimeType = mimeType.split(';')[0].trim()
    }

    // Fallback based on URL extension
    if (!mimeType.startsWith('image/')) {
      if (url.toLowerCase().includes('.jpg') || url.toLowerCase().includes('.jpeg')) {
        mimeType = 'image/jpeg'
      } else if (url.toLowerCase().includes('.png')) {
        mimeType = 'image/png'
      } else if (url.toLowerCase().includes('.webp')) {
        mimeType = 'image/webp'
      } else {
        mimeType = 'image/png' // Default fallback
      }
    }

    // Server-side compression with sharp (prevents 413 errors)
    const compressedBuffer = await compressImageBuffer(buffer)
    const base64 = compressedBuffer.toString('base64')

    // Always return as JPEG after compression for consistency
    return `data:image/jpeg;base64,${base64}`
  } catch (error) {
    console.error('URL to base64 conversion failed:', error)
    throw new Error('이미지 URL을 처리할 수 없습니다.')
  }
}

/**
 * Compress image buffer to <2MB using sharp (server-side)
 * Progressive quality reduction ensures optimal size/quality balance
 */
async function compressImageBuffer(buffer: Buffer): Promise<Buffer> {
  try {
    const image = sharp(buffer)
    const metadata = await image.metadata()

    // Target: 2MB max (will be ~2.6MB after base64 encoding)
    const TARGET_SIZE_MB = 2
    const TARGET_SIZE_BYTES = TARGET_SIZE_MB * 1024 * 1024

    // Resize if dimensions are too large (max 2048px on longest side)
    const MAX_DIMENSION = 2048
    let resizeOptions = {}

    if (metadata.width && metadata.height) {
      const maxSize = Math.max(metadata.width, metadata.height)
      if (maxSize > MAX_DIMENSION) {
        if (metadata.width > metadata.height) {
          resizeOptions = { width: MAX_DIMENSION }
        } else {
          resizeOptions = { height: MAX_DIMENSION }
        }
      }
    }

    // Progressive quality reduction
    let quality = 90
    let compressed = await image
      .resize(resizeOptions)
      .jpeg({ quality, mozjpeg: true })
      .toBuffer()

    // Reduce quality until target size is reached
    while (compressed.length > TARGET_SIZE_BYTES && quality > 60) {
      quality -= 5
      compressed = await image
        .resize(resizeOptions)
        .jpeg({ quality, mozjpeg: true })
        .toBuffer()
    }

    // If still too large, apply more aggressive resizing
    if (compressed.length > TARGET_SIZE_BYTES) {
      const reductionFactor = 0.8
      const reducedWidth = metadata.width ? Math.floor(metadata.width * reductionFactor) : undefined
      const reducedHeight = metadata.height ? Math.floor(metadata.height * reductionFactor) : undefined

      compressed = await image
        .resize({ width: reducedWidth, height: reducedHeight })
        .jpeg({ quality: 60, mozjpeg: true })
        .toBuffer()
    }

    console.log(`Image compressed: ${(buffer.length / 1024 / 1024).toFixed(2)}MB → ${(compressed.length / 1024 / 1024).toFixed(2)}MB`)

    return compressed
  } catch (error) {
    console.error('Image compression failed, returning original:', error)
    // Fallback: return original buffer if compression fails
    return buffer
  }
}

/**
 * Ensure image is in base64 format
 * If URL, converts to base64. If already base64, returns as-is.
 */
export async function ensureBase64(imageInput: string): Promise<string> {
  if (!imageInput) {
    throw new Error('이미지가 제공되지 않았습니다.')
  }

  // Already base64 data URL
  if (isBase64DataUrl(imageInput)) {
    return imageInput
  }

  // URL - need to convert
  if (isImageUrl(imageInput)) {
    return await urlToBase64(imageInput)
  }

  // Raw base64 without data URL prefix - add it
  if (imageInput.length > 100 && !imageInput.includes(' ') && !imageInput.includes('/')) {
    // Likely raw base64, assume PNG
    return `data:image/png;base64,${imageInput}`
  }

  throw new Error('지원하지 않는 이미지 형식입니다.')
}

/**
 * Extract base64 data from data URL
 * Returns just the base64 string without the data URL prefix
 */
export function extractBase64Data(dataUrl: string): { mimeType: string; data: string } {
  if (isImageUrl(dataUrl)) {
    throw new Error('URL은 먼저 base64로 변환해야 합니다.')
  }

  if (dataUrl.startsWith('data:')) {
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (matches) {
      return {
        mimeType: matches[1],
        data: matches[2]
      }
    }
  }

  // Assume raw base64 with PNG mime type
  return {
    mimeType: 'image/png',
    data: dataUrl
  }
}
