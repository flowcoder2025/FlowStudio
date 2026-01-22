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
    price: 9900, // $9.90 or ₩9,900
    priceFormatted: "₩9,900",
    bonus: 0,
  },
  {
    id: "basic",
    variantId: process.env.LEMONSQUEEZY_VARIANT_BASIC || "basic",
    name: "베이직",
    credits: 300,
    price: 24900, // $24.90 or ₩24,900
    priceFormatted: "₩24,900",
    bonus: 10,
    popular: true,
  },
  {
    id: "pro",
    variantId: process.env.LEMONSQUEEZY_VARIANT_PRO || "pro",
    name: "프로",
    credits: 700,
    price: 49900, // $49.90 or ₩49,900
    priceFormatted: "₩49,900",
    bonus: 17,
  },
  {
    id: "business",
    variantId: process.env.LEMONSQUEEZY_VARIANT_BUSINESS || "business",
    name: "비즈니스",
    credits: 1500,
    price: 99000, // $99 or ₩99,000
    priceFormatted: "₩99,000",
    bonus: 25,
  },
];

// =====================================================
// Subscription Plans
// =====================================================

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    variantId: "",
    name: "무료",
    monthlyCredits: 10,
    price: 0,
    priceFormatted: "무료",
    interval: "month",
    features: [
      "월 10 크레딧",
      "기본 이미지 생성",
      "워크플로우 3개",
      "커뮤니티 지원",
    ],
  },
  {
    id: "starter",
    variantId: process.env.LEMONSQUEEZY_VARIANT_SUB_STARTER || "sub_starter",
    name: "스타터",
    monthlyCredits: 100,
    price: 9900,
    priceFormatted: "₩9,900/월",
    interval: "month",
    features: [
      "월 100 크레딧",
      "고품질 이미지 생성",
      "무제한 워크플로우",
      "이메일 지원",
      "미사용 크레딧 이월",
    ],
  },
  {
    id: "pro",
    variantId: process.env.LEMONSQUEEZY_VARIANT_SUB_PRO || "sub_pro",
    name: "프로",
    monthlyCredits: 500,
    price: 39900,
    priceFormatted: "₩39,900/월",
    interval: "month",
    features: [
      "월 500 크레딧",
      "최고 품질 이미지",
      "무제한 워크플로우",
      "우선 지원",
      "미사용 크레딧 이월",
      "팀 공유 기능",
    ],
    popular: true,
  },
  {
    id: "business",
    variantId: process.env.LEMONSQUEEZY_VARIANT_SUB_BUSINESS || "sub_business",
    name: "비즈니스",
    monthlyCredits: 2000,
    price: 99000,
    priceFormatted: "₩99,000/월",
    interval: "month",
    features: [
      "월 2,000 크레딧",
      "최고 품질 이미지",
      "무제한 워크플로우",
      "전담 지원",
      "미사용 크레딧 이월",
      "팀 공유 기능",
      "API 액세스",
      "커스텀 워크플로우",
    ],
  },
];

// =====================================================
// Credit Cost Configuration
// =====================================================

export const CREDIT_COSTS = {
  imageGeneration: {
    standard: 1,
    hd: 2,
    ultra: 5,
  },
  imageProcessing: {
    backgroundRemoval: 1,
    upscale: 2,
    colorTransfer: 1,
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
