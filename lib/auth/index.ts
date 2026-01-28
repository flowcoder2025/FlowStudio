/**
 * Auth Utilities
 * Contract: AUTH_FUNC_SESSION
 * Optimized: React.cache() for request deduplication (Vercel Best Practice: server-cache-react)
 */

import { cache } from "react";
import NextAuth from "next-auth";
import { authOptions } from "./authOptions";

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

/**
 * Cached session getter - deduplicates auth() calls within a single request
 * React.cache() ensures the same session is returned for all components
 * in the same request tree without multiple database queries
 */
export const getSession = cache(async () => {
  return auth();
});

/**
 * Cached current user getter - uses cached session
 */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  return session?.user;
});

/**
 * Require authentication - throws if not authenticated
 * Uses cached getCurrentUser for efficiency
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user?.id) {
    throw new Error("Unauthorized");
  }
  return user;
}
