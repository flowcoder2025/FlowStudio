/**
 * Polar Checkout Service
 * Contract: PAYMENT_FUNC_CHECKOUT
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 *
 * Payment Provider: Polar (https://polar.sh)
 */

import { POLAR_CONFIG, CREDIT_PACKAGES, SUBSCRIPTION_PLANS } from "./config";
import type { CheckoutOptions, CheckoutResult, CreditPackage, SubscriptionPlan } from "./types";

// =====================================================
// Polar API Client
// =====================================================

interface PolarCheckoutResponse {
  id: string;
  url: string;
  status: string;
  expires_at?: string;
}

async function polarFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = POLAR_CONFIG.environment === "production"
    ? "https://api.polar.sh"
    : "https://sandbox-api.polar.sh";

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${POLAR_CONFIG.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Polar API error: ${response.status} - ${error}`);
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
  const { productId, userId, email, metadata, successUrl } = options;

  if (!POLAR_CONFIG.accessToken) {
    throw new Error("Polar access token not configured");
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const finalSuccessUrl = successUrl || POLAR_CONFIG.successUrl || `${baseUrl}/payment/success?checkout_id={CHECKOUT_ID}`;

  const checkoutData = {
    product_id: productId,
    success_url: finalSuccessUrl,
    customer_email: email || undefined,
    metadata: {
      user_id: userId,
      ...metadata,
    },
  };

  const response = await polarFetch<PolarCheckoutResponse>(
    "/v1/checkouts/custom",
    {
      method: "POST",
      body: JSON.stringify(checkoutData),
    }
  );

  return {
    checkoutUrl: response.url,
    checkoutId: response.id,
    expiresAt: response.expires_at,
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

  if (!pkg.productId) {
    throw new Error(`Credit package ${packageId} does not have a Polar product ID configured`);
  }

  return createCheckout({
    productId: pkg.productId,
    userId,
    email,
    metadata: {
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

  if (!plan.productId) {
    throw new Error(`Free plan does not require checkout`);
  }

  return createCheckout({
    productId: plan.productId,
    userId,
    email,
    metadata: {
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
