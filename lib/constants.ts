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

// ========================================
// Credit System Constants
// ========================================

export const CREDIT_PACKAGES = {
  starter: { 
    credits: 100, 
    priceKRW: 10000, 
    priceUSD: 7,
    name: { ko: '스타터', en: 'Starter' },
    discount: 0,
    description: { ko: '이미지 생성 5회 (20장)', en: '5 generations (20 images)' }
  },
  basic: { 
    credits: 300, 
    priceKRW: 28000, 
    priceUSD: 20,
    name: { ko: '베이직', en: 'Basic' },
    discount: 7,
    description: { ko: '이미지 생성 15회 (60장)', en: '15 generations (60 images)' }
  },
  pro: { 
    credits: 1000, 
    priceKRW: 90000, 
    priceUSD: 64,
    name: { ko: '프로', en: 'Pro' },
    discount: 10,
    description: { ko: '이미지 생성 50회 (200장)', en: '50 generations (200 images)' }
  },
  business: { 
    credits: 3000, 
    priceKRW: 250000, 
    priceUSD: 179,
    name: { ko: '비즈니스', en: 'Business' },
    discount: 17,
    description: { ko: '이미지 생성 150회 (600장)', en: '150 generations (600 images)' }
  },
} as const;

export type CreditPackageId = keyof typeof CREDIT_PACKAGES;

/**
 * 크레딧 사용 비용
 */
export const CREDIT_USAGE = {
  GENERATION_4: 20,   // 2K 이미지 4장 생성 = 20 크레딧
  GENERATION_2: 10,   // 추가 2장 생성 = 10 크레딧
  UPSCALE_4K: 10,     // 4K 업스케일링 1회 (1장) = 10 크레딧
} as const;

/**
 * 보너스 크레딧
 */
export const CREDIT_BONUS = {
  SIGNUP_GENERAL: 10,    // 일반 회원 가입 보너스
  SIGNUP_BUSINESS: 100,  // 사업자 회원 가입 보너스 (현재 비활성화)
  REFERRAL: 50,          // 추천인 보상 (현재 비활성화)
} as const;

// ========================================
// Subscription Plan Constants
// ========================================

export type SubscriptionTier = 'FREE' | 'PLUS' | 'PRO' | 'BUSINESS';
export type BillingInterval = 'monthly' | 'yearly';

export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: { ko: '무료', en: 'Free' },
    priceKRW: { monthly: 0, yearly: 0 },
    priceUSD: { monthly: 0, yearly: 0 },
    storageQuotaGB: 1,
    concurrentLimit: 1,
    watermarkFree: false,
    priorityQueue: false,
    historyDays: 7,
    features: {
      ko: ['1GB 저장공간', '동시 1건 생성', '워터마크 포함', '7일 히스토리'],
      en: ['1GB Storage', '1 Concurrent Generation', 'Watermark Included', '7-Day History'],
    },
  },
  PLUS: {
    name: { ko: 'Plus', en: 'Plus' },
    priceKRW: { monthly: 9900, yearly: 99000 },
    priceUSD: { monthly: 7, yearly: 70 },
    storageQuotaGB: 100,
    concurrentLimit: 3,
    watermarkFree: true,
    priorityQueue: true,
    historyDays: 30,
    features: {
      ko: ['100GB 저장공간', '동시 3건 생성', '워터마크 제거', '우선 처리', '30일 히스토리'],
      en: ['100GB Storage', '3 Concurrent Generations', 'No Watermark', 'Priority Processing', '30-Day History'],
    },
  },
  PRO: {
    name: { ko: 'Pro', en: 'Pro' },
    priceKRW: { monthly: 29900, yearly: 299000 },
    priceUSD: { monthly: 21, yearly: 210 },
    storageQuotaGB: 500,
    concurrentLimit: 5,
    watermarkFree: true,
    priorityQueue: true,
    historyDays: 90,
    features: {
      ko: ['500GB 저장공간', '동시 5건 생성', '워터마크 제거', '우선 처리', '90일 히스토리', 'API 접근'],
      en: ['500GB Storage', '5 Concurrent Generations', 'No Watermark', 'Priority Processing', '90-Day History', 'API Access'],
    },
  },
  BUSINESS: {
    name: { ko: 'Business', en: 'Business' },
    priceKRW: { monthly: 99000, yearly: 990000 },
    priceUSD: { monthly: 71, yearly: 710 },
    storageQuotaGB: 1000,
    concurrentLimit: 10,
    watermarkFree: true,
    priorityQueue: true,
    historyDays: -1,
    features: {
      ko: ['1TB 저장공간', '동시 10건 생성', '워터마크 제거', '최우선 처리', '무제한 히스토리', 'API 접근', '팀 협업 (5명)'],
      en: ['1TB Storage', '10 Concurrent Generations', 'No Watermark', 'Top Priority', 'Unlimited History', 'API Access', 'Team (5 members)'],
    },
  },
} as const;
