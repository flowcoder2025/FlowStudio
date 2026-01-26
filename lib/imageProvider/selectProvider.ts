/**
 * Provider Selection Logic
 * Contract: IMAGE_FUNC_PROVIDER
 */

import {
  ImageProvider,
  ImageModel,
  ProviderConfig,
  ProviderSelectionCriteria,
  SelectedProvider,
  RateLimitStatus,
  AspectRatio,
} from './types';
import { GOOGLE_CONFIG, checkRateLimit as checkGoogleRateLimit } from './googleGenAI';
import {
  OPENROUTER_FLUX_CONFIG,
  OPENROUTER_SDXL_CONFIG,
  OPENROUTER_GEMINI_CONFIG,
  checkOpenRouterRateLimit,
} from './openRouter';

// =====================================================
// Provider Configurations Registry
// =====================================================

const PROVIDER_CONFIGS: Record<ImageModel, ProviderConfig> = {
  // Google Models (via @google/genai)
  'gemini-3-pro-image-preview': GOOGLE_CONFIG,
  'gemini-2.0-flash-exp-image-generation': GOOGLE_CONFIG,
  'imagen-3.0-generate-001': GOOGLE_CONFIG,
  'imagen-4.0-fast-generate-001': GOOGLE_CONFIG,
  'imagen-4.0-generate-001': GOOGLE_CONFIG,
  'imagen-4.0-ultra-generate-001': GOOGLE_CONFIG,
  // OpenRouter Models
  'google/gemini-3-pro-image-preview': OPENROUTER_GEMINI_CONFIG,
  'black-forest-labs/flux.2-pro': OPENROUTER_GEMINI_CONFIG,
  'black-forest-labs/flux.2-flex': OPENROUTER_GEMINI_CONFIG,
  'flux-1.1-pro': OPENROUTER_FLUX_CONFIG,
  'flux-1.1-pro-ultra': OPENROUTER_FLUX_CONFIG,
  'sdxl': OPENROUTER_SDXL_CONFIG,
};

// =====================================================
// Main Selection Function
// =====================================================

export function selectProvider(criteria: ProviderSelectionCriteria): SelectedProvider {
  const {
    batchSize,
    preferredProvider,
    requireHighQuality,
    budgetCredits,
    aspectRatio,
  } = criteria;

  // Get available providers based on rate limits
  const availableProviders = getAvailableProviders();

  if (availableProviders.length === 0) {
    // All providers rate limited - return the one that resets soonest
    return selectLeastWaitProvider();
  }

  // If user has a preference, try to honor it
  if (preferredProvider) {
    const preferred = availableProviders.find((p) => p.provider === preferredProvider);
    if (preferred) {
      const config = getConfigForProvider(preferredProvider, requireHighQuality);

      // Check if it supports the requested aspect ratio
      if (!aspectRatio || config.supportedAspectRatios.includes(aspectRatio)) {
        return buildSelection(config, batchSize, 'User preferred provider');
      }
    }
  }

  // Select based on criteria
  let selectedConfig: ProviderConfig | null = null;
  let reason = '';

  // High quality requirement
  if (requireHighQuality) {
    // Prefer Google Gemini for quality
    const googleAvailable = availableProviders.some((p) => p.provider === 'google');
    if (googleAvailable) {
      selectedConfig = GOOGLE_CONFIG;
      reason = 'High quality mode: Google Gemini selected';
    } else {
      // Fallback to Flux Pro Ultra
      selectedConfig = OPENROUTER_FLUX_CONFIG;
      reason = 'High quality mode: Flux Pro selected (Google unavailable)';
    }
  }

  // Budget constraint
  if (!selectedConfig && budgetCredits !== undefined) {
    selectedConfig = selectByBudget(availableProviders, batchSize, budgetCredits);
    if (selectedConfig) {
      reason = `Budget optimized: ${selectedConfig.model} selected`;
    }
  }

  // Batch size optimization
  if (!selectedConfig) {
    if (batchSize > 2) {
      // OpenRouter better for larger batches due to higher rate limits
      const openRouterAvailable = availableProviders.some((p) => p.provider === 'openrouter');
      if (openRouterAvailable) {
        selectedConfig = OPENROUTER_FLUX_CONFIG;
        reason = 'Batch optimization: OpenRouter selected for larger batch';
      }
    }
  }

  // Aspect ratio compatibility
  if (!selectedConfig && aspectRatio) {
    selectedConfig = selectByAspectRatio(availableProviders, aspectRatio);
    if (selectedConfig) {
      reason = `Aspect ratio support: ${selectedConfig.model} selected`;
    }
  }

  // Default selection
  if (!selectedConfig) {
    // Default to Google for single/small requests, OpenRouter for batches
    const googleAvailable = availableProviders.some((p) => p.provider === 'google');
    if (googleAvailable && batchSize <= 2) {
      selectedConfig = GOOGLE_CONFIG;
      reason = 'Default: Google Gemini for small batch';
    } else {
      selectedConfig = OPENROUTER_FLUX_CONFIG;
      reason = 'Default: OpenRouter Flux for batch generation';
    }
  }

  return buildSelection(selectedConfig, batchSize, reason);
}

// =====================================================
// Helper Functions
// =====================================================

function getAvailableProviders(): RateLimitStatus[] {
  const providers: RateLimitStatus[] = [];

  // Check Google
  const googleLimit = checkGoogleRateLimit();
  if (googleLimit.available) {
    providers.push({
      provider: 'google',
      remaining: googleLimit.remaining,
      resetAt: new Date(Date.now() + googleLimit.resetIn),
      isAvailable: true,
    });
  }

  // Check OpenRouter
  const openRouterLimit = checkOpenRouterRateLimit();
  if (openRouterLimit.available) {
    providers.push({
      provider: 'openrouter',
      remaining: openRouterLimit.remaining,
      resetAt: new Date(Date.now() + openRouterLimit.resetIn),
      isAvailable: true,
    });
  }

  return providers;
}

function selectLeastWaitProvider(): SelectedProvider {
  const googleLimit = checkGoogleRateLimit();
  const openRouterLimit = checkOpenRouterRateLimit();

  if (googleLimit.resetIn <= openRouterLimit.resetIn) {
    return {
      provider: 'google',
      model: GOOGLE_CONFIG.model,
      config: GOOGLE_CONFIG,
      estimatedCredits: GOOGLE_CONFIG.costPerImage,
      reason: `Rate limited - Google resets in ${Math.ceil(googleLimit.resetIn / 1000)}s`,
    };
  }

  return {
    provider: 'openrouter',
    model: OPENROUTER_FLUX_CONFIG.model,
    config: OPENROUTER_FLUX_CONFIG,
    estimatedCredits: OPENROUTER_FLUX_CONFIG.costPerImage,
    reason: `Rate limited - OpenRouter resets in ${Math.ceil(openRouterLimit.resetIn / 1000)}s`,
  };
}

function getConfigForProvider(
  provider: ImageProvider,
  highQuality?: boolean
): ProviderConfig {
  if (provider === 'google') {
    return GOOGLE_CONFIG;
  }

  // OpenRouter - select model based on quality preference
  if (highQuality) {
    return OPENROUTER_FLUX_CONFIG; // flux-1.1-pro for high quality
  }

  return OPENROUTER_FLUX_CONFIG;
}

function selectByBudget(
  availableProviders: RateLimitStatus[],
  batchSize: number,
  budgetCredits: number
): ProviderConfig | null {
  // Sort by cost
  const configs: Array<{ config: ProviderConfig; totalCost: number }> = [];

  if (availableProviders.some((p) => p.provider === 'openrouter')) {
    configs.push({
      config: OPENROUTER_SDXL_CONFIG,
      totalCost: OPENROUTER_SDXL_CONFIG.costPerImage * batchSize,
    });
    configs.push({
      config: OPENROUTER_FLUX_CONFIG,
      totalCost: OPENROUTER_FLUX_CONFIG.costPerImage * batchSize,
    });
  }

  if (availableProviders.some((p) => p.provider === 'google')) {
    configs.push({
      config: GOOGLE_CONFIG,
      totalCost: GOOGLE_CONFIG.costPerImage * batchSize,
    });
  }

  // Find cheapest that fits budget
  const affordable = configs
    .filter((c) => c.totalCost <= budgetCredits)
    .sort((a, b) => a.totalCost - b.totalCost);

  return affordable.length > 0 ? affordable[0].config : null;
}

function selectByAspectRatio(
  availableProviders: RateLimitStatus[],
  aspectRatio: AspectRatio
): ProviderConfig | null {
  // Check Google
  if (
    availableProviders.some((p) => p.provider === 'google') &&
    GOOGLE_CONFIG.supportedAspectRatios.includes(aspectRatio)
  ) {
    return GOOGLE_CONFIG;
  }

  // Check OpenRouter Flux
  if (
    availableProviders.some((p) => p.provider === 'openrouter') &&
    OPENROUTER_FLUX_CONFIG.supportedAspectRatios.includes(aspectRatio)
  ) {
    return OPENROUTER_FLUX_CONFIG;
  }

  // Check OpenRouter SDXL
  if (
    availableProviders.some((p) => p.provider === 'openrouter') &&
    OPENROUTER_SDXL_CONFIG.supportedAspectRatios.includes(aspectRatio)
  ) {
    return OPENROUTER_SDXL_CONFIG;
  }

  return null;
}

function buildSelection(
  config: ProviderConfig,
  batchSize: number,
  reason: string
): SelectedProvider {
  return {
    provider: config.provider,
    model: config.model,
    config,
    estimatedCredits: config.costPerImage * batchSize,
    reason,
  };
}

// =====================================================
// Utility Exports
// =====================================================

export function getProviderConfig(model: ImageModel): ProviderConfig {
  return PROVIDER_CONFIGS[model] ?? GOOGLE_CONFIG;
}

export function getAllProviderConfigs(): ProviderConfig[] {
  return [GOOGLE_CONFIG, OPENROUTER_GEMINI_CONFIG, OPENROUTER_FLUX_CONFIG, OPENROUTER_SDXL_CONFIG];
}

export function getProviderStatus(): Record<ImageProvider, RateLimitStatus> {
  const googleLimit = checkGoogleRateLimit();
  const openRouterLimit = checkOpenRouterRateLimit();

  return {
    google: {
      provider: 'google',
      remaining: googleLimit.remaining,
      resetAt: new Date(Date.now() + googleLimit.resetIn),
      isAvailable: googleLimit.available,
    },
    openrouter: {
      provider: 'openrouter',
      remaining: openRouterLimit.remaining,
      resetAt: new Date(Date.now() + openRouterLimit.resetIn),
      isAvailable: openRouterLimit.available,
    },
  };
}

export function estimateCredits(
  provider: ImageProvider,
  model: ImageModel,
  count: number
): number {
  const config = PROVIDER_CONFIGS[model];
  return config ? config.costPerImage * count : 5 * count; // Default 5 credits per image
}
