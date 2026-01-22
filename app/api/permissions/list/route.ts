/**
 * Permission List API
 * Contract: API_ROUTE_PERMISSION_LIST
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listAccessible, listResourceUsers, getAccessibleWithRelation } from "@/lib/permissions/list";
import { checkPermission } from "@/lib/permissions/check";
import { Namespace, Relation } from "@/lib/permissions/types";

/**
 * GET /api/permissions/list
 * List permissions - either resources user has access to, or users with access to a resource
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const namespace = searchParams.get("namespace") as Namespace;
    const objectId = searchParams.get("objectId");
    const relation = searchParams.get("relation") as Relation | undefined;
    const mode = searchParams.get("mode") || "accessible"; // "accessible" | "users" | "detailed"

    // Validate namespace
    if (!namespace) {
      return NextResponse.json(
        { error: "namespace is required" },
        { status: 400 }
      );
    }

    const validNamespaces: Namespace[] = ["image_project", "workflow_session", "system"];
    if (!validNamespaces.includes(namespace)) {
      return NextResponse.json(
        { error: "Invalid namespace" },
        { status: 400 }
      );
    }

    // Mode: List users with access to a specific resource
    if (mode === "users" && objectId) {
      // Verify requester has at least viewer access to see the list
      const hasAccess = await checkPermission({
        namespace,
        objectId,
        relation: "viewer",
        userId: session.user.id,
      });

      if (!hasAccess) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }

      const users = await listResourceUsers(namespace, objectId);
      return NextResponse.json({ users });
    }

    // Mode: List resources with relation details
    if (mode === "detailed") {
      const resources = await getAccessibleWithRelation(namespace, session.user.id);
      return NextResponse.json({ resources });
    }

    // Default Mode: List accessible resource IDs
    const resourceIds = await listAccessible({
      namespace,
      userId: session.user.id,
      relation: relation || undefined,
    });

    return NextResponse.json({ resourceIds });
  } catch (error) {
    console.error("Permission list error:", error);
    return NextResponse.json(
      { error: "Failed to list permissions" },
      { status: 500 }
    );
  }
}
