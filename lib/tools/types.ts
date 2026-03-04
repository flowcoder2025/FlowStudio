/**
 * Shared Types for Tool Pages (Edit, Poster, Composite, Detail Edit, Detail Page)
 */

import type { AspectRatio, ReferenceMode, ImageProvider, ImageModel } from '@/lib/imageProvider/types';

// =====================================================
// Generation Mode
// =====================================================

export type ToolMode = 'EDIT' | 'POSTER' | 'COMPOSITE' | 'DETAIL_EDIT' | 'DETAIL_PAGE';

// =====================================================
// Common Generation Request (Client-side)
// =====================================================

export interface ToolGenerateRequest {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: AspectRatio;
  count?: number;
  style?: string;
  provider?: ImageProvider;
  model?: ImageModel;
  mode: ToolMode;
  /** Source image (base64 data URL) */
  sourceImage?: string;
  /** Reference images (base64 data URLs) */
  refImages?: string[];
  /** Reference mode */
  referenceMode?: ReferenceMode;
  /** Logo image (base64 data URL) */
  logoImage?: string;
  /** Mask image for detail editing (base64 data URL) */
  maskImage?: string;
}

// =====================================================
// Generation Response
// =====================================================

export interface ToolGenerateResponse {
  success: boolean;
  images: ToolGeneratedImage[];
  creditsUsed: number;
  provider: string;
  model: string;
  duration?: number;
  error?: string;
  code?: string;
  retryable?: boolean;
}

export interface ToolGeneratedImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  prompt: string;
  negativePrompt?: string;
  provider: string;
  model: string;
  seed?: number;
}

// =====================================================
// Category / Style Selection
// =====================================================

export interface CategoryItem {
  id: string;
  labelKey: string;
  icon?: string;
}

export interface StyleItem {
  id: string;
  labelKey: string;
  thumbnail?: string;
  category: string;
}

// =====================================================
// Aspect Ratio Option
// =====================================================

export interface AspectRatioOption {
  value: AspectRatio;
  labelKey: string;
  width: number;
  height: number;
}

// =====================================================
// Suggested Tag
// =====================================================

export interface SuggestedTag {
  labelKey: string;
  value: string;
}
