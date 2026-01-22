/**
 * Color Transfer Module
 * Contract: HYBRID_FUNC_COLOR_TRANSFER
 * Implements Reinhard color transfer algorithm
 */

import type {
  ColorTransferOptions,
  ColorTransferResult,
  ColorTransferMethod,
  ImageSource,
} from './types';
import {
  imageDataToLab,
  labToImageData,
  calculateLabStats,
} from './labConversion';

// =====================================================
// Helper Functions
// =====================================================

/**
 * Load image and get ImageData
 */
async function loadImageData(
  source: ImageSource
): Promise<{ imageData: ImageData; width: number; height: number }> {
  let img: HTMLImageElement | ImageBitmap;

  if (source instanceof Blob) {
    img = await createImageBitmap(source);
  } else if (typeof source === 'string') {
    if (source.startsWith('data:') || source.startsWith('blob:') || source.startsWith('http')) {
      const response = await fetch(source);
      const blob = await response.blob();
      img = await createImageBitmap(blob);
    } else {
      throw new Error('Invalid image source');
    }
  } else if (source instanceof HTMLImageElement) {
    img = source;
  } else if (source instanceof HTMLCanvasElement) {
    const ctx = source.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    return {
      imageData: ctx.getImageData(0, 0, source.width, source.height),
      width: source.width,
      height: source.height,
    };
  } else {
    throw new Error('Invalid image source type');
  }

  const canvas = document.createElement('canvas');
  const width = img instanceof HTMLImageElement ? img.naturalWidth : img.width;
  const height = img instanceof HTMLImageElement ? img.naturalHeight : img.height;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.drawImage(img, 0, 0);
  return {
    imageData: ctx.getImageData(0, 0, width, height),
    width,
    height,
  };
}

/**
 * Convert ImageData to Blob
 */
async function imageDataToBlob(
  imageData: ImageData,
  width: number,
  height: number
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
      'image/png'
    );
  });
}

// =====================================================
// Color Transfer Algorithms
// =====================================================

/**
 * Reinhard Color Transfer Algorithm
 * Reference: "Color Transfer between Images" by Reinhard et al. (2001)
 */
function reinhardTransfer(
  targetChannels: Float32Array[],
  sourceStats: { mean: [number, number, number]; std: [number, number, number] },
  targetStats: { mean: [number, number, number]; std: [number, number, number] },
  strength: number = 1.0,
  preserveLuminance: boolean = true
): void {
  const [targetL, targetA, targetB] = targetChannels;
  const pixelCount = targetL.length;

  // Transfer each channel
  for (let i = 0; i < pixelCount; i++) {
    // L channel: optionally preserve original luminance
    if (!preserveLuminance) {
      const normalizedL = (targetL[i] - targetStats.mean[0]) / (targetStats.std[0] || 1);
      const transferredL = normalizedL * sourceStats.std[0] + sourceStats.mean[0];
      targetL[i] = targetL[i] + (transferredL - targetL[i]) * strength;
    }

    // A channel
    const normalizedA = (targetA[i] - targetStats.mean[1]) / (targetStats.std[1] || 1);
    const transferredA = normalizedA * sourceStats.std[1] + sourceStats.mean[1];
    targetA[i] = targetA[i] + (transferredA - targetA[i]) * strength;

    // B channel
    const normalizedB = (targetB[i] - targetStats.mean[2]) / (targetStats.std[2] || 1);
    const transferredB = normalizedB * sourceStats.std[2] + sourceStats.mean[2];
    targetB[i] = targetB[i] + (transferredB - targetB[i]) * strength;
  }

  // Clamp values to valid LAB range
  for (let i = 0; i < pixelCount; i++) {
    targetL[i] = Math.max(0, Math.min(100, targetL[i]));
    targetA[i] = Math.max(-128, Math.min(127, targetA[i]));
    targetB[i] = Math.max(-128, Math.min(127, targetB[i]));
  }
}

/**
 * PDF (Probability Distribution Function) Transfer
 * A simpler but effective color transfer method
 */
function pdfTransfer(
  targetChannels: Float32Array[],
  sourceStats: { mean: [number, number, number]; std: [number, number, number] },
  targetStats: { mean: [number, number, number]; std: [number, number, number] },
  strength: number = 1.0
): void {
  const [targetL, targetA, targetB] = targetChannels;
  const pixelCount = targetL.length;

  // Calculate scaling factors
  const scaleL = (sourceStats.std[0] || 1) / (targetStats.std[0] || 1);
  const scaleA = (sourceStats.std[1] || 1) / (targetStats.std[1] || 1);
  const scaleB = (sourceStats.std[2] || 1) / (targetStats.std[2] || 1);

  for (let i = 0; i < pixelCount; i++) {
    // Scale and shift each channel
    const newL = (targetL[i] - targetStats.mean[0]) * scaleL + sourceStats.mean[0];
    const newA = (targetA[i] - targetStats.mean[1]) * scaleA + sourceStats.mean[1];
    const newB = (targetB[i] - targetStats.mean[2]) * scaleB + sourceStats.mean[2];

    // Apply strength
    targetL[i] = targetL[i] + (newL - targetL[i]) * strength;
    targetA[i] = targetA[i] + (newA - targetA[i]) * strength;
    targetB[i] = targetB[i] + (newB - targetB[i]) * strength;

    // Clamp
    targetL[i] = Math.max(0, Math.min(100, targetL[i]));
    targetA[i] = Math.max(-128, Math.min(127, targetA[i]));
    targetB[i] = Math.max(-128, Math.min(127, targetB[i]));
  }
}

// =====================================================
// Main Functions
// =====================================================

/**
 * Transfer colors from source image to target image
 * Contract: HYBRID_FUNC_COLOR_TRANSFER
 */
export async function transferColors(
  targetImage: ImageSource,
  sourceImage: ImageSource,
  options: ColorTransferOptions = {}
): Promise<ColorTransferResult> {
  const startTime = performance.now();

  const method = options.method || 'reinhard';
  const strength = options.strength ?? 1.0;
  const preserveLuminance = options.preserveLuminance ?? true;

  try {
    // Load both images
    options.onProgress?.(10);
    const [targetData, sourceData] = await Promise.all([
      loadImageData(targetImage),
      loadImageData(sourceImage),
    ]);

    options.onProgress?.(30);

    // Convert to LAB
    const targetChannels = imageDataToLab(targetData.imageData.data);
    const sourceChannels = imageDataToLab(sourceData.imageData.data);

    options.onProgress?.(50);

    // Calculate statistics
    const targetStats = calculateLabStats(targetChannels);
    const sourceStats = calculateLabStats(sourceChannels);

    options.onProgress?.(60);

    // Apply color transfer
    switch (method) {
      case 'reinhard':
        reinhardTransfer(targetChannels, sourceStats, targetStats, strength, preserveLuminance);
        break;
      case 'pdf-transfer':
        pdfTransfer(targetChannels, sourceStats, targetStats, strength);
        break;
      case 'monge-kantorovitch':
        // Simplified MK - same as PDF for this implementation
        pdfTransfer(targetChannels, sourceStats, targetStats, strength);
        break;
      default:
        reinhardTransfer(targetChannels, sourceStats, targetStats, strength, preserveLuminance);
    }

    options.onProgress?.(80);

    // Extract alpha channel from original
    const alphaChannel = new Uint8ClampedArray(targetData.imageData.data.length);
    for (let i = 0; i < targetData.imageData.data.length; i += 4) {
      alphaChannel[i + 3] = targetData.imageData.data[i + 3];
    }

    // Convert back to RGB
    const resultData = labToImageData(
      targetChannels[0],
      targetChannels[1],
      targetChannels[2],
      alphaChannel
    );

    // Preserve alpha channel from original
    for (let i = 0; i < resultData.length; i += 4) {
      resultData[i + 3] = targetData.imageData.data[i + 3];
    }

    options.onProgress?.(90);

    // Create result ImageData - copy data to ensure ArrayBuffer compatibility
    const resultDataCopy = new Uint8ClampedArray(resultData);
    const resultImageData = new ImageData(
      resultDataCopy,
      targetData.width,
      targetData.height
    );

    // Convert to blob
    const resultBlob = await imageDataToBlob(
      resultImageData,
      targetData.width,
      targetData.height
    );

    options.onProgress?.(100);

    const processingTime = performance.now() - startTime;

    return {
      success: true,
      image: resultBlob,
      width: targetData.width,
      height: targetData.height,
      processingTime,
    };
  } catch (error) {
    const processingTime = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('Color transfer failed:', error);

    return {
      success: false,
      image: null,
      width: 0,
      height: 0,
      processingTime,
      error: errorMessage,
    };
  }
}

/**
 * Simple color transfer (Reinhard method)
 */
export async function transferColorsSimple(
  targetImage: ImageSource,
  sourceImage: ImageSource,
  strength: number = 1.0
): Promise<Blob | null> {
  const result = await transferColors(targetImage, sourceImage, {
    method: 'reinhard',
    strength,
    preserveLuminance: true,
  });
  return result.success ? result.image : null;
}

/**
 * Get color statistics from an image
 */
export async function getColorStatistics(
  image: ImageSource
): Promise<{
  mean: [number, number, number];
  std: [number, number, number];
}> {
  const { imageData } = await loadImageData(image);
  const channels = imageDataToLab(imageData.data);
  return calculateLabStats(channels);
}

/**
 * Apply color statistics to an image
 */
export async function applyColorStatistics(
  image: ImageSource,
  targetStats: { mean: [number, number, number]; std: [number, number, number] },
  strength: number = 1.0
): Promise<Blob | null> {
  const startTime = performance.now();

  try {
    const imageData = await loadImageData(image);
    const channels = imageDataToLab(imageData.imageData.data);
    const currentStats = calculateLabStats(channels);

    // Apply transfer
    reinhardTransfer(channels, targetStats, currentStats, strength, false);

    // Extract alpha channel
    const alphaChannel = new Uint8ClampedArray(imageData.imageData.data.length);
    for (let i = 0; i < imageData.imageData.data.length; i += 4) {
      alphaChannel[i + 3] = imageData.imageData.data[i + 3];
    }

    // Convert back
    const resultData = labToImageData(channels[0], channels[1], channels[2], alphaChannel);

    // Preserve alpha
    for (let i = 0; i < resultData.length; i += 4) {
      resultData[i + 3] = imageData.imageData.data[i + 3];
    }

    const resultImageData = new ImageData(new Uint8ClampedArray(resultData), imageData.width, imageData.height);
    return imageDataToBlob(resultImageData, imageData.width, imageData.height);
  } catch (error) {
    console.error('Failed to apply color statistics:', error);
    return null;
  }
}

// =====================================================
// Exports
// =====================================================

export {
  type ColorTransferOptions,
  type ColorTransferResult,
  type ColorTransferMethod,
};
