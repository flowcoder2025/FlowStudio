/**
 * Background Removal Module
 * Contract: HYBRID_FUNC_BG_REMOVE
 * Uses @imgly/background-removal for client-side background removal
 */

import type {
  BackgroundRemovalOptions,
  BackgroundRemovalResult,
  BackgroundRemovalModel,
  ImageSource,
  ImageProcessingError,
} from './types';
import { ProcessingErrorCodes } from './types';

// =====================================================
// Types
// =====================================================

interface RemovalConfig {
  model: BackgroundRemovalModel;
  output: 'foreground' | 'mask' | 'background';
  quality: 'low' | 'medium' | 'high';
  device: 'cpu' | 'gpu';
  debug: boolean;
}

// =====================================================
// Configuration
// =====================================================

const MODEL_CONFIG: Record<BackgroundRemovalModel, { publicPath: string }> = {
  'isnet': {
    publicPath: '/models/background-removal/isnet/',
  },
  'isnet_fp16': {
    publicPath: '/models/background-removal/isnet_fp16/',
  },
  'isnet_quint8': {
    publicPath: '/models/background-removal/isnet_quint8/',
  },
};

const DEFAULT_CONFIG: RemovalConfig = {
  model: 'isnet_fp16',
  output: 'foreground',
  quality: 'medium',
  device: 'cpu',
  debug: false,
};

// =====================================================
// Module State
// =====================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let removeBackgroundFn: ((image: ImageSource, config?: any) => Promise<Blob>) | null = null;

let isInitialized = false;
let initPromise: Promise<void> | null = null;

// =====================================================
// Initialization
// =====================================================

/**
 * Initialize the background removal module
 */
async function initialize(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Dynamic import for client-side only
      const bgRemoval = await import('@imgly/background-removal');
      removeBackgroundFn = bgRemoval.removeBackground;
      isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize background removal:', error);
      throw new Error('Background removal module initialization failed');
    }
  })();

  return initPromise;
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Load image from various sources
 */
async function loadImage(source: ImageSource): Promise<Blob> {
  if (source instanceof Blob) {
    return source;
  }

  if (typeof source === 'string') {
    // URL or data URL
    const response = await fetch(source);
    return response.blob();
  }

  if (source instanceof HTMLImageElement) {
    const canvas = document.createElement('canvas');
    canvas.width = source.naturalWidth;
    canvas.height = source.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    ctx.drawImage(source, 0, 0);
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Failed to convert to blob'))),
        'image/png'
      );
    });
  }

  if (source instanceof HTMLCanvasElement) {
    return new Promise((resolve, reject) => {
      source.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Failed to convert to blob'))),
        'image/png'
      );
    });
  }

  throw new Error('Invalid image source');
}

/**
 * Get image dimensions from blob
 */
async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(blob);
  });
}

/**
 * Apply mask to image to get background
 */
async function applyMaskForBackground(
  originalBlob: Blob,
  maskBlob: Blob
): Promise<Blob> {
  const [originalImg, maskImg] = await Promise.all([
    createImageBitmap(originalBlob),
    createImageBitmap(maskBlob),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = originalImg.width;
  canvas.height = originalImg.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Draw original
  ctx.drawImage(originalImg, 0, 0);

  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Create temp canvas for mask
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = maskImg.width;
  maskCanvas.height = maskImg.height;
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) throw new Error('Failed to get mask canvas context');
  maskCtx.drawImage(maskImg, 0, 0);
  const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

  // Invert mask and apply to alpha channel
  for (let i = 0; i < imageData.data.length; i += 4) {
    // Mask is grayscale, use any channel (red)
    // Invert: foreground becomes transparent, background stays
    const maskValue = 255 - maskData.data[i];
    imageData.data[i + 3] = maskValue;
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
      'image/png'
    );
  });
}

// =====================================================
// Main Functions
// =====================================================

/**
 * Remove background from an image
 * Contract: HYBRID_FUNC_BG_REMOVE
 */
export async function removeBackground(
  image: ImageSource,
  options: BackgroundRemovalOptions = {}
): Promise<BackgroundRemovalResult> {
  const startTime = performance.now();

  const config: RemovalConfig = {
    ...DEFAULT_CONFIG,
    model: options.model || DEFAULT_CONFIG.model,
    output: options.output || DEFAULT_CONFIG.output,
    quality: options.quality || DEFAULT_CONFIG.quality,
  };

  try {
    // Initialize module if needed
    await initialize();
    if (!removeBackgroundFn) {
      throw new Error('Background removal function not available');
    }

    // Load image
    const imageBlob = await loadImage(image);
    const { width, height } = await getImageDimensions(imageBlob);

    // Report progress: Loading complete
    options.onProgress?.(20);

    // Configure removal options for @imgly/background-removal
    const removalOptions = {
      model: config.model,
      progress: (key: string, current: number, total: number) => {
        // Map progress: 20-90%
        const progress = 20 + ((current / total) * 70);
        options.onProgress?.(Math.min(90, progress));
      },
    };

    // Process based on output type
    let foreground: Blob | null = null;
    let mask: Blob | undefined;

    if (config.output === 'mask' || options.returnMask) {
      // Get mask - @imgly/background-removal returns foreground by default
      // We need to process the result to get mask
      const result = await removeBackgroundFn(imageBlob, {
        ...removalOptions,
        output: { type: 'mask' },
      });
      mask = result;

      if (config.output === 'mask') {
        foreground = result;
      }
    }

    if (config.output === 'foreground' || !foreground) {
      // Get foreground (transparent background)
      foreground = await removeBackgroundFn(imageBlob, {
        ...removalOptions,
        output: { type: 'foreground' },
      });
    }

    if (config.output === 'background') {
      // Get background (inverted mask)
      if (!mask) {
        mask = await removeBackgroundFn(imageBlob, {
          ...removalOptions,
          output: { type: 'mask' },
        });
      }
      foreground = await applyMaskForBackground(imageBlob, mask);
    }

    // Report progress: Complete
    options.onProgress?.(100);

    const processingTime = performance.now() - startTime;

    return {
      success: true,
      foreground,
      mask,
      width,
      height,
      processingTime,
    };
  } catch (error) {
    const processingTime = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('Background removal failed:', error);

    return {
      success: false,
      foreground: null,
      width: 0,
      height: 0,
      processingTime,
      error: errorMessage,
    };
  }
}

/**
 * Simple background removal (returns foreground only)
 */
export async function removeBackgroundSimple(
  image: ImageSource,
  onProgress?: (progress: number) => void
): Promise<Blob | null> {
  const result = await removeBackground(image, { onProgress });
  return result.success ? result.foreground : null;
}

/**
 * Get background mask only
 */
export async function getBackgroundMask(
  image: ImageSource,
  onProgress?: (progress: number) => void
): Promise<Blob | null> {
  const result = await removeBackground(image, {
    output: 'mask',
    onProgress,
  });
  return result.success ? result.foreground : null;
}

/**
 * Check if background removal is available
 */
export function isBackgroundRemovalAvailable(): boolean {
  return typeof window !== 'undefined' && 'createImageBitmap' in window;
}

/**
 * Preload background removal model
 */
export async function preloadBackgroundRemovalModel(
  model: BackgroundRemovalModel = 'isnet_fp16'
): Promise<void> {
  await initialize();
  // The model will be loaded on first use
  console.log(`Background removal model ${model} ready`);
}

// =====================================================
// Exports
// =====================================================

export {
  type BackgroundRemovalOptions,
  type BackgroundRemovalResult,
  type BackgroundRemovalModel,
};
