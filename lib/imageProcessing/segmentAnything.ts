/**
 * Segment Anything Module
 * Contract: HYBRID_FUNC_SAM
 * Uses SlimSAM via Transformers.js for client-side segmentation
 */

import type {
  SAMOptions,
  SAMResult,
  SAMSegment,
  SAMModel,
  Point,
  BoundingBox,
  ImageSource,
} from './types';
import { ProcessingErrorCodes } from './types';

// =====================================================
// Types
// =====================================================

interface SAMProcessor {
  process: (image: Blob) => Promise<{
    pixel_values: Float32Array;
    original_sizes: [number, number][];
    reshaped_input_sizes: [number, number][];
  }>;
}

interface SAMEncoder {
  forward: (inputs: { pixel_values: Float32Array }) => Promise<{
    image_embeddings: Float32Array;
  }>;
}

interface SAMDecoder {
  forward: (inputs: {
    image_embeddings: Float32Array;
    image_positional_embeddings: Float32Array;
    input_points?: Float32Array;
    input_labels?: Float32Array;
    input_masks?: Float32Array;
  }) => Promise<{
    pred_masks: Float32Array;
    iou_scores: Float32Array;
  }>;
}

// =====================================================
// Configuration
// =====================================================

const MODEL_CONFIG: Record<SAMModel, { modelId: string }> = {
  'slimsam-77': {
    modelId: 'Xenova/slimsam-77-uniform',
  },
  'slimsam-99': {
    modelId: 'Xenova/slimsam-99-uniform',
  },
  'mobile-sam': {
    modelId: 'Xenova/mobile-sam-vit-base',
  },
};

const DEFAULT_MODEL: SAMModel = 'slimsam-77';

// =====================================================
// Module State
// =====================================================

let processor: SAMProcessor | null = null;
let encoder: SAMEncoder | null = null;
let decoder: SAMDecoder | null = null;
let currentModel: SAMModel | null = null;
let cachedEmbedding: Float32Array | null = null;
let cachedImageDimensions: { width: number; height: number } | null = null;
let initPromise: Promise<void> | null = null;

// =====================================================
// Initialization
// =====================================================

/**
 * Initialize SAM model
 */
async function initialize(model: SAMModel = DEFAULT_MODEL): Promise<void> {
  if (currentModel === model && processor && encoder && decoder) {
    return;
  }

  if (initPromise && currentModel === model) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const { SamModel, AutoProcessor } = await import('@xenova/transformers');

      const config = MODEL_CONFIG[model];

      // Load processor and model
      const [proc, mod] = await Promise.all([
        AutoProcessor.from_pretrained(config.modelId),
        SamModel.from_pretrained(config.modelId),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      processor = proc as any as SAMProcessor;

      // The model contains both encoder and decoder
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const samModel = mod as any;
      encoder = {
        forward: async (inputs) => {
          const output = await samModel.get_image_embeddings(inputs);
          return output;
        },
      };

      decoder = {
        forward: async (inputs) => {
          const output = await samModel.forward(inputs);
          return output;
        },
      };

      currentModel = model;
      cachedEmbedding = null;
      cachedImageDimensions = null;
    } catch (error) {
      console.error('Failed to initialize SAM:', error);
      throw new Error(`SAM initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  })();

  return initPromise;
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Load image as blob
 */
async function loadImageBlob(source: ImageSource): Promise<{ blob: Blob; width: number; height: number }> {
  if (source instanceof Blob) {
    const img = await createImageBitmap(source);
    return { blob: source, width: img.width, height: img.height };
  }

  if (typeof source === 'string') {
    const response = await fetch(source);
    const blob = await response.blob();
    const img = await createImageBitmap(blob);
    return { blob, width: img.width, height: img.height };
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
        (blob) => blob
          ? resolve({ blob, width: canvas.width, height: canvas.height })
          : reject(new Error('Failed to convert to blob')),
        'image/png'
      );
    });
  }

  if (source instanceof HTMLCanvasElement) {
    return new Promise((resolve, reject) => {
      source.toBlob(
        (blob) => blob
          ? resolve({ blob, width: source.width, height: source.height })
          : reject(new Error('Failed to convert to blob')),
        'image/png'
      );
    });
  }

  throw new Error('Invalid image source');
}

/**
 * Convert mask tensor to blob
 */
async function maskToBlob(
  maskData: Float32Array,
  width: number,
  height: number,
  threshold: number = 0.5
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  const imageData = ctx.createImageData(width, height);

  for (let i = 0; i < maskData.length; i++) {
    const value = maskData[i] > threshold ? 255 : 0;
    const idx = i * 4;
    imageData.data[idx] = value;     // R
    imageData.data[idx + 1] = value; // G
    imageData.data[idx + 2] = value; // B
    imageData.data[idx + 3] = 255;   // A
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Failed to create mask blob')),
      'image/png'
    );
  });
}

/**
 * Calculate bounding box from mask
 */
function calculateBoundingBox(
  maskData: Float32Array,
  width: number,
  height: number,
  threshold: number = 0.5
): BoundingBox {
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (maskData[y * width + x] > threshold) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

/**
 * Calculate mask area
 */
function calculateArea(maskData: Float32Array, threshold: number = 0.5): number {
  return maskData.reduce((count, value) => count + (value > threshold ? 1 : 0), 0);
}

// =====================================================
// Main Functions
// =====================================================

/**
 * Segment image using point prompts
 * Contract: HYBRID_FUNC_SAM
 */
export async function segmentAnything(
  image: ImageSource,
  options: SAMOptions = {}
): Promise<SAMResult> {
  const startTime = performance.now();

  const model = options.model || DEFAULT_MODEL;
  const points = options.points || [];
  const labels = options.pointLabels || points.map(() => 1);
  const multimask = options.multimask ?? false;

  try {
    // Initialize model
    await initialize(model);
    if (!processor || !encoder || !decoder) {
      throw new Error('SAM not initialized');
    }

    options.onProgress?.(10);

    // Load image
    const { blob, width, height } = await loadImageBlob(image);

    options.onProgress?.(20);

    // Process image
    const processed = await processor.process(blob);

    options.onProgress?.(40);

    // Get image embeddings (cache if same image)
    let imageEmbeddings = cachedEmbedding;
    if (!imageEmbeddings ||
        cachedImageDimensions?.width !== width ||
        cachedImageDimensions?.height !== height) {
      const embeddingResult = await encoder.forward({
        pixel_values: processed.pixel_values,
      });
      imageEmbeddings = embeddingResult.image_embeddings;
      cachedEmbedding = imageEmbeddings;
      cachedImageDimensions = { width, height };
    }

    options.onProgress?.(60);

    // If no points provided, segment the whole image
    if (points.length === 0) {
      // Center point as default
      points.push({ x: width / 2, y: height / 2 });
      labels.push(1);
    }

    // Prepare point prompts
    const inputPoints = new Float32Array(points.flatMap(p => [p.x, p.y]));
    const inputLabels = new Float32Array(labels);

    // Get positional embeddings (simplified - using zeros)
    const positionalEmbeddings = new Float32Array(imageEmbeddings.length).fill(0);

    options.onProgress?.(70);

    // Run decoder
    const decoderOutput = await decoder.forward({
      image_embeddings: imageEmbeddings,
      image_positional_embeddings: positionalEmbeddings,
      input_points: inputPoints,
      input_labels: inputLabels,
    });

    options.onProgress?.(85);

    // Process masks
    const { pred_masks, iou_scores } = decoderOutput;

    // For simplicity, take the best mask or all masks if multimask
    const numMasks = multimask ? 3 : 1;
    const maskSize = width * height;
    const segments: SAMSegment[] = [];

    for (let i = 0; i < numMasks && i * maskSize < pred_masks.length; i++) {
      const maskData = pred_masks.slice(i * maskSize, (i + 1) * maskSize);
      const score = iou_scores[i] || 0.9;

      const maskBlob = await maskToBlob(maskData, width, height);
      const bbox = calculateBoundingBox(maskData, width, height);
      const area = calculateArea(maskData);

      segments.push({
        mask: maskBlob,
        score,
        area,
        bbox,
      });
    }

    // Sort by score
    segments.sort((a, b) => b.score - a.score);

    options.onProgress?.(100);

    const processingTime = performance.now() - startTime;

    return {
      success: true,
      segments,
      embedding: imageEmbeddings,
      width,
      height,
      processingTime,
    };
  } catch (error) {
    const processingTime = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('SAM segmentation failed:', error);

    return {
      success: false,
      segments: [],
      width: 0,
      height: 0,
      processingTime,
      error: errorMessage,
    };
  }
}

/**
 * Segment with bounding box prompt
 */
export async function segmentWithBox(
  image: ImageSource,
  box: BoundingBox,
  options: Omit<SAMOptions, 'box'> = {}
): Promise<SAMResult> {
  // Convert box to corner points
  const points: Point[] = [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y + box.height },
  ];

  return segmentAnything(image, {
    ...options,
    points,
    pointLabels: [2, 3], // 2 = box start, 3 = box end
  });
}

/**
 * Get image embedding for caching
 */
export async function getImageEmbedding(
  image: ImageSource,
  model: SAMModel = DEFAULT_MODEL
): Promise<Float32Array | null> {
  try {
    await initialize(model);
    if (!processor || !encoder) return null;

    const { blob, width, height } = await loadImageBlob(image);
    const processed = await processor.process(blob);
    const result = await encoder.forward({ pixel_values: processed.pixel_values });

    cachedEmbedding = result.image_embeddings;
    cachedImageDimensions = { width, height };

    return result.image_embeddings;
  } catch (error) {
    console.error('Failed to get image embedding:', error);
    return null;
  }
}

/**
 * Segment with cached embedding
 */
export async function segmentWithEmbedding(
  embedding: Float32Array,
  width: number,
  height: number,
  points: Point[],
  labels?: number[]
): Promise<SAMSegment[]> {
  try {
    if (!decoder) {
      await initialize(DEFAULT_MODEL);
    }
    if (!decoder) return [];

    const inputPoints = new Float32Array(points.flatMap(p => [p.x, p.y]));
    const inputLabels = new Float32Array(labels || points.map(() => 1));
    const positionalEmbeddings = new Float32Array(embedding.length).fill(0);

    const result = await decoder.forward({
      image_embeddings: embedding,
      image_positional_embeddings: positionalEmbeddings,
      input_points: inputPoints,
      input_labels: inputLabels,
    });

    const maskData = result.pred_masks.slice(0, width * height);
    const maskBlob = await maskToBlob(maskData, width, height);
    const bbox = calculateBoundingBox(maskData, width, height);
    const area = calculateArea(maskData);

    return [{
      mask: maskBlob,
      score: result.iou_scores[0] || 0.9,
      area,
      bbox,
    }];
  } catch (error) {
    console.error('Segmentation with embedding failed:', error);
    return [];
  }
}

/**
 * Check if SAM is available
 */
export function isSAMAvailable(): boolean {
  return typeof window !== 'undefined' && 'createImageBitmap' in window;
}

/**
 * Preload SAM model
 */
export async function preloadSAMModel(model: SAMModel = DEFAULT_MODEL): Promise<void> {
  await initialize(model);
  console.log(`SAM model ${model} loaded`);
}

/**
 * Clear SAM cache
 */
export function clearSAMCache(): void {
  cachedEmbedding = null;
  cachedImageDimensions = null;
}

// =====================================================
// Exports
// =====================================================

export {
  type SAMOptions,
  type SAMResult,
  type SAMSegment,
  type SAMModel,
  type Point,
  type BoundingBox,
};
