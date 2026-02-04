/**
 * Image Provider Types
 * Contract: IMAGE_FUNC_GENERATE, IMAGE_FUNC_PROVIDER, IMAGE_FUNC_UPSCALE
 */

// =====================================================
// Provider Types
// =====================================================

export type ImageProvider = 'google' | 'openrouter';

export type ImageModel =
  // Google Models (via @google/genai)
  | 'gemini-3-pro-image-preview'
  | 'gemini-2.0-flash-exp-image-generation'
  | 'imagen-3.0-generate-001'
  | 'imagen-4.0-fast-generate-001'
  | 'imagen-4.0-generate-001'
  | 'imagen-4.0-ultra-generate-001'
  // OpenRouter Models
  | 'google/gemini-3-pro-image-preview'
  | 'black-forest-labs/flux.2-pro'
  | 'black-forest-labs/flux.2-flex'
  | 'flux-1.1-pro'
  | 'flux-1.1-pro-ultra'
  | 'sdxl';

export interface ProviderConfig {
  provider: ImageProvider;
  model: ImageModel;
  maxBatchSize: number;
  rateLimit: {
    requestsPerMinute: number;
    tokensPerMinute?: number;
  };
  costPerImage: number; // in credits
  supportedAspectRatios: AspectRatio[];
  maxResolution: {
    width: number;
    height: number;
  };
}

// =====================================================
// Generation Options
// =====================================================

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '3:2' | '2:3';

/**
 * 참조 이미지 활용 모드
 * - style: 분위기, 색감, 조명, 스타일만 참조 (새로운 피사체 생성)
 * - product: 제품/피사체를 그대로 유지하면서 배경/스타일만 변경
 * - composition: 구도와 레이아웃을 참조하여 유사한 배치로 생성
 * - full: 참조 이미지를 최대한 충실하게 재현 (기본값)
 */
export type ReferenceMode = 'style' | 'product' | 'composition' | 'full';

export interface GenerationOptions {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: AspectRatio;
  width?: number;
  height?: number;
  count?: number; // 1-4
  seed?: number;
  guidanceScale?: number;
  safetyFilterLevel?: 'block_none' | 'block_few' | 'block_some' | 'block_most';
  style?: string;
  provider?: ImageProvider;
  model?: ImageModel;
  // Image editing/reference options
  sourceImage?: string; // base64 data URL for editing
  refImage?: string; // base64 data URL for reference
  refImages?: string[]; // multiple reference images (COMPOSITE mode)
  referenceMode?: ReferenceMode; // 참조 이미지 활용 방식 (style/product/composition/full)
  logoImage?: string; // logo image for overlay
  maskImage?: string; // mask image for DETAIL_EDIT mode
  mode?: string; // generation mode (e.g., 'DETAIL_EDIT', 'COMPOSITE')
}

export interface GenerationRequest extends GenerationOptions {
  userId: string;
  workflowSessionId?: string;
}

// =====================================================
// Generation Result
// =====================================================

export interface GeneratedImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  prompt: string;
  negativePrompt?: string;
  provider: ImageProvider;
  model: ImageModel;
  seed?: number;
  metadata?: Record<string, unknown>;
}

export interface GenerationResult {
  success: boolean;
  images: GeneratedImage[];
  creditsUsed: number;
  provider: ImageProvider;
  model: ImageModel;
  error?: string;
  duration?: number; // in ms
}

// =====================================================
// Upscale Types
// =====================================================

export type UpscaleMode = '2x' | '4x' | 'enhance';

export interface UpscaleOptions {
  imageUrl: string;
  mode: UpscaleMode;
  enhanceFaces?: boolean;
  denoiseStrength?: number;
}

export interface UpscaleResult {
  success: boolean;
  url: string;
  originalWidth: number;
  originalHeight: number;
  upscaledWidth: number;
  upscaledHeight: number;
  creditsUsed: number;
  error?: string;
}

// =====================================================
// Provider Selection
// =====================================================

export interface ProviderSelectionCriteria {
  batchSize: number;
  preferredProvider?: ImageProvider;
  requireHighQuality?: boolean;
  budgetCredits?: number;
  aspectRatio?: AspectRatio;
}

export interface SelectedProvider {
  provider: ImageProvider;
  model: ImageModel;
  config: ProviderConfig;
  estimatedCredits: number;
  reason: string;
}

// =====================================================
// Rate Limiting
// =====================================================

export interface RateLimitStatus {
  provider: ImageProvider;
  remaining: number;
  resetAt: Date;
  isAvailable: boolean;
}

// =====================================================
// Progress Tracking
// =====================================================

export type GenerationStatus =
  | 'pending'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed';

export interface GenerationProgress {
  status: GenerationStatus;
  progress: number; // 0-100
  currentStep?: string;
  estimatedTimeRemaining?: number; // in seconds
  imagesCompleted?: number;
  totalImages?: number;
}

// =====================================================
// Error Types
// =====================================================

export class ImageGenerationError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: ImageProvider,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ImageGenerationError';
  }
}

export const ErrorCodes = {
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_PROMPT: 'INVALID_PROMPT',
  CONTENT_FILTERED: 'CONTENT_FILTERED',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  INVALID_OPTIONS: 'INVALID_OPTIONS',
  TIMEOUT: 'TIMEOUT',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// =====================================================
// Storage Types
// =====================================================

export interface ImageUploadResult {
  success: boolean;
  url: string;
  thumbnailUrl?: string;
  path: string;
  size: number;
  error?: string;
}

export interface ImageMetadata {
  id: string;
  userId: string;
  prompt: string;
  negativePrompt?: string;
  provider: ImageProvider;
  model: ImageModel;
  width: number;
  height: number;
  creditUsed: number;
  isUpscaled: boolean;
  createdAt: Date;
}
