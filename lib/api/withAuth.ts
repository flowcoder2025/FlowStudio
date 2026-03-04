/**
 * Auth Helper for API Routes
 * Contract: API_UTIL_AUTH_HELPER
 *
 * Centralizes the repetitive auth check pattern used across API routes.
 * Eliminates DRY violation where every endpoint duplicates session validation.
 *
 * Usage:
 *   import { withAuth } from "@/lib/api/withAuth";
 *
 *   export async function GET(request: NextRequest) {
 *     return withAuth(async (userId, session) => {
 *       // userId is guaranteed to be a non-empty string
 *       const data = await fetchData(userId);
 *       return NextResponse.json(data);
 *     });
 *   }
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

/**
 * Authenticated session with guaranteed user ID
 */
export interface AuthenticatedSession extends Session {
  user: Session["user"] & { id: string };
}

/**
 * Handler function that receives the authenticated user ID and full session
 */
type AuthenticatedHandler = (
  userId: string,
  session: AuthenticatedSession
) => Promise<NextResponse>;

/**
 * Wraps an API route handler with authentication check.
 * Returns 401 if the session is missing or user ID is not present.
 *
 * @param handler - Async function that receives userId and session
 * @returns NextResponse from the handler or a 401 error response
 */
export async function withAuth(handler: AuthenticatedHandler): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handler(session.user.id, session as AuthenticatedSession);
  } catch (authError) {
    console.error("Auth error:", authError);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
