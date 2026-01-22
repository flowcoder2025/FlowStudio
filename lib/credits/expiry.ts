/**
 * Credit Expiry Service
 * Contract: CREDIT_FUNC_EXPIRY
 * Evidence: IMPLEMENTATION_PLAN.md Phase 2
 *
 * Handles credit expiration logic
 */

import { prisma } from "@/lib/db";

export interface ExpiryResult {
  processedUsers: number;
  expiredCredits: number;
  errors: number;
}

/**
 * Process expired credits
 * Should be run periodically (e.g., daily cron job)
 */
export async function processExpiredCredits(): Promise<ExpiryResult> {
  const now = new Date();
  let processedUsers = 0;
  let expiredCredits = 0;
  let errors = 0;

  // Find all expired credits that haven't been processed
  const expiredCreditRecords = await prisma.credit.findMany({
    where: {
      expiresAt: {
        lte: now,
      },
      amount: {
        gt: 0,
      },
    },
  });

  // Group by user
  const creditsByUser = expiredCreditRecords.reduce(
    (acc, credit) => {
      if (!acc[credit.userId]) {
        acc[credit.userId] = [];
      }
      acc[credit.userId].push(credit);
      return acc;
    },
    {} as Record<string, typeof expiredCreditRecords>
  );

  // Process each user's expired credits
  for (const [userId, credits] of Object.entries(creditsByUser)) {
    try {
      const totalExpired = credits.reduce((sum, c) => sum + c.amount, 0);

      await prisma.$transaction(async (tx) => {
        // Zero out expired credits
        await tx.credit.updateMany({
          where: {
            id: { in: credits.map((c) => c.id) },
          },
          data: {
            amount: 0,
          },
        });

        // Deduct from user balance
        await tx.user.update({
          where: { id: userId },
          data: {
            creditBalance: { decrement: totalExpired },
          },
        });

        // Record transaction
        await tx.creditTransaction.create({
          data: {
            userId,
            amount: -totalExpired,
            type: "expire",
            description: `${credits.length}건 크레딧 만료`,
            status: "completed",
          },
        });

        // Record in ledger
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { creditBalance: true },
        });

        await tx.creditLedger.create({
          data: {
            userId,
            creditId: "expiry",
            change: -totalExpired,
            balanceAfter: user?.creditBalance ?? 0,
            reason: "크레딧 만료",
          },
        });
      });

      processedUsers++;
      expiredCredits += totalExpired;
    } catch (error) {
      console.error(`Failed to process expired credits for user ${userId}:`, error);
      errors++;
    }
  }

  return { processedUsers, expiredCredits, errors };
}

/**
 * Get credits that will expire soon for a user
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

  const credits = await prisma.credit.findMany({
    where: {
      userId,
      amount: { gt: 0 },
      expiresAt: {
        lte: futureDate,
        gt: new Date(),
      },
    },
    orderBy: { expiresAt: "asc" },
  });

  const now = new Date();

  return credits.map((c) => ({
    id: c.id,
    amount: c.amount,
    expiresAt: c.expiresAt,
    daysUntilExpiry: c.expiresAt
      ? Math.ceil((c.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0,
  }));
}

/**
 * Cancel old pending holds (cleanup)
 * Holds older than the specified hours should be cancelled
 */
export async function cancelStaleHolds(maxAgeHours: number = 24): Promise<number> {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - maxAgeHours);

  const staleHolds = await prisma.creditTransaction.findMany({
    where: {
      type: "hold",
      status: "pending",
      createdAt: { lt: cutoff },
    },
  });

  let cancelled = 0;

  for (const hold of staleHolds) {
    try {
      await prisma.creditTransaction.update({
        where: { id: hold.id },
        data: { status: "cancelled" },
      });
      cancelled++;
    } catch (error) {
      console.error(`Failed to cancel stale hold ${hold.id}:`, error);
    }
  }

  return cancelled;
}
