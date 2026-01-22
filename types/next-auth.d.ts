/**
 * NextAuth Type Extensions
 */

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      provider?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    creditBalance?: number;
    businessVerified?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    accessToken?: string;
    provider?: string;
  }
}
