/**
 * Payment Configuration
 * Contract: PAYMENT_FUNC_CHECKOUT
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 *
 * Payment Provider: Polar (https://polar.sh)
 */

import type { CreditPackage, SubscriptionPlan } from "./types";

// =====================================================
// Polar Configuration
// =====================================================

export const POLAR_CONFIG = {
  accessToken: process.env.POLAR_ACCESS_TOKEN || "",
  successUrl: process.env.POLAR_SUCCESS_URL || "http://localhost:3000/payment/success?checkout_id={CHECKOUT_ID}",
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET || "",
  environment: (process.env.POLAR_ENVIRONMENT || "sandbox") as "sandbox" | "production",
} as const;

// =====================================================
// Credit Packages
// =====================================================

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "starter",
    productId: process.env.POLAR_PRODUCT_CREDITS_STARTER || "",
    name: "스타터",
    credits: 100,
    price: 10000, // ₩10,000
    priceUSD: 700, // $7
    priceFormatted: "₩10,000",
    priceFormattedUSD: "$7",
    bonus: 0,
  },
  {
    id: "basic",
    productId: process.env.POLAR_PRODUCT_CREDITS_BASIC || "",
    name: "베이직",
    credits: 300,
    price: 28000, // ₩28,000
    priceUSD: 2000, // $20
    priceFormatted: "₩28,000",
    priceFormattedUSD: "$20",
    bonus: 7,
    popular: true,
  },
  {
    id: "pro",
    productId: process.env.POLAR_PRODUCT_CREDITS_PRO || "",
    name: "프로",
    credits: 1000,
    price: 90000, // ₩90,000
    priceUSD: 6400, // $64
    priceFormatted: "₩90,000",
    priceFormattedUSD: "$64",
    bonus: 10,
  },
  {
    id: "business",
    productId: process.env.POLAR_PRODUCT_CREDITS_BUSINESS || "",
    name: "비즈니스",
    credits: 3000,
    price: 250000, // ₩250,000
    priceUSD: 17900, // $179
    priceFormatted: "₩250,000",
    priceFormattedUSD: "$179",
    bonus: 17,
  },
];

// =====================================================
// Subscription Plans
// =====================================================

// Feature keys for i18n - mapped in pricing page with useTranslations
export type FeatureKey =
  | { key: "monthlyCredits"; params: { count: number } }
  | { key: "storage"; params: { size: string } }
  | { key: "concurrentGenerations"; params: { count: number } }
  | { key: "watermarkIncluded" }
  | { key: "watermarkRemoved" }
  | { key: "standardProcessing" }
  | { key: "priorityProcessing" }
  | { key: "highestPriorityProcessing" }
  | { key: "historyDays"; params: { days: number } }
  | { key: "historyUnlimited" }
  | { key: "apiAccess" }
  | { key: "teamMembers"; params: { count: number } };

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  // =====================================================
  // Free Plan (interval: month - 기본값)
  // =====================================================
  {
    id: "free",
    productId: "",
    name: "무료",
    price: 0,
    priceUSD: 0,
    priceFormatted: "무료",
    priceFormattedUSD: "Free",
    interval: "month",
    monthlyCredits: 0,
    storage: "1GB",
    concurrentGenerations: 1,
    watermarkRemoved: false,
    priority: "standard",
    historyDays: 7,
    features: [
      "1GB 저장공간",
      "1개 동시 생성",
      "워터마크 포함",
      "7일 히스토리",
    ],
    featureKeys: [
      { key: "storage", params: { size: "1GB" } },
      { key: "concurrentGenerations", params: { count: 1 } },
      { key: "watermarkIncluded" },
      { key: "historyDays", params: { days: 7 } },
    ] as FeatureKey[],
  },

  // =====================================================
  // Plus Plan - Monthly
  // =====================================================
  {
    id: "plus",
    productId: process.env.POLAR_PRODUCT_PLUS_MONTHLY || "",
    name: "Plus",
    price: 9900,
    priceUSD: 700, // $7
    priceFormatted: "₩9,900",
    priceFormattedUSD: "$7",
    interval: "month",
    monthlyCredits: 100, // 5회 생성 (20장)
    storage: "100GB",
    concurrentGenerations: 3,
    watermarkRemoved: true,
    priority: "priority",
    historyDays: 30,
    features: [
      "월 100 크레딧 (30일 한정)",
      "100GB 저장공간",
      "3개 동시 생성",
      "워터마크 제거",
      "우선 처리",
      "30일 히스토리",
    ],
    featureKeys: [
      { key: "monthlyCredits", params: { count: 100 } },
      { key: "storage", params: { size: "100GB" } },
      { key: "concurrentGenerations", params: { count: 3 } },
      { key: "watermarkRemoved" },
      { key: "priorityProcessing" },
      { key: "historyDays", params: { days: 30 } },
    ] as FeatureKey[],
    popular: true,
  },

  // =====================================================
  // Plus Plan - Yearly (2개월 무료 = ~17% 할인)
  // =====================================================
  {
    id: "plus-yearly",
    productId: process.env.POLAR_PRODUCT_PLUS_YEARLY || "",
    name: "Plus",
    price: 99000, // 9,900 × 10개월
    priceUSD: 7000, // $7 × 10개월 = $70
    priceFormatted: "₩99,000",
    priceFormattedUSD: "$70",
    interval: "year",
    monthlyCredits: 100,
    storage: "100GB",
    concurrentGenerations: 3,
    watermarkRemoved: true,
    priority: "priority",
    historyDays: 30,
    features: [
      "월 100 크레딧 (30일 한정)",
      "100GB 저장공간",
      "3개 동시 생성",
      "워터마크 제거",
      "우선 처리",
      "30일 히스토리",
    ],
    featureKeys: [
      { key: "monthlyCredits", params: { count: 100 } },
      { key: "storage", params: { size: "100GB" } },
      { key: "concurrentGenerations", params: { count: 3 } },
      { key: "watermarkRemoved" },
      { key: "priorityProcessing" },
      { key: "historyDays", params: { days: 30 } },
    ] as FeatureKey[],
    popular: true,
  },

  // =====================================================
  // Pro Plan - Monthly
  // =====================================================
  {
    id: "pro",
    productId: process.env.POLAR_PRODUCT_PRO_MONTHLY || "",
    name: "Pro",
    price: 29900,
    priceUSD: 2100, // $21
    priceFormatted: "₩29,900",
    priceFormattedUSD: "$21",
    interval: "month",
    monthlyCredits: 300, // 15회 생성 (60장)
    storage: "500GB",
    concurrentGenerations: 5,
    watermarkRemoved: true,
    priority: "priority",
    historyDays: 90,
    apiAccess: true,
    features: [
      "월 300 크레딧 (30일 한정)",
      "500GB 저장공간",
      "5개 동시 생성",
      "워터마크 제거",
      "우선 처리",
      "90일 히스토리",
    ],
    featureKeys: [
      { key: "monthlyCredits", params: { count: 300 } },
      { key: "storage", params: { size: "500GB" } },
      { key: "concurrentGenerations", params: { count: 5 } },
      { key: "watermarkRemoved" },
      { key: "priorityProcessing" },
      { key: "historyDays", params: { days: 90 } },
    ] as FeatureKey[],
  },

  // =====================================================
  // Pro Plan - Yearly (2개월 무료 = ~17% 할인)
  // =====================================================
  {
    id: "pro-yearly",
    productId: process.env.POLAR_PRODUCT_PRO_YEARLY || "",
    name: "Pro",
    price: 299000, // 29,900 × 10개월
    priceUSD: 21000, // $21 × 10개월 = $210
    priceFormatted: "₩299,000",
    priceFormattedUSD: "$210",
    interval: "year",
    monthlyCredits: 300,
    storage: "500GB",
    concurrentGenerations: 5,
    watermarkRemoved: true,
    priority: "priority",
    historyDays: 90,
    apiAccess: true,
    features: [
      "월 300 크레딧 (30일 한정)",
      "500GB 저장공간",
      "5개 동시 생성",
      "워터마크 제거",
      "우선 처리",
      "90일 히스토리",
    ],
    featureKeys: [
      { key: "monthlyCredits", params: { count: 300 } },
      { key: "storage", params: { size: "500GB" } },
      { key: "concurrentGenerations", params: { count: 5 } },
      { key: "watermarkRemoved" },
      { key: "priorityProcessing" },
      { key: "historyDays", params: { days: 90 } },
    ] as FeatureKey[],
  },

  // =====================================================
  // Business Plan - Monthly
  // =====================================================
  {
    id: "business",
    productId: process.env.POLAR_PRODUCT_BUSINESS_MONTHLY || "",
    name: "Business",
    price: 99000,
    priceUSD: 7100, // $71
    priceFormatted: "₩99,000",
    priceFormattedUSD: "$71",
    interval: "month",
    monthlyCredits: 1000, // 50회 생성 (200장)
    storage: "1TB",
    concurrentGenerations: 10,
    watermarkRemoved: true,
    priority: "highest",
    historyDays: "unlimited",
    apiAccess: true,
    teamMembers: 5,
    features: [
      "월 1,000 크레딧 (30일 한정)",
      "1TB 저장공간",
      "10개 동시 생성",
      "워터마크 제거",
      "최우선 처리",
      "무제한 히스토리",
      "팀 협업 (5명) - 추후 예정",
    ],
    featureKeys: [
      { key: "monthlyCredits", params: { count: 1000 } },
      { key: "storage", params: { size: "1TB" } },
      { key: "concurrentGenerations", params: { count: 10 } },
      { key: "watermarkRemoved" },
      { key: "highestPriorityProcessing" },
      { key: "historyUnlimited" },
      { key: "teamMembers", params: { count: 5 } },
    ] as FeatureKey[],
  },

  // =====================================================
  // Business Plan - Yearly (2개월 무료 = ~17% 할인)
  // =====================================================
  {
    id: "business-yearly",
    productId: process.env.POLAR_PRODUCT_BUSINESS_YEARLY || "",
    name: "Business",
    price: 990000, // 99,000 × 10개월
    priceUSD: 71000, // $71 × 10개월 = $710
    priceFormatted: "₩990,000",
    priceFormattedUSD: "$710",
    interval: "year",
    monthlyCredits: 1000,
    storage: "1TB",
    concurrentGenerations: 10,
    watermarkRemoved: true,
    priority: "highest",
    historyDays: "unlimited",
    apiAccess: true,
    teamMembers: 5,
    features: [
      "월 1,000 크레딧 (30일 한정)",
      "1TB 저장공간",
      "10개 동시 생성",
      "워터마크 제거",
      "최우선 처리",
      "무제한 히스토리",
      "팀 협업 (5명) - 추후 예정",
    ],
    featureKeys: [
      { key: "monthlyCredits", params: { count: 1000 } },
      { key: "storage", params: { size: "1TB" } },
      { key: "concurrentGenerations", params: { count: 10 } },
      { key: "watermarkRemoved" },
      { key: "highestPriorityProcessing" },
      { key: "historyUnlimited" },
      { key: "teamMembers", params: { count: 5 } },
    ] as FeatureKey[],
  },
];

// =====================================================
// Credit Cost Configuration
// =====================================================

export const CREDIT_COSTS = {
  // 2K 이미지 생성 1회(4장): 20 크레딧
  imageGeneration: {
    perGeneration: 20, // 1회 생성 (4장)
    perImage: 5, // 이미지 1장당
  },
  // 4K 업스케일링 1회(1장): 10 크레딧
  imageProcessing: {
    upscale4K: 10, // 2K → 4K 업스케일링 1장
    backgroundRemoval: 5,
    colorTransfer: 5,
  },
} as const;

// =====================================================
// Credit Validity Configuration
// =====================================================

export const CREDIT_VALIDITY = {
  // 구독 크레딧: 30일 한정 (매월 리셋)
  subscription: {
    validityDays: 30,
    rollover: false, // 이월 불가
  },
  // 구매 크레딧: 영구 보존
  purchased: {
    validityDays: null, // 무제한
    rollover: true, // 해당 없음 (영구)
  },
} as const;

// =====================================================
// Helper Functions
// =====================================================

export function getPackageByProductId(
  productId: string
): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((pkg) => pkg.productId === productId);
}

export function getPlanByProductId(
  productId: string
): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.productId === productId);
}

export function getCreditsForPackage(productId: string): number {
  const pkg = getPackageByProductId(productId);
  if (pkg) {
    const bonusCredits = pkg.bonus
      ? Math.floor(pkg.credits * (pkg.bonus / 100))
      : 0;
    return pkg.credits + bonusCredits;
  }
  return 0;
}

// Legacy support - map variantId to productId
export function getPackageByVariantId(variantId: string): CreditPackage | undefined {
  return getPackageByProductId(variantId);
}

export function getPlanByVariantId(variantId: string): SubscriptionPlan | undefined {
  return getPlanByProductId(variantId);
}

// =====================================================
// Billing Interval Helper Functions
// =====================================================

/**
 * 특정 결제 주기에 해당하는 플랜 목록을 반환합니다.
 * Free 플랜은 항상 포함됩니다.
 */
export function getPlansByInterval(interval: "month" | "year"): SubscriptionPlan[] {
  return SUBSCRIPTION_PLANS.filter(
    (plan) => plan.interval === interval || plan.id === "free"
  );
}

/**
 * 월간 플랜 목록을 반환합니다.
 */
export function getMonthlyPlans(): SubscriptionPlan[] {
  return getPlansByInterval("month");
}

/**
 * 연간 플랜 목록을 반환합니다.
 */
export function getYearlyPlans(): SubscriptionPlan[] {
  return getPlansByInterval("year");
}

/**
 * 연간 플랜의 월별 환산 가격을 계산합니다.
 */
export function getYearlyPlanMonthlyPrice(plan: SubscriptionPlan): {
  monthly: number;
  monthlyUSD: number;
  monthlyFormatted: string;
  monthlyFormattedUSD: string;
} {
  if (plan.interval !== "year") {
    return {
      monthly: plan.price,
      monthlyUSD: plan.priceUSD,
      monthlyFormatted: plan.priceFormatted,
      monthlyFormattedUSD: plan.priceFormattedUSD,
    };
  }

  const monthly = Math.round(plan.price / 12);
  const monthlyUSD = Math.round(plan.priceUSD / 12);

  return {
    monthly,
    monthlyUSD,
    monthlyFormatted: `₩${monthly.toLocaleString()}`,
    monthlyFormattedUSD: `$${(monthlyUSD / 100).toFixed(0)}`,
  };
}
