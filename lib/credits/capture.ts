/**
 * Credit Capture Service
 * Contract: CREDIT_FUNC_CAPTURE
 * Evidence: IMPLEMENTATION_PLAN.md Phase 2
 *
 * Confirms a credit hold and actually deducts the credits
 *
 * DB Schema Notes:
 * - CreditTransaction: no status/holdId fields
 * - CreditLedger: uses requestId, holdAmount, capturedAmount, status
 */

import { prisma } from "@/lib/db";
import { getLedgerHold } from "./hold";

export interface CaptureResult {
  success: boolean;
  error?: string;
}

/**
 * Capture (confirm) a credit hold
 * This actually deducts the credits from the user's balance
 * Uses CreditLedger for hold management
 */
export async function captureCredits(
  requestId: string,
  description?: string
): Promise<CaptureResult> {
  // Get the hold from CreditLedger
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

  // Execute capture in transaction
  await prisma.$transaction(async (tx) => {
    // Update ledger status to CAPTURED
    await tx.creditLedger.update({
      where: { requestId },
      data: {
        status: "CAPTURED",
        capturedAmount: amount,
        capturedAt: new Date(),
        description: description || "크레딧 사용 확정",
      },
    });

    // Deduct from user balance
    await tx.user.update({
      where: { id: hold.userId },
      data: {
        creditBalance: { decrement: amount },
      },
    });

    // Also update Credit balance if exists
    await tx.credit.updateMany({
      where: { userId: hold.userId },
      data: {
        balance: { decrement: amount },
      },
    });

    // Create capture transaction record (no status field)
    await tx.creditTransaction.create({
      data: {
        userId: hold.userId,
        amount: -amount,
        type: "capture",
        description: description || "크레딧 사용 확정",
        metadata: { requestId },
      },
    });
  });

  return { success: true };
}

/**
 * Partial capture - capture only part of the held amount
 */
export async function partialCapture(
  requestId: string,
  captureAmount: number,
  description?: string
): Promise<CaptureResult> {
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

  const holdAmount = hold.holdAmount;

  if (captureAmount > holdAmount) {
    return {
      success: false,
      error: `캡처 금액이 홀드 금액을 초과합니다. 홀드: ${holdAmount}, 요청: ${captureAmount}`,
    };
  }

  const refundAmount = holdAmount - captureAmount;

  await prisma.$transaction(async (tx) => {
    // Update ledger with partial capture
    await tx.creditLedger.update({
      where: { requestId },
      data: {
        status: refundAmount > 0 ? "PARTIAL_CAPTURED" : "CAPTURED",
        capturedAmount: captureAmount,
        refundedAmount: refundAmount > 0 ? refundAmount : undefined,
        capturedAt: new Date(),
        refundedAt: refundAmount > 0 ? new Date() : undefined,
        description: description || `크레딧 부분 사용 (${captureAmount}/${holdAmount})`,
      },
    });

    // Deduct captured amount from balance
    await tx.user.update({
      where: { id: hold.userId },
      data: {
        creditBalance: { decrement: captureAmount },
      },
    });

    // Also update Credit balance if exists
    await tx.credit.updateMany({
      where: { userId: hold.userId },
      data: {
        balance: { decrement: captureAmount },
      },
    });

    // Create capture transaction
    await tx.creditTransaction.create({
      data: {
        userId: hold.userId,
        amount: -captureAmount,
        type: "capture",
        description: description || `크레딧 부분 사용 (${captureAmount}/${holdAmount})`,
        metadata: { requestId },
      },
    });

    // If there's a refund amount, record it
    if (refundAmount > 0) {
      await tx.creditTransaction.create({
        data: {
          userId: hold.userId,
          amount: refundAmount,
          type: "refund",
          description: `부분 캡처 환불 (${refundAmount})`,
          metadata: { requestId },
        },
      });
    }
  });

  return { success: true };
}
