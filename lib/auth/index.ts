/**
 * Auth Utilities
 * Contract: AUTH_FUNC_SESSION
 */

import NextAuth from "next-auth";
import { authOptions } from "./authOptions";

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

export async function getSession() {
  return auth();
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user?.id) {
    throw new Error("Unauthorized");
  }
  return user;
}
