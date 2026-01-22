/**
 * Payment History API Route
 * Contract: PAYMENT_FUNC_HISTORY
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getPaymentHistory,
  getBillingSummary,
  getPaymentStats,
  getInvoiceData,
} from "@/lib/payment";

/**
 * GET - Get payment history, billing summary, or invoice
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");

    switch (action) {
      case "summary": {
        const summary = await getBillingSummary(session.user.id);
        return NextResponse.json(summary);
      }

      case "stats": {
        const stats = await getPaymentStats(session.user.id);
        return NextResponse.json(stats);
      }

      case "invoice": {
        const paymentId = searchParams.get("paymentId");
        if (!paymentId) {
          return NextResponse.json(
            { error: "paymentId is required" },
            { status: 400 }
          );
        }
        const invoice = await getInvoiceData(paymentId, session.user.id);
        if (!invoice) {
          return NextResponse.json(
            { error: "Invoice not found" },
            { status: 404 }
          );
        }
        return NextResponse.json(invoice);
      }

      default: {
        // Default: return payment history
        const limit = parseInt(searchParams.get("limit") || "20", 10);
        const offset = parseInt(searchParams.get("offset") || "0", 10);
        const status = searchParams.get("status") || undefined;

        const history = await getPaymentHistory(session.user.id, {
          limit,
          offset,
          status,
        });

        return NextResponse.json(history);
      }
    }
  } catch (error) {
    console.error("Get payment history error:", error);
    return NextResponse.json(
      { error: "Failed to get payment history" },
      { status: 500 }
    );
  }
}
