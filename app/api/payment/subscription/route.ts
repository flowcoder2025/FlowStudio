/**
 * Subscription Management API Route
 * Contract: PAYMENT_FUNC_SUBSCRIPTION
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getUserSubscription,
  getUserPlan,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  changeSubscriptionPlan,
  getCustomerPortalUrl,
  getUpdatePaymentMethodUrl,
  getSubscriptionHistory,
} from "@/lib/payment";
import { z } from "zod";

/**
 * GET - Get user's subscription info
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

    if (action === "history") {
      const history = await getSubscriptionHistory(session.user.id);
      return NextResponse.json({ history });
    }

    const [subscription, plan] = await Promise.all([
      getUserSubscription(session.user.id),
      getUserPlan(session.user.id),
    ]);

    return NextResponse.json({
      subscription,
      plan,
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return NextResponse.json(
      { error: "Failed to get subscription" },
      { status: 500 }
    );
  }
}

const updateSchema = z.object({
  action: z.enum(["pause", "resume", "cancel", "change_plan", "portal", "update_payment"]),
  subscriptionId: z.string().min(1),
  newPlanId: z.string().optional(),
});

/**
 * PUT - Update subscription (pause, resume, cancel, change plan)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { action, subscriptionId, newPlanId } = validation.data;

    switch (action) {
      case "pause":
        await pauseSubscription(subscriptionId);
        return NextResponse.json({ message: "Subscription paused" });

      case "resume":
        await resumeSubscription(subscriptionId);
        return NextResponse.json({ message: "Subscription resumed" });

      case "cancel":
        await cancelSubscription(subscriptionId);
        return NextResponse.json({ message: "Subscription cancelled" });

      case "change_plan":
        if (!newPlanId) {
          return NextResponse.json(
            { error: "newPlanId is required for plan change" },
            { status: 400 }
          );
        }
        await changeSubscriptionPlan(subscriptionId, newPlanId);
        return NextResponse.json({ message: "Plan changed successfully" });

      case "portal":
        const portalUrl = await getCustomerPortalUrl(subscriptionId);
        return NextResponse.json({ url: portalUrl });

      case "update_payment":
        const paymentUrl = await getUpdatePaymentMethodUrl(subscriptionId);
        return NextResponse.json({ url: paymentUrl });

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Update subscription error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update subscription" },
      { status: 500 }
    );
  }
}
