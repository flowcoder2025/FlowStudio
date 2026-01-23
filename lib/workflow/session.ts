/**
 * Workflow Session Service
 * Contract: WORKFLOW_FUNC_SESSION
 * Evidence: IMPLEMENTATION_PLAN.md Phase 3
 *
 * 기존 DB 스키마 호환:
 * - industryId (not industry)
 * - actionId (not action)
 * - stepData (not inputs)
 * - workflowId (required)
 */

import { prisma } from "@/lib/db";
import { Industry, isValidIndustry } from "./industries";
import { getAction } from "./actions";
import { grantOwnership } from "@/lib/permissions";

export interface WorkflowSessionData {
  id: string;
  userId: string;
  industry: Industry;
  action: string;
  inputs: Record<string, unknown>;
  prompt: string | null;
  status: "draft" | "generating" | "completed" | "failed" | "IN_PROGRESS";
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSessionInput {
  industry: string;
  action: string;
  inputs?: Record<string, unknown>;
}

// DB 스키마의 status를 우리 status로 변환
function mapDbStatus(dbStatus: string): WorkflowSessionData["status"] {
  const statusMap: Record<string, WorkflowSessionData["status"]> = {
    IN_PROGRESS: "generating",
    COMPLETED: "completed",
    FAILED: "failed",
    draft: "draft",
    generating: "generating",
    completed: "completed",
    failed: "failed",
  };
  return statusMap[dbStatus] || "draft";
}

// DB 레코드를 WorkflowSessionData로 변환
function mapDbToSession(dbSession: {
  id: string;
  userId: string;
  industryId: string;
  actionId: string;
  stepData: unknown;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): WorkflowSessionData {
  return {
    id: dbSession.id,
    userId: dbSession.userId,
    industry: dbSession.industryId as Industry,
    action: dbSession.actionId,
    inputs: (dbSession.stepData as Record<string, unknown>) || {},
    prompt: null, // DB에 prompt 필드 없음
    status: mapDbStatus(dbSession.status),
    createdAt: dbSession.createdAt,
    updatedAt: dbSession.updatedAt,
  };
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

  // 기존 DB 스키마에 맞게 데이터 생성
  const session = await prisma.workflowSession.create({
    data: {
      userId,
      workflowId: `${input.industry}_${input.action}`,
      industryId: input.industry,
      actionId: input.action,
      schemaVersion: "1.0.0",
      totalSteps: 1,
      stepData: (input.inputs || {}) as object,
      status: "IN_PROGRESS",
    },
  });

  // Grant ownership permission
  await grantOwnership("workflow_session", session.id, userId);

  return mapDbToSession(session);
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
    data: { stepData: inputs as object },
  });

  return mapDbToSession(session);
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

  const action = getAction(session.actionId);
  if (!action) {
    throw new Error(`Action not found: ${session.actionId}`);
  }

  // Replace template variables with input values
  const inputs = session.stepData as Record<string, unknown>;
  let prompt = action.promptTemplate;

  for (const [key, value] of Object.entries(inputs)) {
    const placeholder = `{{${key}}}`;
    prompt = prompt.replace(new RegExp(placeholder, "g"), String(value));
  }

  // DB에 prompt 필드가 없으므로 stepData에 저장
  await prisma.workflowSession.update({
    where: { id: sessionId },
    data: {
      stepData: { ...inputs, _generatedPrompt: prompt } as object
    },
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
  // 우리 status를 DB status로 변환
  const dbStatusMap: Record<string, string> = {
    draft: "draft",
    generating: "IN_PROGRESS",
    completed: "COMPLETED",
    failed: "FAILED",
    IN_PROGRESS: "IN_PROGRESS",
  };

  await prisma.workflowSession.update({
    where: { id: sessionId },
    data: { status: dbStatusMap[status] || status },
  });
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<WorkflowSessionData | null> {
  const session = await prisma.workflowSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) return null;
  return mapDbToSession(session);
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
    sessions: sessions.map(mapDbToSession),
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
