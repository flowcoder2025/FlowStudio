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

/**
 * 크레딧 패키지 정의 (PortOne 결제 연동)
 * - 1 크레딧 = ₩100
 * - 패키지별 할인율 적용
 */
export const CREDIT_PACKAGES = {
  starter: { credits: 100, price: 10000, name: '스타터', discount: 0 },
  basic: { credits: 300, price: 28000, name: '베이직', discount: 7 },    // 2,000원 할인
  pro: { credits: 1000, price: 90000, name: '프로', discount: 10 },      // 10,000원 할인
  business: { credits: 3000, price: 250000, name: '비즈니스', discount: 17 }, // 50,000원 할인
} as const;

export type CreditPackageId = keyof typeof CREDIT_PACKAGES;

/**
 * 크레딧 사용 비용
 */
export const CREDIT_USAGE = {
  GENERATION_2K: 20,  // 2K 이미지 생성 1회 (2장) = 20 크레딧
  UPSCALE_4K: 10,     // 4K 업스케일링 1회 (1장) = 10 크레딧
} as const;

/**
 * 보너스 크레딧
 */
export const CREDIT_BONUS = {
  SIGNUP_GENERAL: 30,    // 일반 회원 가입 보너스
  SIGNUP_BUSINESS: 150,  // 사업자 회원 가입 보너스
  REFERRAL: 150,         // 추천인 보상 (양측 각각)
} as const;

// ========================================
// Subscription Plan Constants
// ========================================

export type SubscriptionTier = 'FREE' | 'PLUS' | 'PRO' | 'BUSINESS';

/**
 * 구독 플랜 정의
 * - 크레딧은 별도 구매 (정기 구독과 분리)
 * - 구독은 스토리지, 기능, 처리 우선순위 제공
 */
export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: '무료',
    price: 0,
    storageQuotaGB: 1,
    concurrentLimit: 1,
    watermarkFree: false,
    priorityQueue: false,
    historyDays: 7,
    features: ['1GB 저장공간', '동시 1건 생성', '워터마크 포함', '7일 히스토리'],
  },
  PLUS: {
    name: 'Plus',
    price: 9900,
    storageQuotaGB: 100,
    concurrentLimit: 3,
    watermarkFree: true,
    priorityQueue: true,
    historyDays: 30,
    features: ['100GB 저장공간', '동시 3건 생성', '워터마크 제거', '우선 처리', '30일 히스토리'],
  },
  PRO: {
    name: 'Pro',
    price: 29900,
    storageQuotaGB: 500,
    concurrentLimit: 5,
    watermarkFree: true,
    priorityQueue: true,
    historyDays: 90,
    features: ['500GB 저장공간', '동시 5건 생성', '워터마크 제거', '우선 처리', '90일 히스토리', 'API 접근'],
  },
  BUSINESS: {
    name: 'Business',
    price: 99000,
    storageQuotaGB: 1000, // 1TB, Fair Use Policy
    concurrentLimit: 10,
    watermarkFree: true,
    priorityQueue: true,
    historyDays: -1, // 무제한
    features: ['1TB 저장공간', '동시 10건 생성', '워터마크 제거', '최우선 처리', '무제한 히스토리', 'API 접근', '팀 협업 (5명)'],
  },
} as const;
