/**
 * Image List API
 * Contract: IMAGE_FUNC_LIST
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listImages, type ImageListOptions } from '@/lib/images/list';

// =====================================================
// GET /api/images/list
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
    const sortBy = (searchParams.get('sortBy') ?? 'createdAt') as 'createdAt' | 'updatedAt';
    const sortOrder = (searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc';
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    // 3. Validate
    if (page < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid page number' },
        { status: 400 }
      );
    }

    // 4. Fetch images
    const options: ImageListOptions = {
      userId,
      page,
      limit,
      sortBy,
      sortOrder,
      includeDeleted,
    };

    const result = await listImages(options);

    // 5. Return result
    return NextResponse.json(result);
  } catch (error) {
    console.error('List images error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list images',
      },
      { status: 500 }
    );
  }
}
