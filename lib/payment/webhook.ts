/**
 * LemonSqueezy Webhook Handler
 * Contract: PAYMENT_FUNC_WEBHOOK
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
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
  LEMONSQUEEZY_CONFIG,
  getCreditsForPackage,
  getPlanByVariantId,
} from "./config";
import type {
  WebhookPayload,
  WebhookEventName,
  OrderAttributes,
  SubscriptionAttributes,
} from "./types";

// =====================================================
// Webhook Signature Verification
// =====================================================

/**
 * Verify webhook signature from LemonSqueezy
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  if (!signature || !LEMONSQUEEZY_CONFIG.webhookSecret) {
    return false;
  }

  const hmac = crypto.createHmac("sha256", LEMONSQUEEZY_CONFIG.webhookSecret);
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

  const eventName = payload.meta?.event_name;
  if (!eventName) {
    return { success: false, message: "Missing event name" };
  }

  // Process event directly (no WebhookEvent model)
  try {
    await processWebhookEvent(eventName, payload);

    return {
      success: true,
      message: `Event ${eventName} processed successfully`,
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
  eventName: WebhookEventName,
  payload: WebhookPayload
): Promise<void> {
  const userId = payload.meta.custom_data?.user_id;

  switch (eventName) {
    case "order_created":
      await handleOrderCreated(payload, userId);
      break;

    case "order_refunded":
      await handleOrderRefunded(payload);
      break;

    case "subscription_created":
      await handleSubscriptionCreated(payload, userId);
      break;

    case "subscription_updated":
    case "subscription_resumed":
    case "subscription_paused":
    case "subscription_unpaused":
      await handleSubscriptionUpdated(payload);
      break;

    case "subscription_cancelled":
    case "subscription_expired":
      await handleSubscriptionEnded(payload);
      break;

    case "subscription_payment_success":
      await handleSubscriptionPaymentSuccess(payload);
      break;

    case "subscription_payment_failed":
    case "subscription_payment_recovered":
      await handleSubscriptionPaymentStatus(payload, eventName);
      break;

    default:
      console.log(`Unhandled webhook event: ${eventName}`);
  }
}

// =====================================================
// Order Event Handlers
// =====================================================

async function handleOrderCreated(
  payload: WebhookPayload,
  userId?: string
): Promise<void> {
  const attributes = payload.data.attributes as unknown as OrderAttributes;
  const orderId = payload.data.id;

  if (!userId) {
    console.error("Order created without user_id in custom_data");
    return;
  }

  // Check if this is a one-time purchase (not subscription)
  const variantId = attributes.first_order_item?.variant_id?.toString();
  const credits = variantId ? getCreditsForPackage(variantId) : 0;

  // Record purchase via CreditTransaction (no Payment model)
  await prisma.creditTransaction.create({
    data: {
      userId,
      amount: credits,
      type: "purchase",
      description: `Purchase: ${attributes.first_order_item?.product_name ?? orderId}`,
      paymentId: orderId,
      paymentProvider: "lemonsqueezy",
    },
  });

  // Grant credits if payment is successful
  // 구매 크레딧은 영구 보존 (expiresInDays: null)
  if (attributes.status === "paid" && credits > 0) {
    await grantCredits(userId, credits, `Purchase: ${orderId}`, {
      expiresInDays: null,
      type: "purchase",
    });
  }
}

async function handleOrderRefunded(
  payload: WebhookPayload
): Promise<void> {
  const orderId = payload.data.id;

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

async function handleSubscriptionCreated(
  payload: WebhookPayload,
  userId?: string
): Promise<void> {
  const attributes = payload.data.attributes as unknown as SubscriptionAttributes;
  const subscriptionId = payload.data.id;

  if (!userId) {
    console.error("Subscription created without user_id in custom_data");
    return;
  }

  // Get plan info
  const variantId = attributes.variant_id?.toString();
  const plan = variantId ? getPlanByVariantId(variantId) : null;

  // Create subscription record with available fields
  await prisma.subscription.create({
    data: {
      userId,
      externalId: subscriptionId,
      tier: plan?.id?.toUpperCase() || "PRO",
      status: attributes.status,
      startDate: new Date(),
      endDate: attributes.ends_at ? new Date(attributes.ends_at) : null,
      paymentProvider: "lemonsqueezy",
    },
  });

  // Grant initial credits for subscription (if plan has monthly credits)
  // 구독 크레딧은 30일 한정
  if (plan && attributes.status === "active" && plan.monthlyCredits) {
    await grantCredits(
      userId,
      plan.monthlyCredits,
      `Subscription: ${plan.name}`,
      { expiresInDays: 30, type: "subscription" }
    );
  }
}

async function handleSubscriptionUpdated(
  payload: WebhookPayload
): Promise<void> {
  const attributes = payload.data.attributes as unknown as SubscriptionAttributes;
  const subscriptionId = payload.data.id;

  await prisma.subscription.updateMany({
    where: { externalId: subscriptionId },
    data: {
      status: attributes.status,
      endDate: attributes.ends_at ? new Date(attributes.ends_at) : null,
    },
  });
}

async function handleSubscriptionEnded(payload: WebhookPayload): Promise<void> {
  const attributes = payload.data.attributes as unknown as SubscriptionAttributes;
  const subscriptionId = payload.data.id;

  await prisma.subscription.updateMany({
    where: { externalId: subscriptionId },
    data: {
      status: attributes.status,
      endDate: new Date(),
      cancelledAt: new Date(),
    },
  });
}

async function handleSubscriptionPaymentSuccess(
  payload: WebhookPayload
): Promise<void> {
  const attributes = payload.data.attributes as unknown as SubscriptionAttributes;
  const subscriptionId = payload.data.id;

  const subscription = await prisma.subscription.findFirst({
    where: { externalId: subscriptionId },
  });

  if (subscription) {
    // Get plan info from tier
    const plan = getPlanByVariantId(subscription.tier.toLowerCase());

    // Grant monthly credits (if plan has monthly credits)
    // 구독 크레딧은 30일 한정
    if (plan && plan.monthlyCredits) {
      await grantCredits(
        subscription.userId,
        plan.monthlyCredits,
        `Subscription renewal: ${plan.name}`,
        { expiresInDays: 30, type: "subscription" }
      );
    }

    // Update subscription
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: attributes.status,
        endDate: attributes.ends_at ? new Date(attributes.ends_at) : null,
      },
    });
  }
}

async function handleSubscriptionPaymentStatus(
  payload: WebhookPayload,
  eventName: WebhookEventName
): Promise<void> {
  const attributes = payload.data.attributes as unknown as SubscriptionAttributes;
  const subscriptionId = payload.data.id;

  await prisma.subscription.updateMany({
    where: { externalId: subscriptionId },
    data: {
      status: attributes.status,
    },
  });

  // If payment recovered, grant credits
  if (eventName === "subscription_payment_recovered") {
    const subscription = await prisma.subscription.findFirst({
      where: { externalId: subscriptionId },
    });

    if (subscription) {
      const plan = getPlanByVariantId(subscription.tier.toLowerCase());
      // 구독 크레딧은 30일 한정
      if (plan && plan.monthlyCredits) {
        await grantCredits(
          subscription.userId,
          plan.monthlyCredits,
          `Payment recovered: ${plan.name}`,
          { expiresInDays: 30, type: "subscription" }
        );
      }
    }
  }
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
