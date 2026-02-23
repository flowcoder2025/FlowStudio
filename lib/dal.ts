/**
 * Data Access Layer (DAL)
 * Contract: Server-only authenticated data access with React cache() deduplication
 * Security: server-only import prevents client bundle inclusion
 */

import "server-only";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Cached user getter — deduplicates DB queries within a single request.
 * Returns full user profile or null if unauthenticated.
 */
export const getUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      creditBalance: true,
      subscriptionTier: true,
      businessVerified: true,
    },
  });
});

/**
 * Require authentication — throws if not authenticated.
 * Use in Server Components / Server Actions that need auth.
 */
export async function requireAuth() {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

/**
 * Require minimum subscription tier.
 * Throws if user tier is below required level.
 */
export async function requireTier(requiredTier: string) {
  const user = await requireAuth();
  const tierOrder: Record<string, number> = {
    FREE: 0,
    BASIC: 1,
    PRO: 2,
    ENTERPRISE: 3,
  };
  if ((tierOrder[user.subscriptionTier] ?? 0) < (tierOrder[requiredTier] ?? 0)) {
    throw new Error(`Requires ${requiredTier} tier`);
  }
  return user;
}
