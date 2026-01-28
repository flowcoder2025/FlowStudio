/**
 * LemonSqueezy Checkout Service
 * Contract: PAYMENT_FUNC_CHECKOUT
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 */

import { LEMONSQUEEZY_CONFIG, CREDIT_PACKAGES, SUBSCRIPTION_PLANS } from "./config";
import type { CheckoutOptions, CheckoutResult, CreditPackage, SubscriptionPlan } from "./types";

// =====================================================
// LemonSqueezy API Client
// =====================================================

interface LemonSqueezyCheckoutResponse {
  data: {
    id: string;
    attributes: {
      url: string;
      expires_at: string | null;
    };
  };
}

async function lemonSqueezyFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${LEMONSQUEEZY_CONFIG.apiUrl}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${LEMONSQUEEZY_CONFIG.apiKey}`,
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LemonSqueezy API error: ${response.status} - ${error}`);
  }

  return response.json() as Promise<T>;
}

// =====================================================
// Checkout Creation
// =====================================================

/**
 * Create a checkout session for a credit package or subscription
 */
export async function createCheckout(
  options: CheckoutOptions
): Promise<CheckoutResult> {
  const { variantId, userId, email, name, customData, redirectUrl } = options;

  if (!LEMONSQUEEZY_CONFIG.apiKey) {
    throw new Error("LemonSqueezy API key not configured");
  }

  if (!LEMONSQUEEZY_CONFIG.storeId) {
    throw new Error("LemonSqueezy store ID not configured");
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const checkoutData = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email: email || undefined,
          name: name || undefined,
          custom: {
            user_id: userId,
            ...customData,
          },
        },
        checkout_options: {
          embed: false,
          media: true,
          logo: true,
          desc: true,
          discount: true,
        },
        product_options: {
          redirect_url: redirectUrl || `${baseUrl}/payment/success`,
          receipt_button_text: "대시보드로 이동",
          receipt_link_url: `${baseUrl}/dashboard`,
          receipt_thank_you_note: "구매해 주셔서 감사합니다! 크레딧이 계정에 추가되었습니다.",
        },
      },
      relationships: {
        store: {
          data: {
            type: "stores",
            id: LEMONSQUEEZY_CONFIG.storeId,
          },
        },
        variant: {
          data: {
            type: "variants",
            id: variantId,
          },
        },
      },
    },
  };

  const response = await lemonSqueezyFetch<LemonSqueezyCheckoutResponse>(
    "/checkouts",
    {
      method: "POST",
      body: JSON.stringify(checkoutData),
    }
  );

  return {
    checkoutUrl: response.data.attributes.url,
    expiresAt: response.data.attributes.expires_at || undefined,
  };
}

/**
 * Create checkout for a specific credit package
 */
export async function createCreditPackageCheckout(
  packageId: string,
  userId: string,
  email?: string
): Promise<CheckoutResult> {
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) {
    throw new Error(`Credit package not found: ${packageId}`);
  }

  return createCheckout({
    variantId: pkg.variantId,
    userId,
    email,
    customData: {
      package_id: packageId,
      credits: pkg.credits,
      type: "credit_package",
    },
  });
}

/**
 * Create checkout for a subscription plan
 */
export async function createSubscriptionCheckout(
  planId: string,
  userId: string,
  email?: string
): Promise<CheckoutResult> {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  if (!plan) {
    throw new Error(`Subscription plan not found: ${planId}`);
  }

  if (!plan.variantId) {
    throw new Error(`Free plan does not require checkout`);
  }

  return createCheckout({
    variantId: plan.variantId,
    userId,
    email,
    customData: {
      plan_id: planId,
      monthly_credits: plan.monthlyCredits ?? 0,
      type: "subscription",
    },
  });
}

// =====================================================
// Package & Plan Queries
// =====================================================

/**
 * Get all available credit packages
 */
export function getCreditPackages(): CreditPackage[] {
  return CREDIT_PACKAGES;
}

/**
 * Get all available subscription plans
 */
export function getSubscriptionPlans(): SubscriptionPlan[] {
  return SUBSCRIPTION_PLANS;
}

/**
 * Get credit package by ID
 */
export function getCreditPackageById(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((pkg) => pkg.id === id);
}

/**
 * Get subscription plan by ID
 */
export function getSubscriptionPlanById(id: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === id);
}
