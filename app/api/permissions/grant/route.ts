/**
 * Permission Grant API
 * Contract: API_ROUTE_PERMISSION_GRANT
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { grantPermission } from "@/lib/permissions/grant";
import { Namespace, Relation } from "@/lib/permissions/types";

/**
 * POST /api/permissions/grant
 * Grant a permission to a user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { namespace, objectId, relation, subjectId } = body;

    // Validate required fields
    if (!namespace || !objectId || !relation || !subjectId) {
      return NextResponse.json(
        { error: "namespace, objectId, relation, and subjectId are required" },
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

    // Validate relation
    const validRelations: Relation[] = ["owner", "editor", "viewer", "admin"];
    if (!validRelations.includes(relation)) {
      return NextResponse.json(
        { error: "Invalid relation" },
        { status: 400 }
      );
    }

    const result = await grantPermission({
      namespace,
      objectId,
      relation,
      subjectId,
      grantedBy: session.user.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Permission grant error:", error);
    return NextResponse.json(
      { error: "Failed to grant permission" },
      { status: 500 }
    );
  }
}
