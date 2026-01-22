/**
 * LemonSqueezy Webhook Handler
 * Contract: PAYMENT_FUNC_WEBHOOK
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 */

import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { LEMONSQUEEZY_CONFIG, getCreditsForPackage, getPlanByVariantId } from "./config";
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

  // Store webhook event
  const webhookEvent = await prisma.webhookEvent.create({
    data: {
      eventName,
      payload: payload as object,
      processed: false,
    },
  });

  // Process event
  try {
    await processWebhookEvent(eventName, payload);

    // Mark as processed
    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });

    return {
      success: true,
      message: `Event ${eventName} processed successfully`,
      eventId: webhookEvent.id,
    };
  } catch (error) {
    // Log error
    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return {
      success: false,
      message: error instanceof Error ? error.message : "Processing failed",
      eventId: webhookEvent.id,
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

  // Create payment record
  await prisma.payment.create({
    data: {
      userId,
      lemonSqueezyOrderId: orderId,
      lemonSqueezyCustomerId: attributes.customer_id?.toString(),
      productId: attributes.first_order_item?.product_id?.toString(),
      variantId,
      status: attributes.status,
      amount: attributes.total,
      currency: attributes.currency,
      productName: attributes.first_order_item?.product_name,
      creditsGranted: credits,
    },
  });

  // Grant credits if payment is successful
  if (attributes.status === "paid" && credits > 0) {
    await grantCredits(userId, credits, `Purchase: ${orderId}`);
  }
}

async function handleOrderRefunded(payload: WebhookPayload): Promise<void> {
  const orderId = payload.data.id;

  const payment = await prisma.payment.findUnique({
    where: { lemonSqueezyOrderId: orderId },
  });

  if (payment) {
    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "refunded" },
    });

    // Revoke credits if any were granted
    if (payment.creditsGranted > 0) {
      await revokeCredits(
        payment.userId,
        payment.creditsGranted,
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

  // Create subscription record
  await prisma.subscription.create({
    data: {
      userId,
      lemonSqueezyId: subscriptionId,
      lemonSqueezyCustomerId: attributes.customer_id?.toString(),
      orderId: attributes.order_id?.toString(),
      productId: attributes.product_id?.toString(),
      variantId,
      status: attributes.status,
      planName: plan?.name || attributes.variant_name,
      renewsAt: attributes.renews_at ? new Date(attributes.renews_at) : null,
      endsAt: attributes.ends_at ? new Date(attributes.ends_at) : null,
      trialEndsAt: attributes.trial_ends_at
        ? new Date(attributes.trial_ends_at)
        : null,
      isPaused: !!attributes.pause,
    },
  });

  // Grant initial credits for subscription
  if (plan && attributes.status === "active") {
    await grantCredits(
      userId,
      plan.monthlyCredits,
      `Subscription: ${plan.name}`
    );
  }
}

async function handleSubscriptionUpdated(
  payload: WebhookPayload
): Promise<void> {
  const attributes = payload.data.attributes as unknown as SubscriptionAttributes;
  const subscriptionId = payload.data.id;

  await prisma.subscription.updateMany({
    where: { lemonSqueezyId: subscriptionId },
    data: {
      status: attributes.status,
      renewsAt: attributes.renews_at ? new Date(attributes.renews_at) : null,
      endsAt: attributes.ends_at ? new Date(attributes.ends_at) : null,
      isPaused: !!attributes.pause,
    },
  });
}

async function handleSubscriptionEnded(payload: WebhookPayload): Promise<void> {
  const attributes = payload.data.attributes as unknown as SubscriptionAttributes;
  const subscriptionId = payload.data.id;

  await prisma.subscription.updateMany({
    where: { lemonSqueezyId: subscriptionId },
    data: {
      status: attributes.status,
      endsAt: new Date(),
    },
  });
}

async function handleSubscriptionPaymentSuccess(
  payload: WebhookPayload
): Promise<void> {
  const attributes = payload.data.attributes as unknown as SubscriptionAttributes;
  const subscriptionId = payload.data.id;

  const subscription = await prisma.subscription.findFirst({
    where: { lemonSqueezyId: subscriptionId },
  });

  if (subscription) {
    // Get plan info
    const plan = subscription.variantId
      ? getPlanByVariantId(subscription.variantId)
      : null;

    // Grant monthly credits
    if (plan) {
      await grantCredits(
        subscription.userId,
        plan.monthlyCredits,
        `Subscription renewal: ${plan.name}`
      );
    }

    // Update subscription
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: attributes.status,
        renewsAt: attributes.renews_at ? new Date(attributes.renews_at) : null,
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
    where: { lemonSqueezyId: subscriptionId },
    data: {
      status: attributes.status,
    },
  });

  // If payment recovered, grant credits
  if (eventName === "subscription_payment_recovered") {
    const subscription = await prisma.subscription.findFirst({
      where: { lemonSqueezyId: subscriptionId },
    });

    if (subscription?.variantId) {
      const plan = getPlanByVariantId(subscription.variantId);
      if (plan) {
        await grantCredits(
          subscription.userId,
          plan.monthlyCredits,
          `Payment recovered: ${plan.name}`
        );
      }
    }
  }
}

// =====================================================
// Credit Management Helpers
// =====================================================

async function grantCredits(
  userId: string,
  amount: number,
  description: string
): Promise<void> {
  await prisma.$transaction([
    // Update user balance
    prisma.user.update({
      where: { id: userId },
      data: {
        creditBalance: { increment: amount },
      },
    }),
    // Create credit record
    prisma.credit.create({
      data: {
        userId,
        amount,
        source: "purchase",
      },
    }),
    // Create transaction record
    prisma.creditTransaction.create({
      data: {
        userId,
        amount,
        type: "bonus",
        description,
        status: "completed",
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
    // Create transaction record
    prisma.creditTransaction.create({
      data: {
        userId,
        amount: -amount,
        type: "refund",
        description,
        status: "completed",
      },
    }),
  ]);
}
