/**
 * User Profile Service
 * Contract: USER_FUNC_PROFILE
 * Evidence: IMPLEMENTATION_PLAN.md Phase 2
 */

import { prisma } from "@/lib/db";
import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.string().url().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  creditBalance: number;
  businessVerified: boolean;
  referralCode: string | null;
  createdAt: Date;
}

/**
 * Get user profile by ID
 */
export async function getProfile(userId: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      creditBalance: true,
      businessVerified: true,
      referralCode: true,
      createdAt: true,
    },
  });

  return user;
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  data: UpdateProfileInput
): Promise<UserProfile> {
  const validated = updateProfileSchema.parse(data);

  const user = await prisma.user.update({
    where: { id: userId },
    data: validated,
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      creditBalance: true,
      businessVerified: true,
      referralCode: true,
      createdAt: true,
    },
  });

  return user;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      creditBalance: true,
      businessVerified: true,
      referralCode: true,
      createdAt: true,
    },
  });

  return user;
}
