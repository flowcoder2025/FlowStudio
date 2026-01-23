/**
 * Credit Hold Service
 * Contract: CREDIT_FUNC_HOLD
 * Evidence: IMPLEMENTATION_PLAN.md Phase 2
 *
 * Implements 2-phase commit for credit transactions:
 * 1. HOLD: Reserve credits before operation
 * 2. CAPTURE: Confirm deduction after success
 * 3. REFUND: Release hold if operation fails
 *
 * DB Schema Notes:
 * - Uses CreditLedger for hold management
 * - CreditLedger has: requestId (unique), holdAmount, status, expiresAt
 * - CreditTransaction: no status/holdId fields
 */

import { prisma } from "@/lib/db";
import { getCreditBalance } from "./balance";
import { randomUUID } from "crypto";

export interface HoldResult {
  success: boolean;
  holdId?: string; // This is requestId for CreditLedger
  error?: string;
}

/**
 * Hold (reserve) credits for an operation
 * Credits are not actually deducted until capture is called
 * Uses CreditLedger for hold management
 */
export async function holdCredits(
  userId: string,
  amount: number,
  description?: string,
  workflowSessionId?: string
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

  // Generate unique request ID
  const requestId = randomUUID();

  // Set expiry time (default 1 hour)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  // Create hold in CreditLedger
  // Note: workflowSessionId must be provided via relation, not direct field
  await prisma.creditLedger.create({
    data: {
      userId,
      requestId,
      holdAmount: amount,
      status: "HELD",
      expiresAt,
      description: description || "크레딧 예약",
      updatedAt: new Date(),
      ...(workflowSessionId
        ? { WorkflowSession: { connect: { id: workflowSessionId } } }
        : {}),
    },
  });

  // Also create a transaction record for history (no status field)
  await prisma.creditTransaction.create({
    data: {
      userId,
      amount: -amount, // Negative for holds
      type: "hold",
      description: description || "크레딧 예약",
      metadata: { requestId },
    },
  });

  return {
    success: true,
    holdId: requestId, // Return requestId as holdId
  };
}

/**
 * Get hold details from CreditLedger
 */
export async function getLedgerHold(requestId: string): Promise<{
  requestId: string;
  userId: string;
  holdAmount: number;
  status: string;
  createdAt: Date;
  expiresAt: Date;
} | null> {
  const hold = await prisma.creditLedger.findUnique({
    where: { requestId },
    select: {
      requestId: true,
      userId: true,
      holdAmount: true,
      status: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  return hold;
}

/**
 * Check if a hold is still valid (HELD status and not expired)
 */
export async function isHoldValid(requestId: string): Promise<boolean> {
  const hold = await getLedgerHold(requestId);
  if (!hold) return false;

  const now = new Date();
  return hold.status === "HELD" && hold.expiresAt > now;
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use getLedgerHold instead
 */
export async function getHold(holdId: string): Promise<{
  id: string;
  userId: string;
  amount: number;
  status: string;
  createdAt: Date;
} | null> {
  // Try to find in CreditLedger first (holdId is actually requestId)
  const ledgerHold = await getLedgerHold(holdId);
  if (ledgerHold) {
    return {
      id: ledgerHold.requestId,
      userId: ledgerHold.userId,
      amount: ledgerHold.holdAmount,
      status: ledgerHold.status === "HELD" ? "pending" : ledgerHold.status.toLowerCase(),
      createdAt: ledgerHold.createdAt,
    };
  }
  return null;
}
