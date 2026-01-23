/**
 * Image Search API
 * Contract: IMAGE_FUNC_LIST (search variant)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { searchImages, type SearchOptions } from '@/lib/images';

// =====================================================
// GET /api/images/search
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
    // DB Schema: ImageProject uses mode/category instead of provider
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') ?? undefined;
    const mode = searchParams.get('mode') ?? undefined;
    const category = searchParams.get('category') ?? undefined;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);
    const sortBy = (searchParams.get('sortBy') ?? 'createdAt') as 'createdAt' | 'updatedAt';
    const sortOrder = (searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc';

    // 3. Build search options
    const options: SearchOptions = {
      userId,
      query,
      mode,
      category,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      page,
      limit,
      sortBy,
      sortOrder,
      includeDeleted: false,
    };

    // 4. Search images
    const result = await searchImages(options);

    // 5. Return result
    return NextResponse.json(result);
  } catch (error) {
    console.error('Search images error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      },
      { status: 500 }
    );
  }
}
