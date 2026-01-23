/**
 * Unified Image Generation
 * Contract: IMAGE_FUNC_GENERATE
 */

import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { holdCredits } from '@/lib/credits/hold';
import { captureCredits } from '@/lib/credits/capture';
import { refundCredits } from '@/lib/credits/refund';
import {
  GenerationRequest,
  GenerationResult,
  GenerationOptions,
  ImageGenerationError,
  ErrorCodes,
  ImageProvider,
  GeneratedImage,
} from './types';
import {
  generateWithGoogle,
  validateGoogleOptions,
  incrementRateLimit as incrementGoogleRateLimit,
} from './googleGenAI';
import {
  generateWithOpenRouter,
  validateOpenRouterOptions,
  incrementOpenRouterRateLimit,
} from './openRouter';
import { selectProvider, estimateCredits } from './selectProvider';

// =====================================================
// Main Generation Function
// =====================================================

export async function generateImages(
  request: GenerationRequest
): Promise<GenerationResult> {
  const { userId, workflowSessionId, ...options } = request;
  const count = options.count ?? 1;

  // 1. Select optimal provider
  const selected = selectProvider({
    batchSize: count,
    preferredProvider: options.provider,
    requireHighQuality: false,
    budgetCredits: undefined,
    aspectRatio: options.aspectRatio,
  });

  // 2. Estimate credits
  const estimatedCreditsNeeded = estimateCredits(
    selected.provider,
    selected.model,
    count
  );

  // 3. Hold credits (2-phase commit)
  let holdId: string | null = null;

  try {
    const holdResult = await holdCredits(
      userId,
      estimatedCreditsNeeded,
      `Image generation: ${count} image(s) with ${selected.model}`
    );

    if (!holdResult.success || !holdResult.holdId) {
      throw new ImageGenerationError(
        `Insufficient credits. Required: ${estimatedCreditsNeeded}`,
        ErrorCodes.INSUFFICIENT_CREDITS,
        selected.provider,
        false
      );
    }

    holdId = holdResult.holdId;

    // 4. Validate options
    validateOptions(options, selected.provider);

    // 5. Generate images
    const generationOptions: GenerationOptions = {
      ...options,
      provider: selected.provider,
      model: selected.model,
    };

    const result = await executeGeneration(generationOptions, selected.provider);

    // 6. Increment rate limit counter
    incrementRateLimit(selected.provider);

    // 7. Capture credits (commit)
    if (holdId) {
      await captureCredits(holdId, `Generated ${result.images.length} image(s)`);
    }

    // 8. Save images to database
    const savedImages = await saveImageProjects(
      userId,
      result.images,
      workflowSessionId
    );

    return {
      ...result,
      images: savedImages,
    };
  } catch (error) {
    // Refund credits on failure
    if (holdId) {
      await refundCredits(holdId);
    }

    if (error instanceof ImageGenerationError) {
      throw error;
    }

    console.error('Image generation error:', error);
    throw new ImageGenerationError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      ErrorCodes.UNKNOWN,
      selected.provider,
      true
    );
  }
}

// =====================================================
// Simple Generation (without credit management)
// =====================================================

export async function generateImagesSimple(
  options: GenerationOptions
): Promise<GenerationResult> {
  const count = options.count ?? 1;

  // Select provider
  const selected = selectProvider({
    batchSize: count,
    preferredProvider: options.provider,
    aspectRatio: options.aspectRatio,
  });

  // Validate
  validateOptions(options, selected.provider);

  // Generate
  const generationOptions: GenerationOptions = {
    ...options,
    provider: selected.provider,
    model: selected.model,
  };

  const result = await executeGeneration(generationOptions, selected.provider);

  // Increment rate limit
  incrementRateLimit(selected.provider);

  return result;
}

// =====================================================
// Helper Functions
// =====================================================

function validateOptions(options: GenerationOptions, provider: ImageProvider): void {
  if (provider === 'google') {
    validateGoogleOptions(options);
  } else {
    validateOpenRouterOptions(options);
  }
}

async function executeGeneration(
  options: GenerationOptions,
  provider: ImageProvider
): Promise<GenerationResult> {
  if (provider === 'google') {
    return generateWithGoogle(options);
  }
  return generateWithOpenRouter(options);
}

function incrementRateLimit(provider: ImageProvider): void {
  if (provider === 'google') {
    incrementGoogleRateLimit();
  } else {
    incrementOpenRouterRateLimit();
  }
}

async function saveImageProjects(
  userId: string,
  images: GeneratedImage[],
  workflowSessionId?: string
): Promise<GeneratedImage[]> {
  const savedImages: GeneratedImage[] = [];

  for (const image of images) {
    try {
      // DB Schema: ImageProject uses resultImages array, mode, category, style
      // Not: imageUrl, thumbnailUrl, negativePrompt, provider, model, creditUsed, isUpscaled
      const project = await prisma.imageProject.create({
        data: {
          userId,
          workflowSessionId,
          title: image.prompt?.substring(0, 100) || 'Generated Image',
          prompt: image.prompt,
          mode: 'generate', // Default mode
          resultImages: image.url ? [image.url] : [],
          status: 'completed',
        },
      });

      savedImages.push({
        ...image,
        id: project.id,
      });
    } catch (error) {
      console.error('Failed to save image project:', error);
      // Continue with unsaved image
      savedImages.push(image);
    }
  }

  return savedImages;
}

// =====================================================
// Batch Generation
// =====================================================

export interface BatchGenerationRequest {
  userId: string;
  requests: GenerationOptions[];
  workflowSessionId?: string;
}

export interface BatchGenerationResult {
  success: boolean;
  results: GenerationResult[];
  totalCreditsUsed: number;
  successCount: number;
  failureCount: number;
}

export async function generateImagesBatch(
  request: BatchGenerationRequest
): Promise<BatchGenerationResult> {
  const { userId, requests, workflowSessionId } = request;
  const results: GenerationResult[] = [];
  let totalCreditsUsed = 0;
  let successCount = 0;
  let failureCount = 0;

  // Process each request sequentially to respect rate limits
  for (const options of requests) {
    try {
      const result = await generateImages({
        ...options,
        userId,
        workflowSessionId,
      });

      results.push(result);
      totalCreditsUsed += result.creditsUsed;
      successCount++;
    } catch (error) {
      failureCount++;
      results.push({
        success: false,
        images: [],
        creditsUsed: 0,
        provider: options.provider ?? 'google',
        model: options.model ?? 'gemini-2.0-flash-exp-image-generation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Stop batch on rate limit
      if (
        error instanceof ImageGenerationError &&
        error.code === ErrorCodes.RATE_LIMITED
      ) {
        break;
      }
    }
  }

  return {
    success: failureCount === 0,
    results,
    totalCreditsUsed,
    successCount,
    failureCount,
  };
}

// =====================================================
// Retry Logic
// =====================================================

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
}

export async function generateImagesWithRetry(
  request: GenerationRequest,
  retryOptions: RetryOptions = {}
): Promise<GenerationResult> {
  const { maxRetries = 3, retryDelay = 1000, exponentialBackoff = true } = retryOptions;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await generateImages(request);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry non-retryable errors
      if (
        error instanceof ImageGenerationError &&
        !error.retryable
      ) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay
      const delay = exponentialBackoff
        ? retryDelay * Math.pow(2, attempt)
        : retryDelay;

      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error('Max retries exceeded');
}
