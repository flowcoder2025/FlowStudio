/**
 * Business Verification API
 * Contract: API_ROUTE_USER_BUSINESS_VERIFY
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifyBusinessNumber, getBusinessStatus } from "@/lib/user/businessVerify";

/**
 * POST /api/user/business/verify
 * Verify business registration number
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate & Parse body in parallel (Vercel Best Practice: async-parallel)
    const [session, body] = await Promise.all([
      auth(),
      request.json(),
    ]);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessNumber } = body;

    if (!businessNumber) {
      return NextResponse.json(
        { error: "사업자번호가 필요합니다" },
        { status: 400 }
      );
    }

    const result = await verifyBusinessNumber(session.user.id, { businessNumber });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: result.verified,
    });
  } catch (error) {
    console.error("Business verify error:", error);
    return NextResponse.json(
      { error: "사업자 인증 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/business/verify
 * Get business verification status
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = await getBusinessStatus(session.user.id);
    return NextResponse.json(status);
  } catch (error) {
    console.error("Business status fetch error:", error);
    return NextResponse.json(
      { error: "인증 상태 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
