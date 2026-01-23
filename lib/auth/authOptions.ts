/**
 * NextAuth Configuration
 * Contract: AUTH_FUNC_GOOGLE_OAUTH, AUTH_FUNC_KAKAO_OAUTH, AUTH_FUNC_SESSION
 * Evidence: IMPLEMENTATION_PLAN.md Phase 1
 */

import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import { prisma } from "@/lib/db";
import type { User, Account, Profile } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Contract: AUTH_FUNC_GOOGLE_OAUTH
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    // Contract: AUTH_FUNC_KAKAO_OAUTH
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    // Contract: AUTH_FUNC_SESSION
    async jwt({ token, user, account }: { token: JWT; user?: User | AdapterUser; account?: Account | null }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.provider = token.provider as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Allow sign in
      return true;
    },
  },
  events: {
    async createUser({ user }: { user: User }) {
      // Grant initial bonus credits to new users
      // DB Schema: Credit has only balance (1:1 with User), requires updatedAt
      if (user.id) {
        // Create Credit record with initial balance
        await prisma.credit.create({
          data: {
            userId: user.id,
            balance: 10, // Welcome bonus: 10 credits
            updatedAt: new Date(),
          },
        });
        // Update user's creditBalance
        await prisma.user.update({
          where: { id: user.id },
          data: { creditBalance: 10 },
        });
        // Record bonus transaction
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
  debug: process.env.NODE_ENV === "development",
};
