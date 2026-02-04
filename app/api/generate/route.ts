/**
 * Image Generation API
 * Contract: IMAGE_FUNC_GENERATE
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateImages } from '@/lib/imageProvider/generate';
import type { AspectRatio, ImageProvider, ImageModel, GenerationRequest, ReferenceMode } from '@/lib/imageProvider/types';
import { ImageGenerationError, ErrorCodes } from '@/lib/imageProvider/types';
import { uploadImageFromUrl } from '@/lib/storage';

// =====================================================
// Route Config (Next.js App Router)
// =====================================================

// Vercel에서 body 크기 제한을 10MB로 설정
export const maxDuration = 60; // 최대 실행 시간 60초

// =====================================================
// Request Schema
// =====================================================

interface GenerateRequestBody {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: AspectRatio;
  count?: number;
  style?: string;
  provider?: ImageProvider;
  model?: ImageModel;
  workflowSessionId?: string;
  saveToStorage?: boolean;
  /** Reference images for style guidance (base64 data URLs) */
  refImages?: string[];
  /** 참조 이미지 활용 모드: style(분위기만), product(제품유지), composition(구도), full(전체) */
  referenceMode?: ReferenceMode;
}

// =====================================================
// POST /api/generate
// =====================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate & Parse body in parallel (Vercel Best Practice: async-parallel)
    const [session, body] = await Promise.all([
      auth(),
      request.json() as Promise<GenerateRequestBody>,
    ]);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 3. Validate
    if (!body.prompt || typeof body.prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (body.prompt.length > 4000) {
      return NextResponse.json(
        { success: false, error: 'Prompt exceeds maximum length of 4000 characters' },
        { status: 400 }
      );
    }

    const count = body.count ?? 1;
    if (count < 1 || count > 4) {
      return NextResponse.json(
        { success: false, error: 'Count must be between 1 and 4' },
        { status: 400 }
      );
    }

    // 4. Build generation request
    const generationRequest: GenerationRequest = {
      userId,
      prompt: body.prompt,
      negativePrompt: body.negativePrompt,
      aspectRatio: body.aspectRatio,
      count,
      style: body.style,
      provider: body.provider,
      model: body.model,
      workflowSessionId: body.workflowSessionId,
      refImages: body.refImages,
      referenceMode: body.referenceMode,
    };

    // 5. Generate images
    const result = await generateImages(generationRequest);

    // 6. Optionally upload to storage
    if (body.saveToStorage !== false && result.success) {
      const uploadedImages = await Promise.all(
        result.images.map(async (image) => {
          // Skip if already a storage URL
          if (!image.url.startsWith('data:')) {
            return image;
          }

          const uploadResult = await uploadImageFromUrl(userId, image.url);
          if (uploadResult.success) {
            return {
              ...image,
              url: uploadResult.url,
              thumbnailUrl: uploadResult.thumbnailUrl,
            };
          }
          return image;
        })
      );

      return NextResponse.json({
        success: true,
        images: uploadedImages,
        creditsUsed: result.creditsUsed,
        provider: result.provider,
        model: result.model,
        duration: result.duration,
      });
    }

    // 7. Return result
    return NextResponse.json({
      success: result.success,
      images: result.images,
      creditsUsed: result.creditsUsed,
      provider: result.provider,
      model: result.model,
      duration: result.duration,
      error: result.error,
    });
  } catch (error) {
    console.error('Generate API error:', error);

    // Handle specific error types
    if (error instanceof ImageGenerationError) {
      const statusCode = getStatusCode(error.code);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          provider: error.provider,
          retryable: error.retryable,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Generation failed',
      },
      { status: 500 }
    );
  }
}

// =====================================================
// Helper Functions
// =====================================================

function getStatusCode(errorCode: string): number {
  switch (errorCode) {
    case ErrorCodes.INSUFFICIENT_CREDITS:
      return 402; // Payment Required
    case ErrorCodes.RATE_LIMITED:
      return 429; // Too Many Requests
    case ErrorCodes.INVALID_PROMPT:
    case ErrorCodes.INVALID_OPTIONS:
      return 400; // Bad Request
    case ErrorCodes.CONTENT_FILTERED:
      return 422; // Unprocessable Entity
    case ErrorCodes.PAYLOAD_TOO_LARGE:
      return 413; // Payload Too Large
    case ErrorCodes.PROVIDER_ERROR:
      return 502; // Bad Gateway
    case ErrorCodes.TIMEOUT:
      return 504; // Gateway Timeout
    default:
      return 500; // Internal Server Error
  }
}

// =====================================================
// GET /api/generate (Get provider status)
// =====================================================

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Import provider status
    const { getProviderStatus, getAllProviderConfigs } = await import('@/lib/imageProvider');

    const status = getProviderStatus();
    const configs = getAllProviderConfigs();

    return NextResponse.json({
      success: true,
      providers: status,
      configs: configs.map((c) => ({
        provider: c.provider,
        model: c.model,
        costPerImage: c.costPerImage,
        maxBatchSize: c.maxBatchSize,
        supportedAspectRatios: c.supportedAspectRatios,
      })),
    });
  } catch (error) {
    console.error('Get provider status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get provider status' },
      { status: 500 }
    );
  }
}
