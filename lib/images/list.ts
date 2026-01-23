/**
 * Image Gallery List
 * Contract: IMAGE_FUNC_LIST
 *
 * DB Schema Notes:
 * - ImageProject uses: resultImages[], mode, category, style, aspectRatio
 * - Not: imageUrl, thumbnailUrl, negativePrompt, provider, model, creditUsed, isUpscaled
 * - WorkflowSession uses: industryId, actionId, stepData, workflowId
 * - Not: industry, action, inputs
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
  prompt: string | null;
  imageUrl: string | null; // Derived from resultImages[0]
  thumbnailUrl: string | null; // Derived from resultImages[0]
  mode: string;
  category: string | null;
  style: string | null;
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
  description: string | null;
  aspectRatio: string | null;
  sourceImage: string | null;
  resultImages: string[];
  workflowSession?: {
    id: string;
    industryId: string;
    actionId: string;
    stepData: Record<string, unknown>;
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
        mode: true,
        category: true,
        style: true,
        resultImages: true,
        createdAt: true,
        updatedAt: true,
        workflowSessionId: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Map to ImageListItem format
    const mappedImages: ImageListItem[] = images.map((img) => ({
      id: img.id,
      title: img.title,
      prompt: img.prompt,
      imageUrl: img.resultImages?.[0] ?? null,
      thumbnailUrl: img.resultImages?.[0] ?? null,
      mode: img.mode,
      category: img.category,
      style: img.style,
      createdAt: img.createdAt,
      updatedAt: img.updatedAt,
      workflowSessionId: img.workflowSessionId,
    }));

    return {
      success: true,
      images: mappedImages,
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
            industryId: true,
            actionId: true,
            stepData: true,
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
        description: image.description,
        imageUrl: image.resultImages?.[0] ?? null,
        thumbnailUrl: image.resultImages?.[0] ?? null,
        mode: image.mode,
        category: image.category,
        style: image.style,
        aspectRatio: image.aspectRatio,
        sourceImage: image.sourceImage,
        resultImages: image.resultImages,
        createdAt: image.createdAt,
        updatedAt: image.updatedAt,
        workflowSessionId: image.workflowSessionId,
        workflowSession: image.workflowSession
          ? {
              id: image.workflowSession.id,
              industryId: image.workflowSession.industryId,
              actionId: image.workflowSession.actionId,
              stepData: image.workflowSession.stepData as Record<string, unknown>,
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
  mode?: string;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export async function searchImages(options: SearchOptions): Promise<ImageListResult> {
  const {
    userId,
    query,
    mode,
    category,
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
      OR?: Array<{
        prompt?: { contains: string; mode: 'insensitive' };
        title?: { contains: string; mode: 'insensitive' };
      }>;
      mode?: string;
      category?: string;
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

    // Mode filter
    if (mode) {
      where.mode = mode;
    }

    // Category filter
    if (category) {
      where.category = category;
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
        mode: true,
        category: true,
        style: true,
        resultImages: true,
        createdAt: true,
        updatedAt: true,
        workflowSessionId: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Map to ImageListItem format
    const mappedImages: ImageListItem[] = images.map((img) => ({
      id: img.id,
      title: img.title,
      prompt: img.prompt,
      imageUrl: img.resultImages?.[0] ?? null,
      thumbnailUrl: img.resultImages?.[0] ?? null,
      mode: img.mode,
      category: img.category,
      style: img.style,
      createdAt: img.createdAt,
      updatedAt: img.updatedAt,
      workflowSessionId: img.workflowSessionId,
    }));

    return {
      success: true,
      images: mappedImages,
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
  imagesByMode: Record<string, number>;
  imagesByCategory: Record<string, number>;
  imagesByMonth: Array<{ month: string; count: number }>;
}

export async function getImageStats(userId: string): Promise<ImageStats> {
  try {
    // Get total count
    const totalImages = await prisma.imageProject.count({
      where: { userId, deletedAt: null },
    });

    // Get images by mode
    const byMode = await prisma.imageProject.groupBy({
      by: ['mode'],
      where: { userId, deletedAt: null },
      _count: true,
    });

    const imagesByMode: Record<string, number> = {};
    byMode.forEach((item) => {
      if (item.mode) {
        imagesByMode[item.mode] = item._count;
      }
    });

    // Get images by category
    const byCategory = await prisma.imageProject.groupBy({
      by: ['category'],
      where: { userId, deletedAt: null },
      _count: true,
    });

    const imagesByCategory: Record<string, number> = {};
    byCategory.forEach((item) => {
      if (item.category) {
        imagesByCategory[item.category] = item._count;
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
      imagesByMode,
      imagesByCategory,
      imagesByMonth,
    };
  } catch (error) {
    console.error('Get image stats error:', error);
    return {
      totalImages: 0,
      imagesByMode: {},
      imagesByCategory: {},
      imagesByMonth: [],
    };
  }
}
