/**
 * Image Save API
 * Contract: IMAGE_FUNC_SAVE
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadImage, uploadImageFromUrl } from '@/lib/storage';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

// =====================================================
// Request Schema
// =====================================================

interface SaveRequestBody {
  imageUrl?: string; // URL or data URL
  imageData?: string; // Base64 data
  title?: string;
  prompt?: string;
  negativePrompt?: string;
  provider?: string;
  model?: string;
  workflowSessionId?: string;
  metadata?: Record<string, unknown>;
}

// =====================================================
// POST /api/images/save
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
    const body = await request.json() as SaveRequestBody;

    // 3. Validate
    if (!body.imageUrl && !body.imageData) {
      return NextResponse.json(
        { success: false, error: 'Either imageUrl or imageData is required' },
        { status: 400 }
      );
    }

    // 4. Upload image
    let uploadResult;

    if (body.imageUrl) {
      uploadResult = await uploadImageFromUrl(userId, body.imageUrl);
    } else if (body.imageData) {
      uploadResult = await uploadImage({
        userId,
        imageData: body.imageData,
        contentType: 'image/png',
        generateThumbnail: true,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'No image data provided' },
        { status: 400 }
      );
    }

    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: uploadResult.error ?? 'Upload failed' },
        { status: 500 }
      );
    }

    // 5. Create database record
    const imageProject = await prisma.imageProject.create({
      data: {
        userId,
        title: body.title,
        prompt: body.prompt ?? 'Manually uploaded image',
        negativePrompt: body.negativePrompt,
        imageUrl: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl,
        provider: body.provider,
        model: body.model,
        workflowSessionId: body.workflowSessionId,
        metadata: (body.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });

    // 6. Return result
    return NextResponse.json({
      success: true,
      image: {
        id: imageProject.id,
        url: imageProject.imageUrl,
        thumbnailUrl: imageProject.thumbnailUrl,
        title: imageProject.title,
        prompt: imageProject.prompt,
        createdAt: imageProject.createdAt,
      },
    });
  } catch (error) {
    console.error('Save image error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save image',
      },
      { status: 500 }
    );
  }
}
