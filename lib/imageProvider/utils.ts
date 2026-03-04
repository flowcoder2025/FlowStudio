/**
 * Image Provider Utility Functions
 * Shared utilities used across image provider implementations
 */

import { ImageGenerationError, ErrorCodes } from './types';

// =====================================================
// Constants
// =====================================================

/** Allowed MIME types for image input */
const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

/** Maximum image size in bytes (20MB) */
const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;

// =====================================================
// Base64 Extraction & Validation
// =====================================================

/**
 * Extract base64 data from data URL and validate the image
 *
 * Validates:
 * - MIME type is one of: image/png, image/jpeg, image/webp, image/gif
 * - Decoded size does not exceed 20MB
 *
 * @param dataUrl - A data URL (data:mime;base64,...) or raw base64 string
 * @param options - Optional validation settings
 * @returns Object with mimeType and base64 data string
 * @throws ImageGenerationError if validation fails
 */
export function extractBase64Data(
  dataUrl: string,
  options: { skipValidation?: boolean } = {}
): { mimeType: string; data: string } {
  let mimeType = 'image/png';
  let data = dataUrl;

  if (dataUrl.startsWith('data:')) {
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      mimeType = matches[1];
      data = matches[2];
    }
  }

  if (!options.skipValidation) {
    validateImageData(mimeType, data);
  }

  return { mimeType, data };
}

/**
 * Validate MIME type and image size
 */
function validateImageData(mimeType: string, base64Data: string): void {
  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new ImageGenerationError(
      `Unsupported image type: ${mimeType}. Allowed types: ${Array.from(ALLOWED_MIME_TYPES).join(', ')}`,
      ErrorCodes.INVALID_OPTIONS,
      undefined,
      false
    );
  }

  // Estimate decoded size from base64 length
  // Base64 encoding increases size by ~33%, so decoded = base64Length * 3/4
  const estimatedBytes = Math.ceil(base64Data.length * 3 / 4);

  if (estimatedBytes > MAX_IMAGE_SIZE_BYTES) {
    const sizeMB = (estimatedBytes / (1024 * 1024)).toFixed(1);
    throw new ImageGenerationError(
      `Image too large: ${sizeMB}MB exceeds maximum of 20MB`,
      ErrorCodes.PAYLOAD_TOO_LARGE,
      undefined,
      false
    );
  }
}
