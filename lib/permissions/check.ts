/**
 * Permission Check
 * Contract: PERMISSION_FUNC_CHECK
 * Evidence: IMPLEMENTATION_PLAN.md Phase 1
 */

import { prisma } from "@/lib/db";
import { Namespace, Relation, hasPermission } from "./types";

export interface CheckPermissionParams {
  namespace: Namespace;
  objectId: string;
  relation: Relation;
  userId: string;
}

/**
 * Check if a user has a specific permission on a resource
 */
export async function checkPermission({
  namespace,
  objectId,
  relation,
  userId,
}: CheckPermissionParams): Promise<boolean> {
  // Check for direct relation
  const tuple = await prisma.relationTuple.findFirst({
    where: {
      namespace,
      objectId,
      subjectId: userId,
    },
  });

  if (tuple) {
    return hasPermission(tuple.relation as Relation, relation);
  }

  // Check for system admin (has access to everything)
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
 * Get user's relation to a resource
 */
export async function getUserRelation(
  namespace: Namespace,
  objectId: string,
  userId: string
): Promise<Relation | null> {
  const tuple = await prisma.relationTuple.findFirst({
    where: {
      namespace,
      objectId,
      subjectId: userId,
    },
  });

  return tuple?.relation as Relation | null;
}

/**
 * Check if user can perform action (with fallback to owner check)
 */
export async function canAccess(
  namespace: Namespace,
  objectId: string,
  userId: string,
  requiredRelation: Relation = "viewer"
): Promise<boolean> {
  return checkPermission({
    namespace,
    objectId,
    relation: requiredRelation,
    userId,
  });
}
