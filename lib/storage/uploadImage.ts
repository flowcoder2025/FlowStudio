/**
 * Supabase Storage Upload
 * Contract: IMAGE_FUNC_SAVE
 */

import { createClient } from '@supabase/supabase-js';
import { checkStorageQuota, updateStorageUsage } from './quota';

// =====================================================
// Configuration
// =====================================================

const BUCKET_NAME = 'images';
const THUMBNAIL_BUCKET = 'thumbnails';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// =====================================================
// Types
// =====================================================

export interface UploadOptions {
  userId: string;
  imageData: string | Buffer | Blob;
  filename?: string;
  contentType?: string;
  generateThumbnail?: boolean;
}

export interface UploadResult {
  success: boolean;
  url: string;
  thumbnailUrl?: string;
  path: string;
  size: number;
  error?: string;
  errorCode?: 'STORAGE_QUOTA_EXCEEDED';
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

// =====================================================
// Supabase Client
// =====================================================

let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }

  return supabaseClient;
}

// =====================================================
// Main Upload Function
// =====================================================

export async function uploadImage(options: UploadOptions): Promise<UploadResult> {
  const {
    userId,
    imageData,
    filename,
    contentType = 'image/png',
    generateThumbnail = true,
  } = options;

  try {
    const supabase = getSupabaseClient();

    // Process image data
    const { buffer, size } = await processImageData(imageData);

    if (size > MAX_FILE_SIZE) {
      return {
        success: false,
        url: '',
        path: '',
        size: 0,
        error: `File size (${Math.round(size / 1024 / 1024)}MB) exceeds maximum (${MAX_FILE_SIZE / 1024 / 1024}MB)`,
      };
    }

    // Check storage quota before upload
    const quotaCheck = await checkStorageQuota(userId, size);
    if (!quotaCheck.allowed) {
      return {
        success: false,
        url: '',
        path: '',
        size: 0,
        error: quotaCheck.errorMessage,
        errorCode: quotaCheck.errorCode,
      };
    }

    // Generate unique filename
    const extension = getExtension(contentType);
    const generatedFilename = filename ?? generateFilename(userId, extension);
    const path = `${userId}/${generatedFilename}`;

    // Upload main image
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return {
        success: false,
        url: '',
        path: '',
        size: 0,
        error: uploadError.message,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    const url = urlData.publicUrl;

    // Generate and upload thumbnail
    let thumbnailUrl: string | undefined;
    if (generateThumbnail) {
      thumbnailUrl = await uploadThumbnail(userId, buffer, generatedFilename, contentType);
    }

    // Update storage usage after successful upload
    await updateStorageUsage(userId, BigInt(size), 1);

    return {
      success: true,
      url,
      thumbnailUrl,
      path,
      size,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      url: '',
      path: '',
      size: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =====================================================
// Thumbnail Upload
// =====================================================

async function uploadThumbnail(
  userId: string,
  imageBuffer: Buffer,
  originalFilename: string,
  contentType: string
): Promise<string | undefined> {
  try {
    const supabase = getSupabaseClient();

    // For now, we'll upload the same image as thumbnail
    // In production, you'd want to resize using sharp or similar
    const thumbnailFilename = `thumb_${originalFilename}`;
    const thumbnailPath = `${userId}/${thumbnailFilename}`;

    const { error } = await supabase.storage
      .from(THUMBNAIL_BUCKET)
      .upload(thumbnailPath, imageBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      // Thumbnail failure is not critical
      console.warn('Thumbnail upload failed:', error);
      return undefined;
    }

    const { data } = supabase.storage
      .from(THUMBNAIL_BUCKET)
      .getPublicUrl(thumbnailPath);

    return data.publicUrl;
  } catch (error) {
    console.warn('Thumbnail generation failed:', error);
    return undefined;
  }
}

// =====================================================
// Delete Functions
// =====================================================

export async function deleteImage(path: string): Promise<DeleteResult> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Also try to delete thumbnail
    const thumbnailPath = path.replace(/\/([^\/]+)$/, '/thumb_$1');
    await supabase.storage
      .from(THUMBNAIL_BUCKET)
      .remove([thumbnailPath])
      .catch(() => {/* Ignore thumbnail delete errors */});

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function deleteImages(paths: string[]): Promise<DeleteResult> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(paths);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Also delete thumbnails
    const thumbnailPaths = paths.map(p => p.replace(/\/([^\/]+)$/, '/thumb_$1'));
    await supabase.storage
      .from(THUMBNAIL_BUCKET)
      .remove(thumbnailPaths)
      .catch(() => {/* Ignore */});

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =====================================================
// Helper Functions
// =====================================================

async function processImageData(
  data: string | Buffer | Blob
): Promise<{ buffer: Buffer; size: number }> {
  // Handle data URL
  if (typeof data === 'string') {
    if (data.startsWith('data:')) {
      const base64Data = data.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      return { buffer, size: buffer.length };
    }

    // Handle base64 string without prefix
    const buffer = Buffer.from(data, 'base64');
    return { buffer, size: buffer.length };
  }

  // Handle Buffer
  if (Buffer.isBuffer(data)) {
    return { buffer: data, size: data.length };
  }

  // Handle Blob
  if (data instanceof Blob) {
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return { buffer, size: buffer.length };
  }

  throw new Error('Unsupported image data format');
}

function generateFilename(userId: string, extension: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${random}.${extension}`;
}

function getExtension(contentType: string): string {
  const extensions: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return extensions[contentType] ?? 'png';
}

// =====================================================
// URL Helpers
// =====================================================

export function getImageUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return path;
  }
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${path}`;
}

export function getThumbnailUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return path;
  }
  const thumbnailPath = path.replace(/\/([^\/]+)$/, '/thumb_$1');
  return `${supabaseUrl}/storage/v1/object/public/${THUMBNAIL_BUCKET}/${thumbnailPath}`;
}

export function getPathFromUrl(url: string): string | null {
  const match = url.match(/\/storage\/v1\/object\/public\/images\/(.+)$/);
  return match ? match[1] : null;
}

// =====================================================
// Upload from URL
// =====================================================

export async function uploadImageFromUrl(
  userId: string,
  imageUrl: string,
  generateThumbnail = true
): Promise<UploadResult> {
  try {
    // Handle data URLs directly
    if (imageUrl.startsWith('data:')) {
      const contentTypeMatch = imageUrl.match(/^data:([^;]+);/);
      const contentType = contentTypeMatch?.[1] ?? 'image/png';

      return uploadImage({
        userId,
        imageData: imageUrl,
        contentType,
        generateThumbnail,
      });
    }

    // Fetch remote image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return {
        success: false,
        url: '',
        path: '',
        size: 0,
        error: `Failed to fetch image: ${response.status}`,
      };
    }

    const contentType = response.headers.get('content-type') ?? 'image/png';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return uploadImage({
      userId,
      imageData: buffer,
      contentType,
      generateThumbnail,
    });
  } catch (error) {
    return {
      success: false,
      url: '',
      path: '',
      size: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
