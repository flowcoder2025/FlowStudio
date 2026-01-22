/**
 * Permission Revoke
 * Contract: PERMISSION_FUNC_REVOKE
 * Evidence: IMPLEMENTATION_PLAN.md Phase 1
 */

import { prisma } from "@/lib/db";
import { Namespace, Relation } from "./types";
import { checkPermission } from "./check";

export interface RevokePermissionParams {
  namespace: Namespace;
  objectId: string;
  relation?: Relation; // If not provided, revokes all relations
  subjectId: string;
  revokedBy?: string; // userId of the revoker for authorization
}

/**
 * Revoke a permission from a user
 * The revoker must have owner or admin access to revoke permissions
 */
export async function revokePermission({
  namespace,
  objectId,
  relation,
  subjectId,
  revokedBy,
}: RevokePermissionParams): Promise<{ success: boolean; error?: string }> {
  // If revokedBy is provided, verify they have permission to revoke
  if (revokedBy) {
    const canRevoke = await checkPermission({
      namespace,
      objectId,
      relation: "owner",
      userId: revokedBy,
    });

    if (!canRevoke) {
      return { success: false, error: "Insufficient permissions to revoke access" };
    }

    // Cannot revoke your own owner permission (prevent orphaned resources)
    if (revokedBy === subjectId && relation === "owner") {
      return { success: false, error: "Cannot revoke your own owner permission" };
    }
  }

  try {
    if (relation) {
      // Revoke specific relation
      await prisma.relationTuple.deleteMany({
        where: {
          namespace,
          objectId,
          relation,
          subjectId,
        },
      });
    } else {
      // Revoke all relations for this subject
      await prisma.relationTuple.deleteMany({
        where: {
          namespace,
          objectId,
          subjectId,
        },
      });
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to revoke permission" };
  }
}

/**
 * Revoke all permissions for a resource (cleanup on delete)
 */
export async function revokeAllPermissions(
  namespace: Namespace,
  objectId: string
): Promise<void> {
  await prisma.relationTuple.deleteMany({
    where: {
      namespace,
      objectId,
    },
  });
}
