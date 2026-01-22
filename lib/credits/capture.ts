/**
 * Credit Capture Service
 * Contract: CREDIT_FUNC_CAPTURE
 * Evidence: IMPLEMENTATION_PLAN.md Phase 2
 *
 * Confirms a credit hold and actually deducts the credits
 */

import { prisma } from "@/lib/db";
import { getHold } from "./hold";

export interface CaptureResult {
  success: boolean;
  error?: string;
}

/**
 * Capture (confirm) a credit hold
 * This actually deducts the credits from the user's balance
 */
export async function captureCredits(
  holdId: string,
  description?: string
): Promise<CaptureResult> {
  // Get the hold
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

  // Execute capture in transaction
  await prisma.$transaction(async (tx) => {
    // Update hold status
    await tx.creditTransaction.update({
      where: { id: holdId },
      data: { status: "completed" },
    });

    // Deduct from user balance
    await tx.user.update({
      where: { id: hold.userId },
      data: {
        creditBalance: { decrement: amount },
      },
    });

    // Create capture transaction record
    await tx.creditTransaction.create({
      data: {
        userId: hold.userId,
        amount: -amount,
        type: "capture",
        description: description || "크레딧 사용 확정",
        holdId,
        status: "completed",
      },
    });

    // Create ledger entry
    const user = await tx.user.findUnique({
      where: { id: hold.userId },
      select: { creditBalance: true },
    });

    await tx.creditLedger.create({
      data: {
        userId: hold.userId,
        creditId: holdId, // Using holdId as reference
        change: -amount,
        balanceAfter: user?.creditBalance ?? 0,
        reason: description || "크레딧 사용",
      },
    });
  });

  return { success: true };
}

/**
 * Partial capture - capture only part of the held amount
 */
export async function partialCapture(
  holdId: string,
  captureAmount: number,
  description?: string
): Promise<CaptureResult> {
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

  const holdAmount = Math.abs(hold.amount);

  if (captureAmount > holdAmount) {
    return {
      success: false,
      error: `캡처 금액이 홀드 금액을 초과합니다. 홀드: ${holdAmount}, 요청: ${captureAmount}`,
    };
  }

  const refundAmount = holdAmount - captureAmount;

  await prisma.$transaction(async (tx) => {
    // Update hold status
    await tx.creditTransaction.update({
      where: { id: holdId },
      data: { status: "completed" },
    });

    // Deduct captured amount from balance
    await tx.user.update({
      where: { id: hold.userId },
      data: {
        creditBalance: { decrement: captureAmount },
      },
    });

    // Create capture transaction
    await tx.creditTransaction.create({
      data: {
        userId: hold.userId,
        amount: -captureAmount,
        type: "capture",
        description: description || `크레딧 부분 사용 (${captureAmount}/${holdAmount})`,
        holdId,
        status: "completed",
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
          holdId,
          status: "completed",
        },
      });
    }
  });

  return { success: true };
}
