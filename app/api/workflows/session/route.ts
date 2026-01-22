/**
 * Workflow Session API
 * Contract: API_ROUTE_WORKFLOW_SESSION
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createSession,
  getSession,
  getUserSessions,
  updateSessionInputs,
  updateSessionStatus,
  generatePrompt,
  deleteSession,
} from "@/lib/workflow/session";

/**
 * POST /api/workflows/session
 * Create a new workflow session
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { industry, action, inputs } = body;

    if (!industry || !action) {
      return NextResponse.json(
        { error: "Industry and action are required" },
        { status: 400 }
      );
    }

    const workflowSession = await createSession(session.user.id, {
      industry,
      action,
      inputs,
    });

    return NextResponse.json(workflowSession, { status: 201 });
  } catch (error) {
    console.error("Session create error:", error);
    const message = error instanceof Error ? error.message : "Failed to create session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/workflows/session
 * Get session(s) - by ID or list user's sessions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("id");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status") || undefined;

    if (sessionId) {
      // Get specific session
      const workflowSession = await getSession(sessionId);

      if (!workflowSession) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      // Check ownership
      if (workflowSession.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return NextResponse.json(workflowSession);
    }

    // List user's sessions
    const result = await getUserSessions(session.user.id, { limit, offset, status });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Session fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/workflows/session
 * Update session (inputs, status, or generate prompt)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, inputs, status: newStatus, generatePromptFlag } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingSession = await getSession(id);
    if (!existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (existingSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update inputs
    if (inputs) {
      await updateSessionInputs(id, inputs);
    }

    // Update status
    if (newStatus) {
      await updateSessionStatus(id, newStatus);
    }

    // Generate prompt
    if (generatePromptFlag) {
      const prompt = await generatePrompt(id);
      return NextResponse.json({ prompt });
    }

    // Return updated session
    const updatedSession = await getSession(id);
    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("Session update error:", error);
    const message = error instanceof Error ? error.message : "Failed to update session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/workflows/session
 * Delete a session
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingSession = await getSession(sessionId);
    if (!existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (existingSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteSession(sessionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
