/**
 * Image Provider Module
 * Contract: IMAGE_FUNC_GENERATE, IMAGE_FUNC_PROVIDER, IMAGE_FUNC_UPSCALE
 */

// Types
export * from './types';

// Generation
export {
  generateImages,
  generateImagesSimple,
  generateImagesBatch,
  generateImagesWithRetry,
} from './generate';

// Upscale
export {
  upscaleImage,
  upscaleImageSimple,
  getUpscaleCost,
  getUpscaleFactor,
  calculateUpscaledDimensions,
} from './upscale';

// Provider Selection
export {
  selectProvider,
  getProviderConfig,
  getAllProviderConfigs,
  getProviderStatus,
  estimateCredits,
} from './selectProvider';

// Provider-specific (for advanced use)
export { GOOGLE_CONFIG, checkRateLimit as checkGoogleRateLimit } from './googleGenAI';
export {
  OPENROUTER_FLUX_CONFIG,
  OPENROUTER_SDXL_CONFIG,
  checkOpenRouterRateLimit,
  getOpenRouterConfig,
} from './openRouter';
