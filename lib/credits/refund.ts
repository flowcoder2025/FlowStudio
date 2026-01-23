/**
 * Credit Refund Service
 * Contract: CREDIT_FUNC_REFUND
 * Evidence: IMPLEMENTATION_PLAN.md Phase 2
 *
 * Releases a credit hold (used when operation fails)
 *
 * DB Schema Notes:
 * - Uses CreditLedger for hold management
 * - CreditTransaction: no status/holdId fields
 */

import { prisma } from "@/lib/db";
import { getLedgerHold } from "./hold";

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
  requestId: string,
  reason?: string
): Promise<RefundResult> {
  const hold = await getLedgerHold(requestId);

  if (!hold) {
    return { success: false, error: "홀드를 찾을 수 없습니다" };
  }

  if (hold.status !== "HELD") {
    return {
      success: false,
      error: `이미 처리된 홀드입니다. 상태: ${hold.status}`,
    };
  }

  const amount = hold.holdAmount;

  await prisma.$transaction(async (tx) => {
    // Update ledger status to REFUNDED
    await tx.creditLedger.update({
      where: { requestId },
      data: {
        status: "REFUNDED",
        refundedAmount: amount,
        refundedAt: new Date(),
        description: reason || "크레딧 홀드 해제",
      },
    });

    // Create refund transaction record (no status/holdId fields)
    await tx.creditTransaction.create({
      data: {
        userId: hold.userId,
        amount: amount, // Positive for refund (releasing hold)
        type: "refund",
        description: reason || "크레딧 홀드 해제",
        metadata: { requestId },
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
  // Find all HELD status in CreditLedger
  const pendingHolds = await prisma.creditLedger.findMany({
    where: {
      userId,
      status: "HELD",
    },
  });

  let refunded = 0;
  let totalAmount = 0;

  for (const hold of pendingHolds) {
    const result = await refundCredits(hold.requestId, reason);
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

    // Also update Credit balance if exists
    await tx.credit.updateMany({
      where: { userId },
      data: {
        balance: { increment: amount },
      },
    });

    // Create refund transaction
    await tx.creditTransaction.create({
      data: {
        userId,
        amount: amount,
        type: "refund",
        description: reason,
        metadata: { type: "manual_refund" },
      },
    });
  });

  return {
    success: true,
    refundedAmount: amount,
  };
}
