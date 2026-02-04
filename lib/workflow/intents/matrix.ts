/**
 * Intent-Industry Matrix - 업종×의도 매핑 매트릭스
 * Contract: INTENT_MATRIX
 * Evidence: Workflow Guide System Phase 7
 */

import { Industry, INDUSTRIES } from "../industries";
import { Action, getIndustryActions } from "../actions";
import {
  ExpressionIntent,
  ExpressionCategory,
  EXPRESSION_INTENT_INFO,
  EXPRESSION_INTENTS,
  getExpressionCategory,
} from "./taxonomy";

// ============================================================
// 업종×의도 호환성 매트릭스
// ============================================================

type CompatibilityScore = 0 | 1 | 2 | 3;
// 0: 해당 없음
// 1: 낮은 호환성 (가능하지만 추천하지 않음)
// 2: 보통 호환성 (사용 가능)
// 3: 높은 호환성 (강력 추천)

// 업종별 카테고리 호환성
export const CATEGORY_INDUSTRY_MATRIX: Record<ExpressionCategory, Record<Industry, CompatibilityScore>> = {
  "with-person": {
    fashion: 3,
    food: 2,
    beauty: 3,
    interior: 1,
    electronics: 2,
    jewelry: 3,
    sports: 3,
    pet: 2,
    kids: 3,
    "photo-studio": 2,
  },
  "product-only": {
    fashion: 3,
    food: 3,
    beauty: 3,
    interior: 3,
    electronics: 3,
    jewelry: 3,
    sports: 3,
    pet: 3,
    kids: 3,
    "photo-studio": 0,
  },
  "detail-focus": {
    fashion: 2,
    food: 3,
    beauty: 3,
    interior: 2,
    electronics: 2,
    jewelry: 3,
    sports: 2,
    pet: 1,
    kids: 1,
    "photo-studio": 1,
  },
  "mood-styling": {
    fashion: 3,
    food: 3,
    beauty: 3,
    interior: 3,
    electronics: 2,
    jewelry: 3,
    sports: 2,
    pet: 2,
    kids: 3,
    "photo-studio": 2,
  },
  composition: {
    fashion: 3,
    food: 2,
    beauty: 3,
    interior: 2,
    electronics: 3,
    jewelry: 3,
    sports: 2,
    pet: 2,
    kids: 2,
    "photo-studio": 1,
  },
  portrait: {
    fashion: 1,
    food: 0,
    beauty: 2,
    interior: 0,
    electronics: 0,
    jewelry: 1,
    sports: 1,
    pet: 0,
    kids: 1,
    "photo-studio": 3,
  },
};

// ============================================================
// 의도 → 액션 매핑
// ============================================================

interface IntentActionMapping {
  expressionIntent: ExpressionIntent;
  actionIds: Record<Industry, string[]>; // 업종별 매핑되는 액션 ID 목록
}

// 의도와 기존 액션 간의 매핑
export const INTENT_ACTION_MAPPINGS: IntentActionMapping[] = [
  {
    expressionIntent: "with-person.model-fullbody",
    actionIds: {
      fashion: ["fashion-model-shot", "fashion-lifestyle"],
      food: [],
      beauty: [],
      interior: [],
      electronics: [],
      jewelry: ["jewelry-glamour"],
      sports: ["sports-action"],
      pet: [],
      kids: ["kids-playful"],
      "photo-studio": ["photo-studio-profile", "photo-studio-audition"],
    },
  },
  {
    expressionIntent: "with-person.hand-holding",
    actionIds: {
      fashion: [],
      food: ["food-hero"], // food에 hand-holding 스타일 추가 가능
      beauty: ["beauty-texture"],
      interior: [],
      electronics: ["electronics-product"],
      jewelry: ["jewelry-glamour"],
      sports: [],
      pet: ["pet-product"],
      kids: ["kids-playful"],
      "photo-studio": [],
    },
  },
  {
    expressionIntent: "product-only.hero-front",
    actionIds: {
      fashion: ["fashion-ghost-mannequin"],
      food: ["food-hero"],
      beauty: ["beauty-hero"],
      interior: ["interior-room-scene"],
      electronics: ["electronics-product"],
      jewelry: ["jewelry-glamour"],
      sports: ["sports-action"],
      pet: ["pet-product"],
      kids: ["kids-playful"],
      "photo-studio": [],
    },
  },
  {
    expressionIntent: "product-only.flat-lay",
    actionIds: {
      fashion: ["fashion-flat-lay"],
      food: ["food-flat-lay"],
      beauty: ["beauty-flat-lay"],
      interior: [],
      electronics: ["electronics-product"],
      jewelry: [],
      sports: [],
      pet: [],
      kids: [],
      "photo-studio": [],
    },
  },
  {
    expressionIntent: "detail-focus.texture",
    actionIds: {
      fashion: ["fashion-detail"],
      food: ["food-detail"],
      beauty: ["beauty-texture"],
      interior: [],
      electronics: [],
      jewelry: [],
      sports: [],
      pet: [],
      kids: [],
      "photo-studio": [],
    },
  },
  {
    expressionIntent: "mood-styling.space-cozy",
    actionIds: {
      fashion: ["fashion-lifestyle"],
      food: ["food-lifestyle"],
      beauty: [],
      interior: ["interior-room-scene"],
      electronics: [],
      jewelry: [],
      sports: [],
      pet: ["pet-product"],
      kids: ["kids-playful"],
      "photo-studio": [],
    },
  },
  // Portrait (Photo Studio) mappings
  {
    expressionIntent: "portrait.id-photo",
    actionIds: {
      fashion: [],
      food: [],
      beauty: [],
      interior: [],
      electronics: [],
      jewelry: [],
      sports: [],
      pet: [],
      kids: [],
      "photo-studio": ["photo-studio-id-photo"],
    },
  },
  {
    expressionIntent: "portrait.business-profile",
    actionIds: {
      fashion: [],
      food: [],
      beauty: [],
      interior: [],
      electronics: [],
      jewelry: [],
      sports: [],
      pet: [],
      kids: [],
      "photo-studio": ["photo-studio-business-profile"],
    },
  },
  {
    expressionIntent: "portrait.sns-profile",
    actionIds: {
      fashion: [],
      food: [],
      beauty: [],
      interior: [],
      electronics: [],
      jewelry: [],
      sports: [],
      pet: [],
      kids: [],
      "photo-studio": ["photo-studio-sns-profile"],
    },
  },
  {
    expressionIntent: "portrait.job-application",
    actionIds: {
      fashion: [],
      food: [],
      beauty: [],
      interior: [],
      electronics: [],
      jewelry: [],
      sports: [],
      pet: [],
      kids: [],
      "photo-studio": ["photo-studio-job-application"],
    },
  },
  {
    expressionIntent: "portrait.beauty-retouch",
    actionIds: {
      fashion: [],
      food: [],
      beauty: [],
      interior: [],
      electronics: [],
      jewelry: [],
      sports: [],
      pet: [],
      kids: [],
      "photo-studio": ["photo-studio-beauty-retouch"],
    },
  },
  {
    expressionIntent: "portrait.background-change",
    actionIds: {
      fashion: [],
      food: [],
      beauty: [],
      interior: [],
      electronics: [],
      jewelry: [],
      sports: [],
      pet: [],
      kids: [],
      "photo-studio": ["photo-studio-background-change"],
    },
  },
  {
    expressionIntent: "portrait.group-composite",
    actionIds: {
      fashion: [],
      food: [],
      beauty: [],
      interior: [],
      electronics: [],
      jewelry: [],
      sports: [],
      pet: [],
      kids: [],
      "photo-studio": ["photo-studio-group-composite"],
    },
  },
  {
    expressionIntent: "portrait.personal-color",
    actionIds: {
      fashion: [],
      food: [],
      beauty: [],
      interior: [],
      electronics: [],
      jewelry: [],
      sports: [],
      pet: [],
      kids: [],
      "photo-studio": ["photo-studio-personal-color"],
    },
  },
];

// ============================================================
// 크로스 인더스트리 유사도 매핑
// ============================================================

interface CrossIndustrySimilarity {
  sourceIndustry: Industry;
  sourceIntent: ExpressionIntent;
  targetIndustry: Industry;
  targetIntent: ExpressionIntent;
  similarity: number; // 0-1 유사도 점수
  reason: string;
}

export const CROSS_INDUSTRY_SIMILARITIES: CrossIndustrySimilarity[] = [
  // 모델 착용 유사성
  {
    sourceIndustry: "fashion",
    sourceIntent: "with-person.model-fullbody",
    targetIndustry: "jewelry",
    targetIntent: "with-person.model-fullbody",
    similarity: 0.9,
    reason: "착용 모델 촬영 방식 동일",
  },
  {
    sourceIndustry: "fashion",
    sourceIntent: "with-person.model-fullbody",
    targetIndustry: "sports",
    targetIntent: "with-person.model-fullbody",
    similarity: 0.85,
    reason: "스포츠웨어도 착용 촬영",
  },

  // 플랫레이 유사성
  {
    sourceIndustry: "fashion",
    sourceIntent: "product-only.flat-lay",
    targetIndustry: "beauty",
    targetIntent: "product-only.flat-lay",
    similarity: 0.95,
    reason: "탑뷰 촬영 기법 동일",
  },
  {
    sourceIndustry: "fashion",
    sourceIntent: "product-only.flat-lay",
    targetIndustry: "food",
    targetIntent: "product-only.flat-lay",
    similarity: 0.8,
    reason: "음식도 탑뷰 촬영 활용",
  },

  // 디테일 유사성
  {
    sourceIndustry: "fashion",
    sourceIntent: "detail-focus.texture",
    targetIndustry: "food",
    targetIntent: "detail-focus.texture",
    similarity: 0.7,
    reason: "질감 표현 기법 유사",
  },
  {
    sourceIndustry: "beauty",
    sourceIntent: "detail-focus.texture",
    targetIndustry: "jewelry",
    targetIntent: "detail-focus.texture",
    similarity: 0.85,
    reason: "제품 표면 질감 촬영",
  },

  // 라이프스타일 유사성
  {
    sourceIndustry: "fashion",
    sourceIntent: "with-person.lifestyle-casual",
    targetIndustry: "interior",
    targetIntent: "mood-styling.space-cozy",
    similarity: 0.75,
    reason: "일상적 분위기 연출",
  },
  {
    sourceIndustry: "food",
    sourceIntent: "mood-styling.space-cozy",
    targetIndustry: "interior",
    targetIntent: "mood-styling.space-cozy",
    similarity: 0.9,
    reason: "아늑한 공간 연출 동일",
  },

  // 손 등장 유사성
  {
    sourceIndustry: "beauty",
    sourceIntent: "with-person.hand-holding",
    targetIndustry: "food",
    targetIntent: "with-person.hand-holding",
    similarity: 0.85,
    reason: "손으로 제품 잡는 구도",
  },
  {
    sourceIndustry: "electronics",
    sourceIntent: "with-person.hand-holding",
    targetIndustry: "jewelry",
    targetIntent: "with-person.hand-holding",
    similarity: 0.8,
    reason: "손으로 제품 들고 있는 구도",
  },

  // 세트 구성 유사성
  {
    sourceIndustry: "beauty",
    sourceIntent: "composition.set-bundle",
    targetIndustry: "food",
    targetIntent: "composition.set-bundle",
    similarity: 0.9,
    reason: "세트 구성 촬영 방식 동일",
  },

  // 시즌 유사성
  {
    sourceIndustry: "fashion",
    sourceIntent: "mood-styling.seasonal-spring",
    targetIndustry: "beauty",
    targetIntent: "mood-styling.seasonal-spring",
    similarity: 0.95,
    reason: "시즌 무드 연출 동일",
  },
];

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * 업종에 대한 의도의 호환성 점수 조회
 */
export function getCompatibilityScore(
  industry: Industry,
  expressionIntent: ExpressionIntent
): CompatibilityScore {
  const category = getExpressionCategory(expressionIntent);
  return CATEGORY_INDUSTRY_MATRIX[category][industry];
}

/**
 * 업종에 적합한 의도 목록 조회 (점수 기준 정렬)
 */
export function getCompatibleIntentsForIndustry(
  industry: Industry,
  minScore: CompatibilityScore = 2
): ExpressionIntent[] {
  return EXPRESSION_INTENTS.filter((intent) => {
    const info = EXPRESSION_INTENT_INFO[intent];
    const score = getCompatibilityScore(industry, intent);
    return (
      score >= minScore && info.applicableIndustries.includes(industry)
    );
  }).sort((a, b) => {
    const scoreA = getCompatibilityScore(industry, a);
    const scoreB = getCompatibilityScore(industry, b);
    return scoreB - scoreA;
  });
}

/**
 * 의도에 매핑된 액션 조회
 */
export function getActionsForIntent(
  industry: Industry,
  expressionIntent: ExpressionIntent
): Action[] {
  const mapping = INTENT_ACTION_MAPPINGS.find(
    (m) => m.expressionIntent === expressionIntent
  );

  if (!mapping) {
    // 매핑이 없으면 해당 업종의 모든 액션 반환
    return getIndustryActions(industry);
  }

  const actionIds = mapping.actionIds[industry];
  if (!actionIds || actionIds.length === 0) {
    return getIndustryActions(industry);
  }

  const industryActions = getIndustryActions(industry);
  return industryActions.filter((action) => actionIds.includes(action.id));
}

/**
 * 유사한 다른 업종의 워크플로우 조회
 */
export function getSimilarCrossIndustryWorkflows(
  sourceIndustry: Industry,
  sourceIntent: ExpressionIntent,
  minSimilarity: number = 0.7
): CrossIndustrySimilarity[] {
  return CROSS_INDUSTRY_SIMILARITIES.filter(
    (sim) =>
      sim.sourceIndustry === sourceIndustry &&
      sim.sourceIntent === sourceIntent &&
      sim.similarity >= minSimilarity
  ).sort((a, b) => b.similarity - a.similarity);
}

/**
 * 특정 의도에 대한 모든 업종의 유사 워크플로우 조회
 */
export function getAllSimilarWorkflowsForIntent(
  expressionIntent: ExpressionIntent,
  minSimilarity: number = 0.7
): CrossIndustrySimilarity[] {
  return CROSS_INDUSTRY_SIMILARITIES.filter(
    (sim) =>
      (sim.sourceIntent === expressionIntent ||
        sim.targetIntent === expressionIntent) &&
      sim.similarity >= minSimilarity
  ).sort((a, b) => b.similarity - a.similarity);
}

/**
 * 업종 간 의도 추천
 * 사용자가 선택한 업종+의도와 유사한 다른 업종의 의도 추천
 */
export function recommendCrossIndustryIntents(
  currentIndustry: Industry,
  currentIntent: ExpressionIntent,
  limit: number = 5
): Array<{
  industry: Industry;
  intent: ExpressionIntent;
  similarity: number;
  reason: string;
}> {
  const recommendations: Array<{
    industry: Industry;
    intent: ExpressionIntent;
    similarity: number;
    reason: string;
  }> = [];

  // 1. 직접 매핑된 유사도에서 추천
  const directSimilarities = getSimilarCrossIndustryWorkflows(
    currentIndustry,
    currentIntent
  );

  for (const sim of directSimilarities) {
    if (sim.targetIndustry !== currentIndustry) {
      recommendations.push({
        industry: sim.targetIndustry,
        intent: sim.targetIntent,
        similarity: sim.similarity,
        reason: sim.reason,
      });
    }
  }

  // 2. 같은 카테고리의 의도를 다른 업종에서 추천
  const category = getExpressionCategory(currentIntent);
  for (const industry of INDUSTRIES) {
    if (industry === currentIndustry) continue;

    const categoryScore = CATEGORY_INDUSTRY_MATRIX[category][industry];
    if (categoryScore >= 2) {
      // 이미 추천에 있는지 확인
      const exists = recommendations.some(
        (r) => r.industry === industry && r.intent === currentIntent
      );
      if (!exists) {
        const intentInfo = EXPRESSION_INTENT_INFO[currentIntent];
        if (intentInfo.applicableIndustries.includes(industry)) {
          recommendations.push({
            industry,
            intent: currentIntent,
            similarity: categoryScore / 3, // 0-1 스케일로 변환
            reason: `${intentInfo.nameKo} 촬영 기법 공유`,
          });
        }
      }
    }
  }

  return recommendations.slice(0, limit);
}

/**
 * 업종별 인기 의도 조회 (추후 사용 데이터 기반으로 확장 가능)
 */
export function getPopularIntentsForIndustry(
  industry: Industry,
  limit: number = 5
): ExpressionIntent[] {
  // 현재는 호환성 점수 기반으로 반환
  // 추후 실제 사용 데이터 기반으로 확장 가능
  return getCompatibleIntentsForIndustry(industry, 2).slice(0, limit);
}

/**
 * 업종 간 공통 의도 조회
 */
export function getCommonIntentsBetweenIndustries(
  industry1: Industry,
  industry2: Industry
): ExpressionIntent[] {
  const intents1 = new Set(getCompatibleIntentsForIndustry(industry1, 2));
  const intents2 = getCompatibleIntentsForIndustry(industry2, 2);

  return intents2.filter((intent) => intents1.has(intent));
}
