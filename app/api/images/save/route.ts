/**
 * Image Save API
 * Contract: IMAGE_FUNC_SAVE
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadImage, uploadImageFromUrl } from '@/lib/storage';
import { prisma } from '@/lib/db';

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
    // 1. Authenticate & Parse body in parallel (Vercel Best Practice: async-parallel)
    const [session, body] = await Promise.all([
      auth(),
      request.json() as Promise<SaveRequestBody>,
    ]);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

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
    // DB Schema: ImageProject uses resultImages array, mode, not imageUrl/thumbnailUrl/negativePrompt/provider/model
    const imageProject = await prisma.imageProject.create({
      data: {
        userId,
        title: body.title ?? 'Uploaded Image',
        prompt: body.prompt ?? 'Manually uploaded image',
        mode: 'upload', // Manual upload mode
        resultImages: uploadResult.url ? [uploadResult.url] : [],
        workflowSessionId: body.workflowSessionId,
        status: 'completed',
      },
    });

    // 6. Return result
    return NextResponse.json({
      success: true,
      image: {
        id: imageProject.id,
        url: imageProject.resultImages?.[0] ?? null,
        thumbnailUrl: imageProject.resultImages?.[0] ?? null,
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
