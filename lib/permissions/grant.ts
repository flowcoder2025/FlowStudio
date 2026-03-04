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
  // Determine the effective granter for authorization checks
  const effectiveGranter = grantedBy || subjectId;

  // For elevated roles (owner/admin), the granter must actually hold owner on this resource
  if (relation === "owner" || relation === "admin") {
    const granterIsOwner = await checkPermission({
      namespace,
      objectId,
      relation: "owner",
      userId: effectiveGranter,
    });

    if (!granterIsOwner) {
      return { success: false, error: "Only owners can grant owner or admin permissions" };
    }

    // Block self-escalation: if no explicit grantedBy, the subject cannot elevate themselves
    if (!grantedBy || grantedBy === subjectId) {
      // Check if the subject already holds owner -- if not, this is self-escalation
      const subjectIsOwner = await checkPermission({
        namespace,
        objectId,
        relation: "owner",
        userId: subjectId,
      });
      if (!subjectIsOwner) {
        return { success: false, error: "Cannot escalate your own permissions" };
      }
    }
  } else if (grantedBy) {
    // For non-elevated roles, granter still needs owner permission on the resource
    const canGrant = await checkPermission({
      namespace,
      objectId,
      relation: "owner",
      userId: grantedBy,
    });

    if (!canGrant) {
      return { success: false, error: "Insufficient permissions to grant access" };
    }
  }

  try {
    // DB Schema: RelationTuple requires subjectType field
    await prisma.relationTuple.upsert({
      where: {
        namespace_objectId_relation_subjectType_subjectId: {
          namespace,
          objectId,
          relation,
          subjectType: "user",
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
        subjectType: "user",
        subjectId,
      },
    });

    return { success: true };
  } catch {
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
  // DB Schema: RelationTuple requires subjectType field
  await prisma.relationTuple.create({
    data: {
      namespace,
      objectId,
      relation: "owner",
      subjectType: "user",
      subjectId: userId,
    },
  });
}
