/**
 * Permission Middleware
 * Contract: PERMISSION_FUNC_MIDDLEWARE
 * Evidence: IMPLEMENTATION_PLAN.md Phase 1
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { checkPermission } from "./check";
import { Namespace, Relation } from "./types";

export interface MiddlewareConfig {
  namespace: Namespace;
  getObjectId: (req: NextRequest) => string | null;
  relation: Relation;
  fallbackToOwner?: boolean;
}

/**
 * Create a permission middleware for API routes
 */
export function createPermissionMiddleware(config: MiddlewareConfig) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const token = await getToken({ req });

    if (!token?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const objectId = config.getObjectId(req);

    if (!objectId) {
      return NextResponse.json(
        { error: "Resource not specified" },
        { status: 400 }
      );
    }

    const hasAccess = await checkPermission({
      namespace: config.namespace,
      objectId,
      relation: config.relation,
      userId: token.id as string,
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Permission granted, return null to continue
    return null;
  };
}

/**
 * Higher-order function to wrap API handlers with permission check
 */
export function withPermission<T extends unknown[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>,
  config: MiddlewareConfig
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const permissionResult = await createPermissionMiddleware(config)(req);

    if (permissionResult) {
      return permissionResult;
    }

    return handler(req, ...args);
  };
}

/**
 * Utility to extract resource ID from URL path
 */
export function extractIdFromPath(
  req: NextRequest,
  paramName: string = "id"
): string | null {
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/");

  // Find the param in the path (simplified approach)
  // In actual use, Next.js provides this through route params
  const idIndex = pathParts.findIndex((part) => part === paramName) + 1;

  if (idIndex > 0 && idIndex < pathParts.length) {
    return pathParts[idIndex];
  }

  // Try to get from search params as fallback
  return url.searchParams.get(paramName);
}
