/**
 * OpenRouter Image Provider (Chat/Completions API)
 * Contract: IMAGE_FUNC_GENERATE (OpenRouter implementation)
 *
 * Uses OpenRouter's chat/completions API with image generation models
 * Supports: Gemini, FLUX, GPT-5 Image
 *
 * API 문서: https://openrouter.ai/docs/guides/overview/multimodal/image-generation
 */

import {
  GenerationOptions,
  GeneratedImage,
  GenerationResult,
  ImageGenerationError,
  ErrorCodes,
  AspectRatio,
  ProviderConfig,
  ImageModel,
} from './types';

// 프로덕션에서는 디버그 로그 비활성화
const isDev = process.env.NODE_ENV === 'development';
const log = (message: string) => isDev && console.log(message);
const logError = (message: string) => console.error(message);

// =====================================================
// Configuration
// =====================================================

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
} as const;

export type OpenRouterModel = typeof OPENROUTER_MODELS[keyof typeof OPENROUTER_MODELS];

export const OPENROUTER_GEMINI_CONFIG: ProviderConfig = {
  provider: 'openrouter',
  model: OPENROUTER_MODELS.GEMINI_3_PRO_IMAGE as ImageModel,
  maxBatchSize: 4,
  rateLimit: {
    requestsPerMinute: 60,
  },
  costPerImage: 4, // credits
  supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
  maxResolution: {
    width: 2048,
    height: 2048,
  },
};

// Legacy configs for backward compatibility
export const OPENROUTER_FLUX_CONFIG = OPENROUTER_GEMINI_CONFIG;
export const OPENROUTER_SDXL_CONFIG = OPENROUTER_GEMINI_CONFIG;

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// =====================================================
// Aspect Ratio Types
// =====================================================

export type ImageSize = '1K' | '2K' | '4K';

// =====================================================
// Utility Functions
// =====================================================

/**
 * Extract base64 data from data URL
 */
function extractBase64Data(base64String: string): { mimeType: string; data: string } {
  const match = base64String.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  // data: prefix가 없는 경우 기본값
  return { mimeType: 'image/png', data: base64String };
}

// =====================================================
// Main Generation Function
// =====================================================

export async function generateWithOpenRouter(
  options: GenerationOptions
): Promise<GenerationResult> {
  const startTime = Date.now();
  const count = options.count ?? 1;
  const model = OPENROUTER_MODELS.GEMINI_3_PRO_IMAGE;
  const config = OPENROUTER_GEMINI_CONFIG;

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new ImageGenerationError(
        'OPENROUTER_API_KEY is not configured',
        ErrorCodes.PROVIDER_ERROR,
        'openrouter',
        false
      );
    }

    validateOpenRouterOptions(options);

    const aspectRatio = options.aspectRatio ?? '1:1';
    const imageSize: ImageSize = '2K';

    log(`[OpenRouter] Generating ${count} image(s) with model: ${model}`);

    const images: GeneratedImage[] = [];

    // Generate images one at a time (OpenRouter generates one per request)
    for (let i = 0; i < count; i++) {
      try {
        const generatedImage = await generateSingleImage(
          apiKey,
          options,
          model,
          aspectRatio,
          imageSize,
          i
        );

        if (generatedImage) {
          images.push(generatedImage);
          log(`[OpenRouter] ✅ Image ${i + 1}/${count} generated successfully`);
        } else {
          log(`[OpenRouter] ⚠️ No image generated for image ${i + 1}/${count}`);
        }
      } catch (error) {
        logError(`[OpenRouter] Failed to generate image ${i + 1}/${count}: ${error instanceof Error ? error.message : String(error)}`);

        // Check for rate limit
        if (isRateLimitError(error)) {
          throw new ImageGenerationError(
            'Rate limit exceeded',
            ErrorCodes.RATE_LIMITED,
            'openrouter',
            true
          );
        }

        // Continue with other images on non-critical errors
        continue;
      }
    }

    if (images.length === 0) {
      throw new ImageGenerationError(
        'No images were generated',
        ErrorCodes.PROVIDER_ERROR,
        'openrouter',
        true
      );
    }

    return {
      success: true,
      images,
      creditsUsed: images.length * config.costPerImage,
      provider: 'openrouter',
      model: model as ImageModel,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    if (error instanceof ImageGenerationError) {
      throw error;
    }

    logError(`[OpenRouter] Generation error: ${error instanceof Error ? error.message : String(error)}`);
    throw new ImageGenerationError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      ErrorCodes.PROVIDER_ERROR,
      'openrouter',
      true
    );
  }
}

// =====================================================
// Single Image Generation
// =====================================================

async function generateSingleImage(
  apiKey: string,
  options: GenerationOptions,
  model: string,
  aspectRatio: AspectRatio,
  imageSize: ImageSize,
  index: number
): Promise<GeneratedImage | null> {
  // Build message content
  type MessageContent = string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
  let content: MessageContent = options.prompt;

  // Check if we have images
  const hasImages = options.sourceImage || options.refImage || (options.refImages && options.refImages.length > 0) || options.maskImage;

  if (hasImages) {
    const parts: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = [];

    // Source image (editing mode)
    if (options.sourceImage) {
      const { mimeType, data } = extractBase64Data(options.sourceImage);
      parts.push({
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${data}` }
      });
    }

    // Mask image (DETAIL_EDIT mode)
    if (options.maskImage) {
      const { mimeType, data } = extractBase64Data(options.maskImage);
      parts.push({
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${data}` }
      });
    }

    // Reference images
    if (options.refImages && options.refImages.length > 0) {
      for (const img of options.refImages) {
        const { mimeType, data } = extractBase64Data(img);
        parts.push({
          type: 'image_url',
          image_url: { url: `data:${mimeType};base64,${data}` }
        });
      }
    } else if (options.refImage) {
      const { mimeType, data } = extractBase64Data(options.refImage);
      parts.push({
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${data}` }
      });
    }

    // Build prompt
    let enhancedPrompt = buildPrompt(options);

    // DETAIL_EDIT mode prompt enhancement
    if (options.maskImage && options.mode === 'DETAIL_EDIT') {
      enhancedPrompt = `You are given two images:
1. The ORIGINAL image (first image)
2. The MASK image (second image) - shows a RED semi-transparent overlay on the area to be edited

TASK: Edit ONLY the area marked with the RED overlay in the original image.

User's edit instruction: ${enhancedPrompt}

CRITICAL RULES:
- ONLY modify the red-highlighted area
- Keep ALL other areas EXACTLY the same as the original
- Blend the edited area seamlessly with surroundings
- Match lighting, colors, and style of the original
- Output the complete edited image at the same size as the original`;
    }

    parts.push({ type: 'text', text: enhancedPrompt });
    content = parts;
  }

  // Build request body
  const requestBody: {
    model: string;
    messages: Array<{ role: string; content: MessageContent }>;
    modalities: string[];
    image_config?: {
      aspect_ratio?: string;
      image_size?: string;
    };
  } = {
    model,
    messages: [
      {
        role: 'user',
        content,
      }
    ],
    modalities: ['image', 'text'],
  };

  // Add image config for Gemini models
  if (model.includes('gemini')) {
    requestBody.image_config = {
      aspect_ratio: aspectRatio,
      image_size: imageSize,
    };
  }

  // Make request with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://flowstudio.app',
        'X-Title': 'FlowStudio',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      logError(`[OpenRouter] API error: ${response.status} - ${errorText}`);
      throw new Error(`OpenRouter API 오류: ${response.status} - ${errorText}`);
    }

    const result = await response.json() as OpenRouterResponse;

    // Check for error response
    if (result.error) {
      logError(`[OpenRouter] Error: ${result.error.message}`);
      throw new Error(`OpenRouter 오류: ${result.error.message}`);
    }

    // Extract image from response
    const images = result.choices?.[0]?.message?.images;
    if (images && images.length > 0) {
      const imageUrl = images[0].image_url.url;
      log(`[OpenRouter] Image generated successfully`);

      return {
        id: `openrouter_${Date.now()}_${index}`,
        url: imageUrl,
        width: 1024,
        height: 1024,
        prompt: options.prompt,
        negativePrompt: options.negativePrompt,
        provider: 'openrouter',
        model: model as ImageModel,
        seed: options.seed,
        metadata: {
          aspectRatio: aspectRatio,
          style: options.style,
          generatedAt: new Date().toISOString(),
        },
      };
    }

    // Check for text response
    const textContent = result.choices?.[0]?.message?.content;
    if (textContent) {
      logError(`[OpenRouter] Text response instead of image: ${textContent.substring(0, 200)}`);
    }

    // Debug response structure
    logError(`[OpenRouter] No image in response. Response structure: ${JSON.stringify({
      hasChoices: !!result.choices,
      choicesLength: result.choices?.length,
      messageKeys: result.choices?.[0]?.message ? Object.keys(result.choices[0].message) : [],
      finishReason: result.choices?.[0]?.finish_reason,
    })}`);

    return null;
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle timeout
    if (error instanceof Error && error.name === 'AbortError') {
      logError('[OpenRouter] Generation timeout (90s)');
      throw new Error('OpenRouter 이미지 생성 오류: 타임아웃 (90초)');
    }

    throw error;
  }
}

// =====================================================
// Response Types
// =====================================================

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content?: string;
      images?: Array<{
        image_url: {
          url: string;
        };
      }>;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: {
    message: string;
    type: string;
    code: string;
  };
}

// =====================================================
// Helper Functions
// =====================================================

function buildPrompt(options: GenerationOptions): string {
  let prompt = options.prompt;

  // Add style modifier
  if (options.style) {
    prompt = `${options.style} style, ${prompt}`;
  }

  // Add negative prompt guidance
  if (options.negativePrompt) {
    prompt = `${prompt}. Avoid: ${options.negativePrompt}`;
  }

  return prompt;
}

function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('rate limit') ||
      message.includes('quota') ||
      message.includes('429') ||
      message.includes('too many requests')
    );
  }
  return false;
}

// =====================================================
// Validation
// =====================================================

export function validateOpenRouterOptions(options: GenerationOptions): void {
  if (!options.prompt || options.prompt.trim().length === 0) {
    throw new ImageGenerationError(
      'Prompt is required',
      ErrorCodes.INVALID_OPTIONS,
      'openrouter',
      false
    );
  }

  if (options.prompt.length > 4000) {
    throw new ImageGenerationError(
      'Prompt exceeds maximum length of 4000 characters',
      ErrorCodes.INVALID_OPTIONS,
      'openrouter',
      false
    );
  }

  const config = OPENROUTER_GEMINI_CONFIG;
  const count = options.count ?? 1;

  if (count < 1 || count > config.maxBatchSize) {
    throw new ImageGenerationError(
      `Count must be between 1 and ${config.maxBatchSize}`,
      ErrorCodes.INVALID_OPTIONS,
      'openrouter',
      false
    );
  }

  if (options.aspectRatio && !config.supportedAspectRatios.includes(options.aspectRatio)) {
    throw new ImageGenerationError(
      `Aspect ratio ${options.aspectRatio} is not supported. Use: ${config.supportedAspectRatios.join(', ')}`,
      ErrorCodes.INVALID_OPTIONS,
      'openrouter',
      false
    );
  }
}

// =====================================================
// Utility Functions (exported)
// =====================================================

export function getOpenRouterConfig(): ProviderConfig {
  return OPENROUTER_GEMINI_CONFIG;
}

export function isOpenRouterConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

// =====================================================
// Rate Limit Management
// =====================================================

interface RateLimitState {
  count: number;
  resetTime: number;
}

const rateLimitState: RateLimitState = {
  count: 0,
  resetTime: Date.now() + 60000,
};

export function checkOpenRouterRateLimit(): {
  available: boolean;
  remaining: number;
  resetIn: number;
} {
  const now = Date.now();

  if (now >= rateLimitState.resetTime) {
    rateLimitState.count = 0;
    rateLimitState.resetTime = now + 60000;
  }

  const config = OPENROUTER_GEMINI_CONFIG;
  const remaining = config.rateLimit.requestsPerMinute - rateLimitState.count;
  const resetIn = Math.max(0, rateLimitState.resetTime - now);

  return {
    available: remaining > 0,
    remaining,
    resetIn,
  };
}

export function incrementOpenRouterRateLimit(): void {
  rateLimitState.count++;
}

// =====================================================
// 4K Upscale (via OpenRouter)
// =====================================================

export async function upscaleImageWithOpenRouter(
  imageBase64: string
): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  log('[OpenRouter] Starting 4K upscale');

  const { mimeType, data } = extractBase64Data(imageBase64);

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
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://flowstudio.app',
        'X-Title': 'FlowStudio',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      logError(`[OpenRouter] Upscale API error: ${response.status} - ${errorText}`);
      throw new Error(`OpenRouter 업스케일 오류: ${response.status} - ${errorText}`);
    }

    const result = await response.json() as OpenRouterResponse;

    if (result.error) {
      logError(`[OpenRouter] Upscale error: ${result.error.message}`);
      throw new Error(`OpenRouter 업스케일 오류: ${result.error.message}`);
    }

    const images = result.choices?.[0]?.message?.images;
    if (images && images.length > 0) {
      const imageUrl = images[0].image_url.url;
      log(`[OpenRouter] ✅ 4K upscale successful`);
      return imageUrl;
    }

    logError('[OpenRouter] No image in upscale response');
    return null;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      logError('[OpenRouter] Upscale timeout (120s)');
      throw new Error('OpenRouter 업스케일 오류: 타임아웃 (120초)');
    }

    logError(`[OpenRouter] Upscale failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
