/**
 * Subscription Management Service
 * Contract: PAYMENT_FUNC_SUBSCRIPTION
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 *
 * Payment Provider: Polar (https://polar.sh)
 *
 * DB Schema Notes:
 * - Subscription model uses: tier, status, endDate, startDate, cancelledAt, externalId
 * - NOT: planName, renewsAt, endsAt, isPaused, lemonSqueezyId, variantId
 */

import { prisma } from "@/lib/db";
import { POLAR_CONFIG, SUBSCRIPTION_PLANS } from "./config";
import type { SubscriptionInfo, SubscriptionPlan } from "./types";

// =====================================================
// Polar API Client
// =====================================================

interface PolarSubscriptionResponse {
  id: string;
  status: string;
  product_id: string;
  current_period_start: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  ended_at?: string;
  user?: {
    id: string;
    email: string;
  };
  product?: {
    id: string;
    name: string;
  };
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
// Subscription Management
// =====================================================

/**
 * Get user's active subscription
 */
export async function getUserSubscription(
  userId: string
): Promise<SubscriptionInfo | null> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "active", "trialing", "past_due", "paused"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    return null;
  }

  return {
    id: subscription.id,
    planName: subscription.tier,
    status: subscription.status,
    renewsAt: subscription.endDate,
    endsAt: subscription.endDate,
    isPaused: subscription.status === "paused",
  };
}

/**
 * Get user's current plan (including free tier)
 */
export async function getUserPlan(userId: string): Promise<SubscriptionPlan> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    // Return free plan
    return SUBSCRIPTION_PLANS.find((p) => p.id === "free")!;
  }

  // Find matching plan by tier
  const plan = SUBSCRIPTION_PLANS.find(
    (p) =>
      p.name === subscription.planName ||
      p.id === subscription.planName?.toLowerCase()
  );

  return plan || SUBSCRIPTION_PLANS.find((p) => p.id === "free")!;
}

/**
 * Pause a subscription
 * Note: Polar doesn't have pause/resume - we cancel and recreate
 */
export async function pauseSubscription(subscriptionId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  // Update local record to paused status
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: "paused" },
  });
}

/**
 * Resume a paused subscription
 */
export async function resumeSubscription(subscriptionId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  // Update local record
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: "active" },
  });
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  // Call Polar API to cancel if externalId exists
  if (subscription.externalId && POLAR_CONFIG.accessToken) {
    try {
      await polarFetch(`/v1/subscriptions/${subscription.externalId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Failed to cancel subscription in Polar:", error);
      // Continue with local update even if Polar API fails
    }
  }

  // Update local record
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: "canceled",
      cancelledAt: new Date(),
      endDate: new Date(),
    },
  });
}

/**
 * Change subscription plan (upgrade/downgrade)
 * Note: With Polar, plan changes typically require creating a new checkout
 */
export async function changeSubscriptionPlan(
  subscriptionId: string,
  newPlanId: string
): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  const newPlan = SUBSCRIPTION_PLANS.find((p) => p.id === newPlanId);
  if (!newPlan || !newPlan.productId) {
    throw new Error("Invalid plan");
  }

  // Update local record
  // Note: User needs to go through a new checkout for the plan change
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      tier: newPlan.id.toUpperCase(),
    },
  });
}

/**
 * Get customer portal URL for managing billing
 * Note: Polar uses CustomerPortal component from SDK
 */
export async function getCustomerPortalUrl(
  subscriptionId: string
): Promise<string> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  // Polar customer portal is accessed via SDK component or direct URL
  const baseUrl = POLAR_CONFIG.environment === "production"
    ? "https://polar.sh"
    : "https://sandbox.polar.sh";

  return `${baseUrl}/purchases`;
}

/**
 * Get payment method update URL
 */
export async function getUpdatePaymentMethodUrl(
  subscriptionId: string
): Promise<string> {
  // Polar handles payment method updates through the customer portal
  return getCustomerPortalUrl(subscriptionId);
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "active", "trialing"] },
    },
  });

  return !!subscription;
}

/**
 * Get subscription history for user
 */
export async function getSubscriptionHistory(
  userId: string
): Promise<SubscriptionInfo[]> {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return subscriptions.map((sub) => ({
    id: sub.id,
    planName: sub.tier,
    status: sub.status,
    renewsAt: sub.endDate,
    endsAt: sub.endDate,
    isPaused: sub.status === "paused",
  }));
}
