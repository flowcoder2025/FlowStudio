/**
 * Image Converter Utility
 * Handles conversion between URLs and base64 for Gemini API compatibility
 */

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
 * Convert image URL to base64 data URL
 * Fetches the image from URL and converts to base64
 */
export async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')

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

    return `data:${mimeType};base64,${base64}`
  } catch (error) {
    console.error('URL to base64 conversion failed:', error)
    throw new Error('이미지 URL을 처리할 수 없습니다.')
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
