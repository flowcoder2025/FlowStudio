/**
 * Referral Apply API
 * Contract: API_ROUTE_USER_REFERRAL
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { applyReferralCode, getReferralStats } from "@/lib/user/referral";

/**
 * POST /api/user/referral/apply
 * Apply a referral code
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

    const { referralCode } = body;

    if (!referralCode) {
      return NextResponse.json(
        { error: "추천 코드가 필요합니다" },
        { status: 400 }
      );
    }

    const result = await applyReferralCode(session.user.id, referralCode);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      bonusCredits: result.bonusCredits,
      message: `${result.bonusCredits} 크레딧이 지급되었습니다!`,
    });
  } catch (error) {
    console.error("Referral apply error:", error);
    return NextResponse.json(
      { error: "추천 코드 적용 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/referral/apply
 * Get user's referral code and stats
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getReferralStats(session.user.id);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Referral stats fetch error:", error);
    return NextResponse.json(
      { error: "추천 정보 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
