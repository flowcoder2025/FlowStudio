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
 * 기존 DB 스키마: Credit.balance 사용 (User.creditBalance가 아님)
 * CreditLedger로 hold 관리
 */
export async function getCreditBalance(userId: string): Promise<CreditBalance> {
  const [credit, pendingHolds] = await Promise.all([
    // Credit 테이블에서 balance 조회 (1:1 관계)
    prisma.credit.findUnique({
      where: { userId },
      select: { balance: true },
    }),
    // CreditLedger에서 HELD 상태인 것들의 holdAmount 합계
    prisma.creditLedger.aggregate({
      where: {
        userId,
        status: "HELD",
      },
      _sum: {
        holdAmount: true,
      },
    }),
  ]);

  const balance = credit?.balance ?? 0;
  const holds = Math.abs(pendingHolds._sum.holdAmount ?? 0);

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
        createdAt: true,
      },
    }),
    prisma.creditTransaction.count({ where: { userId } }),
  ]);

  return { transactions, total };
}
