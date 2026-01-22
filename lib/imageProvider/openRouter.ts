/**
 * OpenRouter Image Provider
 * Contract: IMAGE_FUNC_GENERATE (OpenRouter/Flux implementation)
 */

import {
  GenerationOptions,
  GeneratedImage,
  GenerationResult,
  ImageGenerationError,
  ErrorCodes,
  AspectRatio,
  ProviderConfig,
  ImageModel,
} from './types';

// =====================================================
// Configuration
// =====================================================

export const OPENROUTER_FLUX_CONFIG: ProviderConfig = {
  provider: 'openrouter',
  model: 'flux-1.1-pro',
  maxBatchSize: 4,
  rateLimit: {
    requestsPerMinute: 60,
  },
  costPerImage: 3, // credits
  supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
  maxResolution: {
    width: 1440,
    height: 1440,
  },
};

export const OPENROUTER_SDXL_CONFIG: ProviderConfig = {
  provider: 'openrouter',
  model: 'sdxl',
  maxBatchSize: 4,
  rateLimit: {
    requestsPerMinute: 60,
  },
  costPerImage: 2, // credits
  supportedAspectRatios: ['1:1', '16:9', '9:16'],
  maxResolution: {
    width: 1024,
    height: 1024,
  },
};

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/images/generations';

// Model mapping to OpenRouter model IDs
const MODEL_IDS: Record<string, string> = {
  'flux-1.1-pro': 'black-forest-labs/flux-1.1-pro',
  'flux-1.1-pro-ultra': 'black-forest-labs/flux-1.1-pro-ultra',
  'sdxl': 'stabilityai/stable-diffusion-xl-base-1.0',
};

// =====================================================
// Aspect Ratio to Dimensions
// =====================================================

const ASPECT_RATIO_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
  '4:3': { width: 1152, height: 896 },
  '3:4': { width: 896, height: 1152 },
  '3:2': { width: 1216, height: 832 },
  '2:3': { width: 832, height: 1216 },
};

// =====================================================
// Main Generation Function
// =====================================================

export async function generateWithOpenRouter(
  options: GenerationOptions
): Promise<GenerationResult> {
  const startTime = Date.now();
  const count = options.count ?? 1;
  const model = options.model ?? 'flux-1.1-pro';
  const config = getConfigForModel(model);

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new ImageGenerationError(
        'OPENROUTER_API_KEY is not configured',
        ErrorCodes.PROVIDER_ERROR,
        'openrouter',
        false
      );
    }

    validateOpenRouterOptions(options);

    // Get dimensions
    const aspectRatio = options.aspectRatio ?? '1:1';
    const dimensions = options.width && options.height
      ? { width: options.width, height: options.height }
      : ASPECT_RATIO_DIMENSIONS[aspectRatio];

    // Build request body
    const requestBody = buildRequestBody(options, model, dimensions, count);

    // Make API request
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
        'X-Title': 'FlowStudio',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      handleApiError(response.status, errorData);
    }

    const data = await response.json() as OpenRouterResponse;

    // Extract images from response
    const images = extractImagesFromResponse(data, options, dimensions);

    if (images.length === 0) {
      throw new ImageGenerationError(
        'No images were generated',
        ErrorCodes.PROVIDER_ERROR,
        'openrouter',
        true
      );
    }

    return {
      success: true,
      images,
      creditsUsed: images.length * config.costPerImage,
      provider: 'openrouter',
      model: model as ImageModel,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    if (error instanceof ImageGenerationError) {
      throw error;
    }

    console.error('OpenRouter generation error:', error);
    throw new ImageGenerationError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      ErrorCodes.PROVIDER_ERROR,
      'openrouter',
      true
    );
  }
}

// =====================================================
// Request Building
// =====================================================

interface OpenRouterRequestBody {
  model: string;
  prompt: string;
  negative_prompt?: string;
  n: number;
  size: string;
  seed?: number;
  guidance_scale?: number;
  response_format: string;
}

function buildRequestBody(
  options: GenerationOptions,
  model: string,
  dimensions: { width: number; height: number },
  count: number
): OpenRouterRequestBody {
  const modelId = MODEL_IDS[model] ?? MODEL_IDS['flux-1.1-pro'];

  const body: OpenRouterRequestBody = {
    model: modelId,
    prompt: buildPrompt(options),
    n: count,
    size: `${dimensions.width}x${dimensions.height}`,
    response_format: 'b64_json',
  };

  if (options.negativePrompt) {
    body.negative_prompt = options.negativePrompt;
  }

  if (options.seed !== undefined) {
    body.seed = options.seed;
  }

  if (options.guidanceScale !== undefined) {
    body.guidance_scale = options.guidanceScale;
  }

  return body;
}

function buildPrompt(options: GenerationOptions): string {
  let prompt = options.prompt;

  // Add style modifier
  if (options.style) {
    prompt = `${options.style} style, ${prompt}`;
  }

  return prompt;
}

// =====================================================
// Response Handling
// =====================================================

interface OpenRouterResponse {
  data?: Array<{
    b64_json?: string;
    url?: string;
    revised_prompt?: string;
  }>;
  error?: {
    message: string;
    type: string;
    code?: string;
  };
}

function extractImagesFromResponse(
  response: OpenRouterResponse,
  options: GenerationOptions,
  dimensions: { width: number; height: number }
): GeneratedImage[] {
  if (!response.data || !Array.isArray(response.data)) {
    return [];
  }

  return response.data
    .map((item, index) => {
      let url: string;

      if (item.b64_json) {
        url = `data:image/png;base64,${item.b64_json}`;
      } else if (item.url) {
        url = item.url;
      } else {
        return null;
      }

      const image: GeneratedImage = {
        id: `openrouter_${Date.now()}_${index}`,
        url,
        width: dimensions.width,
        height: dimensions.height,
        prompt: item.revised_prompt ?? options.prompt,
        negativePrompt: options.negativePrompt,
        provider: 'openrouter',
        model: (options.model ?? 'flux-1.1-pro') as ImageModel,
        seed: options.seed,
        metadata: {
          aspectRatio: options.aspectRatio ?? '1:1',
          style: options.style,
          generatedAt: new Date().toISOString(),
        },
      };

      return image;
    })
    .filter((img): img is GeneratedImage => img !== null);
}

// =====================================================
// Error Handling
// =====================================================

interface ApiErrorData {
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}

function handleApiError(status: number, errorData: ApiErrorData): never {
  const message = errorData.error?.message ?? 'Unknown API error';

  switch (status) {
    case 400:
      if (message.toLowerCase().includes('content') || message.toLowerCase().includes('safety')) {
        throw new ImageGenerationError(
          'Content was filtered by safety settings',
          ErrorCodes.CONTENT_FILTERED,
          'openrouter',
          false
        );
      }
      throw new ImageGenerationError(
        `Invalid request: ${message}`,
        ErrorCodes.INVALID_OPTIONS,
        'openrouter',
        false
      );

    case 401:
      throw new ImageGenerationError(
        'Invalid API key',
        ErrorCodes.PROVIDER_ERROR,
        'openrouter',
        false
      );

    case 429:
      throw new ImageGenerationError(
        'Rate limit exceeded',
        ErrorCodes.RATE_LIMITED,
        'openrouter',
        true
      );

    case 500:
    case 502:
    case 503:
    case 504:
      throw new ImageGenerationError(
        'OpenRouter service unavailable',
        ErrorCodes.PROVIDER_ERROR,
        'openrouter',
        true
      );

    default:
      throw new ImageGenerationError(
        `API error: ${message}`,
        ErrorCodes.PROVIDER_ERROR,
        'openrouter',
        true
      );
  }
}

// =====================================================
// Validation
// =====================================================

export function validateOpenRouterOptions(options: GenerationOptions): void {
  if (!options.prompt || options.prompt.trim().length === 0) {
    throw new ImageGenerationError(
      'Prompt is required',
      ErrorCodes.INVALID_OPTIONS,
      'openrouter',
      false
    );
  }

  if (options.prompt.length > 2000) {
    throw new ImageGenerationError(
      'Prompt exceeds maximum length of 2000 characters',
      ErrorCodes.INVALID_OPTIONS,
      'openrouter',
      false
    );
  }

  const model = options.model ?? 'flux-1.1-pro';
  const config = getConfigForModel(model);

  const count = options.count ?? 1;
  if (count < 1 || count > config.maxBatchSize) {
    throw new ImageGenerationError(
      `Count must be between 1 and ${config.maxBatchSize}`,
      ErrorCodes.INVALID_OPTIONS,
      'openrouter',
      false
    );
  }

  if (options.aspectRatio && !config.supportedAspectRatios.includes(options.aspectRatio)) {
    throw new ImageGenerationError(
      `Aspect ratio ${options.aspectRatio} is not supported for ${model}. Use: ${config.supportedAspectRatios.join(', ')}`,
      ErrorCodes.INVALID_OPTIONS,
      'openrouter',
      false
    );
  }
}

// =====================================================
// Utility Functions
// =====================================================

function getConfigForModel(model: string): ProviderConfig {
  switch (model) {
    case 'sdxl':
      return OPENROUTER_SDXL_CONFIG;
    case 'flux-1.1-pro':
    case 'flux-1.1-pro-ultra':
    default:
      return OPENROUTER_FLUX_CONFIG;
  }
}

export function getOpenRouterConfig(model?: string): ProviderConfig {
  return getConfigForModel(model ?? 'flux-1.1-pro');
}

// =====================================================
// Rate Limit Management
// =====================================================

interface RateLimitState {
  count: number;
  resetTime: number;
}

const rateLimitState: RateLimitState = {
  count: 0,
  resetTime: Date.now() + 60000,
};

export function checkOpenRouterRateLimit(): {
  available: boolean;
  remaining: number;
  resetIn: number;
} {
  const now = Date.now();

  if (now >= rateLimitState.resetTime) {
    rateLimitState.count = 0;
    rateLimitState.resetTime = now + 60000;
  }

  const config = OPENROUTER_FLUX_CONFIG;
  const remaining = config.rateLimit.requestsPerMinute - rateLimitState.count;
  const resetIn = Math.max(0, rateLimitState.resetTime - now);

  return {
    available: remaining > 0,
    remaining,
    resetIn,
  };
}

export function incrementOpenRouterRateLimit(): void {
  rateLimitState.count++;
}
