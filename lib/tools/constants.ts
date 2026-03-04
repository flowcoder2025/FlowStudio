/**
 * Shared Constants for Tool Pages
 */

import type { AspectRatioOption, CategoryItem, StyleItem, SuggestedTag } from './types';

// =====================================================
// Aspect Ratios
// =====================================================

export const ASPECT_RATIOS: AspectRatioOption[] = [
  { value: '1:1', labelKey: 'tools.aspectRatio.square', width: 1, height: 1 },
  { value: '3:4', labelKey: 'tools.aspectRatio.portrait34', width: 3, height: 4 },
  { value: '4:3', labelKey: 'tools.aspectRatio.landscape43', width: 4, height: 3 },
  { value: '9:16', labelKey: 'tools.aspectRatio.portrait916', width: 9, height: 16 },
  { value: '16:9', labelKey: 'tools.aspectRatio.landscape169', width: 16, height: 9 },
];

// =====================================================
// Categories (Poster / Composite / Detail Page 공유)
// =====================================================

export const CATEGORIES: CategoryItem[] = [
  { id: 'fashion', labelKey: 'category.fashion' },
  { id: 'food', labelKey: 'category.food' },
  { id: 'beauty', labelKey: 'category.beauty' },
  { id: 'electronics', labelKey: 'category.electronics' },
  { id: 'interior', labelKey: 'category.interior' },
  { id: 'lifestyle', labelKey: 'category.lifestyle' },
];

// =====================================================
// Styles (카테고리별)
// =====================================================

export const STYLES: StyleItem[] = [
  // Fashion
  { id: 'minimalist', labelKey: 'style.minimalist', category: 'fashion' },
  { id: 'luxury', labelKey: 'style.luxury', category: 'fashion' },
  { id: 'street', labelKey: 'style.street', category: 'fashion' },
  { id: 'editorial', labelKey: 'style.editorial', category: 'fashion' },
  // Food
  { id: 'warm-cozy', labelKey: 'style.warmCozy', category: 'food' },
  { id: 'clean-bright', labelKey: 'style.cleanBright', category: 'food' },
  { id: 'dark-moody', labelKey: 'style.darkMoody', category: 'food' },
  { id: 'natural', labelKey: 'style.natural', category: 'food' },
  // Beauty
  { id: 'elegant', labelKey: 'style.elegant', category: 'beauty' },
  { id: 'fresh', labelKey: 'style.fresh', category: 'beauty' },
  { id: 'bold', labelKey: 'style.bold', category: 'beauty' },
  { id: 'soft', labelKey: 'style.soft', category: 'beauty' },
  // Electronics
  { id: 'tech', labelKey: 'style.tech', category: 'electronics' },
  { id: 'modern', labelKey: 'style.modern', category: 'electronics' },
  { id: 'futuristic', labelKey: 'style.futuristic', category: 'electronics' },
  // Interior
  { id: 'scandinavian', labelKey: 'style.scandinavian', category: 'interior' },
  { id: 'industrial', labelKey: 'style.industrial', category: 'interior' },
  { id: 'cozy', labelKey: 'style.cozy', category: 'interior' },
  // Lifestyle
  { id: 'casual', labelKey: 'style.casual', category: 'lifestyle' },
  { id: 'professional', labelKey: 'style.professional', category: 'lifestyle' },
  { id: 'vibrant', labelKey: 'style.vibrant', category: 'lifestyle' },
];

/** 카테고리별 스타일 필터링 */
export function getStylesForCategory(categoryId: string): StyleItem[] {
  return STYLES.filter((s) => s.category === categoryId);
}

// =====================================================
// Suggested Tags (프롬프트 추천)
// =====================================================

export const SUGGESTED_TAGS: SuggestedTag[] = [
  { labelKey: 'tools.tag.highQuality', value: 'high quality, professional photography' },
  { labelKey: 'tools.tag.studioLighting', value: 'studio lighting, soft shadows' },
  { labelKey: 'tools.tag.naturalLight', value: 'natural light, golden hour' },
  { labelKey: 'tools.tag.whiteBackground', value: 'white background, clean' },
  { labelKey: 'tools.tag.lifestyle', value: 'lifestyle shot, in context' },
  { labelKey: 'tools.tag.closeUp', value: 'close-up, macro detail' },
  { labelKey: 'tools.tag.flatLay', value: 'flat lay, top view' },
  { labelKey: 'tools.tag.minimalist', value: 'minimalist, simple composition' },
];

// =====================================================
// Image Count Options
// =====================================================

export const IMAGE_COUNT_OPTIONS = [1, 2, 3, 4] as const;

export type ImageCount = typeof IMAGE_COUNT_OPTIONS[number];

// =====================================================
// File Upload Limits
// =====================================================

export const UPLOAD_LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
  maxFiles: {
    edit: 1,
    poster: 1,
    composite: 10,
    detailEdit: 1,
    detailPage: 1,
  },
} as const;
