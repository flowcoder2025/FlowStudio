/**
 * Images Module
 * Contract: IMAGE_FUNC_LIST, IMAGE_FUNC_DELETE
 */

// List functions
export {
  listImages,
  getImage,
  searchImages,
  getImageStats,
  type ImageListOptions,
  type ImageListItem,
  type ImageListResult,
  type ImageDetail,
  type SearchOptions,
  type ImageStats,
} from './list';

// Delete functions
export {
  deleteImageById,
  deleteImages,
  restoreImage,
  cleanupDeletedImages,
  listDeletedImages,
  type DeleteOptions,
  type DeleteResult,
  type BulkDeleteOptions,
  type BulkDeleteResult,
  type CleanupOptions,
  type CleanupResult,
  type TrashListOptions,
  type TrashListResult,
} from './delete';
