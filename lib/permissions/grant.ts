/**
 * Permission Grant
 * Contract: PERMISSION_FUNC_GRANT
 * Evidence: IMPLEMENTATION_PLAN.md Phase 1
 */

import { prisma } from "@/lib/db";
import { Namespace, Relation } from "./types";
import { checkPermission } from "./check";

export interface GrantPermissionParams {
  namespace: Namespace;
  objectId: string;
  relation: Relation;
  subjectId: string;
  grantedBy?: string; // userId of the granter for authorization
}

/**
 * Grant a permission to a user
 * The granter must have owner or admin access to grant permissions
 */
export async function grantPermission({
  namespace,
  objectId,
  relation,
  subjectId,
  grantedBy,
}: GrantPermissionParams): Promise<{ success: boolean; error?: string }> {
  // If grantedBy is provided, verify they have permission to grant
  if (grantedBy) {
    const canGrant = await checkPermission({
      namespace,
      objectId,
      relation: "owner",
      userId: grantedBy,
    });

    if (!canGrant) {
      return { success: false, error: "Insufficient permissions to grant access" };
    }

    // Cannot grant higher permission than you have
    if (relation === "owner" && grantedBy !== subjectId) {
      const grantorRelation = await prisma.relationTuple.findFirst({
        where: { namespace, objectId, subjectId: grantedBy },
      });
      if (grantorRelation?.relation !== "owner" && grantorRelation?.relation !== "admin") {
        return { success: false, error: "Cannot grant owner permission" };
      }
    }
  }

  try {
    await prisma.relationTuple.upsert({
      where: {
        namespace_objectId_relation_subjectId: {
          namespace,
          objectId,
          relation,
          subjectId,
        },
      },
      update: {
        relation, // Update if exists with different relation
      },
      create: {
        namespace,
        objectId,
        relation,
        subjectId,
      },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to grant permission" };
  }
}

/**
 * Grant owner permission (typically on resource creation)
 */
export async function grantOwnership(
  namespace: Namespace,
  objectId: string,
  userId: string
): Promise<void> {
  await prisma.relationTuple.create({
    data: {
      namespace,
      objectId,
      relation: "owner",
      subjectId: userId,
    },
  });
}
