'use client';

/**
 * Filter Tab Component
 * Contract: HYBRID_DESIGN_FILTER_TAB
 */

import { useState, useCallback, useMemo } from 'react';
import { Check, RotateCcw, Sliders } from 'lucide-react';
import {
  ALL_PRESETS,
  getCategories,
  getPresetsByCategory,
  type FilterPreset,
} from '@/lib/imageProcessing/presets';
import { applyFilters, previewFilter } from '@/lib/imageProcessing/applyFilter';
import type { FilterValue, FilterType } from '@/lib/imageProcessing/types';

// =====================================================
// Types
// =====================================================

interface FilterTabProps {
  imageUrl: string;
  onProcessed: (url: string | null) => void;
  onProgress: (progress: number) => void;
  disabled?: boolean;
}

type FilterCategory = 'basic' | 'artistic' | 'color' | 'vintage' | 'professional';

// =====================================================
// Custom Filter Controls
// =====================================================

interface CustomFilterState {
  brightness: number;
  contrast: number;
  saturation: number;
  hueRotate: number;
  blur: number;
}

const DEFAULT_CUSTOM_FILTERS: CustomFilterState = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hueRotate: 0,
  blur: 0,
};

// =====================================================
// Component
// =====================================================

export function FilterTab({
  imageUrl,
  onProcessed,
  onProgress,
  disabled = false,
}: FilterTabProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('basic');
  const [showCustom, setShowCustom] = useState(false);
  const [customFilters, setCustomFilters] = useState<CustomFilterState>(DEFAULT_CUSTOM_FILTERS);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [isApplying, setIsApplying] = useState(false);

  const categories = useMemo(() => getCategories(), []);
  const currentPresets = useMemo(
    () => getPresetsByCategory(activeCategory),
    [activeCategory]
  );

  // Generate preview thumbnails
  const generatePreview = useCallback(
    async (preset: FilterPreset) => {
      if (previewUrls[preset.id]) return;

      try {
        const preview = await previewFilter(imageUrl, preset.filters, 100);
        if (preview) {
          setPreviewUrls((prev) => ({ ...prev, [preset.id]: preview }));
        }
      } catch (error) {
        console.error('Preview generation failed:', error);
      }
    },
    [imageUrl, previewUrls]
  );

  // Apply preset
  const handleApplyPreset = useCallback(
    async (preset: FilterPreset) => {
      if (disabled || isApplying) return;

      setIsApplying(true);
      setSelectedPreset(preset.id);
      onProgress(10);

      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        const result = await applyFilters(blob, {
          filters: preset.filters,
          onProgress,
        });

        if (result.success && result.image) {
          const url = URL.createObjectURL(result.image);
          onProcessed(url);
        } else {
          console.error('Filter application failed:', result.error);
          onProcessed(null);
        }
      } catch (error) {
        console.error('Filter error:', error);
        onProcessed(null);
      } finally {
        setIsApplying(false);
      }
    },
    [imageUrl, onProcessed, onProgress, disabled, isApplying]
  );

  // Apply custom filters
  const handleApplyCustom = useCallback(async () => {
    if (disabled || isApplying) return;

    setIsApplying(true);
    setSelectedPreset('custom');
    onProgress(10);

    const filters: FilterValue[] = [];

    if (customFilters.brightness !== 100) {
      filters.push({ type: 'brightness', value: customFilters.brightness });
    }
    if (customFilters.contrast !== 100) {
      filters.push({ type: 'contrast', value: customFilters.contrast });
    }
    if (customFilters.saturation !== 100) {
      filters.push({ type: 'saturation', value: customFilters.saturation });
    }
    if (customFilters.hueRotate !== 0) {
      filters.push({ type: 'hue-rotate', value: customFilters.hueRotate });
    }
    if (customFilters.blur > 0) {
      filters.push({ type: 'blur', value: customFilters.blur });
    }

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const result = await applyFilters(blob, {
        filters,
        onProgress,
      });

      if (result.success && result.image) {
        const url = URL.createObjectURL(result.image);
        onProcessed(url);
      } else {
        onProcessed(null);
      }
    } catch (error) {
      console.error('Custom filter error:', error);
      onProcessed(null);
    } finally {
      setIsApplying(false);
    }
  }, [imageUrl, customFilters, onProcessed, onProgress, disabled, isApplying]);

  // Reset custom filters
  const handleResetCustom = useCallback(() => {
    setCustomFilters(DEFAULT_CUSTOM_FILTERS);
  }, []);

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowCustom(false)}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            !showCustom
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          }`}
        >
          프리셋
        </button>
        <button
          onClick={() => setShowCustom(true)}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            showCustom
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          }`}
        >
          <Sliders className="w-4 h-4 inline-block mr-1" />
          커스텀
        </button>
      </div>

      {!showCustom ? (
        /* Preset Mode */
        <>
          {/* Category Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as FilterCategory)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {cat.nameKo}
              </button>
            ))}
          </div>

          {/* Preset Grid */}
          <div className="grid grid-cols-3 gap-2">
            {currentPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                onMouseEnter={() => generatePreview(preset)}
                disabled={disabled || isApplying}
                className={`
                  relative aspect-square rounded-lg overflow-hidden border-2 transition-all
                  ${selectedPreset === preset.id
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }
                  ${disabled || isApplying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {/* Preview Image */}
                <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700">
                  {previewUrls[preset.id] ? (
                    <img
                      src={previewUrls[preset.id]}
                      alt={preset.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={imageUrl}
                      alt={preset.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Label */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                  <span className="text-xs text-white font-medium">
                    {preset.nameKo}
                  </span>
                </div>

                {/* Selected Indicator */}
                {selectedPreset === preset.id && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </>
      ) : (
        /* Custom Mode */
        <div className="space-y-4">
          {/* Brightness */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">밝기</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {customFilters.brightness}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={customFilters.brightness}
              onChange={(e) =>
                setCustomFilters((prev) => ({
                  ...prev,
                  brightness: Number(e.target.value),
                }))
              }
              className="w-full accent-blue-500"
            />
          </div>

          {/* Contrast */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">대비</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {customFilters.contrast}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={customFilters.contrast}
              onChange={(e) =>
                setCustomFilters((prev) => ({
                  ...prev,
                  contrast: Number(e.target.value),
                }))
              }
              className="w-full accent-blue-500"
            />
          </div>

          {/* Saturation */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">채도</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {customFilters.saturation}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={customFilters.saturation}
              onChange={(e) =>
                setCustomFilters((prev) => ({
                  ...prev,
                  saturation: Number(e.target.value),
                }))
              }
              className="w-full accent-blue-500"
            />
          </div>

          {/* Hue Rotate */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">색조 회전</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {customFilters.hueRotate}°
              </span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              value={customFilters.hueRotate}
              onChange={(e) =>
                setCustomFilters((prev) => ({
                  ...prev,
                  hueRotate: Number(e.target.value),
                }))
              }
              className="w-full accent-blue-500"
            />
          </div>

          {/* Blur */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">블러</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {customFilters.blur}px
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={customFilters.blur}
              onChange={(e) =>
                setCustomFilters((prev) => ({
                  ...prev,
                  blur: Number(e.target.value),
                }))
              }
              className="w-full accent-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleResetCustom}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              초기화
            </button>
            <button
              onClick={handleApplyCustom}
              disabled={disabled || isApplying}
              className="flex-1 py-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isApplying ? '적용 중...' : '적용'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
