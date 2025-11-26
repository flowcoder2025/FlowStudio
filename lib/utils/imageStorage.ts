/**
 * Image Storage Utilities
 *
 * Handles uploading images to Supabase Storage and converting between
 * base64 and public URLs
 */

import { supabase, IMAGE_BUCKET } from '@/lib/supabase'
import crypto from 'crypto'

/**
 * Upload a base64 image to Supabase Storage
 *
 * @param base64Image - Base64 encoded image (with or without data URI prefix)
 * @param userId - User ID for organizing files
 * @param prefix - Optional prefix for file organization (e.g., 'projects', 'generations')
 * @returns Public URL of the uploaded image
 */
export async function uploadImageToStorage(
  base64Image: string,
  userId: string,
  prefix: string = 'images'
): Promise<string> {
  try {
    // Remove data URI prefix if present
    const base64Data = base64Image.includes(',')
      ? base64Image.split(',')[1]
      : base64Image

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64')

    // Detect mime type from data URI or default to png
    let mimeType = 'image/png'
    let extension = 'png'

    if (base64Image.includes('data:')) {
      const match = base64Image.match(/data:([^;]+);/)
      if (match) {
        mimeType = match[1]
        extension = mimeType.split('/')[1] || 'png'
      }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomHash = crypto.randomBytes(8).toString('hex')
    const fileName = `${prefix}/${userId}/${timestamp}-${randomHash}.${extension}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(fileName, buffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Supabase Storage upload error:', error)
      throw new Error(`이미지 업로드 실패: ${error.message}`)
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(data.path)

    return publicUrl
  } catch (error) {
    console.error('Image upload error:', error)
    throw error
  }
}

/**
 * Upload multiple base64 images to Supabase Storage
 *
 * @param base64Images - Array of base64 encoded images
 * @param userId - User ID for organizing files
 * @param prefix - Optional prefix for file organization
 * @returns Array of public URLs
 */
export async function uploadMultipleImages(
  base64Images: string[],
  userId: string,
  prefix: string = 'images'
): Promise<string[]> {
  const uploadPromises = base64Images.map((image) =>
    uploadImageToStorage(image, userId, prefix)
  )

  return Promise.all(uploadPromises)
}

/**
 * Delete an image from Supabase Storage
 *
 * @param imageUrl - Public URL of the image to delete
 */
export async function deleteImageFromStorage(imageUrl: string): Promise<void> {
  try {
    // Extract file path from public URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split(`/${IMAGE_BUCKET}/`)

    if (pathParts.length < 2) {
      throw new Error('Invalid image URL format')
    }

    const filePath = pathParts[1]

    // Delete from Supabase Storage
    const { error } = await supabase.storage.from(IMAGE_BUCKET).remove([filePath])

    if (error) {
      console.error('Supabase Storage delete error:', error)
      throw new Error(`이미지 삭제 실패: ${error.message}`)
    }
  } catch (error) {
    console.error('Image deletion error:', error)
    throw error
  }
}

/**
 * Delete multiple images from Supabase Storage
 *
 * @param imageUrls - Array of public URLs to delete
 */
export async function deleteMultipleImages(imageUrls: string[]): Promise<void> {
  const deletePromises = imageUrls.map((url) => deleteImageFromStorage(url))
  await Promise.all(deletePromises)
}

/**
 * Check if a string is a base64 image (legacy data)
 *
 * @param str - String to check
 * @returns True if the string is a base64 image
 */
export function isBase64Image(str: string): boolean {
  return str.startsWith('data:image/')
}

/**
 * Check if a string is a Supabase Storage URL
 *
 * @param str - String to check
 * @returns True if the string is a Supabase Storage URL
 */
export function isStorageUrl(str: string): boolean {
  return str.includes(IMAGE_BUCKET) || str.startsWith('http')
}
