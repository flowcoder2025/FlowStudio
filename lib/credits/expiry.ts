/**
 * Credit Expiry Service
 * Contract: CREDIT_FUNC_EXPIRY
 * Evidence: IMPLEMENTATION_PLAN.md Phase 2
 *
 * Handles credit expiration logic
 *
 * DB Schema Notes:
 * - Credit model: only has balance, no amount/expiresAt
 * - CreditTransaction: has expiresAt, remainingAmount
 * - CreditLedger: has expiresAt for hold expiration
 */

import { prisma } from "@/lib/db";

export interface ExpiryResult {
  processedUsers: number;
  expiredCredits: number;
  errors: number;
}

/**
 * Process expired credit transactions
 * Should be run periodically (e.g., daily cron job)
 */
export async function processExpiredCredits(): Promise<ExpiryResult> {
  const now = new Date();
  let processedUsers = 0;
  let expiredCredits = 0;
  let errors = 0;

  // Find all expired credit transactions with remaining amount
  const expiredTransactions = await prisma.creditTransaction.findMany({
    where: {
      expiresAt: {
        lte: now,
      },
      remainingAmount: {
        gt: 0,
      },
      type: {
        in: ["purchase", "bonus", "referral"], // Only positive credit types
      },
    },
  });

  // Group by user
  const txByUser = expiredTransactions.reduce<Record<string, typeof expiredTransactions>>(
    (acc: Record<string, typeof expiredTransactions>, tx) => {
      if (!acc[tx.userId]) {
        acc[tx.userId] = [];
      }
      acc[tx.userId].push(tx);
      return acc;
    },
    {}
  );

  // Process each user's expired credits
  for (const [userId, transactions] of Object.entries(txByUser)) {
    try {
      const totalExpired = transactions.reduce(
        (sum: number, tx) => sum + (tx.remainingAmount ?? 0),
        0
      );

      await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
        // Zero out remaining amounts on expired transactions
        await tx.creditTransaction.updateMany({
          where: {
            id: { in: transactions.map((t) => t.id) },
          },
          data: {
            remainingAmount: 0,
          },
        });

        // Deduct from user balance
        await tx.user.update({
          where: { id: userId },
          data: {
            creditBalance: { decrement: totalExpired },
          },
        });

        // Also update Credit balance if exists
        await tx.credit.updateMany({
          where: { userId },
          data: {
            balance: { decrement: totalExpired },
          },
        });

        // Record expiry transaction
        await tx.creditTransaction.create({
          data: {
            userId,
            amount: -totalExpired,
            type: "expire",
            description: `${transactions.length}건 크레딧 만료`,
          },
        });
      });

      processedUsers++;
      expiredCredits += totalExpired;
    } catch (error) {
      console.error(
        `Failed to process expired credits for user ${userId}:`,
        error
      );
      errors++;
    }
  }

  return { processedUsers, expiredCredits, errors };
}

/**
 * Get credits that will expire soon for a user
 * Based on CreditTransaction.expiresAt
 */
export async function getExpiringCredits(
  userId: string,
  withinDays: number = 7
): Promise<
  Array<{
    id: string;
    amount: number;
    expiresAt: Date | null;
    daysUntilExpiry: number;
  }>
> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + withinDays);

  const transactions = await prisma.creditTransaction.findMany({
    where: {
      userId,
      remainingAmount: { gt: 0 },
      expiresAt: {
        lte: futureDate,
        gt: new Date(),
      },
      type: {
        in: ["purchase", "bonus", "referral"],
      },
    },
    orderBy: { expiresAt: "asc" },
  });

  const now = new Date();

  return transactions.map((t) => ({
    id: t.id,
    amount: t.remainingAmount ?? t.amount,
    expiresAt: t.expiresAt,
    daysUntilExpiry: t.expiresAt
      ? Math.ceil(
          (t.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0,
  }));
}

/**
 * Cancel old pending holds (cleanup)
 * Uses CreditLedger for hold management
 */
export async function cancelStaleHolds(
  maxAgeHours: number = 24
): Promise<number> {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - maxAgeHours);

  // Find stale holds in CreditLedger
  const staleHolds = await prisma.creditLedger.findMany({
    where: {
      status: "HELD",
      OR: [{ expiresAt: { lt: new Date() } }, { createdAt: { lt: cutoff } }],
    },
  });

  let cancelled = 0;

  for (const hold of staleHolds) {
    try {
      await prisma.creditLedger.update({
        where: { id: hold.id },
        data: {
          status: "EXPIRED",
          refundedAt: new Date(),
        },
      });
      cancelled++;
    } catch (error) {
      console.error(`Failed to cancel stale hold ${hold.id}:`, error);
    }
  }

  return cancelled;
}
