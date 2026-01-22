/**
 * Google GenAI Image Provider
 * Contract: IMAGE_FUNC_GENERATE (Google Gemini implementation)
 *
 * Note: Requires @google/generative-ai package to be installed
 * npm install @google/generative-ai
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

// =====================================================
// Configuration
// =====================================================

export const GOOGLE_CONFIG: ProviderConfig = {
  provider: 'google',
  model: 'gemini-2.0-flash-exp-image-generation',
  maxBatchSize: 4,
  rateLimit: {
    requestsPerMinute: 10,
  },
  costPerImage: 5, // credits
  supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
  maxResolution: {
    width: 1024,
    height: 1024,
  },
};

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
// Main Generation Function
// =====================================================

export async function generateWithGoogle(
  options: GenerationOptions
): Promise<GenerationResult> {
  const startTime = Date.now();
  const count = options.count ?? 1;
  const images: GeneratedImage[] = [];

  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new ImageGenerationError(
        'GOOGLE_AI_API_KEY is not configured',
        ErrorCodes.PROVIDER_ERROR,
        'google',
        false
      );
    }

    // Dynamic import to handle case where package is not installed
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);

    // Get dimensions from aspect ratio
    const aspectRatio = options.aspectRatio ?? '1:1';
    const dimensions = options.width && options.height
      ? { width: options.width, height: options.height }
      : ASPECT_RATIO_DIMENSIONS[aspectRatio];

    // Build enhanced prompt
    const enhancedPrompt = buildPrompt(options);

    // Get the model for image generation
    const model = genAI.getGenerativeModel({
      model: GOOGLE_CONFIG.model,
    });

    // Generate images (Gemini generates one at a time)
    for (let i = 0; i < count; i++) {
      try {
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
          generationConfig: {
            responseMimeType: 'text/plain',
          },
        });

        // Extract image from response
        const response = result.response;
        const generatedImage = extractImageFromResponse(
          response,
          options,
          dimensions,
          i
        );

        if (generatedImage) {
          images.push(generatedImage);
        }
      } catch (error) {
        // Handle individual image generation error
        console.error(`Failed to generate image ${i + 1}/${count}:`, error);

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

    console.error('Google GenAI generation error:', error);
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

interface GenerateContentResponse {
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
  response: GenerateContentResponse,
  options: GenerationOptions,
  dimensions: { width: number; height: number },
  index: number
): GeneratedImage | null {
  const candidate = response.candidates?.[0];
  if (!candidate?.content?.parts) {
    return null;
  }

  // Find image part
  const imagePart = candidate.content.parts.find(
    (part) => part.inlineData?.mimeType?.startsWith('image/')
  );

  if (!imagePart?.inlineData) {
    return null;
  }

  // Convert base64 to data URL
  const dataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

  return {
    id: `google_${Date.now()}_${index}`,
    url: dataUrl, // Will be uploaded to storage later
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
      message.includes('too many requests')
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
