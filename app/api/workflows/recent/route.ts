/**
 * Recent Workflows API
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRecentWorkflows, addRecentWorkflow } from "@/lib/workflow/history";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workflows = await getRecentWorkflows(session.user.id);
    return NextResponse.json({ success: true, workflows });
  } catch (error) {
    console.error("GET /api/workflows/recent error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent workflows" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { industry, action, intent } = body;

    if (!industry || !action) {
      return NextResponse.json(
        { error: "industry and action are required" },
        { status: 400 }
      );
    }

    const workflow = await addRecentWorkflow(session.user.id, {
      industry,
      action,
      intent,
    });

    return NextResponse.json({ success: true, workflow });
  } catch (error) {
    console.error("POST /api/workflows/recent error:", error);
    return NextResponse.json(
      { error: "Failed to save recent workflow" },
      { status: 500 }
    );
  }
}
