/**
 * Workflow Session Service
 * Contract: WORKFLOW_FUNC_SESSION
 * Evidence: IMPLEMENTATION_PLAN.md Phase 3
 */

import { prisma } from "@/lib/db";
import { Industry, isValidIndustry } from "./industries";
import { getAction, Action } from "./actions";
import { grantOwnership } from "@/lib/permissions";

export interface WorkflowSessionData {
  id: string;
  userId: string;
  industry: Industry;
  action: string;
  inputs: Record<string, unknown>;
  prompt: string | null;
  status: "draft" | "generating" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSessionInput {
  industry: string;
  action: string;
  inputs?: Record<string, unknown>;
}

/**
 * Create a new workflow session
 */
export async function createSession(
  userId: string,
  input: CreateSessionInput
): Promise<WorkflowSessionData> {
  if (!isValidIndustry(input.industry)) {
    throw new Error(`Invalid industry: ${input.industry}`);
  }

  const action = getAction(input.action);
  if (!action) {
    throw new Error(`Invalid action: ${input.action}`);
  }

  const session = await prisma.workflowSession.create({
    data: {
      userId,
      industry: input.industry,
      action: input.action,
      inputs: (input.inputs || {}) as object,
      status: "draft",
    },
  });

  // Grant ownership permission
  await grantOwnership("workflow_session", session.id, userId);

  return session as WorkflowSessionData;
}

/**
 * Update session inputs
 */
export async function updateSessionInputs(
  sessionId: string,
  inputs: Record<string, unknown>
): Promise<WorkflowSessionData> {
  const session = await prisma.workflowSession.update({
    where: { id: sessionId },
    data: { inputs: inputs as object },
  });

  return session as WorkflowSessionData;
}

/**
 * Generate prompt for session
 */
export async function generatePrompt(sessionId: string): Promise<string> {
  const session = await prisma.workflowSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  const action = getAction(session.action);
  if (!action) {
    throw new Error(`Action not found: ${session.action}`);
  }

  // Replace template variables with input values
  const inputs = session.inputs as Record<string, unknown>;
  let prompt = action.promptTemplate;

  for (const [key, value] of Object.entries(inputs)) {
    const placeholder = `{{${key}}}`;
    prompt = prompt.replace(new RegExp(placeholder, "g"), String(value));
  }

  // Update session with generated prompt
  await prisma.workflowSession.update({
    where: { id: sessionId },
    data: { prompt },
  });

  return prompt;
}

/**
 * Update session status
 */
export async function updateSessionStatus(
  sessionId: string,
  status: WorkflowSessionData["status"]
): Promise<void> {
  await prisma.workflowSession.update({
    where: { id: sessionId },
    data: { status },
  });
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<WorkflowSessionData | null> {
  const session = await prisma.workflowSession.findUnique({
    where: { id: sessionId },
  });

  return session as WorkflowSessionData | null;
}

/**
 * Get user's sessions
 */
export async function getUserSessions(
  userId: string,
  options: { limit?: number; offset?: number; status?: string } = {}
): Promise<{ sessions: WorkflowSessionData[]; total: number }> {
  const { limit = 20, offset = 0, status } = options;

  const where = {
    userId,
    ...(status && { status }),
  };

  const [sessions, total] = await Promise.all([
    prisma.workflowSession.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.workflowSession.count({ where }),
  ]);

  return {
    sessions: sessions as WorkflowSessionData[],
    total,
  };
}

/**
 * Delete session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await prisma.workflowSession.delete({
    where: { id: sessionId },
  });
}
