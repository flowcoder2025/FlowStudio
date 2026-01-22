/**
 * Image Processing Types
 * Contract: HYBRID_FUNC_* (Phase 5)
 */

// =====================================================
// Color Types
// =====================================================

export interface RGB {
  r: number; // 0-255
  g: number;
  b: number;
}

export interface RGBA extends RGB {
  a: number; // 0-255
}

export interface LAB {
  l: number; // 0-100 (lightness)
  a: number; // -128 to 127 (green to red)
  b: number; // -128 to 127 (blue to yellow)
}

export interface HSL {
  h: number; // 0-360 (hue)
  s: number; // 0-100 (saturation)
  l: number; // 0-100 (lightness)
}

export interface HSV {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

export interface ColorPalette {
  dominant: RGB;
  colors: ExtractedColor[];
  total: number;
}

export interface ExtractedColor {
  color: RGB;
  hex: string;
  percentage: number;
  count: number;
  name?: string;
}

// =====================================================
// Background Removal Types
// =====================================================

export type BackgroundRemovalModel = 'isnet' | 'isnet_fp16' | 'isnet_quint8';

export interface BackgroundRemovalOptions {
  model?: BackgroundRemovalModel;
  output?: 'foreground' | 'mask' | 'background';
  returnMask?: boolean;
  quality?: 'low' | 'medium' | 'high';
  onProgress?: (progress: number) => void;
}

export interface BackgroundRemovalResult {
  success: boolean;
  foreground: Blob | null;
  mask?: Blob;
  width: number;
  height: number;
  processingTime: number;
  error?: string;
}

// =====================================================
// Color Transfer Types
// =====================================================

export type ColorTransferMethod = 'reinhard' | 'monge-kantorovitch' | 'pdf-transfer';

export interface ColorTransferOptions {
  method?: ColorTransferMethod;
  preserveLuminance?: boolean;
  strength?: number; // 0-1
  onProgress?: (progress: number) => void;
}

export interface ColorTransferResult {
  success: boolean;
  image: Blob | null;
  width: number;
  height: number;
  processingTime: number;
  error?: string;
}

// =====================================================
// Filter Types
// =====================================================

export type FilterType =
  | 'brightness'
  | 'contrast'
  | 'saturation'
  | 'hue-rotate'
  | 'grayscale'
  | 'sepia'
  | 'invert'
  | 'blur'
  | 'sharpen'
  | 'vintage'
  | 'warm'
  | 'cool'
  | 'dramatic'
  | 'soft'
  | 'vibrant'
  | 'noir'
  | 'fade'
  | 'chrome'
  | 'clarendon'
  | 'custom';

export interface FilterValue {
  type: FilterType;
  value: number;
}

export interface FilterPreset {
  id: string;
  name: string;
  nameKo: string;
  filters: FilterValue[];
  thumbnail?: string;
  category: 'basic' | 'artistic' | 'color' | 'vintage' | 'professional';
}

export interface FilterOptions {
  filters: FilterValue[];
  onProgress?: (progress: number) => void;
}

export interface FilterResult {
  success: boolean;
  image: Blob | null;
  width: number;
  height: number;
  processingTime: number;
  error?: string;
}

// =====================================================
// SAM Segmentation Types
// =====================================================

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type SAMModel = 'slimsam-77' | 'slimsam-99' | 'mobile-sam';

export interface SAMOptions {
  model?: SAMModel;
  points?: Point[];
  pointLabels?: number[]; // 1 for foreground, 0 for background
  box?: BoundingBox;
  multimask?: boolean;
  onProgress?: (progress: number) => void;
}

export interface SAMSegment {
  mask: Blob;
  score: number;
  area: number;
  bbox: BoundingBox;
}

export interface SAMResult {
  success: boolean;
  segments: SAMSegment[];
  embedding?: Float32Array;
  width: number;
  height: number;
  processingTime: number;
  error?: string;
}

// =====================================================
// Colorway Types
// =====================================================

export type ColorwayStrategy =
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'split-complementary'
  | 'tetradic'
  | 'monochromatic';

export interface ColorwayOptions {
  strategy: ColorwayStrategy;
  baseColor?: RGB;
  preserveOriginal?: boolean;
  variations?: number; // 1-10
  strength?: number; // 0-1
  onProgress?: (progress: number) => void;
}

export interface ColorwayVariation {
  id: string;
  name: string;
  colors: RGB[];
  preview?: Blob;
}

export interface ColorwayResult {
  success: boolean;
  variations: ColorwayVariation[];
  baseColor: RGB;
  processingTime: number;
  error?: string;
}

// =====================================================
// Processing Pipeline Types
// =====================================================

export type ProcessingStep =
  | { type: 'background-removal'; options: BackgroundRemovalOptions }
  | { type: 'color-transfer'; source: Blob | string; options: ColorTransferOptions }
  | { type: 'filter'; options: FilterOptions }
  | { type: 'segment'; options: SAMOptions }
  | { type: 'colorway'; options: ColorwayOptions };

export interface ProcessingPipeline {
  steps: ProcessingStep[];
  onStepComplete?: (step: number, result: ProcessingStepResult) => void;
  onProgress?: (progress: number) => void;
}

export interface ProcessingStepResult {
  step: number;
  type: ProcessingStep['type'];
  success: boolean;
  output: Blob | null;
  duration: number;
  error?: string;
}

export interface PipelineResult {
  success: boolean;
  finalImage: Blob | null;
  steps: ProcessingStepResult[];
  totalTime: number;
  error?: string;
}

// =====================================================
// Worker Message Types
// =====================================================

export type WorkerMessageType =
  | 'init'
  | 'background-removal'
  | 'color-transfer'
  | 'filter'
  | 'segment'
  | 'colorway'
  | 'color-extract'
  | 'lab-convert'
  | 'cancel';

export interface WorkerMessage {
  id: string;
  type: WorkerMessageType;
  payload: unknown;
}

export interface WorkerResponse {
  id: string;
  type: WorkerMessageType;
  success: boolean;
  result?: unknown;
  error?: string;
  progress?: number;
}

// =====================================================
// Canvas & Image Utilities
// =====================================================

export interface ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export type ImageSource = HTMLImageElement | HTMLCanvasElement | Blob | string;

export interface CanvasContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  imageData: globalThis.ImageData;
}

// =====================================================
// Error Types
// =====================================================

export class ImageProcessingError extends Error {
  constructor(
    message: string,
    public code: ProcessingErrorCode,
    public step?: ProcessingStep['type']
  ) {
    super(message);
    this.name = 'ImageProcessingError';
  }
}

export const ProcessingErrorCodes = {
  INVALID_INPUT: 'INVALID_INPUT',
  MODEL_LOAD_FAILED: 'MODEL_LOAD_FAILED',
  PROCESSING_FAILED: 'PROCESSING_FAILED',
  WORKER_ERROR: 'WORKER_ERROR',
  TIMEOUT: 'TIMEOUT',
  OUT_OF_MEMORY: 'OUT_OF_MEMORY',
  CANCELLED: 'CANCELLED',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ProcessingErrorCode = typeof ProcessingErrorCodes[keyof typeof ProcessingErrorCodes];

// =====================================================
// Constants
// =====================================================

export const DEFAULT_PROCESSING_OPTIONS = {
  backgroundRemoval: {
    model: 'isnet_fp16' as BackgroundRemovalModel,
    output: 'foreground' as const,
    quality: 'medium' as const,
  },
  colorTransfer: {
    method: 'reinhard' as ColorTransferMethod,
    preserveLuminance: true,
    strength: 1.0,
  },
  filter: {
    filters: [] as FilterValue[],
  },
  sam: {
    model: 'slimsam-77' as SAMModel,
    multimask: false,
  },
  colorway: {
    strategy: 'complementary' as ColorwayStrategy,
    variations: 5,
    strength: 0.8,
  },
} as const;
