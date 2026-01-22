/**
 * Subscription Management Service
 * Contract: PAYMENT_FUNC_SUBSCRIPTION
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 */

import { prisma } from "@/lib/db";
import { LEMONSQUEEZY_CONFIG, SUBSCRIPTION_PLANS } from "./config";
import type { SubscriptionInfo, SubscriptionPlan } from "./types";

// =====================================================
// LemonSqueezy API Client
// =====================================================

interface LemonSqueezySubscription {
  data: {
    id: string;
    attributes: {
      status: string;
      variant_id: number;
      product_name: string;
      variant_name: string;
      renews_at: string | null;
      ends_at: string | null;
      urls: {
        update_payment_method: string;
        customer_portal: string;
      };
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
      status: { in: ["active", "on_trial", "past_due", "paused"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    return null;
  }

  return {
    id: subscription.id,
    planName: subscription.planName,
    status: subscription.status,
    renewsAt: subscription.renewsAt,
    endsAt: subscription.endsAt,
    isPaused: subscription.isPaused,
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

  // Find matching plan by name
  const plan = SUBSCRIPTION_PLANS.find(
    (p) => p.name === subscription.planName || p.id === subscription.planName?.toLowerCase()
  );

  return plan || SUBSCRIPTION_PLANS.find((p) => p.id === "free")!;
}

/**
 * Pause a subscription
 */
export async function pauseSubscription(subscriptionId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  // Call LemonSqueezy API to pause
  await lemonSqueezyFetch(`/subscriptions/${subscription.lemonSqueezyId}`, {
    method: "PATCH",
    body: JSON.stringify({
      data: {
        type: "subscriptions",
        id: subscription.lemonSqueezyId,
        attributes: {
          pause: {
            mode: "void", // Don't bill during pause
          },
        },
      },
    }),
  });

  // Update local record
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { isPaused: true },
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

  // Call LemonSqueezy API to unpause
  await lemonSqueezyFetch(`/subscriptions/${subscription.lemonSqueezyId}`, {
    method: "PATCH",
    body: JSON.stringify({
      data: {
        type: "subscriptions",
        id: subscription.lemonSqueezyId,
        attributes: {
          pause: null,
        },
      },
    }),
  });

  // Update local record
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { isPaused: false },
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

  // Call LemonSqueezy API to cancel
  await lemonSqueezyFetch(`/subscriptions/${subscription.lemonSqueezyId}`, {
    method: "DELETE",
  });

  // Update local record
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: "cancelled",
      endsAt: new Date(),
    },
  });
}

/**
 * Change subscription plan (upgrade/downgrade)
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
  if (!newPlan || !newPlan.variantId) {
    throw new Error("Invalid plan");
  }

  // Call LemonSqueezy API to change plan
  await lemonSqueezyFetch(`/subscriptions/${subscription.lemonSqueezyId}`, {
    method: "PATCH",
    body: JSON.stringify({
      data: {
        type: "subscriptions",
        id: subscription.lemonSqueezyId,
        attributes: {
          variant_id: parseInt(newPlan.variantId, 10),
          // Prorate by default
          invoice_immediately: true,
        },
      },
    }),
  });

  // Update local record
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      variantId: newPlan.variantId,
      planName: newPlan.name,
    },
  });
}

/**
 * Get customer portal URL for managing billing
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

  const response = await lemonSqueezyFetch<LemonSqueezySubscription>(
    `/subscriptions/${subscription.lemonSqueezyId}`
  );

  return response.data.attributes.urls.customer_portal;
}

/**
 * Get payment method update URL
 */
export async function getUpdatePaymentMethodUrl(
  subscriptionId: string
): Promise<string> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  const response = await lemonSqueezyFetch<LemonSqueezySubscription>(
    `/subscriptions/${subscription.lemonSqueezyId}`
  );

  return response.data.attributes.urls.update_payment_method;
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["active", "on_trial"] },
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
    planName: sub.planName,
    status: sub.status,
    renewsAt: sub.renewsAt,
    endsAt: sub.endsAt,
    isPaused: sub.isPaused,
  }));
}
