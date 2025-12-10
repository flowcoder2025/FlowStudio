import { FilterState, FilterPreset } from '@/types';

// Color correction filter defaults
export const DEFAULT_FILTERS: FilterState = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sepia: 0,
  blur: 0,
  grayscale: 0,
  hueRotate: 0,
};

// Professional filter presets
export const FILTER_PRESETS: FilterPreset[] = [
  { label: '원본 (Reset)', filters: DEFAULT_FILTERS, color: 'bg-white text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-500' },
  { label: '화사하게 (Bright)', filters: { ...DEFAULT_FILTERS, brightness: 115, saturation: 110, contrast: 105 }, color: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-700' },
  { label: '푸드 (Foodie)', filters: { ...DEFAULT_FILTERS, brightness: 110, saturation: 130, contrast: 115, sepia: 10 }, color: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-700' },
  { label: '감성 카페 (Warm)', filters: { ...DEFAULT_FILTERS, sepia: 30, brightness: 105, saturation: 85, contrast: 95 }, color: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700' },
  { label: '시네마틱 (Movie)', filters: { ...DEFAULT_FILTERS, contrast: 125, saturation: 90, brightness: 95, sepia: 10 }, color: 'bg-blue-900 text-white border-blue-900 dark:bg-blue-800 dark:border-blue-600' },
  { label: '쿨톤 (Cool)', filters: { ...DEFAULT_FILTERS, hueRotate: 15, brightness: 105, saturation: 95 }, color: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700' },
  { label: '비비드 (Vivid)', filters: { ...DEFAULT_FILTERS, saturation: 150, contrast: 110, brightness: 105 }, color: 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/40 dark:text-pink-200 dark:border-pink-700' },
  { label: '필름 (Film)', filters: { ...DEFAULT_FILTERS, contrast: 90, brightness: 110, saturation: 70, sepia: 20 }, color: 'bg-zinc-200 text-zinc-800 border-zinc-400 dark:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-500' },
  { label: '매트 (Matte)', filters: { ...DEFAULT_FILTERS, contrast: 85, brightness: 115, saturation: 80 }, color: 'bg-stone-100 text-stone-800 border-stone-300 dark:bg-stone-700 dark:text-stone-200 dark:border-stone-500' },
  { label: '누아르 (B&W)', filters: { ...DEFAULT_FILTERS, grayscale: 100, contrast: 130, brightness: 100 }, color: 'bg-black text-white border-black dark:bg-slate-900 dark:border-slate-600' },
  { label: '페이딩 (Faded)', filters: { ...DEFAULT_FILTERS, contrast: 80, brightness: 120, sepia: 15, saturation: 60 }, color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-500' },
  { label: '몽환적 (Dreamy)', filters: { ...DEFAULT_FILTERS, blur: 1.5, brightness: 110, saturation: 120, hueRotate: -10 }, color: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-700' },
];

// Usage & Cost Estimation Constants
export const ESTIMATED_COST_PER_IMAGE_USD = 0.14; // Updated cost for gemini-3-pro-image-preview
export const EXCHANGE_RATE_KRW = 1400; // Approximate exchange rate
