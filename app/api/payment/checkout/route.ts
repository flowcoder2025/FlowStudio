/**
 * Checkout API Route
 * Contract: PAYMENT_FUNC_CHECKOUT
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createCreditPackageCheckout,
  createSubscriptionCheckout,
  getCreditPackages,
  getSubscriptionPlans,
} from "@/lib/payment/checkout";
import { z } from "zod";

const checkoutSchema = z.object({
  type: z.enum(["credit_package", "subscription"]),
  itemId: z.string().min(1),
});

/**
 * POST - Create checkout session
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = checkoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { type, itemId } = validation.data;

    let result;
    if (type === "credit_package") {
      result = await createCreditPackageCheckout(
        itemId,
        session.user.id,
        session.user.email || undefined
      );
    } else {
      result = await createSubscriptionCheckout(
        itemId,
        session.user.id,
        session.user.email || undefined
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create checkout" },
      { status: 500 }
    );
  }
}

/**
 * GET - Get available packages and plans
 */
export async function GET() {
  try {
    const creditPackages = getCreditPackages();
    const subscriptionPlans = getSubscriptionPlans();

    return NextResponse.json({
      creditPackages,
      subscriptionPlans,
    });
  } catch (error) {
    console.error("Get pricing error:", error);
    return NextResponse.json(
      { error: "Failed to get pricing" },
      { status: 500 }
    );
  }
}
