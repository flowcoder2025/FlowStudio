/**
 * Image Upscale API
 * Contract: IMAGE_FUNC_UPSCALE
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { upscaleImage } from '@/lib/imageProvider/upscale';
import type { UpscaleMode } from '@/lib/imageProvider/types';
import { ImageGenerationError, ErrorCodes } from '@/lib/imageProvider/types';
import { uploadImageFromUrl } from '@/lib/storage';

// =====================================================
// Request Schema
// =====================================================

interface UpscaleRequestBody {
  imageUrl: string;
  mode: UpscaleMode;
  imageProjectId?: string;
  enhanceFaces?: boolean;
  denoiseStrength?: number;
  saveToStorage?: boolean;
}

// =====================================================
// POST /api/upscale
// =====================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Parse request body
    const body = await request.json() as UpscaleRequestBody;

    // 3. Validate
    if (!body.imageUrl) {
      return NextResponse.json(
        { success: false, error: 'imageUrl is required' },
        { status: 400 }
      );
    }

    const validModes: UpscaleMode[] = ['2x', '4x', 'enhance'];
    if (!validModes.includes(body.mode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid mode. Use: 2x, 4x, or enhance' },
        { status: 400 }
      );
    }

    // 4. Perform upscale
    const result = await upscaleImage({
      userId,
      imageUrl: body.imageUrl,
      mode: body.mode,
      imageProjectId: body.imageProjectId,
      enhanceFaces: body.enhanceFaces,
      denoiseStrength: body.denoiseStrength,
    });

    // 5. Optionally upload to storage
    if (body.saveToStorage !== false && result.success && result.url.startsWith('data:')) {
      const uploadResult = await uploadImageFromUrl(userId, result.url);
      if (uploadResult.success) {
        return NextResponse.json({
          success: true,
          url: uploadResult.url,
          thumbnailUrl: uploadResult.thumbnailUrl,
          originalWidth: result.originalWidth,
          originalHeight: result.originalHeight,
          upscaledWidth: result.upscaledWidth,
          upscaledHeight: result.upscaledHeight,
          creditsUsed: result.creditsUsed,
        });
      }
    }

    // 6. Return result
    return NextResponse.json({
      success: result.success,
      url: result.url,
      originalWidth: result.originalWidth,
      originalHeight: result.originalHeight,
      upscaledWidth: result.upscaledWidth,
      upscaledHeight: result.upscaledHeight,
      creditsUsed: result.creditsUsed,
      error: result.error,
    });
  } catch (error) {
    console.error('Upscale API error:', error);

    if (error instanceof ImageGenerationError) {
      const statusCode = error.code === ErrorCodes.INSUFFICIENT_CREDITS ? 402 : 500;
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          retryable: error.retryable,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upscale failed',
      },
      { status: 500 }
    );
  }
}

// =====================================================
// GET /api/upscale (Get upscale pricing)
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

    const { getUpscaleCost, getUpscaleFactor } = await import('@/lib/imageProvider');

    return NextResponse.json({
      success: true,
      modes: [
        {
          mode: '2x',
          factor: getUpscaleFactor('2x'),
          cost: getUpscaleCost('2x'),
          description: 'Double the resolution',
        },
        {
          mode: '4x',
          factor: getUpscaleFactor('4x'),
          cost: getUpscaleCost('4x'),
          description: 'Quadruple the resolution',
        },
        {
          mode: 'enhance',
          factor: getUpscaleFactor('enhance'),
          cost: getUpscaleCost('enhance'),
          description: 'Enhance quality without changing size',
        },
      ],
    });
  } catch (error) {
    console.error('Get upscale info error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get upscale info' },
      { status: 500 }
    );
  }
}
