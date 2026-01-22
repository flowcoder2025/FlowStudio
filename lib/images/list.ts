/**
 * Image Gallery List
 * Contract: IMAGE_FUNC_LIST
 */

import { prisma } from '@/lib/db';
import { checkPermission } from '@/lib/permissions/check';

// =====================================================
// Types
// =====================================================

export interface ImageListOptions {
  userId: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  includeDeleted?: boolean;
}

export interface ImageListItem {
  id: string;
  title: string | null;
  prompt: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  provider: string | null;
  model: string | null;
  creditUsed: number;
  isUpscaled: boolean;
  createdAt: Date;
  updatedAt: Date;
  workflowSessionId: string | null;
}

export interface ImageListResult {
  success: boolean;
  images: ImageListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
}

export interface ImageDetail extends ImageListItem {
  negativePrompt: string | null;
  metadata: Record<string, unknown> | null;
  workflowSession?: {
    id: string;
    industry: string;
    action: string;
    inputs: Record<string, unknown>;
  } | null;
}

// =====================================================
// List Functions
// =====================================================

export async function listImages(options: ImageListOptions): Promise<ImageListResult> {
  const {
    userId,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    includeDeleted = false,
  } = options;

  try {
    // Build where clause
    const where = {
      userId,
      ...(includeDeleted ? {} : { deletedAt: null }),
    };

    // Get total count
    const total = await prisma.imageProject.count({ where });

    // Get images
    const images = await prisma.imageProject.findMany({
      where,
      select: {
        id: true,
        title: true,
        prompt: true,
        imageUrl: true,
        thumbnailUrl: true,
        provider: true,
        model: true,
        creditUsed: true,
        isUpscaled: true,
        createdAt: true,
        updatedAt: true,
        workflowSessionId: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      success: true,
      images,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('List images error:', error);
    return {
      success: false,
      images: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
      error: error instanceof Error ? error.message : 'Failed to list images',
    };
  }
}

// =====================================================
// Get Single Image
// =====================================================

export async function getImage(
  imageId: string,
  userId: string
): Promise<{ success: boolean; image?: ImageDetail; error?: string }> {
  try {
    const image = await prisma.imageProject.findUnique({
      where: { id: imageId },
      include: {
        workflowSession: {
          select: {
            id: true,
            industry: true,
            action: true,
            inputs: true,
          },
        },
      },
    });

    if (!image) {
      return {
        success: false,
        error: 'Image not found',
      };
    }

    // Check permission
    const hasPermission = await checkPermission({
      userId,
      namespace: 'image_project',
      objectId: imageId,
      relation: 'viewer',
    });

    // Also check if user owns the image
    const isOwner = image.userId === userId;

    if (!hasPermission && !isOwner) {
      return {
        success: false,
        error: 'Access denied',
      };
    }

    return {
      success: true,
      image: {
        id: image.id,
        title: image.title,
        prompt: image.prompt,
        negativePrompt: image.negativePrompt,
        imageUrl: image.imageUrl,
        thumbnailUrl: image.thumbnailUrl,
        provider: image.provider,
        model: image.model,
        metadata: image.metadata as Record<string, unknown> | null,
        creditUsed: image.creditUsed,
        isUpscaled: image.isUpscaled,
        createdAt: image.createdAt,
        updatedAt: image.updatedAt,
        workflowSessionId: image.workflowSessionId,
        workflowSession: image.workflowSession
          ? {
              id: image.workflowSession.id,
              industry: image.workflowSession.industry,
              action: image.workflowSession.action,
              inputs: image.workflowSession.inputs as Record<string, unknown>,
            }
          : null,
      },
    };
  } catch (error) {
    console.error('Get image error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get image',
    };
  }
}

// =====================================================
// Search Images
// =====================================================

export interface SearchOptions extends ImageListOptions {
  query?: string;
  provider?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export async function searchImages(options: SearchOptions): Promise<ImageListResult> {
  const {
    userId,
    query,
    provider,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    includeDeleted = false,
  } = options;

  try {
    // Build where clause
    interface WhereClause {
      userId: string;
      deletedAt?: null;
      OR?: Array<{ prompt?: { contains: string; mode: 'insensitive' }; title?: { contains: string; mode: 'insensitive' } }>;
      provider?: string;
      createdAt?: { gte?: Date; lte?: Date };
    }

    const where: WhereClause = {
      userId,
      ...(includeDeleted ? {} : { deletedAt: null }),
    };

    // Text search
    if (query) {
      where.OR = [
        { prompt: { contains: query, mode: 'insensitive' } },
        { title: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Provider filter
    if (provider) {
      where.provider = provider;
    }

    // Date range
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        where.createdAt.lte = dateTo;
      }
    }

    // Get total count
    const total = await prisma.imageProject.count({ where });

    // Get images
    const images = await prisma.imageProject.findMany({
      where,
      select: {
        id: true,
        title: true,
        prompt: true,
        imageUrl: true,
        thumbnailUrl: true,
        provider: true,
        model: true,
        creditUsed: true,
        isUpscaled: true,
        createdAt: true,
        updatedAt: true,
        workflowSessionId: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      success: true,
      images,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Search images error:', error);
    return {
      success: false,
      images: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
      error: error instanceof Error ? error.message : 'Failed to search images',
    };
  }
}

// =====================================================
// Statistics
// =====================================================

export interface ImageStats {
  totalImages: number;
  totalCreditsUsed: number;
  imagesByProvider: Record<string, number>;
  imagesByMonth: Array<{ month: string; count: number }>;
}

export async function getImageStats(userId: string): Promise<ImageStats> {
  try {
    // Get total count
    const totalImages = await prisma.imageProject.count({
      where: { userId, deletedAt: null },
    });

    // Get total credits used
    const creditSum = await prisma.imageProject.aggregate({
      where: { userId, deletedAt: null },
      _sum: { creditUsed: true },
    });

    // Get images by provider
    const byProvider = await prisma.imageProject.groupBy({
      by: ['provider'],
      where: { userId, deletedAt: null },
      _count: true,
    });

    const imagesByProvider: Record<string, number> = {};
    byProvider.forEach((item) => {
      if (item.provider) {
        imagesByProvider[item.provider] = item._count;
      }
    });

    // Get images by month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const recentImages = await prisma.imageProject.findMany({
      where: {
        userId,
        deletedAt: null,
        createdAt: { gte: twelveMonthsAgo },
      },
      select: { createdAt: true },
    });

    const monthCounts: Record<string, number> = {};
    recentImages.forEach((img) => {
      const month = img.createdAt.toISOString().substring(0, 7); // YYYY-MM
      monthCounts[month] = (monthCounts[month] ?? 0) + 1;
    });

    const imagesByMonth = Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalImages,
      totalCreditsUsed: creditSum._sum.creditUsed ?? 0,
      imagesByProvider,
      imagesByMonth,
    };
  } catch (error) {
    console.error('Get image stats error:', error);
    return {
      totalImages: 0,
      totalCreditsUsed: 0,
      imagesByProvider: {},
      imagesByMonth: [],
    };
  }
}
