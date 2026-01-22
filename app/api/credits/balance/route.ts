/**
 * Credit Balance API
 * Contract: CREDIT_FUNC_BALANCE
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCreditBalance } from "@/lib/credits/balance";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const balance = await getCreditBalance(session.user.id);

    return NextResponse.json(balance);
  } catch (error) {
    console.error("Credit balance error:", error);
    return NextResponse.json(
      { error: "Failed to fetch credit balance" },
      { status: 500 }
    );
  }
}
