/**
 * Credit Balance Service
 * Contract: CREDIT_FUNC_BALANCE
 * Evidence: IMPLEMENTATION_PLAN.md Phase 2
 */

import { prisma } from "@/lib/db";

export interface CreditBalance {
  balance: number;
  pendingHolds: number;
  availableBalance: number;
}

/**
 * Get user's credit balance
 */
export async function getCreditBalance(userId: string): Promise<CreditBalance> {
  const [user, pendingHolds] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true },
    }),
    prisma.creditTransaction.aggregate({
      where: {
        userId,
        type: "hold",
        status: "pending",
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  const balance = user?.creditBalance ?? 0;
  const holds = Math.abs(pendingHolds._sum.amount ?? 0);

  return {
    balance,
    pendingHolds: holds,
    availableBalance: Math.max(0, balance - holds),
  };
}

/**
 * Check if user has sufficient credits
 */
export async function hasEnoughCredits(
  userId: string,
  requiredAmount: number
): Promise<boolean> {
  const { availableBalance } = await getCreditBalance(userId);
  return availableBalance >= requiredAmount;
}

/**
 * Get credit transaction history
 */
export async function getCreditHistory(
  userId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{
  transactions: Array<{
    id: string;
    amount: number;
    type: string;
    description: string | null;
    status: string;
    createdAt: Date;
  }>;
  total: number;
}> {
  const { limit = 20, offset = 0 } = options;

  const [transactions, total] = await Promise.all([
    prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.creditTransaction.count({ where: { userId } }),
  ]);

  return { transactions, total };
}
