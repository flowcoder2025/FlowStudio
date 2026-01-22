/**
 * Credit Refund Service
 * Contract: CREDIT_FUNC_REFUND
 * Evidence: IMPLEMENTATION_PLAN.md Phase 2
 *
 * Releases a credit hold (used when operation fails)
 */

import { prisma } from "@/lib/db";
import { getHold } from "./hold";

export interface RefundResult {
  success: boolean;
  refundedAmount?: number;
  error?: string;
}

/**
 * Refund (release) a credit hold
 * Used when an operation fails and the held credits should be released
 */
export async function refundCredits(
  holdId: string,
  reason?: string
): Promise<RefundResult> {
  const hold = await getHold(holdId);

  if (!hold) {
    return { success: false, error: "홀드를 찾을 수 없습니다" };
  }

  if (hold.status !== "pending") {
    return {
      success: false,
      error: `이미 처리된 홀드입니다. 상태: ${hold.status}`,
    };
  }

  const amount = Math.abs(hold.amount);

  await prisma.$transaction(async (tx) => {
    // Update hold status to cancelled
    await tx.creditTransaction.update({
      where: { id: holdId },
      data: { status: "cancelled" },
    });

    // Create refund transaction record
    await tx.creditTransaction.create({
      data: {
        userId: hold.userId,
        amount: amount, // Positive for refund
        type: "refund",
        description: reason || "크레딧 홀드 해제",
        holdId,
        status: "completed",
      },
    });
  });

  return {
    success: true,
    refundedAmount: amount,
  };
}

/**
 * Refund all pending holds for a user
 * Used in emergency situations or cleanup
 */
export async function refundAllPendingHolds(
  userId: string,
  reason?: string
): Promise<{ refunded: number; totalAmount: number }> {
  const pendingHolds = await prisma.creditTransaction.findMany({
    where: {
      userId,
      type: "hold",
      status: "pending",
    },
  });

  let refunded = 0;
  let totalAmount = 0;

  for (const hold of pendingHolds) {
    const result = await refundCredits(hold.id, reason);
    if (result.success) {
      refunded++;
      totalAmount += result.refundedAmount ?? 0;
    }
  }

  return { refunded, totalAmount };
}

/**
 * Refund captured credits (actual refund to user's balance)
 * Used for special cases like customer support refunds
 */
export async function refundCapturedCredits(
  userId: string,
  amount: number,
  reason: string
): Promise<RefundResult> {
  if (amount <= 0) {
    return { success: false, error: "금액은 0보다 커야 합니다" };
  }

  await prisma.$transaction(async (tx) => {
    // Add credits back to user
    await tx.user.update({
      where: { id: userId },
      data: {
        creditBalance: { increment: amount },
      },
    });

    // Create refund transaction
    await tx.creditTransaction.create({
      data: {
        userId,
        amount: amount,
        type: "refund",
        description: reason,
        status: "completed",
      },
    });

    // Create ledger entry
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true },
    });

    await tx.creditLedger.create({
      data: {
        userId,
        creditId: "manual_refund",
        change: amount,
        balanceAfter: user?.creditBalance ?? 0,
        reason,
      },
    });
  });

  return {
    success: true,
    refundedAmount: amount,
  };
}
