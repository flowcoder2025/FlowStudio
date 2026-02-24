/**
 * Recent Workflow History - Server-side persistence
 */

import prisma from "@/lib/db";

const MAX_RECENT_WORKFLOWS = 20;

interface RecentWorkflowInput {
  industry: string;
  action: string;
  intent?: string;
}

export interface RecentWorkflowRecord {
  id: string;
  industry: string;
  action: string;
  intent: string | null;
  createdAt: Date;
}

/**
 * Get recent workflows for a user
 */
export async function getRecentWorkflows(
  userId: string,
  limit = MAX_RECENT_WORKFLOWS
): Promise<RecentWorkflowRecord[]> {
  return prisma.recentWorkflow.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      industry: true,
      action: true,
      intent: true,
      createdAt: true,
    },
  });
}

/**
 * Add a workflow to recent history.
 * Deduplicates same industry+action and keeps max count.
 */
export async function addRecentWorkflow(
  userId: string,
  workflow: RecentWorkflowInput
): Promise<RecentWorkflowRecord> {
  // Remove existing duplicate (same industry + action)
  await prisma.recentWorkflow.deleteMany({
    where: {
      userId,
      industry: workflow.industry,
      action: workflow.action,
    },
  });

  // Insert new entry
  const created = await prisma.recentWorkflow.create({
    data: {
      userId,
      industry: workflow.industry,
      action: workflow.action,
      intent: workflow.intent,
    },
    select: {
      id: true,
      industry: true,
      action: true,
      intent: true,
      createdAt: true,
    },
  });

  // Trim old entries beyond max
  const all = await prisma.recentWorkflow.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (all.length > MAX_RECENT_WORKFLOWS) {
    const idsToDelete = all.slice(MAX_RECENT_WORKFLOWS).map((r) => r.id);
    await prisma.recentWorkflow.deleteMany({
      where: { id: { in: idsToDelete } },
    });
  }

  return created;
}
