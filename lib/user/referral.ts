/**
 * Referral System Service
 * Contract: USER_FUNC_REFERRAL
 * Evidence: IMPLEMENTATION_PLAN.md Phase 2
 */

import { prisma } from "@/lib/db";

const REFERRAL_BONUS_CREDITS = 5; // Bonus for both referrer and referee

export interface ReferralResult {
  success: boolean;
  error?: string;
  bonusCredits?: number;
}

/**
 * Apply referral code for a new user
 */
export async function applyReferralCode(
  userId: string,
  referralCode: string
): Promise<ReferralResult> {
  // Check if user already has a referrer
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referredBy: true },
  });

  if (user?.referredBy) {
    return {
      success: false,
      error: "이미 추천인이 등록되어 있습니다",
    };
  }

  // Find referrer by code
  const referrer = await prisma.user.findUnique({
    where: { referralCode },
    select: { id: true },
  });

  if (!referrer) {
    return {
      success: false,
      error: "유효하지 않은 추천 코드입니다",
    };
  }

  // Cannot refer yourself
  if (referrer.id === userId) {
    return {
      success: false,
      error: "본인의 추천 코드는 사용할 수 없습니다",
    };
  }

  // Apply referral in a transaction
  // DB Schema: Credit has only balance (no amount/source), use upsert for 1:1 relation
  await prisma.$transaction(async (tx) => {
    // Update referee with referrer info
    await tx.user.update({
      where: { id: userId },
      data: {
        referredBy: referrer.id,
        creditBalance: { increment: REFERRAL_BONUS_CREDITS },
      },
    });

    // Update or create Credit record for referee
    await tx.credit.upsert({
      where: { userId },
      update: {
        balance: { increment: REFERRAL_BONUS_CREDITS },
        updatedAt: new Date(),
      },
      create: {
        userId,
        balance: REFERRAL_BONUS_CREDITS,
        updatedAt: new Date(),
      },
    });

    // Give bonus to referrer
    await tx.user.update({
      where: { id: referrer.id },
      data: {
        creditBalance: { increment: REFERRAL_BONUS_CREDITS },
      },
    });

    // Update or create Credit record for referrer
    await tx.credit.upsert({
      where: { userId: referrer.id },
      update: {
        balance: { increment: REFERRAL_BONUS_CREDITS },
        updatedAt: new Date(),
      },
      create: {
        userId: referrer.id,
        balance: REFERRAL_BONUS_CREDITS,
        updatedAt: new Date(),
      },
    });

    // Record transactions (no status field)
    await tx.creditTransaction.createMany({
      data: [
        {
          userId,
          amount: REFERRAL_BONUS_CREDITS,
          type: "bonus",
          description: "추천인 보너스",
        },
        {
          userId: referrer.id,
          amount: REFERRAL_BONUS_CREDITS,
          type: "bonus",
          description: "추천 보너스",
        },
      ],
    });
  });

  return {
    success: true,
    bonusCredits: REFERRAL_BONUS_CREDITS,
  };
}

/**
 * Get user's referral code
 */
export async function getReferralCode(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });

  return user?.referralCode ?? null;
}

/**
 * Get referral statistics for a user
 */
export async function getReferralStats(userId: string): Promise<{
  referralCode: string | null;
  referralCount: number;
  totalEarnedCredits: number;
}> {
  const [user, referralCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    }),
    prisma.user.count({
      where: { referredBy: userId },
    }),
  ]);

  return {
    referralCode: user?.referralCode ?? null,
    referralCount,
    totalEarnedCredits: referralCount * REFERRAL_BONUS_CREDITS,
  };
}
