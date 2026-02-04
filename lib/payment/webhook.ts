/**
 * Polar Webhook Handler
 * Contract: PAYMENT_FUNC_WEBHOOK
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 *
 * Payment Provider: Polar (https://polar.sh)
 *
 * DB Schema Notes:
 * - WebhookEvent model does NOT exist in schema
 * - Payment model does NOT exist in schema
 * - Subscription uses: tier, status, endDate, externalId (not lemonSqueezyId, variantId, etc.)
 * - Credit uses: balance only (not amount, source)
 * - CreditTransaction: no status field
 */

import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import {
  POLAR_CONFIG,
  getCreditsForPackage,
  getPlanByProductId,
  getPackageByProductId,
} from "./config";
import type {
  WebhookPayload,
  WebhookEventName,
  PolarOrder,
  PolarSubscription,
} from "./types";

// =====================================================
// Webhook Signature Verification
// =====================================================

/**
 * Verify webhook signature from Polar
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  if (!signature || !POLAR_CONFIG.webhookSecret) {
    // If no webhook secret configured, skip verification in development
    if (process.env.NODE_ENV === "development") {
      console.warn("Webhook signature verification skipped - no secret configured");
      return true;
    }
    return false;
  }

  const hmac = crypto.createHmac("sha256", POLAR_CONFIG.webhookSecret);
  const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  if (digest.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(digest, signatureBuffer);
}

// =====================================================
// Webhook Event Processing
// =====================================================

export interface WebhookResult {
  success: boolean;
  message: string;
  eventId?: string;
}

/**
 * Handle incoming webhook event
 * Note: WebhookEvent model not in schema, so we just process directly
 */
export async function handleWebhook(
  rawBody: string,
  signature: string | null
): Promise<WebhookResult> {
  // Verify signature
  if (!verifyWebhookSignature(rawBody, signature)) {
    return { success: false, message: "Invalid signature" };
  }

  // Parse payload
  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return { success: false, message: "Invalid JSON payload" };
  }

  const eventType = payload.type;
  if (!eventType) {
    return { success: false, message: "Missing event type" };
  }

  // Process event directly (no WebhookEvent model)
  try {
    await processWebhookEvent(eventType, payload);

    return {
      success: true,
      message: `Event ${eventType} processed successfully`,
    };
  } catch (error) {
    console.error("Webhook processing error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Processing failed",
    };
  }
}

/**
 * Process specific webhook event
 */
async function processWebhookEvent(
  eventType: WebhookEventName,
  payload: WebhookPayload
): Promise<void> {
  switch (eventType) {
    case "order.created":
      await handleOrderCreated(payload.data as unknown as PolarOrder);
      break;

    case "order.refunded":
      await handleOrderRefunded(payload.data as unknown as PolarOrder);
      break;

    case "subscription.created":
      await handleSubscriptionCreated(payload.data as unknown as PolarSubscription);
      break;

    case "subscription.updated":
    case "subscription.active":
      await handleSubscriptionUpdated(payload.data as unknown as PolarSubscription);
      break;

    case "subscription.canceled":
    case "subscription.revoked":
      await handleSubscriptionEnded(payload.data as unknown as PolarSubscription);
      break;

    case "checkout.created":
    case "checkout.updated":
      // Checkout events - log only
      console.log(`Checkout event: ${eventType}`, payload.data);
      break;

    default:
      console.log(`Unhandled webhook event: ${eventType}`);
  }
}

// =====================================================
// Order Event Handlers
// =====================================================

async function handleOrderCreated(order: PolarOrder): Promise<void> {
  const orderId = order.id;
  const userId = order.metadata?.user_id;
  const productId = order.product_id;

  if (!userId) {
    console.error("Order created without user_id in metadata");
    return;
  }

  // Check if this is a credit package purchase
  const pkg = getPackageByProductId(productId);
  const credits = pkg ? getCreditsForPackage(productId) : 0;

  // Record purchase via CreditTransaction (no Payment model)
  await prisma.creditTransaction.create({
    data: {
      userId,
      amount: credits,
      type: "purchase",
      description: `Purchase: ${order.product?.name ?? orderId}`,
      paymentId: orderId,
      paymentProvider: "polar",
    },
  });

  // Grant credits if this is a credit package purchase
  // 구매 크레딧은 영구 보존 (expiresInDays: null)
  if (credits > 0) {
    await grantCredits(userId, credits, `Purchase: ${orderId}`, {
      expiresInDays: null,
      type: "purchase",
    });
  }
}

async function handleOrderRefunded(order: PolarOrder): Promise<void> {
  const orderId = order.id;

  // Find the original purchase transaction
  const purchaseTx = await prisma.creditTransaction.findFirst({
    where: {
      paymentId: orderId,
      type: "purchase",
    },
  });

  if (purchaseTx) {
    // Revoke credits if any were granted
    if (purchaseTx.amount > 0) {
      await revokeCredits(
        purchaseTx.userId,
        purchaseTx.amount,
        `Refund: ${orderId}`
      );
    }
  }
}

// =====================================================
// Subscription Event Handlers
// =====================================================

async function handleSubscriptionCreated(subscription: PolarSubscription): Promise<void> {
  const subscriptionId = subscription.id;
  const userId = subscription.metadata?.user_id;
  const productId = subscription.product_id;

  if (!userId) {
    console.error("Subscription created without user_id in metadata");
    return;
  }

  // Get plan info
  const plan = getPlanByProductId(productId);

  // Create subscription record with available fields
  await prisma.subscription.create({
    data: {
      userId,
      externalId: subscriptionId,
      tier: plan?.id?.toUpperCase() || "PRO",
      status: subscription.status,
      startDate: new Date(),
      endDate: subscription.current_period_end
        ? new Date(subscription.current_period_end)
        : null,
      paymentProvider: "polar",
    },
  });

  // Grant initial credits for subscription (if plan has monthly credits)
  // 구독 크레딧은 30일 한정
  if (plan && subscription.status === "active" && plan.monthlyCredits) {
    await grantCredits(
      userId,
      plan.monthlyCredits,
      `Subscription: ${plan.name}`,
      { expiresInDays: 30, type: "subscription" }
    );
  }
}

async function handleSubscriptionUpdated(subscription: PolarSubscription): Promise<void> {
  const subscriptionId = subscription.id;

  // Find existing subscription
  const existingSub = await prisma.subscription.findFirst({
    where: { externalId: subscriptionId },
  });

  await prisma.subscription.updateMany({
    where: { externalId: subscriptionId },
    data: {
      status: subscription.status,
      endDate: subscription.current_period_end
        ? new Date(subscription.current_period_end)
        : null,
    },
  });

  // If subscription became active and has plan with monthly credits, grant credits
  if (existingSub && existingSub.status !== "active" && subscription.status === "active") {
    const plan = getPlanByProductId(subscription.product_id);
    if (plan && plan.monthlyCredits) {
      await grantCredits(
        existingSub.userId,
        plan.monthlyCredits,
        `Subscription renewal: ${plan.name}`,
        { expiresInDays: 30, type: "subscription" }
      );
    }
  }
}

async function handleSubscriptionEnded(subscription: PolarSubscription): Promise<void> {
  const subscriptionId = subscription.id;

  await prisma.subscription.updateMany({
    where: { externalId: subscriptionId },
    data: {
      status: subscription.status,
      endDate: new Date(),
      cancelledAt: new Date(),
    },
  });
}

// =====================================================
// Credit Management Helpers
// =====================================================

interface GrantCreditsOptions {
  expiresInDays?: number | null; // null = 영구 보존
  type?: string;
}

/**
 * Grant credits to user
 * @param userId - User ID
 * @param amount - Credit amount
 * @param description - Transaction description
 * @param options - Options including expiry (null = permanent, number = days)
 */
async function grantCredits(
  userId: string,
  amount: number,
  description: string,
  options: GrantCreditsOptions = {}
): Promise<void> {
  const { expiresInDays = null, type = "bonus" } = options;

  // Calculate expiry date (null = permanent/never expires)
  const expiresAt = expiresInDays !== null
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  await prisma.$transaction([
    // Update user balance
    prisma.user.update({
      where: { id: userId },
      data: {
        creditBalance: { increment: amount },
      },
    }),
    // Update Credit balance (if exists) or create
    prisma.credit.upsert({
      where: { userId },
      update: {
        balance: { increment: amount },
        updatedAt: new Date(),
      },
      create: {
        userId,
        balance: amount,
        updatedAt: new Date(),
      },
    }),
    // Create transaction record with expiry info
    prisma.creditTransaction.create({
      data: {
        userId,
        amount,
        type,
        description,
        expiresAt,
        remainingAmount: amount, // Track remaining for expirable credits
      },
    }),
  ]);
}

async function revokeCredits(
  userId: string,
  amount: number,
  description: string
): Promise<void> {
  await prisma.$transaction([
    // Update user balance
    prisma.user.update({
      where: { id: userId },
      data: {
        creditBalance: { decrement: amount },
      },
    }),
    // Update Credit balance
    prisma.credit.updateMany({
      where: { userId },
      data: {
        balance: { decrement: amount },
        updatedAt: new Date(),
      },
    }),
    // Create transaction record (no status field)
    prisma.creditTransaction.create({
      data: {
        userId,
        amount: -amount,
        type: "refund",
        description,
      },
    }),
  ]);
}
