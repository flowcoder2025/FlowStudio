/**
 * Permission Types
 * Contract: PERMISSION_FUNC_*
 */

export type Namespace = "image_project" | "workflow_session" | "system";

export type Relation = "owner" | "editor" | "viewer" | "admin";

export interface RelationTuple {
  namespace: Namespace;
  objectId: string;
  relation: Relation;
  subjectId: string;
}

export interface PermissionCheck {
  namespace: Namespace;
  objectId: string;
  relation: Relation;
  userId: string;
}

// Relation hierarchy: owner > editor > viewer
export const RELATION_HIERARCHY: Record<Relation, Relation[]> = {
  owner: ["owner", "editor", "viewer"],
  editor: ["editor", "viewer"],
  viewer: ["viewer"],
  admin: ["admin", "owner", "editor", "viewer"],
};

export function hasPermission(
  userRelation: Relation | undefined,
  requiredRelation: Relation
): boolean {
  if (!userRelation) return false;
  return RELATION_HIERARCHY[userRelation]?.includes(requiredRelation) ?? false;
}
