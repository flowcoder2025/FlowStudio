/**
 * Google GenAI Image Provider (Using @google/genai)
 * Contract: IMAGE_FUNC_GENERATE (Google Gemini implementation)
 *
 * Uses the new @google/genai package with ai.models.generateContent() API
 */

import {
  GenerationOptions,
  GeneratedImage,
  GenerationResult,
  ImageGenerationError,
  ErrorCodes,
  AspectRatio,
  ProviderConfig,
} from './types';
import { getGenAIClient, VERTEX_AI_MODELS } from './vertexai';

// =====================================================
// Configuration
// =====================================================

export const GOOGLE_CONFIG: ProviderConfig = {
  provider: 'google',
  model: VERTEX_AI_MODELS.GEMINI_3_PRO_IMAGE,
  maxBatchSize: 4,
  rateLimit: {
    requestsPerMinute: 10,
  },
  costPerImage: 5, // credits
  supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
  maxResolution: {
    width: 2048,
    height: 2048,
  },
};

// 프로덕션에서는 디버그 로그 비활성화
const isDev = process.env.NODE_ENV === 'development';
const log = (message: string) => isDev && console.log(message);
const logError = (message: string) => console.error(message);

// =====================================================
// Aspect Ratio to Dimensions
// =====================================================

const ASPECT_RATIO_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1024, height: 576 },
  '9:16': { width: 576, height: 1024 },
  '4:3': { width: 1024, height: 768 },
  '3:4': { width: 768, height: 1024 },
  '3:2': { width: 1024, height: 683 },
  '2:3': { width: 683, height: 1024 },
};

// =====================================================
// Utility Functions
// =====================================================

/**
 * Extract base64 data from data URL
 */
function extractBase64Data(dataUrl: string): { mimeType: string; data: string } {
  if (dataUrl.startsWith('data:')) {
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      return {
        mimeType: matches[1],
        data: matches[2],
      };
    }
  }
  // Assume raw base64 with PNG mime type
  return {
    mimeType: 'image/png',
    data: dataUrl,
  };
}

// =====================================================
// Main Generation Function
// =====================================================

export async function generateWithGoogle(
  options: GenerationOptions
): Promise<GenerationResult> {
  const startTime = Date.now();
  const count = options.count ?? 1;
  const images: GeneratedImage[] = [];

  try {
    // Get GenAI client (auto-initializes based on env vars)
    const ai = getGenAIClient();
    const imageModel = VERTEX_AI_MODELS.GEMINI_3_PRO_IMAGE;

    // Get dimensions from aspect ratio
    const aspectRatio = options.aspectRatio ?? '1:1';
    const dimensions = options.width && options.height
      ? { width: options.width, height: options.height }
      : ASPECT_RATIO_DIMENSIONS[aspectRatio];

    log(`[GoogleGenAI] Generating ${count} image(s) with model: ${imageModel}`);

    // Generate images (Gemini generates one at a time)
    for (let i = 0; i < count; i++) {
      try {
        // Build content parts
        const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

        // Add source image if provided (for editing mode)
        if (options.sourceImage) {
          const { mimeType, data } = extractBase64Data(options.sourceImage);
          parts.push({ inlineData: { mimeType, data } });
        }

        // Add reference image if provided
        if (options.refImage) {
          const { mimeType, data } = extractBase64Data(options.refImage);
          parts.push({ inlineData: { mimeType, data } });
        }

        // Build enhanced prompt
        const enhancedPrompt = buildPrompt(options);
        parts.push({ text: enhancedPrompt });

        // Call the new @google/genai API
        const response = await ai.models.generateContent({
          model: imageModel,
          contents: parts,
          config: {
            imageConfig: {
              aspectRatio: aspectRatio,
              imageSize: '2K',
            },
          },
        });

        // Debug logging
        if (isDev) {
          const res = response as unknown as GenAIResponse;
          log(`[GoogleGenAI] Response structure: ${JSON.stringify({
            hasCandidates: !!res.candidates,
            candidatesLength: res.candidates?.length,
            firstCandidate: res.candidates?.[0] ? {
              hasContent: !!res.candidates[0].content,
              partsCount: res.candidates[0].content?.parts?.length,
            } : null,
          })}`);
        }

        // Extract image from response (cast to our known response shape)
        const generatedImage = extractImageFromResponse(
          response as unknown as GenAIResponse,
          options,
          dimensions,
          i
        );

        if (generatedImage) {
          images.push(generatedImage);
          log(`[GoogleGenAI] ✅ Image ${i + 1}/${count} generated successfully`);
        } else {
          log(`[GoogleGenAI] ⚠️ No image in response for image ${i + 1}/${count}`);
        }
      } catch (error) {
        // Handle individual image generation error
        logError(`[GoogleGenAI] Failed to generate image ${i + 1}/${count}: ${error instanceof Error ? error.message : String(error)}`);

        // Check if it's a content filter error
        if (isContentFilterError(error)) {
          throw new ImageGenerationError(
            'Content was filtered by safety settings',
            ErrorCodes.CONTENT_FILTERED,
            'google',
            false
          );
        }

        // Continue with other images on non-critical errors
        if (!isRateLimitError(error)) {
          continue;
        }

        // Rate limit - stop and report
        throw new ImageGenerationError(
          'Rate limit exceeded',
          ErrorCodes.RATE_LIMITED,
          'google',
          true
        );
      }
    }

    if (images.length === 0) {
      throw new ImageGenerationError(
        'No images were generated',
        ErrorCodes.PROVIDER_ERROR,
        'google',
        true
      );
    }

    return {
      success: true,
      images,
      creditsUsed: images.length * GOOGLE_CONFIG.costPerImage,
      provider: 'google',
      model: GOOGLE_CONFIG.model,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    if (error instanceof ImageGenerationError) {
      throw error;
    }

    logError(`[GoogleGenAI] Generation error: ${error instanceof Error ? error.message : String(error)}`);
    throw new ImageGenerationError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      ErrorCodes.PROVIDER_ERROR,
      'google',
      true
    );
  }
}

// =====================================================
// Helper Functions
// =====================================================

function buildPrompt(options: GenerationOptions): string {
  let prompt = options.prompt;

  // Add style if specified
  if (options.style) {
    prompt = `${options.style} style: ${prompt}`;
  }

  // Note: Negative prompts are handled differently in Gemini
  // We append guidance to avoid certain elements
  if (options.negativePrompt) {
    prompt = `${prompt}. Avoid: ${options.negativePrompt}`;
  }

  return prompt;
}

interface GenAIResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
    finishReason?: string;
  }>;
}

function extractImageFromResponse(
  response: GenAIResponse,
  options: GenerationOptions,
  dimensions: { width: number; height: number },
  index: number
): GeneratedImage | null {
  // Navigate through response structure
  for (const candidate of response.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        // Convert base64 to data URL
        const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;

        return {
          id: `google_${Date.now()}_${index}`,
          url: dataUrl,
          width: dimensions.width,
          height: dimensions.height,
          prompt: options.prompt,
          negativePrompt: options.negativePrompt,
          provider: 'google',
          model: GOOGLE_CONFIG.model,
          seed: options.seed,
          metadata: {
            aspectRatio: options.aspectRatio ?? '1:1',
            style: options.style,
            generatedAt: new Date().toISOString(),
          },
        };
      }
    }
  }

  return null;
}

function isContentFilterError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('safety') ||
      message.includes('blocked') ||
      message.includes('content filter') ||
      message.includes('harmful')
    );
  }
  return false;
}

function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('rate limit') ||
      message.includes('quota') ||
      message.includes('429') ||
      message.includes('too many requests') ||
      message.includes('resource exhausted')
    );
  }
  return false;
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

export function checkRateLimit(): { available: boolean; remaining: number; resetIn: number } {
  const now = Date.now();

  // Reset if minute has passed
  if (now >= rateLimitState.resetTime) {
    rateLimitState.count = 0;
    rateLimitState.resetTime = now + 60000;
  }

  const remaining = GOOGLE_CONFIG.rateLimit.requestsPerMinute - rateLimitState.count;
  const resetIn = Math.max(0, rateLimitState.resetTime - now);

  return {
    available: remaining > 0,
    remaining,
    resetIn,
  };
}

export function incrementRateLimit(): void {
  rateLimitState.count++;
}

// =====================================================
// Validation
// =====================================================

export function validateGoogleOptions(options: GenerationOptions): void {
  if (!options.prompt || options.prompt.trim().length === 0) {
    throw new ImageGenerationError(
      'Prompt is required',
      ErrorCodes.INVALID_OPTIONS,
      'google',
      false
    );
  }

  if (options.prompt.length > 4000) {
    throw new ImageGenerationError(
      'Prompt exceeds maximum length of 4000 characters',
      ErrorCodes.INVALID_OPTIONS,
      'google',
      false
    );
  }

  const count = options.count ?? 1;
  if (count < 1 || count > GOOGLE_CONFIG.maxBatchSize) {
    throw new ImageGenerationError(
      `Count must be between 1 and ${GOOGLE_CONFIG.maxBatchSize}`,
      ErrorCodes.INVALID_OPTIONS,
      'google',
      false
    );
  }

  if (options.aspectRatio && !GOOGLE_CONFIG.supportedAspectRatios.includes(options.aspectRatio)) {
    throw new ImageGenerationError(
      `Aspect ratio ${options.aspectRatio} is not supported. Use: ${GOOGLE_CONFIG.supportedAspectRatios.join(', ')}`,
      ErrorCodes.INVALID_OPTIONS,
      'google',
      false
    );
  }
}
