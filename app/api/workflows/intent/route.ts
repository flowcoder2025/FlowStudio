/**
 * Intent Analysis API
 * Contract: API_INTENT_ANALYZE
 * Evidence: Workflow Guide System Phase 7
 *
 * POST /api/workflows/intent - 사용자 입력 분석
 * GET /api/workflows/intent - 카테고리/업종별 의도 목록 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { Industry, isValidIndustry } from "@/lib/workflow/industries";
import {
  matchIntent,
  suggestIntentsForCategory,
  quickSuggestIntents,
  EXPRESSION_CATEGORY_INFO,
  EXPRESSION_INTENT_INFO,
  PURPOSE_INTENT_INFO,
  type ExpressionCategory,
} from "@/lib/workflow/intents";

// ============================================================
// POST - 사용자 입력 분석
// ============================================================

interface AnalyzeRequestBody {
  text: string;
  industry?: Industry;
  referenceImageUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequestBody = await request.json();

    if (!body.text || typeof body.text !== "string") {
      return NextResponse.json(
        { error: "text 필드가 필요합니다." },
        { status: 400 }
      );
    }

    if (body.text.length > 1000) {
      return NextResponse.json(
        { error: "text는 1000자 이내여야 합니다." },
        { status: 400 }
      );
    }

    // 의도 분석 수행
    const result = matchIntent(body.text);

    // 업종이 명시적으로 제공된 경우 오버라이드
    if (body.industry && isValidIndustry(body.industry)) {
      result.industry.detected = body.industry;
      result.industry.confidence = 1;
    }

    // 참조 이미지 URL이 있으면 메타 정보에 추가
    if (body.referenceImageUrl) {
      result.meta = {
        ...result.meta,
        referenceImageUrl: body.referenceImageUrl,
      } as typeof result.meta & { referenceImageUrl: string };
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Intent analysis error:", error);
    return NextResponse.json(
      { error: "의도 분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// ============================================================
// GET - 의도 목록 조회
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "categories" | "intents" | "purposes" | "quick"
    const category = searchParams.get("category") as ExpressionCategory | null;
    const industry = searchParams.get("industry") as Industry | null;
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // 카테고리 목록 조회
    if (type === "categories") {
      const categories = Object.entries(EXPRESSION_CATEGORY_INFO).map(
        ([id, info]) => ({
          id,
          ...info,
        })
      );
      return NextResponse.json({
        success: true,
        data: categories,
      });
    }

    // 목적 목록 조회
    if (type === "purposes") {
      const purposes = Object.entries(PURPOSE_INTENT_INFO).map(
        ([purposeId, info]) => ({
          ...info,
          id: purposeId,
        })
      );
      return NextResponse.json({
        success: true,
        data: purposes,
      });
    }

    // 빠른 추천 (업종 기반)
    if (type === "quick" && industry && isValidIndustry(industry)) {
      const suggestions = quickSuggestIntents(industry, limit);
      return NextResponse.json({
        success: true,
        data: suggestions,
      });
    }

    // 카테고리별 의도 목록 조회
    if (type === "intents" && category) {
      const validCategories = Object.keys(EXPRESSION_CATEGORY_INFO);
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: "유효하지 않은 카테고리입니다." },
          { status: 400 }
        );
      }

      const industryParam = industry && isValidIndustry(industry) ? industry : undefined;
      const intents = suggestIntentsForCategory(category, industryParam);

      const intentDetails = intents.map((intentId) => ({
        ...EXPRESSION_INTENT_INFO[intentId],
        id: intentId,
      }));

      return NextResponse.json({
        success: true,
        data: intentDetails,
      });
    }

    // 전체 의도 목록 (기본)
    const allIntents = Object.entries(EXPRESSION_INTENT_INFO).map(
      ([intentId, info]) => ({
        ...info,
        id: intentId,
      })
    );

    return NextResponse.json({
      success: true,
      data: allIntents.slice(0, limit),
      total: allIntents.length,
    });
  } catch (error) {
    console.error("Intent list error:", error);
    return NextResponse.json(
      { error: "의도 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
