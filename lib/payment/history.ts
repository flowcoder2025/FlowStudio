/**
 * Payment History Service
 * Contract: PAYMENT_FUNC_HISTORY
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 *
 * DB Schema Notes:
 * - Payment model does NOT exist in schema
 * - Using CreditTransaction to track payment history
 * - Subscription model has different fields
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
 * Uses CreditTransaction with type="purchase" as payment records
 */
export async function getPaymentHistory(
  userId: string,
  options: PaymentHistoryOptions = {}
): Promise<PaymentHistoryResult> {
  const { limit = 20, offset = 0 } = options;

  const where = {
    userId,
    type: "purchase",
  };

  const [transactions, total] = await Promise.all([
    prisma.creditTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        paymentId: true,
        paymentProvider: true,
        amount: true,
        description: true,
        createdAt: true,
      },
    }),
    prisma.creditTransaction.count({ where }),
  ]);

  return {
    payments: transactions.map((t) => ({
      id: t.id,
      orderId: t.paymentId ?? t.id,
      productName: t.description ?? "Credit Purchase",
      amount: 0, // Price not stored in transaction
      currency: "KRW",
      status: "completed",
      creditsGranted: t.amount,
      createdAt: t.createdAt,
    })),
    total,
    hasMore: offset + transactions.length < total,
  };
}

/**
 * Get a specific payment by ID
 */
export async function getPaymentById(
  paymentId: string,
  userId: string
): Promise<PaymentHistoryItem | null> {
  const transaction = await prisma.creditTransaction.findFirst({
    where: {
      id: paymentId,
      userId,
      type: "purchase",
    },
    select: {
      id: true,
      paymentId: true,
      amount: true,
      description: true,
      createdAt: true,
    },
  });

  if (!transaction) {
    return null;
  }

  return {
    id: transaction.id,
    orderId: transaction.paymentId ?? transaction.id,
    productName: transaction.description ?? "Credit Purchase",
    amount: 0,
    currency: "KRW",
    status: "completed",
    creditsGranted: transaction.amount,
    createdAt: transaction.createdAt,
  };
}

/**
 * Get payment by order ID (paymentId in transaction)
 */
export async function getPaymentByOrderId(
  orderId: string
): Promise<PaymentHistoryItem | null> {
  const transaction = await prisma.creditTransaction.findFirst({
    where: {
      paymentId: orderId,
      type: "purchase",
    },
    select: {
      id: true,
      paymentId: true,
      amount: true,
      description: true,
      createdAt: true,
    },
  });

  if (!transaction) {
    return null;
  }

  return {
    id: transaction.id,
    orderId: transaction.paymentId ?? transaction.id,
    productName: transaction.description ?? "Credit Purchase",
    amount: 0,
    currency: "KRW",
    status: "completed",
    creditsGranted: transaction.amount,
    createdAt: transaction.createdAt,
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
  const [aggregates, lastTransaction, subscription] = await Promise.all([
    prisma.creditTransaction.aggregate({
      where: {
        userId,
        type: "purchase",
      },
      _sum: {
        amount: true,
      },
      _count: true,
    }),
    prisma.creditTransaction.findFirst({
      where: {
        userId,
        type: "purchase",
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ["ACTIVE", "active", "on_trial", "past_due", "paused"] },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    totalSpent: 0, // Price not tracked
    totalCreditsGranted: aggregates._sum.amount || 0,
    paymentCount: aggregates._count,
    lastPaymentDate: lastTransaction?.createdAt || null,
    currentSubscription: subscription
      ? {
          id: subscription.id,
          planName: subscription.tier,
          status: subscription.status,
          renewsAt: subscription.endDate,
          endsAt: subscription.endDate,
          isPaused: subscription.status === "paused",
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
  const transaction = await prisma.creditTransaction.findFirst({
    where: {
      id: paymentId,
      userId,
      type: "purchase",
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

  if (!transaction) {
    return null;
  }

  return {
    orderId: transaction.paymentId ?? transaction.id,
    productName: transaction.description,
    amount: 0,
    currency: "KRW",
    status: "completed",
    creditsGranted: transaction.amount,
    createdAt: transaction.createdAt,
    user: {
      name: transaction.user.name,
      email: transaction.user.email ?? "",
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
    prisma.creditTransaction.aggregate({
      where: {
        userId,
        type: "purchase",
        createdAt: { gte: thisMonthStart },
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.creditTransaction.aggregate({
      where: {
        userId,
        type: "purchase",
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.creditTransaction.aggregate({
      where: {
        userId,
        type: "purchase",
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
