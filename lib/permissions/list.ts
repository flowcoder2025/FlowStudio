/**
 * Permission List
 * Contract: PERMISSION_FUNC_LIST
 * Evidence: IMPLEMENTATION_PLAN.md Phase 1
 */

import { prisma } from "@/lib/db";
import { Namespace, Relation, RELATION_HIERARCHY } from "./types";

export interface ListAccessibleParams {
  namespace: Namespace;
  userId: string;
  relation?: Relation;
}

/**
 * List all resources a user has access to in a namespace
 */
export async function listAccessible({
  namespace,
  userId,
  relation,
}: ListAccessibleParams): Promise<string[]> {
  const whereClause: Record<string, unknown> = {
    namespace,
    subjectId: userId,
  };

  // If specific relation is required, also include higher relations
  if (relation) {
    const allowedRelations = Object.entries(RELATION_HIERARCHY)
      .filter(([_, includes]) => includes.includes(relation))
      .map(([rel]) => rel);
    whereClause.relation = { in: allowedRelations };
  }

  const tuples = await prisma.relationTuple.findMany({
    where: whereClause,
    select: { objectId: true },
  });

  return tuples.map((t) => t.objectId);
}

/**
 * List all users who have access to a resource
 */
export async function listResourceUsers(
  namespace: Namespace,
  objectId: string
): Promise<Array<{ userId: string; relation: Relation }>> {
  const tuples = await prisma.relationTuple.findMany({
    where: {
      namespace,
      objectId,
    },
    select: {
      subjectId: true,
      relation: true,
    },
  });

  return tuples.map((t) => ({
    userId: t.subjectId,
    relation: t.relation as Relation,
  }));
}

/**
 * Get accessible resources with details
 */
export async function getAccessibleWithRelation(
  namespace: Namespace,
  userId: string
): Promise<Array<{ objectId: string; relation: Relation }>> {
  const tuples = await prisma.relationTuple.findMany({
    where: {
      namespace,
      subjectId: userId,
    },
    select: {
      objectId: true,
      relation: true,
    },
  });

  return tuples.map((t) => ({
    objectId: t.objectId,
    relation: t.relation as Relation,
  }));
}
