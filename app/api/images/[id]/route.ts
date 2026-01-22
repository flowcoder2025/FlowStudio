/**
 * Single Image API
 * Contract: IMAGE_FUNC_LIST, IMAGE_FUNC_DELETE
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getImage } from '@/lib/images/list';
import { deleteImageById, restoreImage } from '@/lib/images/delete';
import { prisma } from '@/lib/db';

// =====================================================
// GET /api/images/[id]
// =====================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 2. Get image
    const result = await getImage(id, session.user.id);

    if (!result.success) {
      const status = result.error === 'Image not found' ? 404 : 403;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    // 3. Return result
    return NextResponse.json({
      success: true,
      image: result.image,
    });
  } catch (error) {
    console.error('Get image error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get image',
      },
      { status: 500 }
    );
  }
}

// =====================================================
// PATCH /api/images/[id] (Update image metadata)
// =====================================================

interface UpdateRequestBody {
  title?: string;
  restore?: boolean; // If true, restore from trash
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json() as UpdateRequestBody;

    // 2. Handle restore
    if (body.restore) {
      const result = await restoreImage(session.user.id, id);
      return NextResponse.json(result);
    }

    // 3. Update image
    const image = await prisma.imageProject.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      );
    }

    if (image.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const updated = await prisma.imageProject.update({
      where: { id },
      data: {
        title: body.title,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      image: updated,
    });
  } catch (error) {
    console.error('Update image error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update image',
      },
      { status: 500 }
    );
  }
}

// =====================================================
// DELETE /api/images/[id]
// =====================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 2. Check for permanent delete query param
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    // 3. Delete image
    const result = await deleteImageById({
      userId: session.user.id,
      imageId: id,
      permanent,
    });

    if (!result.success) {
      const status = result.error === 'Image not found' ? 404 : 403;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete image',
      },
      { status: 500 }
    );
  }
}
