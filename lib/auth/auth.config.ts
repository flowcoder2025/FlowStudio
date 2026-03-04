/**
 * NextAuth Edge-Safe Configuration
 * Contract: AUTH_FUNC_GOOGLE_OAUTH, AUTH_FUNC_KAKAO_OAUTH, AUTH_FUNC_SESSION
 * Runtime: Edge-compatible (no DB, no Node.js-only deps)
 */

import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Session, User, Account } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";

export const authConfig: NextAuthConfig = {
  providers: [
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
    async signIn({ user }: { user?: User | AdapterUser }) {
      // Block users without email
      if (!user?.email) {
        return false;
      }

      // Check blocked email list from environment variable
      const blockedEmails = process.env.BLOCKED_EMAILS;
      if (blockedEmails) {
        const blockedList = blockedEmails.split(",").map((e) => e.trim().toLowerCase());
        if (blockedList.includes(user.email.toLowerCase())) {
          return false;
        }
      }

      return true;
    },
  },
  debug: process.env.NODE_ENV === "development",
};
