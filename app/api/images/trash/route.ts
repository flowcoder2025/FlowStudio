/**
 * Image Trash API
 * Contract: IMAGE_FUNC_DELETE (trash management)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listDeletedImages, cleanupDeletedImages, deleteImages } from '@/lib/images/delete';

// =====================================================
// GET /api/images/trash (List deleted images)
// =====================================================

export async function GET(request: NextRequest) {
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

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);

    // 3. Fetch deleted images
    const result = await listDeletedImages({
      userId,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('List trash error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list trash',
      },
      { status: 500 }
    );
  }
}

// =====================================================
// DELETE /api/images/trash (Empty trash / bulk delete)
// =====================================================

interface DeleteRequestBody {
  imageIds?: string[]; // Specific images to permanently delete
  emptyAll?: boolean; // Delete all items in trash
}

export async function DELETE(request: NextRequest) {
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
    const body = await request.json() as DeleteRequestBody;

    // 3. Handle empty all
    if (body.emptyAll) {
      // Use cleanup with 0 days to delete all
      const result = await cleanupDeletedImages({
        daysOld: 0, // Delete all deleted images regardless of age
        dryRun: false,
      });

      return NextResponse.json({
        success: result.success,
        deleted: result.count,
        error: result.error,
      });
    }

    // 4. Handle specific images
    if (body.imageIds && body.imageIds.length > 0) {
      const result = await deleteImages({
        userId,
        imageIds: body.imageIds,
        permanent: true,
      });

      return NextResponse.json({
        success: result.success,
        deleted: result.deleted.length,
        failed: result.failed,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Either imageIds or emptyAll is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Empty trash error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to empty trash',
      },
      { status: 500 }
    );
  }
}
