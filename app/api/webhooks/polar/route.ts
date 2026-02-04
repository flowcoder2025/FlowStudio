/**
 * Polar Webhook API Route
 * Contract: PAYMENT_FUNC_WEBHOOK
 * Evidence: Polar Next.js SDK Documentation
 *
 * This route uses the official Polar Next.js SDK Webhooks adapter.
 */

import { Webhooks } from "@polar-sh/nextjs";
import { prisma } from "@/lib/db";
import {
  getCreditsForPackage,
  getPlanByProductId,
  getPackageByProductId,
} from "@/lib/payment/config";

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    // Generic handler for all events
    console.log("Polar webhook received:", payload.type);
  },
  onOrderCreated: async ({ data }) => {
    const order = data;
    const orderId = order.id;
    const userId = order.metadata?.user_id as string | undefined;
    const productId = order.productId as string | undefined;

    if (!userId) {
      console.error("Order created without user_id in metadata");
      return;
    }

    if (!productId) {
      console.error("Order created without productId");
      return;
    }

    // Check if this is a credit package purchase
    const pkg = getPackageByProductId(productId);
    const credits = pkg ? getCreditsForPackage(productId) : 0;

    // Record purchase via CreditTransaction
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
    if (credits > 0) {
      const expiresAt = null; // 구매 크레딧은 영구 보존

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { creditBalance: { increment: credits } },
        }),
        prisma.credit.upsert({
          where: { userId },
          update: { balance: { increment: credits }, updatedAt: new Date() },
          create: { userId, balance: credits, updatedAt: new Date() },
        }),
        prisma.creditTransaction.create({
          data: {
            userId,
            amount: credits,
            type: "purchase",
            description: `Credits granted: ${orderId}`,
            expiresAt,
            remainingAmount: credits,
          },
        }),
      ]);
    }

    console.log(`Order ${orderId} processed for user ${userId}, credits: ${credits}`);
  },
  onSubscriptionCreated: async ({ data }) => {
    const subscription = data;
    const subscriptionId = subscription.id;
    const userId = subscription.metadata?.user_id as string | undefined;
    const productId = subscription.productId as string | undefined;

    if (!userId) {
      console.error("Subscription created without user_id in metadata");
      return;
    }

    if (!productId) {
      console.error("Subscription created without productId");
      return;
    }

    const plan = getPlanByProductId(productId);

    await prisma.subscription.create({
      data: {
        userId,
        externalId: subscriptionId,
        tier: plan?.id?.toUpperCase() || "PRO",
        status: subscription.status,
        startDate: new Date(),
        endDate: subscription.currentPeriodEnd
          ? new Date(subscription.currentPeriodEnd)
          : null,
        paymentProvider: "polar",
      },
    });

    // Grant monthly credits for subscription (30일 한정)
    if (plan && subscription.status === "active" && plan.monthlyCredits) {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { creditBalance: { increment: plan.monthlyCredits } },
        }),
        prisma.credit.upsert({
          where: { userId },
          update: { balance: { increment: plan.monthlyCredits }, updatedAt: new Date() },
          create: { userId, balance: plan.monthlyCredits, updatedAt: new Date() },
        }),
        prisma.creditTransaction.create({
          data: {
            userId,
            amount: plan.monthlyCredits,
            type: "subscription",
            description: `Subscription: ${plan.name}`,
            expiresAt,
            remainingAmount: plan.monthlyCredits,
          },
        }),
      ]);
    }

    console.log(`Subscription ${subscriptionId} created for user ${userId}`);
  },
  onSubscriptionUpdated: async ({ data }) => {
    const subscription = data;
    const subscriptionId = subscription.id;

    await prisma.subscription.updateMany({
      where: { externalId: subscriptionId },
      data: {
        status: subscription.status,
        endDate: subscription.currentPeriodEnd
          ? new Date(subscription.currentPeriodEnd)
          : null,
      },
    });

    console.log(`Subscription ${subscriptionId} updated`);
  },
  onSubscriptionRevoked: async ({ data }) => {
    const subscription = data;
    const subscriptionId = subscription.id;

    await prisma.subscription.updateMany({
      where: { externalId: subscriptionId },
      data: {
        status: "canceled",
        endDate: new Date(),
        cancelledAt: new Date(),
      },
    });

    console.log(`Subscription ${subscriptionId} revoked`);
  },
});
