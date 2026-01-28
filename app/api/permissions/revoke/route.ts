/**
 * Permission Revoke API
 * Contract: API_ROUTE_PERMISSION_REVOKE
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { revokePermission } from "@/lib/permissions/revoke";
import { Namespace, Relation } from "@/lib/permissions/types";

/**
 * DELETE /api/permissions/revoke
 * Revoke a permission from a user
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const namespace = searchParams.get("namespace") as Namespace;
    const objectId = searchParams.get("objectId");
    const relation = searchParams.get("relation") as Relation | undefined;
    const subjectId = searchParams.get("subjectId");

    // Validate required fields
    if (!namespace || !objectId || !subjectId) {
      return NextResponse.json(
        { error: "namespace, objectId, and subjectId are required" },
        { status: 400 }
      );
    }

    // Validate namespace
    const validNamespaces: Namespace[] = ["image_project", "workflow_session", "system"];
    if (!validNamespaces.includes(namespace)) {
      return NextResponse.json(
        { error: "Invalid namespace" },
        { status: 400 }
      );
    }

    // Validate relation if provided
    if (relation) {
      const validRelations: Relation[] = ["owner", "editor", "viewer", "admin"];
      if (!validRelations.includes(relation)) {
        return NextResponse.json(
          { error: "Invalid relation" },
          { status: 400 }
        );
      }
    }

    const result = await revokePermission({
      namespace,
      objectId,
      relation: relation || undefined,
      subjectId,
      revokedBy: session.user.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Permission revoke error:", error);
    return NextResponse.json(
      { error: "Failed to revoke permission" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/permissions/revoke
 * Alternative: Revoke via POST body (for complex operations)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate & Parse body in parallel (Vercel Best Practice: async-parallel)
    const [session, body] = await Promise.all([
      auth(),
      request.json(),
    ]);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { namespace, objectId, relation, subjectId } = body;

    // Validate required fields
    if (!namespace || !objectId || !subjectId) {
      return NextResponse.json(
        { error: "namespace, objectId, and subjectId are required" },
        { status: 400 }
      );
    }

    const result = await revokePermission({
      namespace,
      objectId,
      relation: relation || undefined,
      subjectId,
      revokedBy: session.user.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Permission revoke error:", error);
    return NextResponse.json(
      { error: "Failed to revoke permission" },
      { status: 500 }
    );
  }
}
