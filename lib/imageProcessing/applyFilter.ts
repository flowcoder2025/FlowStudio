/**
 * Image Filter Module
 * Contract: HYBRID_FUNC_FILTER
 * Applies various image filters using Canvas API
 */

import type {
  FilterType,
  FilterValue,
  FilterOptions,
  FilterResult,
  ImageSource,
} from './types';

// =====================================================
// Helper Functions
// =====================================================

/**
 * Load image as ImageData
 */
async function loadImage(
  source: ImageSource
): Promise<{
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
}> {
  let img: HTMLImageElement | ImageBitmap;

  if (source instanceof Blob) {
    img = await createImageBitmap(source);
  } else if (typeof source === 'string') {
    const response = await fetch(source);
    const blob = await response.blob();
    img = await createImageBitmap(blob);
  } else if (source instanceof HTMLImageElement) {
    img = source;
  } else if (source instanceof HTMLCanvasElement) {
    const ctx = source.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    return {
      canvas: source,
      ctx,
      width: source.width,
      height: source.height,
    };
  } else {
    throw new Error('Invalid image source');
  }

  const width = img instanceof HTMLImageElement ? img.naturalWidth : img.width;
  const height = img instanceof HTMLImageElement ? img.naturalHeight : img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.drawImage(img, 0, 0);

  return { canvas, ctx, width, height };
}

/**
 * Convert canvas to blob
 */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
      'image/png'
    );
  });
}

/**
 * Clamp value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// =====================================================
// CSS Filter Application
// =====================================================

/**
 * Build CSS filter string
 */
function buildCSSFilter(filters: FilterValue[]): string {
  const cssFilters: string[] = [];

  for (const filter of filters) {
    switch (filter.type) {
      case 'brightness':
        cssFilters.push(`brightness(${filter.value}%)`);
        break;
      case 'contrast':
        cssFilters.push(`contrast(${filter.value}%)`);
        break;
      case 'saturation':
        cssFilters.push(`saturate(${filter.value}%)`);
        break;
      case 'hue-rotate':
        cssFilters.push(`hue-rotate(${filter.value}deg)`);
        break;
      case 'grayscale':
        cssFilters.push(`grayscale(${filter.value}%)`);
        break;
      case 'sepia':
        cssFilters.push(`sepia(${filter.value}%)`);
        break;
      case 'invert':
        cssFilters.push(`invert(${filter.value}%)`);
        break;
      case 'blur':
        cssFilters.push(`blur(${filter.value}px)`);
        break;
    }
  }

  return cssFilters.join(' ');
}

// =====================================================
// Pixel Manipulation Filters
// =====================================================

/**
 * Apply sharpen filter
 */
function applySharpen(imageData: ImageData, amount: number = 1): void {
  const { data, width, height } = imageData;
  const original = new Uint8ClampedArray(data);

  // Sharpen kernel
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0,
  ];

  const factor = 1 + (amount - 1) * 0.5;
  const adjustedKernel = kernel.map((v, i) => i === 4 ? v * factor : v);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const kidx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += original[kidx] * adjustedKernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        data[idx + c] = clamp(sum, 0, 255);
      }
    }
  }
}

/**
 * Apply vintage/film effect
 */
function applyVintage(imageData: ImageData, amount: number = 100): void {
  const { data } = imageData;
  const strength = amount / 100;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Sepia-like transformation
    const newR = r * (1 - 0.3 * strength) + g * 0.3 * strength + b * 0.1 * strength;
    const newG = r * 0.1 * strength + g * (1 - 0.2 * strength) + b * 0.1 * strength;
    const newB = r * 0.1 * strength + g * 0.1 * strength + b * (1 - 0.3 * strength);

    // Add slight fade
    data[i] = clamp(newR + 10 * strength, 0, 255);
    data[i + 1] = clamp(newG + 5 * strength, 0, 255);
    data[i + 2] = clamp(newB - 10 * strength, 0, 255);
  }
}

/**
 * Apply warm filter
 */
function applyWarm(imageData: ImageData, amount: number = 100): void {
  const { data } = imageData;
  const strength = amount / 100;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(data[i] + 20 * strength, 0, 255);     // Red
    data[i + 1] = clamp(data[i + 1] + 10 * strength, 0, 255); // Green
    data[i + 2] = clamp(data[i + 2] - 15 * strength, 0, 255); // Blue
  }
}

/**
 * Apply cool filter
 */
function applyCool(imageData: ImageData, amount: number = 100): void {
  const { data } = imageData;
  const strength = amount / 100;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(data[i] - 15 * strength, 0, 255);     // Red
    data[i + 1] = clamp(data[i + 1] + 5 * strength, 0, 255); // Green
    data[i + 2] = clamp(data[i + 2] + 20 * strength, 0, 255); // Blue
  }
}

/**
 * Apply dramatic filter
 */
function applyDramatic(imageData: ImageData, amount: number = 100): void {
  const { data } = imageData;
  const strength = amount / 100;

  for (let i = 0; i < data.length; i += 4) {
    // Increase contrast
    for (let c = 0; c < 3; c++) {
      const value = data[i + c];
      const adjusted = ((value / 255 - 0.5) * (1 + strength) + 0.5) * 255;
      data[i + c] = clamp(adjusted, 0, 255);
    }

    // Slight desaturation
    const gray = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
    data[i] = clamp(data[i] + (gray - data[i]) * 0.2 * strength, 0, 255);
    data[i + 1] = clamp(data[i + 1] + (gray - data[i + 1]) * 0.2 * strength, 0, 255);
    data[i + 2] = clamp(data[i + 2] + (gray - data[i + 2]) * 0.2 * strength, 0, 255);
  }
}

/**
 * Apply soft/glow filter
 */
function applySoft(imageData: ImageData, amount: number = 100): void {
  const { data } = imageData;
  const strength = amount / 100;

  // Reduce contrast slightly
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const value = data[i + c];
      const adjusted = value + (128 - value) * 0.2 * strength;
      data[i + c] = clamp(adjusted, 0, 255);
    }
  }
}

/**
 * Apply vibrant filter
 */
function applyVibrant(imageData: ImageData, amount: number = 100): void {
  const { data } = imageData;
  const strength = amount / 100;

  for (let i = 0; i < data.length; i += 4) {
    const max = Math.max(data[i], data[i + 1], data[i + 2]);
    const min = Math.min(data[i], data[i + 1], data[i + 2]);
    const saturation = max === 0 ? 0 : (max - min) / max;

    // Boost saturation more for less saturated pixels
    const boost = (1 - saturation) * strength;

    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = clamp(data[i] + (data[i] - avg) * boost, 0, 255);
    data[i + 1] = clamp(data[i + 1] + (data[i + 1] - avg) * boost, 0, 255);
    data[i + 2] = clamp(data[i + 2] + (data[i + 2] - avg) * boost, 0, 255);
  }
}

/**
 * Apply noir/black and white with contrast
 */
function applyNoir(imageData: ImageData, amount: number = 100): void {
  const { data } = imageData;
  const strength = amount / 100;

  for (let i = 0; i < data.length; i += 4) {
    // Convert to grayscale with high contrast
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    const contrasted = ((gray / 255 - 0.5) * 1.5 + 0.5) * 255;
    const value = clamp(contrasted, 0, 255);

    data[i] = data[i] + (value - data[i]) * strength;
    data[i + 1] = data[i + 1] + (value - data[i + 1]) * strength;
    data[i + 2] = data[i + 2] + (value - data[i + 2]) * strength;
  }
}

/**
 * Apply fade effect
 */
function applyFade(imageData: ImageData, amount: number = 100): void {
  const { data } = imageData;
  const strength = amount / 100;

  // Lift blacks and reduce contrast
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const value = data[i + c];
      // Lift blacks
      const lifted = value + (255 - value) * 0.1 * strength;
      // Reduce contrast
      const faded = lifted + (128 - lifted) * 0.2 * strength;
      data[i + c] = clamp(faded, 0, 255);
    }
  }
}

/**
 * Apply chrome filter
 */
function applyChrome(imageData: ImageData, amount: number = 100): void {
  const { data } = imageData;
  const strength = amount / 100;

  for (let i = 0; i < data.length; i += 4) {
    // High contrast
    for (let c = 0; c < 3; c++) {
      const value = data[i + c];
      const contrasted = ((value / 255 - 0.5) * 1.4 + 0.5) * 255;
      data[i + c] = clamp(data[i + c] + (contrasted - data[i + c]) * strength, 0, 255);
    }

    // Slight blue tint
    data[i + 2] = clamp(data[i + 2] + 10 * strength, 0, 255);
  }
}

/**
 * Apply Clarendon-like filter
 */
function applyClarendon(imageData: ImageData, amount: number = 100): void {
  const { data } = imageData;
  const strength = amount / 100;

  for (let i = 0; i < data.length; i += 4) {
    // Increase contrast
    for (let c = 0; c < 3; c++) {
      const value = data[i + c];
      const contrasted = ((value / 255 - 0.5) * 1.3 + 0.5) * 255;
      data[i + c] = clamp(contrasted, 0, 255);
    }

    // Cool shadows, warm highlights
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (brightness < 128) {
      data[i + 2] = clamp(data[i + 2] + 15 * strength * (1 - brightness / 128), 0, 255);
    } else {
      data[i] = clamp(data[i] + 15 * strength * ((brightness - 128) / 127), 0, 255);
    }
  }
}

// =====================================================
// Main Functions
// =====================================================

/**
 * Apply filters to an image
 * Contract: HYBRID_FUNC_FILTER
 */
export async function applyFilters(
  image: ImageSource,
  options: FilterOptions
): Promise<FilterResult> {
  const startTime = performance.now();

  try {
    const { canvas, ctx, width, height } = await loadImage(image);

    // Separate CSS filters and pixel manipulation filters
    const cssFilters: FilterValue[] = [];
    const pixelFilters: FilterValue[] = [];

    for (const filter of options.filters) {
      if (['brightness', 'contrast', 'saturation', 'hue-rotate', 'grayscale', 'sepia', 'invert', 'blur'].includes(filter.type)) {
        cssFilters.push(filter);
      } else {
        pixelFilters.push(filter);
      }
    }

    options.onProgress?.(20);

    // Apply CSS filters first
    if (cssFilters.length > 0) {
      const filterString = buildCSSFilter(cssFilters);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) throw new Error('Failed to get temp canvas context');

      tempCtx.filter = filterString;
      tempCtx.drawImage(canvas, 0, 0);

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(tempCanvas, 0, 0);
    }

    options.onProgress?.(50);

    // Apply pixel manipulation filters
    if (pixelFilters.length > 0) {
      const imageData = ctx.getImageData(0, 0, width, height);

      for (const filter of pixelFilters) {
        switch (filter.type) {
          case 'sharpen':
            applySharpen(imageData, filter.value);
            break;
          case 'vintage':
            applyVintage(imageData, filter.value);
            break;
          case 'warm':
            applyWarm(imageData, filter.value);
            break;
          case 'cool':
            applyCool(imageData, filter.value);
            break;
          case 'dramatic':
            applyDramatic(imageData, filter.value);
            break;
          case 'soft':
            applySoft(imageData, filter.value);
            break;
          case 'vibrant':
            applyVibrant(imageData, filter.value);
            break;
          case 'noir':
            applyNoir(imageData, filter.value);
            break;
          case 'fade':
            applyFade(imageData, filter.value);
            break;
          case 'chrome':
            applyChrome(imageData, filter.value);
            break;
          case 'clarendon':
            applyClarendon(imageData, filter.value);
            break;
        }
      }

      ctx.putImageData(imageData, 0, 0);
    }

    options.onProgress?.(90);

    const resultBlob = await canvasToBlob(canvas);

    options.onProgress?.(100);

    const processingTime = performance.now() - startTime;

    return {
      success: true,
      image: resultBlob,
      width,
      height,
      processingTime,
    };
  } catch (error) {
    const processingTime = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('Filter application failed:', error);

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
 * Apply a single filter
 */
export async function applySingleFilter(
  image: ImageSource,
  filterType: FilterType,
  value: number
): Promise<Blob | null> {
  const result = await applyFilters(image, {
    filters: [{ type: filterType, value }],
  });
  return result.success ? result.image : null;
}

/**
 * Preview filter (returns data URL for quick preview)
 */
export async function previewFilter(
  image: ImageSource,
  filters: FilterValue[],
  maxDimension: number = 300
): Promise<string | null> {
  try {
    let img: HTMLImageElement | ImageBitmap;

    if (image instanceof Blob) {
      img = await createImageBitmap(image);
    } else if (typeof image === 'string') {
      const response = await fetch(image);
      const blob = await response.blob();
      img = await createImageBitmap(blob);
    } else {
      return null;
    }

    const width = img.width;
    const height = img.height;

    // Scale for preview
    let scaledWidth = width;
    let scaledHeight = height;
    if (width > maxDimension || height > maxDimension) {
      const scale = maxDimension / Math.max(width, height);
      scaledWidth = Math.floor(width * scale);
      scaledHeight = Math.floor(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Apply CSS filters
    const cssFilters = filters.filter(f =>
      ['brightness', 'contrast', 'saturation', 'hue-rotate', 'grayscale', 'sepia', 'invert', 'blur'].includes(f.type)
    );

    if (cssFilters.length > 0) {
      ctx.filter = buildCSSFilter(cssFilters);
    }

    ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

    return canvas.toDataURL('image/jpeg', 0.7);
  } catch {
    return null;
  }
}

// =====================================================
// Exports
// =====================================================

export {
  type FilterType,
  type FilterValue,
  type FilterOptions,
  type FilterResult,
};
