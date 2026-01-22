/**
 * Payment History Service
 * Contract: PAYMENT_FUNC_HISTORY
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 */

import { prisma } from "@/lib/db";
import type { PaymentHistoryItem, SubscriptionInfo } from "./types";

// =====================================================
// Payment History
// =====================================================

export interface PaymentHistoryOptions {
  limit?: number;
  offset?: number;
  status?: string;
}

export interface PaymentHistoryResult {
  payments: PaymentHistoryItem[];
  total: number;
  hasMore: boolean;
}

/**
 * Get payment history for a user
 */
export async function getPaymentHistory(
  userId: string,
  options: PaymentHistoryOptions = {}
): Promise<PaymentHistoryResult> {
  const { limit = 20, offset = 0, status } = options;

  const where = {
    userId,
    ...(status && { status }),
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        lemonSqueezyOrderId: true,
        productName: true,
        amount: true,
        currency: true,
        status: true,
        creditsGranted: true,
        createdAt: true,
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    payments: payments.map((p) => ({
      id: p.id,
      orderId: p.lemonSqueezyOrderId,
      productName: p.productName,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      creditsGranted: p.creditsGranted,
      createdAt: p.createdAt,
    })),
    total,
    hasMore: offset + payments.length < total,
  };
}

/**
 * Get a specific payment by ID
 */
export async function getPaymentById(
  paymentId: string,
  userId: string
): Promise<PaymentHistoryItem | null> {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      userId,
    },
    select: {
      id: true,
      lemonSqueezyOrderId: true,
      productName: true,
      amount: true,
      currency: true,
      status: true,
      creditsGranted: true,
      createdAt: true,
    },
  });

  if (!payment) {
    return null;
  }

  return {
    id: payment.id,
    orderId: payment.lemonSqueezyOrderId,
    productName: payment.productName,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    creditsGranted: payment.creditsGranted,
    createdAt: payment.createdAt,
  };
}

/**
 * Get payment by LemonSqueezy order ID
 */
export async function getPaymentByOrderId(
  orderId: string
): Promise<PaymentHistoryItem | null> {
  const payment = await prisma.payment.findUnique({
    where: { lemonSqueezyOrderId: orderId },
    select: {
      id: true,
      lemonSqueezyOrderId: true,
      productName: true,
      amount: true,
      currency: true,
      status: true,
      creditsGranted: true,
      createdAt: true,
    },
  });

  if (!payment) {
    return null;
  }

  return {
    id: payment.id,
    orderId: payment.lemonSqueezyOrderId,
    productName: payment.productName,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    creditsGranted: payment.creditsGranted,
    createdAt: payment.createdAt,
  };
}

// =====================================================
// Billing Summary
// =====================================================

export interface BillingSummary {
  totalSpent: number;
  totalCreditsGranted: number;
  paymentCount: number;
  lastPaymentDate: Date | null;
  currentSubscription: SubscriptionInfo | null;
}

/**
 * Get billing summary for a user
 */
export async function getBillingSummary(userId: string): Promise<BillingSummary> {
  const [aggregates, lastPayment, subscription] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        userId,
        status: "paid",
      },
      _sum: {
        amount: true,
        creditsGranted: true,
      },
      _count: true,
    }),
    prisma.payment.findFirst({
      where: {
        userId,
        status: "paid",
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ["active", "on_trial", "past_due", "paused"] },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    totalSpent: aggregates._sum.amount || 0,
    totalCreditsGranted: aggregates._sum.creditsGranted || 0,
    paymentCount: aggregates._count,
    lastPaymentDate: lastPayment?.createdAt || null,
    currentSubscription: subscription
      ? {
          id: subscription.id,
          planName: subscription.planName,
          status: subscription.status,
          renewsAt: subscription.renewsAt,
          endsAt: subscription.endsAt,
          isPaused: subscription.isPaused,
        }
      : null,
  };
}

// =====================================================
// Invoice & Receipt
// =====================================================

export interface InvoiceData {
  orderId: string;
  productName: string | null;
  amount: number;
  currency: string;
  status: string;
  creditsGranted: number;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
  };
}

/**
 * Get invoice data for a payment
 */
export async function getInvoiceData(
  paymentId: string,
  userId: string
): Promise<InvoiceData | null> {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      userId,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!payment) {
    return null;
  }

  return {
    orderId: payment.lemonSqueezyOrderId,
    productName: payment.productName,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    creditsGranted: payment.creditsGranted,
    createdAt: payment.createdAt,
    user: {
      name: payment.user.name,
      email: payment.user.email,
    },
  };
}

// =====================================================
// Statistics
// =====================================================

export interface PaymentStats {
  thisMonth: {
    amount: number;
    count: number;
  };
  lastMonth: {
    amount: number;
    count: number;
  };
  thisYear: {
    amount: number;
    count: number;
  };
}

/**
 * Get payment statistics for a user
 */
export async function getPaymentStats(userId: string): Promise<PaymentStats> {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const thisYearStart = new Date(now.getFullYear(), 0, 1);

  const [thisMonth, lastMonth, thisYear] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        userId,
        status: "paid",
        createdAt: { gte: thisMonthStart },
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: {
        userId,
        status: "paid",
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: {
        userId,
        status: "paid",
        createdAt: { gte: thisYearStart },
      },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return {
    thisMonth: {
      amount: thisMonth._sum.amount || 0,
      count: thisMonth._count,
    },
    lastMonth: {
      amount: lastMonth._sum.amount || 0,
      count: lastMonth._count,
    },
    thisYear: {
      amount: thisYear._sum.amount || 0,
      count: thisYear._count,
    },
  };
}
