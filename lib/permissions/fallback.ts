/**
 * Permission Fallback
 * Contract: PERMISSION_FUNC_FALLBACK
 * Evidence: IMPLEMENTATION_PLAN.md Phase 1
 */

import { prisma } from "@/lib/db";
import { Namespace, Relation } from "./types";
import { checkPermission } from "./check";

/**
 * Check permission with userId fallback
 * If no explicit permission exists, check if the user is the resource creator
 */
export async function checkPermissionWithFallback(
  namespace: Namespace,
  objectId: string,
  userId: string,
  requiredRelation: Relation = "viewer"
): Promise<boolean> {
  // First, try standard permission check
  const hasExplicitPermission = await checkPermission({
    namespace,
    objectId,
    relation: requiredRelation,
    userId,
  });

  if (hasExplicitPermission) {
    return true;
  }

  // Fallback: Check if user is the creator of the resource
  return checkOwnershipFallback(namespace, objectId, userId);
}

/**
 * Check if user is the creator of a resource (by userId field)
 */
async function checkOwnershipFallback(
  namespace: Namespace,
  objectId: string,
  userId: string
): Promise<boolean> {
  switch (namespace) {
    case "image_project": {
      const project = await prisma.imageProject.findUnique({
        where: { id: objectId },
        select: { userId: true },
      });
      return project?.userId === userId;
    }

    case "workflow_session": {
      const session = await prisma.workflowSession.findUnique({
        where: { id: objectId },
        select: { userId: true },
      });
      return session?.userId === userId;
    }

    default:
      return false;
  }
}

/**
 * Ensure permission tuple exists for a resource owner
 * Used when creating resources to establish ownership
 */
export async function ensureOwnerPermission(
  namespace: Namespace,
  objectId: string,
  userId: string
): Promise<void> {
  // DB Schema: RelationTuple requires subjectType field
  await prisma.relationTuple.upsert({
    where: {
      namespace_objectId_relation_subjectType_subjectId: {
        namespace,
        objectId,
        relation: "owner",
        subjectType: "user",
        subjectId: userId,
      },
    },
    update: {},
    create: {
      namespace,
      objectId,
      relation: "owner",
      subjectType: "user",
      subjectId: userId,
    },
  });
}

/**
 * Migrate existing resources to have explicit permissions
 * Run this for resources created before permission system was in place
 */
export async function migrateResourcePermissions(
  namespace: Namespace
): Promise<{ migrated: number; errors: number }> {
  let migrated = 0;
  let errors = 0;

  switch (namespace) {
    case "image_project": {
      const projects = await prisma.imageProject.findMany({
        select: { id: true, userId: true },
      });

      for (const project of projects) {
        try {
          await ensureOwnerPermission("image_project", project.id, project.userId);
          migrated++;
        } catch {
          errors++;
        }
      }
      break;
    }

    case "workflow_session": {
      const sessions = await prisma.workflowSession.findMany({
        select: { id: true, userId: true },
      });

      for (const session of sessions) {
        try {
          await ensureOwnerPermission("workflow_session", session.id, session.userId);
          migrated++;
        } catch {
          errors++;
        }
      }
      break;
    }
  }

  return { migrated, errors };
}
