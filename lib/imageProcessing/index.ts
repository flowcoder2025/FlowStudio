/**
 * Image Processing Module
 * Contract: HYBRID_FUNC_* (Phase 5)
 */

// =====================================================
// Types
// =====================================================

export * from './types';

// =====================================================
// Color Utilities
// =====================================================

export {
  // RGB <-> LAB
  rgbToLab,
  labToRgb,
  // RGB <-> HSL
  rgbToHsl,
  hslToRgb,
  // RGB <-> HSV
  rgbToHsv,
  hsvToRgb,
  // RGB <-> Hex
  rgbToHex,
  hexToRgb,
  // Color utilities
  colorDistance,
  getLuminance,
  getContrastRatio,
  blendColors,
  getComplementary,
  getAnalogous,
  getTriadic,
  // Batch operations
  imageDataToLab,
  labToImageData,
  calculateLabStats,
} from './labConversion';

// =====================================================
// Background Removal (HYBRID_FUNC_BG_REMOVE)
// =====================================================

export {
  removeBackground,
  removeBackgroundSimple,
  getBackgroundMask,
  isBackgroundRemovalAvailable,
  preloadBackgroundRemovalModel,
} from './removeBackground';

// =====================================================
// Color Transfer (HYBRID_FUNC_COLOR_TRANSFER)
// =====================================================

export {
  transferColors,
  transferColorsSimple,
  getColorStatistics,
  applyColorStatistics,
} from './colorTransfer';

// =====================================================
// Color Extraction (HYBRID_FUNC_COLOR_EXTRACT)
// =====================================================

export {
  extractColors,
  extractDominantColor,
  extractColorPaletteHex,
  isGrayscale,
  getColorHistogram,
  findSimilarColors,
} from './extractColor';

// =====================================================
// Filters (HYBRID_FUNC_FILTER)
// =====================================================

export {
  applyFilters,
  applySingleFilter,
  previewFilter,
} from './applyFilter';

// =====================================================
// SAM Segmentation (HYBRID_FUNC_SAM)
// =====================================================

export {
  segmentAnything,
  segmentWithBox,
  getImageEmbedding,
  segmentWithEmbedding,
  isSAMAvailable,
  preloadSAMModel,
  clearSAMCache,
} from './segmentAnything';

// =====================================================
// Colorway Generation (HYBRID_FUNC_COLORWAY)
// =====================================================

export {
  generateColorways,
  generateSingleColorway,
  getPaletteSuggestions,
  generatePalette,
  getColorwayName,
} from './colorway';

// =====================================================
// Presets
// =====================================================

export {
  BASIC_PRESETS,
  ARTISTIC_PRESETS,
  COLOR_PRESETS,
  VINTAGE_PRESETS,
  PROFESSIONAL_PRESETS,
  ALL_PRESETS,
  getPresetById,
  getPresetsByCategory,
  getCategories,
  createCustomPreset,
  mergePresets,
  adjustPresetIntensity,
} from './presets';
