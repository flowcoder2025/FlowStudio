/**
 * NextAuth Node.js Configuration (DB-dependent)
 * Contract: AUTH_FUNC_GOOGLE_OAUTH, AUTH_FUNC_KAKAO_OAUTH, AUTH_FUNC_SESSION
 * Runtime: Node.js only (PrismaAdapter requires DB access)
 */

import type { NextAuthConfig } from "next-auth";
import type { User } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { authConfig } from "./auth.config";

export const authOptions: NextAuthConfig = {
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  events: {
    async createUser({ user }: { user: User }) {
      // Grant initial bonus credits to new users (upsert to avoid UNIQUE constraint violation)
      if (user.id) {
        await prisma.credit.upsert({
          where: { userId: user.id },
          update: {}, // No update if already exists -- prevent duplicate bonus
          create: {
            userId: user.id,
            balance: 10,
            updatedAt: new Date(),
          },
        });
        await prisma.user.update({
          where: { id: user.id },
          data: { creditBalance: 10 },
        });
        await prisma.creditTransaction.create({
          data: {
            userId: user.id,
            amount: 10,
            type: "bonus",
            description: "Welcome bonus credits",
          },
        });
      }
    },
  },
};
