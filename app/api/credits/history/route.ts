/**
 * Credit History API
 * Contract: CREDIT_FUNC_BALANCE
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCreditHistory } from "@/lib/credits/balance";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const history = await getCreditHistory(session.user.id, { limit, offset });

    return NextResponse.json(history);
  } catch (error) {
    console.error("Credit history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch credit history" },
      { status: 500 }
    );
  }
}
