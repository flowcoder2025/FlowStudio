/**
 * Image Delete
 * Contract: IMAGE_FUNC_DELETE
 */

import { prisma } from '@/lib/db';
import { checkPermission } from '@/lib/permissions/check';
import { deleteImage as deleteFromStorage, getPathFromUrl } from '@/lib/storage/uploadImage';

// =====================================================
// Types
// =====================================================

export interface DeleteOptions {
  userId: string;
  imageId: string;
  permanent?: boolean; // If true, permanently delete; if false, soft delete
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

export interface BulkDeleteOptions {
  userId: string;
  imageIds: string[];
  permanent?: boolean;
}

export interface BulkDeleteResult {
  success: boolean;
  deleted: string[];
  failed: Array<{ id: string; error: string }>;
}

// =====================================================
// Single Delete
// =====================================================

export async function deleteImageById(options: DeleteOptions): Promise<DeleteResult> {
  const { userId, imageId, permanent = false } = options;

  try {
    // Get image
    // DB Schema: ImageProject uses resultImages array, not imageUrl/thumbnailUrl
    const image = await prisma.imageProject.findUnique({
      where: { id: imageId },
      select: {
        id: true,
        userId: true,
        resultImages: true,
        deletedAt: true,
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
      relation: 'owner',
    });

    const isOwner = image.userId === userId;

    if (!hasPermission && !isOwner) {
      return {
        success: false,
        error: 'Access denied',
      };
    }

    if (permanent) {
      // Permanent delete
      return await permanentDelete(image);
    } else {
      // Soft delete
      return await softDelete(imageId);
    }
  } catch (error) {
    console.error('Delete image error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete image',
    };
  }
}

// =====================================================
// Soft Delete
// =====================================================

async function softDelete(imageId: string): Promise<DeleteResult> {
  try {
    await prisma.imageProject.update({
      where: { id: imageId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to soft delete',
    };
  }
}

// =====================================================
// Permanent Delete
// =====================================================

interface ImageToDelete {
  id: string;
  resultImages: string[];
}

async function permanentDelete(image: ImageToDelete): Promise<DeleteResult> {
  try {
    // Delete from storage first - delete all result images
    for (const imageUrl of image.resultImages) {
      const imagePath = getPathFromUrl(imageUrl);
      if (imagePath) {
        await deleteFromStorage(imagePath);
      }
    }

    // Delete from database
    await prisma.imageProject.delete({
      where: { id: image.id },
    });

    // Also delete any related permission tuples
    await prisma.relationTuple.deleteMany({
      where: {
        namespace: 'image_project',
        objectId: image.id,
      },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to permanently delete',
    };
  }
}

// =====================================================
// Bulk Delete
// =====================================================

export async function deleteImages(options: BulkDeleteOptions): Promise<BulkDeleteResult> {
  const { userId, imageIds, permanent = false } = options;
  const deleted: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  for (const imageId of imageIds) {
    const result = await deleteImageById({
      userId,
      imageId,
      permanent,
    });

    if (result.success) {
      deleted.push(imageId);
    } else {
      failed.push({ id: imageId, error: result.error ?? 'Unknown error' });
    }
  }

  return {
    success: failed.length === 0,
    deleted,
    failed,
  };
}

// =====================================================
// Restore (Undo Soft Delete)
// =====================================================

export async function restoreImage(
  userId: string,
  imageId: string
): Promise<DeleteResult> {
  try {
    // Get image
    const image = await prisma.imageProject.findUnique({
      where: { id: imageId },
      select: {
        id: true,
        userId: true,
        deletedAt: true,
      },
    });

    if (!image) {
      return {
        success: false,
        error: 'Image not found',
      };
    }

    if (!image.deletedAt) {
      return {
        success: false,
        error: 'Image is not deleted',
      };
    }

    // Check permission
    const isOwner = image.userId === userId;
    if (!isOwner) {
      return {
        success: false,
        error: 'Access denied',
      };
    }

    // Restore
    await prisma.imageProject.update({
      where: { id: imageId },
      data: { deletedAt: null },
    });

    return { success: true };
  } catch (error) {
    console.error('Restore image error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore image',
    };
  }
}

// =====================================================
// Cleanup (Delete old soft-deleted images)
// =====================================================

export interface CleanupOptions {
  daysOld?: number; // Delete soft-deleted images older than this
  dryRun?: boolean; // If true, just return count without deleting
}

export interface CleanupResult {
  success: boolean;
  count: number;
  deletedIds?: string[];
  error?: string;
}

export async function cleanupDeletedImages(options: CleanupOptions = {}): Promise<CleanupResult> {
  const { daysOld = 30, dryRun = false } = options;

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Find old soft-deleted images
    // DB Schema: ImageProject uses resultImages array
    const images = await prisma.imageProject.findMany({
      where: {
        deletedAt: {
          not: null,
          lt: cutoffDate,
        },
      },
      select: {
        id: true,
        resultImages: true,
      },
    });

    if (dryRun) {
      return {
        success: true,
        count: images.length,
        deletedIds: images.map((img) => img.id),
      };
    }

    // Permanently delete each
    const deletedIds: string[] = [];
    for (const image of images) {
      const result = await permanentDelete(image);
      if (result.success) {
        deletedIds.push(image.id);
      }
    }

    return {
      success: true,
      count: deletedIds.length,
      deletedIds,
    };
  } catch (error) {
    console.error('Cleanup error:', error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Cleanup failed',
    };
  }
}

// =====================================================
// List Deleted Images (Trash)
// =====================================================

export interface TrashListOptions {
  userId: string;
  page?: number;
  limit?: number;
}

export interface TrashListResult {
  success: boolean;
  images: Array<{
    id: string;
    title: string | null;
    thumbnailUrl: string | null;
    deletedAt: Date;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listDeletedImages(options: TrashListOptions): Promise<TrashListResult> {
  const { userId, page = 1, limit = 20 } = options;

  try {
    const where = {
      userId,
      deletedAt: { not: null },
    };

    const total = await prisma.imageProject.count({ where });

    // DB Schema: ImageProject uses resultImages array, not thumbnailUrl
    const images = await prisma.imageProject.findMany({
      where,
      select: {
        id: true,
        title: true,
        resultImages: true,
        deletedAt: true,
      },
      orderBy: { deletedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      success: true,
      images: images.map((img) => ({
        id: img.id,
        title: img.title,
        thumbnailUrl: img.resultImages?.[0] ?? null, // Use first image as thumbnail
        deletedAt: img.deletedAt!,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('List deleted images error:', error);
    return {
      success: false,
      images: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }
}
