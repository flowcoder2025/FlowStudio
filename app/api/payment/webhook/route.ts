/**
 * Polar Webhook API Route
 * Contract: PAYMENT_FUNC_WEBHOOK
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 *
 * Payment Provider: Polar (https://polar.sh)
 */

import { NextRequest, NextResponse } from "next/server";
import { handleWebhook } from "@/lib/payment/webhook";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("X-Polar-Signature") ||
                      request.headers.get("Polar-Signature") ||
                      request.headers.get("X-Signature");

    const result = await handleWebhook(rawBody, signature);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: result.message, eventId: result.eventId },
      { status: 200 }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
