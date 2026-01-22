/**
 * Filter Presets
 * Pre-defined filter combinations for common image styles
 */

import type { FilterPreset, FilterValue } from './types';

// Re-export types for convenience
export type { FilterPreset, FilterValue };

// =====================================================
// Basic Filters
// =====================================================

export const BASIC_PRESETS: FilterPreset[] = [
  {
    id: 'none',
    name: 'None',
    nameKo: '원본',
    filters: [],
    category: 'basic',
  },
  {
    id: 'brightness-high',
    name: 'Bright',
    nameKo: '밝게',
    filters: [{ type: 'brightness', value: 120 }],
    category: 'basic',
  },
  {
    id: 'brightness-low',
    name: 'Dark',
    nameKo: '어둡게',
    filters: [{ type: 'brightness', value: 80 }],
    category: 'basic',
  },
  {
    id: 'contrast-high',
    name: 'High Contrast',
    nameKo: '고대비',
    filters: [{ type: 'contrast', value: 130 }],
    category: 'basic',
  },
  {
    id: 'contrast-low',
    name: 'Low Contrast',
    nameKo: '저대비',
    filters: [{ type: 'contrast', value: 80 }],
    category: 'basic',
  },
  {
    id: 'saturate-high',
    name: 'Vivid',
    nameKo: '선명하게',
    filters: [{ type: 'saturation', value: 150 }],
    category: 'basic',
  },
  {
    id: 'saturate-low',
    name: 'Muted',
    nameKo: '차분하게',
    filters: [{ type: 'saturation', value: 60 }],
    category: 'basic',
  },
];

// =====================================================
// Artistic Filters
// =====================================================

export const ARTISTIC_PRESETS: FilterPreset[] = [
  {
    id: 'grayscale',
    name: 'Grayscale',
    nameKo: '흑백',
    filters: [{ type: 'grayscale', value: 100 }],
    category: 'artistic',
  },
  {
    id: 'sepia',
    name: 'Sepia',
    nameKo: '세피아',
    filters: [{ type: 'sepia', value: 100 }],
    category: 'artistic',
  },
  {
    id: 'noir',
    name: 'Noir',
    nameKo: '느와르',
    filters: [
      { type: 'grayscale', value: 100 },
      { type: 'contrast', value: 140 },
      { type: 'brightness', value: 90 },
    ],
    category: 'artistic',
  },
  {
    id: 'invert',
    name: 'Invert',
    nameKo: '반전',
    filters: [{ type: 'invert', value: 100 }],
    category: 'artistic',
  },
  {
    id: 'dramatic',
    name: 'Dramatic',
    nameKo: '드라마틱',
    filters: [
      { type: 'contrast', value: 130 },
      { type: 'saturation', value: 80 },
      { type: 'brightness', value: 95 },
    ],
    category: 'artistic',
  },
  {
    id: 'soft-glow',
    name: 'Soft Glow',
    nameKo: '부드러운 빛',
    filters: [
      { type: 'brightness', value: 110 },
      { type: 'contrast', value: 90 },
      { type: 'blur', value: 0.5 },
    ],
    category: 'artistic',
  },
];

// =====================================================
// Color Filters
// =====================================================

export const COLOR_PRESETS: FilterPreset[] = [
  {
    id: 'warm',
    name: 'Warm',
    nameKo: '따뜻하게',
    filters: [
      { type: 'hue-rotate', value: -10 },
      { type: 'saturation', value: 110 },
    ],
    category: 'color',
  },
  {
    id: 'cool',
    name: 'Cool',
    nameKo: '차갑게',
    filters: [
      { type: 'hue-rotate', value: 10 },
      { type: 'saturation', value: 105 },
    ],
    category: 'color',
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    nameKo: '생동감',
    filters: [
      { type: 'saturation', value: 140 },
      { type: 'contrast', value: 110 },
    ],
    category: 'color',
  },
  {
    id: 'pastel',
    name: 'Pastel',
    nameKo: '파스텔',
    filters: [
      { type: 'saturation', value: 70 },
      { type: 'brightness', value: 115 },
      { type: 'contrast', value: 85 },
    ],
    category: 'color',
  },
  {
    id: 'autumn',
    name: 'Autumn',
    nameKo: '가을',
    filters: [
      { type: 'hue-rotate', value: -20 },
      { type: 'saturation', value: 120 },
      { type: 'contrast', value: 105 },
    ],
    category: 'color',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    nameKo: '바다',
    filters: [
      { type: 'hue-rotate', value: 20 },
      { type: 'saturation', value: 115 },
    ],
    category: 'color',
  },
];

// =====================================================
// Vintage Filters
// =====================================================

export const VINTAGE_PRESETS: FilterPreset[] = [
  {
    id: 'vintage',
    name: 'Vintage',
    nameKo: '빈티지',
    filters: [
      { type: 'sepia', value: 30 },
      { type: 'contrast', value: 95 },
      { type: 'brightness', value: 105 },
    ],
    category: 'vintage',
  },
  {
    id: 'retro',
    name: 'Retro',
    nameKo: '레트로',
    filters: [
      { type: 'sepia', value: 20 },
      { type: 'saturation', value: 80 },
      { type: 'hue-rotate', value: -15 },
    ],
    category: 'vintage',
  },
  {
    id: 'fade',
    name: 'Fade',
    nameKo: '페이드',
    filters: [
      { type: 'contrast', value: 85 },
      { type: 'brightness', value: 110 },
      { type: 'saturation', value: 85 },
    ],
    category: 'vintage',
  },
  {
    id: 'film',
    name: 'Film',
    nameKo: '필름',
    filters: [
      { type: 'sepia', value: 15 },
      { type: 'contrast', value: 105 },
      { type: 'saturation', value: 90 },
    ],
    category: 'vintage',
  },
  {
    id: 'polaroid',
    name: 'Polaroid',
    nameKo: '폴라로이드',
    filters: [
      { type: 'sepia', value: 25 },
      { type: 'contrast', value: 110 },
      { type: 'brightness', value: 108 },
      { type: 'saturation', value: 95 },
    ],
    category: 'vintage',
  },
];

// =====================================================
// Professional Filters
// =====================================================

export const PROFESSIONAL_PRESETS: FilterPreset[] = [
  {
    id: 'clarendon',
    name: 'Clarendon',
    nameKo: '클라렌던',
    filters: [
      { type: 'contrast', value: 120 },
      { type: 'saturation', value: 115 },
    ],
    category: 'professional',
  },
  {
    id: 'chrome',
    name: 'Chrome',
    nameKo: '크롬',
    filters: [
      { type: 'contrast', value: 125 },
      { type: 'saturation', value: 105 },
      { type: 'brightness', value: 105 },
    ],
    category: 'professional',
  },
  {
    id: 'lark',
    name: 'Lark',
    nameKo: '라크',
    filters: [
      { type: 'brightness', value: 108 },
      { type: 'contrast', value: 95 },
      { type: 'saturation', value: 90 },
    ],
    category: 'professional',
  },
  {
    id: 'juno',
    name: 'Juno',
    nameKo: '주노',
    filters: [
      { type: 'saturation', value: 120 },
      { type: 'contrast', value: 105 },
      { type: 'brightness', value: 102 },
    ],
    category: 'professional',
  },
  {
    id: 'reyes',
    name: 'Reyes',
    nameKo: '레예스',
    filters: [
      { type: 'sepia', value: 22 },
      { type: 'brightness', value: 110 },
      { type: 'contrast', value: 85 },
      { type: 'saturation', value: 75 },
    ],
    category: 'professional',
  },
  {
    id: 'hudson',
    name: 'Hudson',
    nameKo: '허드슨',
    filters: [
      { type: 'brightness', value: 105 },
      { type: 'contrast', value: 95 },
      { type: 'saturation', value: 85 },
      { type: 'hue-rotate', value: 10 },
    ],
    category: 'professional',
  },
];

// =====================================================
// All Presets
// =====================================================

export const ALL_PRESETS: FilterPreset[] = [
  ...BASIC_PRESETS,
  ...ARTISTIC_PRESETS,
  ...COLOR_PRESETS,
  ...VINTAGE_PRESETS,
  ...PROFESSIONAL_PRESETS,
];

// =====================================================
// Helper Functions
// =====================================================

/**
 * Get preset by ID
 */
export function getPresetById(id: string): FilterPreset | undefined {
  return ALL_PRESETS.find((p) => p.id === id);
}

/**
 * Get presets by category
 */
export function getPresetsByCategory(category: FilterPreset['category']): FilterPreset[] {
  return ALL_PRESETS.filter((p) => p.category === category);
}

/**
 * Get all categories
 */
export function getCategories(): Array<{ id: FilterPreset['category']; name: string; nameKo: string }> {
  return [
    { id: 'basic', name: 'Basic', nameKo: '기본' },
    { id: 'artistic', name: 'Artistic', nameKo: '예술적' },
    { id: 'color', name: 'Color', nameKo: '색상' },
    { id: 'vintage', name: 'Vintage', nameKo: '빈티지' },
    { id: 'professional', name: 'Professional', nameKo: '전문가' },
  ];
}

/**
 * Create custom preset
 */
export function createCustomPreset(
  name: string,
  nameKo: string,
  filters: FilterValue[]
): FilterPreset {
  return {
    id: `custom-${Date.now()}`,
    name,
    nameKo,
    filters,
    category: 'basic',
  };
}

/**
 * Merge presets (combine filters)
 */
export function mergePresets(preset1: FilterPreset, preset2: FilterPreset): FilterPreset {
  const mergedFilters: FilterValue[] = [...preset1.filters];

  for (const filter of preset2.filters) {
    const existingIndex = mergedFilters.findIndex((f) => f.type === filter.type);
    if (existingIndex >= 0) {
      // Average the values for same filter type
      mergedFilters[existingIndex] = {
        type: filter.type,
        value: (mergedFilters[existingIndex].value + filter.value) / 2,
      };
    } else {
      mergedFilters.push(filter);
    }
  }

  return {
    id: `merged-${Date.now()}`,
    name: `${preset1.name} + ${preset2.name}`,
    nameKo: `${preset1.nameKo} + ${preset2.nameKo}`,
    filters: mergedFilters,
    category: 'basic',
  };
}

/**
 * Adjust preset intensity
 */
export function adjustPresetIntensity(preset: FilterPreset, intensity: number): FilterPreset {
  const adjustedFilters = preset.filters.map((filter) => {
    // Calculate how much the filter deviates from neutral (100 for most, 0 for some)
    let neutral = 100;
    if (['grayscale', 'sepia', 'invert', 'blur', 'hue-rotate'].includes(filter.type)) {
      neutral = 0;
    }

    const deviation = filter.value - neutral;
    const adjustedValue = neutral + deviation * intensity;

    return {
      type: filter.type,
      value: adjustedValue,
    };
  });

  return {
    ...preset,
    id: `${preset.id}-adjusted`,
    filters: adjustedFilters,
  };
}
