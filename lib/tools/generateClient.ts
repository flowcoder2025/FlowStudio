/**
 * Client-side API wrapper for image generation
 * Encapsulates /api/generate calls with proper typing
 */

import type { ToolGenerateRequest, ToolGenerateResponse } from './types';

// =====================================================
// Generate Images
// =====================================================

export async function generateFromTool(
  request: ToolGenerateRequest
): Promise<ToolGenerateResponse> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: request.prompt,
      negativePrompt: request.negativePrompt,
      aspectRatio: request.aspectRatio,
      count: request.count ?? 1,
      style: request.style,
      provider: request.provider,
      model: request.model,
      mode: request.mode,
      sourceImage: request.sourceImage,
      refImages: request.refImages,
      referenceMode: request.referenceMode,
      logoImage: request.logoImage,
      maskImage: request.maskImage,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      images: [],
      creditsUsed: 0,
      provider: '',
      model: '',
      error: errorData.error || `HTTP ${response.status}`,
      code: errorData.code,
      retryable: errorData.retryable ?? false,
    };
  }

  return response.json();
}

// =====================================================
// Save Image to Gallery
// =====================================================

export async function saveImageToGallery(params: {
  imageUrl: string;
  title?: string;
  prompt?: string;
  negativePrompt?: string;
  provider?: string;
  model?: string;
}): Promise<{ success: boolean; error?: string }> {
  const response = await fetch('/api/images/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  return response.json();
}

// =====================================================
// Upscale Image
// =====================================================

export async function upscaleImage(params: {
  imageUrl: string;
  mode: '2x' | '4x' | 'enhance';
}): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  const response = await fetch('/api/upscale', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  return response.json();
}

// =====================================================
// Download Image Utility
// =====================================================

export async function downloadImage(
  imageUrl: string,
  filename: string = 'flowstudio-image.png'
): Promise<void> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
