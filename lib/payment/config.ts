/**
 * Payment Configuration
 * Contract: PAYMENT_FUNC_CHECKOUT
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 */

import type { CreditPackage, SubscriptionPlan } from "./types";

// =====================================================
// LemonSqueezy Configuration
// =====================================================

export const LEMONSQUEEZY_CONFIG = {
  apiKey: process.env.LEMONSQUEEZY_API_KEY || "",
  storeId: process.env.LEMONSQUEEZY_STORE_ID || "",
  webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "",
  apiUrl: "https://api.lemonsqueezy.com/v1",
} as const;

// =====================================================
// Credit Packages
// =====================================================

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "starter",
    variantId: process.env.LEMONSQUEEZY_VARIANT_STARTER || "starter",
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
    variantId: process.env.LEMONSQUEEZY_VARIANT_BASIC || "basic",
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
    variantId: process.env.LEMONSQUEEZY_VARIANT_PRO || "pro",
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
    variantId: process.env.LEMONSQUEEZY_VARIANT_BUSINESS || "business",
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
  {
    id: "free",
    variantId: "",
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
  {
    id: "plus",
    variantId: process.env.LEMONSQUEEZY_VARIANT_SUB_PLUS || "sub_plus",
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
  {
    id: "pro",
    variantId: process.env.LEMONSQUEEZY_VARIANT_SUB_PRO || "sub_pro",
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
      "API 접근",
    ],
    featureKeys: [
      { key: "monthlyCredits", params: { count: 300 } },
      { key: "storage", params: { size: "500GB" } },
      { key: "concurrentGenerations", params: { count: 5 } },
      { key: "watermarkRemoved" },
      { key: "priorityProcessing" },
      { key: "historyDays", params: { days: 90 } },
      { key: "apiAccess" },
    ] as FeatureKey[],
  },
  {
    id: "business",
    variantId: process.env.LEMONSQUEEZY_VARIANT_SUB_BUSINESS || "sub_business",
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
      "API 접근",
      "팀 협업 (5명)",
    ],
    featureKeys: [
      { key: "monthlyCredits", params: { count: 1000 } },
      { key: "storage", params: { size: "1TB" } },
      { key: "concurrentGenerations", params: { count: 10 } },
      { key: "watermarkRemoved" },
      { key: "highestPriorityProcessing" },
      { key: "historyUnlimited" },
      { key: "apiAccess" },
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

export function getPackageByVariantId(
  variantId: string
): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((pkg) => pkg.variantId === variantId);
}

export function getPlanByVariantId(
  variantId: string
): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.variantId === variantId);
}

export function getCreditsForPackage(variantId: string): number {
  const pkg = getPackageByVariantId(variantId);
  if (pkg) {
    const bonusCredits = pkg.bonus
      ? Math.floor(pkg.credits * (pkg.bonus / 100))
      : 0;
    return pkg.credits + bonusCredits;
  }
  return 0;
}
