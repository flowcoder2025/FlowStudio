/**
 * Storage Module
 * Contract: IMAGE_FUNC_SAVE
 */

export {
  uploadImage,
  uploadImageFromUrl,
  deleteImage,
  deleteImages,
  getImageUrl,
  getThumbnailUrl,
  getPathFromUrl,
  type UploadOptions,
  type UploadResult,
  type DeleteResult,
} from './uploadImage';

export {
  checkStorageQuota,
  updateStorageUsage,
  getStorageUsage,
  getStorageLimitForUser,
  getStorageStatsSummary,
  parseStorageString,
  formatStorageSize,
  STORAGE_LIMITS,
  type StorageUsage,
  type QuotaCheckResult,
} from './quota';
