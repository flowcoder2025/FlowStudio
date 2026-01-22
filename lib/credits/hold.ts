/**
 * Credit Hold Service
 * Contract: CREDIT_FUNC_HOLD
 * Evidence: IMPLEMENTATION_PLAN.md Phase 2
 *
 * Implements 2-phase commit for credit transactions:
 * 1. HOLD: Reserve credits before operation
 * 2. CAPTURE: Confirm deduction after success
 * 3. REFUND: Release hold if operation fails
 */

import { prisma } from "@/lib/db";
import { getCreditBalance } from "./balance";

export interface HoldResult {
  success: boolean;
  holdId?: string;
  error?: string;
}

/**
 * Hold (reserve) credits for an operation
 * Credits are not actually deducted until capture is called
 */
export async function holdCredits(
  userId: string,
  amount: number,
  description?: string
): Promise<HoldResult> {
  if (amount <= 0) {
    return { success: false, error: "금액은 0보다 커야 합니다" };
  }

  // Check available balance
  const { availableBalance } = await getCreditBalance(userId);

  if (availableBalance < amount) {
    return {
      success: false,
      error: `크레딧이 부족합니다. 필요: ${amount}, 사용 가능: ${availableBalance}`,
    };
  }

  // Create hold transaction
  const transaction = await prisma.creditTransaction.create({
    data: {
      userId,
      amount: -amount, // Negative for holds
      type: "hold",
      description: description || "크레딧 예약",
      status: "pending",
      holdId: undefined, // Will be self-referential via ID
    },
  });

  // Update holdId to self for tracking
  await prisma.creditTransaction.update({
    where: { id: transaction.id },
    data: { holdId: transaction.id },
  });

  return {
    success: true,
    holdId: transaction.id,
  };
}

/**
 * Get hold details
 */
export async function getHold(holdId: string): Promise<{
  id: string;
  userId: string;
  amount: number;
  status: string;
  createdAt: Date;
} | null> {
  const hold = await prisma.creditTransaction.findFirst({
    where: {
      id: holdId,
      type: "hold",
    },
    select: {
      id: true,
      userId: true,
      amount: true,
      status: true,
      createdAt: true,
    },
  });

  return hold;
}

/**
 * Check if a hold is still valid (pending)
 */
export async function isHoldValid(holdId: string): Promise<boolean> {
  const hold = await getHold(holdId);
  return hold?.status === "pending";
}
