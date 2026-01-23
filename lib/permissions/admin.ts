/**
 * Admin Permission Functions
 * Contract: PERMISSION_FUNC_ADMIN
 * Evidence: IMPLEMENTATION_PLAN.md Phase 1
 */

import { prisma } from "@/lib/db";

/**
 * Check if user is a system admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const adminTuple = await prisma.relationTuple.findFirst({
    where: {
      namespace: "system",
      objectId: "global",
      relation: "admin",
      subjectId: userId,
    },
  });

  return !!adminTuple;
}

/**
 * Grant admin privileges to a user
 * Must be called by another admin or during system setup
 */
export async function grantAdmin(
  userId: string,
  grantedBy?: string
): Promise<{ success: boolean; error?: string }> {
  // If grantedBy is provided, verify they are also an admin
  if (grantedBy) {
    const grantorIsAdmin = await isAdmin(grantedBy);
    if (!grantorIsAdmin) {
      return { success: false, error: "Only admins can grant admin privileges" };
    }
  }

  try {
    // DB Schema: RelationTuple requires subjectType field
    await prisma.relationTuple.upsert({
      where: {
        namespace_objectId_relation_subjectType_subjectId: {
          namespace: "system",
          objectId: "global",
          relation: "admin",
          subjectType: "user",
          subjectId: userId,
        },
      },
      update: {},
      create: {
        namespace: "system",
        objectId: "global",
        relation: "admin",
        subjectType: "user",
        subjectId: userId,
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Failed to grant admin privileges" };
  }
}

/**
 * Revoke admin privileges from a user
 */
export async function revokeAdmin(
  userId: string,
  revokedBy: string
): Promise<{ success: boolean; error?: string }> {
  // Verify revoker is an admin
  const revokerIsAdmin = await isAdmin(revokedBy);
  if (!revokerIsAdmin) {
    return { success: false, error: "Only admins can revoke admin privileges" };
  }

  // Cannot revoke your own admin privileges
  if (userId === revokedBy) {
    return { success: false, error: "Cannot revoke your own admin privileges" };
  }

  try {
    await prisma.relationTuple.deleteMany({
      where: {
        namespace: "system",
        objectId: "global",
        relation: "admin",
        subjectId: userId,
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Failed to revoke admin privileges" };
  }
}

/**
 * List all system admins
 */
export async function listAdmins(): Promise<string[]> {
  const adminTuples = await prisma.relationTuple.findMany({
    where: {
      namespace: "system",
      objectId: "global",
      relation: "admin",
    },
    select: { subjectId: true },
  });

  return adminTuples.map((t) => t.subjectId);
}
