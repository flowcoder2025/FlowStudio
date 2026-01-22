/**
 * Color Extraction Module
 * Contract: HYBRID_FUNC_COLOR_EXTRACT
 * Extracts dominant colors from images using K-means clustering
 */

import type {
  RGB,
  ColorPalette,
  ExtractedColor,
  ImageSource,
} from './types';
import { rgbToHex, rgbToLab, colorDistance } from './labConversion';

// =====================================================
// Color Names Database
// =====================================================

const COLOR_NAMES: Array<{ name: string; rgb: RGB }> = [
  { name: 'Black', rgb: { r: 0, g: 0, b: 0 } },
  { name: 'White', rgb: { r: 255, g: 255, b: 255 } },
  { name: 'Red', rgb: { r: 255, g: 0, b: 0 } },
  { name: 'Green', rgb: { r: 0, g: 128, b: 0 } },
  { name: 'Blue', rgb: { r: 0, g: 0, b: 255 } },
  { name: 'Yellow', rgb: { r: 255, g: 255, b: 0 } },
  { name: 'Cyan', rgb: { r: 0, g: 255, b: 255 } },
  { name: 'Magenta', rgb: { r: 255, g: 0, b: 255 } },
  { name: 'Orange', rgb: { r: 255, g: 165, b: 0 } },
  { name: 'Purple', rgb: { r: 128, g: 0, b: 128 } },
  { name: 'Pink', rgb: { r: 255, g: 192, b: 203 } },
  { name: 'Brown', rgb: { r: 139, g: 69, b: 19 } },
  { name: 'Gray', rgb: { r: 128, g: 128, b: 128 } },
  { name: 'Navy', rgb: { r: 0, g: 0, b: 128 } },
  { name: 'Teal', rgb: { r: 0, g: 128, b: 128 } },
  { name: 'Olive', rgb: { r: 128, g: 128, b: 0 } },
  { name: 'Maroon', rgb: { r: 128, g: 0, b: 0 } },
  { name: 'Lime', rgb: { r: 0, g: 255, b: 0 } },
  { name: 'Aqua', rgb: { r: 0, g: 255, b: 255 } },
  { name: 'Silver', rgb: { r: 192, g: 192, b: 192 } },
  { name: 'Coral', rgb: { r: 255, g: 127, b: 80 } },
  { name: 'Salmon', rgb: { r: 250, g: 128, b: 114 } },
  { name: 'Khaki', rgb: { r: 240, g: 230, b: 140 } },
  { name: 'Plum', rgb: { r: 221, g: 160, b: 221 } },
  { name: 'Violet', rgb: { r: 238, g: 130, b: 238 } },
  { name: 'Gold', rgb: { r: 255, g: 215, b: 0 } },
  { name: 'Indigo', rgb: { r: 75, g: 0, b: 130 } },
  { name: 'Crimson', rgb: { r: 220, g: 20, b: 60 } },
  { name: 'Beige', rgb: { r: 245, g: 245, b: 220 } },
  { name: 'Ivory', rgb: { r: 255, g: 255, b: 240 } },
];

// =====================================================
// Helper Functions
// =====================================================

/**
 * Load image and get pixel data
 */
async function loadImagePixels(
  source: ImageSource,
  maxDimension: number = 200
): Promise<{ pixels: RGB[]; width: number; height: number }> {
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
    const imageData = ctx.getImageData(0, 0, source.width, source.height);
    return extractPixelsFromImageData(imageData.data, source.width, source.height);
  } else {
    throw new Error('Invalid image source');
  }

  const width = img instanceof HTMLImageElement ? img.naturalWidth : img.width;
  const height = img instanceof HTMLImageElement ? img.naturalHeight : img.height;

  // Scale down for performance
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
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
  const imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight);

  return extractPixelsFromImageData(imageData.data, scaledWidth, scaledHeight);
}

/**
 * Extract pixels from ImageData
 */
function extractPixelsFromImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number
): { pixels: RGB[]; width: number; height: number } {
  const pixels: RGB[] = [];

  for (let i = 0; i < data.length; i += 4) {
    // Skip transparent pixels
    if (data[i + 3] < 128) continue;

    pixels.push({
      r: data[i],
      g: data[i + 1],
      b: data[i + 2],
    });
  }

  return { pixels, width, height };
}

/**
 * Get closest color name
 */
function getColorName(rgb: RGB): string {
  let minDistance = Infinity;
  let closestName = 'Unknown';

  for (const { name, rgb: namedRgb } of COLOR_NAMES) {
    const distance = colorDistance(rgb, namedRgb);
    if (distance < minDistance) {
      minDistance = distance;
      closestName = name;
    }
  }

  return closestName;
}

// =====================================================
// K-Means Clustering
// =====================================================

/**
 * Initialize centroids using K-means++ algorithm
 */
function initializeCentroids(pixels: RGB[], k: number): RGB[] {
  const centroids: RGB[] = [];

  // First centroid: random pixel
  const firstIndex = Math.floor(Math.random() * pixels.length);
  centroids.push({ ...pixels[firstIndex] });

  // Remaining centroids: D^2 weighting
  for (let i = 1; i < k; i++) {
    const distances: number[] = [];
    let totalDistance = 0;

    for (const pixel of pixels) {
      let minDist = Infinity;
      for (const centroid of centroids) {
        const dist = Math.pow(pixel.r - centroid.r, 2) +
                     Math.pow(pixel.g - centroid.g, 2) +
                     Math.pow(pixel.b - centroid.b, 2);
        minDist = Math.min(minDist, dist);
      }
      distances.push(minDist);
      totalDistance += minDist;
    }

    // Weighted random selection
    let threshold = Math.random() * totalDistance;
    for (let j = 0; j < distances.length; j++) {
      threshold -= distances[j];
      if (threshold <= 0) {
        centroids.push({ ...pixels[j] });
        break;
      }
    }

    if (centroids.length <= i) {
      // Fallback: random selection
      const idx = Math.floor(Math.random() * pixels.length);
      centroids.push({ ...pixels[idx] });
    }
  }

  return centroids;
}

/**
 * Assign pixels to nearest centroid
 */
function assignPixels(pixels: RGB[], centroids: RGB[]): number[] {
  return pixels.map(pixel => {
    let minDist = Infinity;
    let closestIdx = 0;

    for (let i = 0; i < centroids.length; i++) {
      const dist = Math.pow(pixel.r - centroids[i].r, 2) +
                   Math.pow(pixel.g - centroids[i].g, 2) +
                   Math.pow(pixel.b - centroids[i].b, 2);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    }

    return closestIdx;
  });
}

/**
 * Update centroids based on assigned pixels
 */
function updateCentroids(
  pixels: RGB[],
  assignments: number[],
  k: number
): RGB[] {
  const sums: Array<{ r: number; g: number; b: number; count: number }> = Array.from(
    { length: k },
    () => ({ r: 0, g: 0, b: 0, count: 0 })
  );

  for (let i = 0; i < pixels.length; i++) {
    const cluster = assignments[i];
    sums[cluster].r += pixels[i].r;
    sums[cluster].g += pixels[i].g;
    sums[cluster].b += pixels[i].b;
    sums[cluster].count++;
  }

  return sums.map(sum => ({
    r: sum.count > 0 ? Math.round(sum.r / sum.count) : 128,
    g: sum.count > 0 ? Math.round(sum.g / sum.count) : 128,
    b: sum.count > 0 ? Math.round(sum.b / sum.count) : 128,
  }));
}

/**
 * K-means clustering for color extraction
 */
function kMeansClustering(
  pixels: RGB[],
  k: number,
  maxIterations: number = 20
): { centroids: RGB[]; assignments: number[]; counts: number[] } {
  if (pixels.length === 0) {
    return {
      centroids: [],
      assignments: [],
      counts: [],
    };
  }

  // Initialize
  let centroids = initializeCentroids(pixels, Math.min(k, pixels.length));
  let assignments: number[] = [];

  // Iterate
  for (let iter = 0; iter < maxIterations; iter++) {
    const newAssignments = assignPixels(pixels, centroids);

    // Check convergence
    if (assignments.length > 0 &&
        newAssignments.every((a, i) => a === assignments[i])) {
      break;
    }

    assignments = newAssignments;
    centroids = updateCentroids(pixels, assignments, centroids.length);
  }

  // Count pixels in each cluster
  const counts = new Array(centroids.length).fill(0);
  for (const a of assignments) {
    counts[a]++;
  }

  return { centroids, assignments, counts };
}

// =====================================================
// Main Functions
// =====================================================

/**
 * Extract dominant colors from an image
 * Contract: HYBRID_FUNC_COLOR_EXTRACT
 */
export async function extractColors(
  image: ImageSource,
  colorCount: number = 5,
  options: {
    maxDimension?: number;
    includeNames?: boolean;
  } = {}
): Promise<ColorPalette> {
  const maxDimension = options.maxDimension ?? 200;
  const includeNames = options.includeNames ?? true;

  try {
    // Load and sample pixels
    const { pixels } = await loadImagePixels(image, maxDimension);

    if (pixels.length === 0) {
      return {
        dominant: { r: 128, g: 128, b: 128 },
        colors: [],
        total: 0,
      };
    }

    // Run K-means
    const { centroids, counts } = kMeansClustering(pixels, colorCount);

    // Sort by frequency
    const totalPixels = counts.reduce((a, b) => a + b, 0);
    const colorData: Array<{ color: RGB; count: number }> = centroids
      .map((color, i) => ({ color, count: counts[i] }))
      .sort((a, b) => b.count - a.count);

    // Build palette
    const colors: ExtractedColor[] = colorData.map(({ color, count }) => ({
      color,
      hex: rgbToHex(color),
      percentage: totalPixels > 0 ? (count / totalPixels) * 100 : 0,
      count,
      name: includeNames ? getColorName(color) : undefined,
    }));

    return {
      dominant: colors[0]?.color || { r: 128, g: 128, b: 128 },
      colors,
      total: totalPixels,
    };
  } catch (error) {
    console.error('Color extraction failed:', error);
    return {
      dominant: { r: 128, g: 128, b: 128 },
      colors: [],
      total: 0,
    };
  }
}

/**
 * Extract the single dominant color
 */
export async function extractDominantColor(image: ImageSource): Promise<RGB> {
  const palette = await extractColors(image, 1);
  return palette.dominant;
}

/**
 * Extract color palette as hex strings
 */
export async function extractColorPaletteHex(
  image: ImageSource,
  colorCount: number = 5
): Promise<string[]> {
  const palette = await extractColors(image, colorCount, { includeNames: false });
  return palette.colors.map(c => c.hex);
}

/**
 * Check if an image is primarily grayscale
 */
export async function isGrayscale(
  image: ImageSource,
  threshold: number = 10
): Promise<boolean> {
  const { pixels } = await loadImagePixels(image, 100);

  let grayscaleCount = 0;
  for (const pixel of pixels) {
    const diff = Math.max(
      Math.abs(pixel.r - pixel.g),
      Math.abs(pixel.g - pixel.b),
      Math.abs(pixel.r - pixel.b)
    );
    if (diff <= threshold) {
      grayscaleCount++;
    }
  }

  return grayscaleCount / pixels.length > 0.9;
}

/**
 * Get color distribution histogram
 */
export async function getColorHistogram(
  image: ImageSource,
  bins: number = 16
): Promise<{
  r: number[];
  g: number[];
  b: number[];
}> {
  const { pixels } = await loadImagePixels(image, 200);

  const r = new Array(bins).fill(0);
  const g = new Array(bins).fill(0);
  const b = new Array(bins).fill(0);

  const binSize = 256 / bins;

  for (const pixel of pixels) {
    r[Math.min(Math.floor(pixel.r / binSize), bins - 1)]++;
    g[Math.min(Math.floor(pixel.g / binSize), bins - 1)]++;
    b[Math.min(Math.floor(pixel.b / binSize), bins - 1)]++;
  }

  // Normalize
  const total = pixels.length || 1;
  return {
    r: r.map(v => v / total),
    g: g.map(v => v / total),
    b: b.map(v => v / total),
  };
}

/**
 * Find similar colors in the image to a target color
 */
export async function findSimilarColors(
  image: ImageSource,
  targetColor: RGB,
  tolerance: number = 30,
  maxResults: number = 5
): Promise<ExtractedColor[]> {
  const palette = await extractColors(image, 20, { includeNames: true });

  return palette.colors
    .filter(c => colorDistance(c.color, targetColor) <= tolerance)
    .slice(0, maxResults);
}

// =====================================================
// Exports
// =====================================================

export type { ColorPalette, ExtractedColor };
