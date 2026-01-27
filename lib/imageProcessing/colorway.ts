/**
 * Colorway Generation Module
 * Contract: HYBRID_FUNC_COLORWAY
 * Creates color variations of images based on color theory
 */

import type {
  RGB,
  ColorwayOptions,
  ColorwayResult,
  ColorwayVariation,
  ColorwayStrategy,
  ImageSource,
} from './types';
import {
  rgbToHsl,
  hslToRgb,
  rgbToHex,
  getComplementary,
  getTriadic,
  rgbToLab,
  labToRgb,
} from './labConversion';
import { extractDominantColor } from './extractColor';

// =====================================================
// Color Harmony Strategies
// =====================================================

/**
 * Generate complementary colors (opposite on color wheel)
 */
function generateComplementary(baseColor: RGB, count: number): RGB[] {
  const complement = getComplementary(baseColor);
  const colors: RGB[] = [baseColor, complement];

  // Add intermediate variations
  const hsl1 = rgbToHsl(baseColor);
  const hsl2 = rgbToHsl(complement);

  for (let i = 2; i < count; i++) {
    const t = i / (count - 1);
    const hsl = {
      h: (hsl1.h + (hsl2.h - hsl1.h + 360) % 360 * t) % 360,
      s: hsl1.s + (hsl2.s - hsl1.s) * t,
      l: hsl1.l + (hsl2.l - hsl1.l) * t,
    };
    colors.push(hslToRgb(hsl));
  }

  return colors.slice(0, count);
}

/**
 * Generate analogous colors (adjacent on color wheel)
 */
function generateAnalogous(baseColor: RGB, count: number): RGB[] {
  const colors: RGB[] = [baseColor];
  const hsl = rgbToHsl(baseColor);
  const angleStep = 30; // 30 degrees apart

  for (let i = 1; i < count; i++) {
    const direction = i % 2 === 1 ? 1 : -1;
    const step = Math.ceil(i / 2);
    const newHsl = {
      ...hsl,
      h: (hsl.h + direction * step * angleStep + 360) % 360,
    };
    colors.push(hslToRgb(newHsl));
  }

  return colors;
}

/**
 * Generate triadic colors (120 degrees apart)
 */
function generateTriadic(baseColor: RGB, count: number): RGB[] {
  const [color2, color3] = getTriadic(baseColor);
  const baseColors = [baseColor, color2, color3];
  const colors: RGB[] = [...baseColors];

  // Add variations of each triadic color
  let idx = 0;
  while (colors.length < count) {
    const base = baseColors[idx % 3];
    const hsl = rgbToHsl(base);
    // Vary lightness
    const variation = {
      ...hsl,
      l: Math.max(20, Math.min(80, hsl.l + (colors.length % 2 === 0 ? 15 : -15))),
    };
    colors.push(hslToRgb(variation));
    idx++;
  }

  return colors.slice(0, count);
}

/**
 * Generate split-complementary colors
 */
function generateSplitComplementary(baseColor: RGB, count: number): RGB[] {
  const hsl = rgbToHsl(baseColor);
  const complement = (hsl.h + 180) % 360;

  const colors: RGB[] = [
    baseColor,
    hslToRgb({ ...hsl, h: (complement - 30 + 360) % 360 }),
    hslToRgb({ ...hsl, h: (complement + 30) % 360 }),
  ];

  // Add variations
  while (colors.length < count) {
    const base = colors[colors.length % 3];
    const baseHsl = rgbToHsl(base);
    const variation = {
      ...baseHsl,
      s: Math.max(20, Math.min(100, baseHsl.s + (colors.length % 2 === 0 ? 10 : -10))),
      l: Math.max(20, Math.min(80, baseHsl.l + (colors.length % 2 === 0 ? 10 : -10))),
    };
    colors.push(hslToRgb(variation));
  }

  return colors.slice(0, count);
}

/**
 * Generate tetradic colors (rectangular pattern)
 */
function generateTetradic(baseColor: RGB, count: number): RGB[] {
  const hsl = rgbToHsl(baseColor);

  const colors: RGB[] = [
    baseColor,
    hslToRgb({ ...hsl, h: (hsl.h + 90) % 360 }),
    hslToRgb({ ...hsl, h: (hsl.h + 180) % 360 }),
    hslToRgb({ ...hsl, h: (hsl.h + 270) % 360 }),
  ];

  // Add variations
  while (colors.length < count) {
    const base = colors[colors.length % 4];
    const baseHsl = rgbToHsl(base);
    const variation = {
      ...baseHsl,
      l: Math.max(20, Math.min(80, baseHsl.l + (colors.length % 2 === 0 ? 15 : -15))),
    };
    colors.push(hslToRgb(variation));
  }

  return colors.slice(0, count);
}

/**
 * Generate monochromatic colors (same hue, varying saturation/lightness)
 */
function generateMonochromatic(baseColor: RGB, count: number): RGB[] {
  const hsl = rgbToHsl(baseColor);
  const colors: RGB[] = [];

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const newHsl = {
      h: hsl.h,
      s: Math.max(20, hsl.s - 30 + 60 * t),
      l: 20 + 60 * t,
    };
    colors.push(hslToRgb(newHsl));
  }

  return colors;
}

/**
 * Generate colors based on strategy
 */
function generatePalette(
  baseColor: RGB,
  strategy: ColorwayStrategy,
  count: number
): RGB[] {
  switch (strategy) {
    case 'complementary':
      return generateComplementary(baseColor, count);
    case 'analogous':
      return generateAnalogous(baseColor, count);
    case 'triadic':
      return generateTriadic(baseColor, count);
    case 'split-complementary':
      return generateSplitComplementary(baseColor, count);
    case 'tetradic':
      return generateTetradic(baseColor, count);
    case 'monochromatic':
      return generateMonochromatic(baseColor, count);
    default:
      return generateComplementary(baseColor, count);
  }
}

// =====================================================
// Image Color Transformation
// =====================================================

/**
 * Load image and get pixel data
 */
async function loadImageData(
  source: ImageSource
): Promise<{
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  imageData: ImageData;
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
      imageData: ctx.getImageData(0, 0, source.width, source.height),
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
  const imageData = ctx.getImageData(0, 0, width, height);

  return { canvas, ctx, imageData, width, height };
}

/**
 * Apply color transformation to image
 * Note: Reserved for future direct color mapping implementation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _applyColorTransformation(
  imageData: ImageData,
  originalColor: RGB,
  targetColor: RGB,
  strength: number = 1.0
): void {
  const { data } = imageData;

  // Convert to LAB for better perceptual transformations
  const originalLab = rgbToLab(originalColor);
  const targetLab = rgbToLab(targetColor);

  // Calculate transformation
  const deltaA = (targetLab.a - originalLab.a) * strength;
  const deltaB = (targetLab.b - originalLab.b) * strength;

  for (let i = 0; i < data.length; i += 4) {
    // Skip transparent pixels
    if (data[i + 3] < 10) continue;

    const rgb: RGB = { r: data[i], g: data[i + 1], b: data[i + 2] };
    const lab = rgbToLab(rgb);

    // Apply hue shift while preserving relative relationships
    lab.a = Math.max(-128, Math.min(127, lab.a + deltaA));
    lab.b = Math.max(-128, Math.min(127, lab.b + deltaB));

    const newRgb = labToRgb(lab);
    data[i] = newRgb.r;
    data[i + 1] = newRgb.g;
    data[i + 2] = newRgb.b;
  }
}

/**
 * Apply hue rotation to image
 */
function applyHueRotation(
  imageData: ImageData,
  hueShift: number,
  strength: number = 1.0
): void {
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 10) continue;

    const rgb: RGB = { r: data[i], g: data[i + 1], b: data[i + 2] };
    const hsl = rgbToHsl(rgb);

    hsl.h = (hsl.h + hueShift * strength + 360) % 360;

    const newRgb = hslToRgb(hsl);
    data[i] = newRgb.r;
    data[i + 1] = newRgb.g;
    data[i + 2] = newRgb.b;
  }
}

// =====================================================
// Main Functions
// =====================================================

/**
 * Generate colorway variations of an image
 * Contract: HYBRID_FUNC_COLORWAY
 */
export async function generateColorways(
  image: ImageSource,
  options: ColorwayOptions
): Promise<ColorwayResult> {
  const startTime = performance.now();

  const {
    strategy,
    baseColor: providedBaseColor,
    variations = 5,
    strength = 0.8,
  } = options;

  try {
    // Load image
    const imageResult = await loadImageData(image);
    const { width, height } = imageResult;

    options.onProgress?.(10);

    // Get base color from image if not provided
    const baseColor = providedBaseColor || await extractDominantColor(image);

    options.onProgress?.(30);

    // Generate color palette
    const palette = generatePalette(baseColor, strategy, variations);

    options.onProgress?.(40);

    // Generate variations
    const colorwayVariations: ColorwayVariation[] = [];
    const progressPerVariation = 50 / variations;

    for (let i = 0; i < palette.length; i++) {
      const targetColor = palette[i];

      // Clone image data for this variation
      const { canvas, ctx, imageData: originalData } = await loadImageData(image);
      const newImageData = new ImageData(
        new Uint8ClampedArray(originalData.data),
        width,
        height
      );

      // Calculate hue shift from base to target
      const baseHsl = rgbToHsl(baseColor);
      const targetHsl = rgbToHsl(targetColor);
      const hueShift = targetHsl.h - baseHsl.h;

      // Apply transformation
      applyHueRotation(newImageData, hueShift, strength);

      // Put result on canvas
      ctx.putImageData(newImageData, 0, 0);

      // Convert to blob
      const preview = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
          'image/png'
        );
      });

      colorwayVariations.push({
        id: `colorway-${i}`,
        name: getColorwayName(strategy, i),
        colors: [targetColor],
        preview,
      });

      options.onProgress?.(40 + (i + 1) * progressPerVariation);
    }

    options.onProgress?.(100);

    const processingTime = performance.now() - startTime;

    return {
      success: true,
      variations: colorwayVariations,
      baseColor,
      processingTime,
    };
  } catch (error) {
    const processingTime = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('Colorway generation failed:', error);

    return {
      success: false,
      variations: [],
      baseColor: { r: 128, g: 128, b: 128 },
      processingTime,
      error: errorMessage,
    };
  }
}

/**
 * Get colorway name based on strategy and index
 */
function getColorwayName(strategy: ColorwayStrategy, index: number): string {
  const names: Record<ColorwayStrategy, string[]> = {
    complementary: ['Original', 'Complement', 'Blend 1', 'Blend 2', 'Blend 3'],
    analogous: ['Original', 'Warm', 'Cool', 'Warmer', 'Cooler'],
    triadic: ['Primary', 'Secondary', 'Tertiary', 'Primary Light', 'Secondary Light'],
    'split-complementary': ['Base', 'Split 1', 'Split 2', 'Variation 1', 'Variation 2'],
    tetradic: ['Color 1', 'Color 2', 'Color 3', 'Color 4', 'Variation'],
    monochromatic: ['Darkest', 'Dark', 'Medium', 'Light', 'Lightest'],
  };

  return names[strategy]?.[index] || `Variation ${index + 1}`;
}

/**
 * Generate single colorway variation
 */
export async function generateSingleColorway(
  image: ImageSource,
  targetColor: RGB,
  strength: number = 0.8
): Promise<Blob | null> {
  try {
    const { canvas, ctx, imageData } = await loadImageData(image);
    const baseColor = await extractDominantColor(image);

    // Calculate hue shift
    const baseHsl = rgbToHsl(baseColor);
    const targetHsl = rgbToHsl(targetColor);
    const hueShift = targetHsl.h - baseHsl.h;

    // Apply transformation
    applyHueRotation(imageData, hueShift, strength);
    ctx.putImageData(imageData, 0, 0);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
        'image/png'
      );
    });
  } catch (error) {
    console.error('Single colorway generation failed:', error);
    return null;
  }
}

/**
 * Get palette suggestions for an image
 */
export async function getPaletteSuggestions(
  image: ImageSource,
  strategy: ColorwayStrategy = 'complementary'
): Promise<{ colors: RGB[]; hexColors: string[] }> {
  const baseColor = await extractDominantColor(image);
  const colors = generatePalette(baseColor, strategy, 5);
  const hexColors = colors.map(rgbToHex);

  return { colors, hexColors };
}

// =====================================================
// Exports
// =====================================================

export {
  type ColorwayOptions,
  type ColorwayResult,
  type ColorwayVariation,
  type ColorwayStrategy,
  generatePalette,
  getColorwayName,
};
