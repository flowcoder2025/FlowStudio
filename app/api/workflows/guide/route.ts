/**
 * Workflow Guide API
 * Contract: API_GUIDE_STEPS
 * Evidence: Workflow Guide System Phase 7
 *
 * POST /api/workflows/guide - 가이드 생성/업데이트
 * GET /api/workflows/guide - 가이드 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { Industry, isValidIndustry } from "@/lib/workflow/industries";
import {
  isExpressionIntent,
  type ExpressionIntent,
} from "@/lib/workflow/intents";
import {
  generateDynamicGuide,
  processUserSelection,
  skipStep,
  goToPreviousStep,
  resetGuide,
  isGuideComplete,
  getNextStep,
  calculateProgress,
  canSkipStep,
  getSkippableSteps,
  type DynamicGuide,
  type StepType,
} from "@/lib/workflow/guide";
import {
  generateRecommendations,
  type RecommendationResponse,
} from "@/lib/workflow/recommend";
import { matchIntent } from "@/lib/workflow/intents";

// ============================================================
// 타입 정의
// ============================================================

interface CreateGuideRequest {
  intent: ExpressionIntent;
  industry: Industry;
}

interface UpdateGuideRequest {
  guide: DynamicGuide;
  action: "select" | "skip" | "back" | "reset";
  stepId?: StepType;
  selection?: string | string[];
}

interface GuideResponse {
  success: boolean;
  guide: DynamicGuide;
  meta: {
    progress: number;
    isComplete: boolean;
    nextStep: ReturnType<typeof getNextStep>;
    skippableSteps: ReturnType<typeof getSkippableSteps>;
  };
  recommendations?: RecommendationResponse;
}

// ============================================================
// POST - 가이드 생성/업데이트
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 새 가이드 생성
    if (body.intent && body.industry) {
      return handleCreateGuide(body as CreateGuideRequest);
    }

    // 기존 가이드 업데이트
    if (body.guide && body.action) {
      return handleUpdateGuide(body as UpdateGuideRequest);
    }

    // 자연어 입력으로 가이드 생성
    if (body.text) {
      return handleTextToGuide(body.text, body.industry);
    }

    return NextResponse.json(
      { error: "intent/industry 또는 guide/action이 필요합니다." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Guide API error:", error);
    return NextResponse.json(
      { error: "가이드 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 새 가이드 생성
 */
function handleCreateGuide(body: CreateGuideRequest): NextResponse {
  const { intent, industry } = body;

  if (!isExpressionIntent(intent)) {
    return NextResponse.json(
      { error: "유효하지 않은 의도입니다." },
      { status: 400 }
    );
  }

  if (!isValidIndustry(industry)) {
    return NextResponse.json(
      { error: "유효하지 않은 업종입니다." },
      { status: 400 }
    );
  }

  const guide = generateDynamicGuide(intent, industry);

  // 의도 매칭 결과로 추천 생성
  const matchResult = matchIntent(`${industry} ${intent}`);
  const recommendations = generateRecommendations(matchResult);

  const response: GuideResponse = {
    success: true,
    guide,
    meta: {
      progress: calculateProgress(guide),
      isComplete: isGuideComplete(guide),
      nextStep: getNextStep(guide),
      skippableSteps: getSkippableSteps(guide),
    },
    recommendations,
  };

  return NextResponse.json(response);
}

/**
 * 가이드 업데이트
 */
function handleUpdateGuide(body: UpdateGuideRequest): NextResponse {
  const { guide, action, stepId, selection } = body;

  let updatedGuide: DynamicGuide;

  switch (action) {
    case "select":
      if (!stepId || selection === undefined) {
        return NextResponse.json(
          { error: "stepId와 selection이 필요합니다." },
          { status: 400 }
        );
      }
      updatedGuide = processUserSelection(guide, stepId, selection);
      break;

    case "skip":
      if (!stepId) {
        return NextResponse.json(
          { error: "stepId가 필요합니다." },
          { status: 400 }
        );
      }
      const { canSkip, reason } = canSkipStep(guide, stepId);
      if (!canSkip) {
        return NextResponse.json(
          { error: `스킵할 수 없습니다: ${reason}` },
          { status: 400 }
        );
      }
      updatedGuide = skipStep(guide, stepId);
      break;

    case "back":
      updatedGuide = goToPreviousStep(guide);
      break;

    case "reset":
      updatedGuide = resetGuide(guide);
      break;

    default:
      return NextResponse.json(
        { error: "유효하지 않은 액션입니다." },
        { status: 400 }
      );
  }

  const response: GuideResponse = {
    success: true,
    guide: updatedGuide,
    meta: {
      progress: calculateProgress(updatedGuide),
      isComplete: isGuideComplete(updatedGuide),
      nextStep: getNextStep(updatedGuide),
      skippableSteps: getSkippableSteps(updatedGuide),
    },
  };

  return NextResponse.json(response);
}

/**
 * 자연어 → 가이드 변환
 */
function handleTextToGuide(
  text: string,
  explicitIndustry?: Industry
): NextResponse {
  // 의도 분석
  const matchResult = matchIntent(text);

  // 업종 결정
  const industry = explicitIndustry && isValidIndustry(explicitIndustry)
    ? explicitIndustry
    : matchResult.industry.detected;

  if (!industry) {
    return NextResponse.json({
      success: false,
      error: "업종을 파악할 수 없습니다. 업종을 선택해주세요.",
      needsIndustry: true,
      matchResult,
    });
  }

  // 의도 결정
  const intent = matchResult.expression.intent;

  if (!intent) {
    // 의도가 불명확하면 추천만 반환
    const recommendations = generateRecommendations(matchResult);
    return NextResponse.json({
      success: false,
      error: "촬영 스타일을 선택해주세요.",
      needsIntent: true,
      recommendations,
      matchResult,
    });
  }

  // 가이드 생성
  const guide = generateDynamicGuide(intent, industry);
  const recommendations = generateRecommendations(matchResult);

  const response: GuideResponse = {
    success: true,
    guide,
    meta: {
      progress: calculateProgress(guide),
      isComplete: isGuideComplete(guide),
      nextStep: getNextStep(guide),
      skippableSteps: getSkippableSteps(guide),
    },
    recommendations,
  };

  return NextResponse.json(response);
}

// ============================================================
// GET - 가이드 정보 조회
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const intent = searchParams.get("intent") as ExpressionIntent | null;
    const industry = searchParams.get("industry") as Industry | null;
    const type = searchParams.get("type"); // "preview" | "full"

    if (!intent || !industry) {
      return NextResponse.json(
        { error: "intent와 industry 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    if (!isExpressionIntent(intent)) {
      return NextResponse.json(
        { error: "유효하지 않은 의도입니다." },
        { status: 400 }
      );
    }

    if (!isValidIndustry(industry)) {
      return NextResponse.json(
        { error: "유효하지 않은 업종입니다." },
        { status: 400 }
      );
    }

    const guide = generateDynamicGuide(intent, industry);

    // preview 모드: 단계 목록만 반환
    if (type === "preview") {
      return NextResponse.json({
        success: true,
        preview: {
          totalSteps: guide.totalSteps,
          steps: guide.steps.map((s) => ({
            id: s.id,
            titleKo: s.titleKo,
            required: s.required,
            type: s.type,
          })),
        },
      });
    }

    // full 모드: 전체 가이드 반환
    return NextResponse.json({
      success: true,
      guide,
      meta: {
        progress: 0,
        isComplete: false,
        nextStep: getNextStep(guide),
        skippableSteps: getSkippableSteps(guide),
      },
    });
  } catch (error) {
    console.error("Guide GET error:", error);
    return NextResponse.json(
      { error: "가이드 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
