/**
 * Recommendation Scoring - 추천 스코어링 로직
 * Contract: RECOMMEND_SCORING
 * Evidence: Workflow Guide System Phase 7
 */

import { Industry } from "../industries";
import {
  ExpressionIntent,
  EXPRESSION_INTENT_INFO,
  getCompatibilityScore,
} from "../intents";

// ============================================================
// 스코어링 요소 가중치
// ============================================================

export interface ScoringWeights {
  intentSimilarity: number;    // 의도 유사도 (0-1)
  industryRelevance: number;   // 업종 관련성 (0-1)
  popularityScore: number;     // 인기도 (0-1)
  userHistory: number;         // 사용자 이력 기반 (0-1)
  recency: number;             // 최신성 (0-1)
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  intentSimilarity: 0.35,
  industryRelevance: 0.30,
  popularityScore: 0.15,
  userHistory: 0.15,
  recency: 0.05,
};

// ============================================================
// 인기도 데이터 (추후 DB에서 가져올 수 있음)
// ============================================================

// 업종별 인기 의도 (정적 데이터, 추후 사용 데이터 기반으로 동적 업데이트)
const POPULARITY_SCORES: Partial<Record<ExpressionIntent, Record<Industry, number>>> = {
  "product-only.hero-front": {
    fashion: 0.95,
    food: 0.90,
    beauty: 0.95,
    interior: 0.85,
    electronics: 0.95,
    jewelry: 0.90,
    sports: 0.85,
    pet: 0.80,
    kids: 0.85,
  },
  "with-person.model-fullbody": {
    fashion: 0.90,
    food: 0.20,
    beauty: 0.75,
    interior: 0.30,
    electronics: 0.40,
    jewelry: 0.85,
    sports: 0.85,
    pet: 0.30,
    kids: 0.80,
  },
  "product-only.flat-lay": {
    fashion: 0.85,
    food: 0.85,
    beauty: 0.90,
    interior: 0.40,
    electronics: 0.60,
    jewelry: 0.70,
    sports: 0.50,
    pet: 0.60,
    kids: 0.65,
  },
  "detail-focus.texture": {
    fashion: 0.70,
    food: 0.85,
    beauty: 0.80,
    interior: 0.75,
    electronics: 0.50,
    jewelry: 0.85,
    sports: 0.40,
    pet: 0.30,
    kids: 0.30,
  },
  "mood-styling.space-cozy": {
    fashion: 0.60,
    food: 0.80,
    beauty: 0.65,
    interior: 0.90,
    electronics: 0.40,
    jewelry: 0.50,
    sports: 0.30,
    pet: 0.70,
    kids: 0.75,
  },
  "with-person.hand-holding": {
    fashion: 0.50,
    food: 0.75,
    beauty: 0.85,
    interior: 0.40,
    electronics: 0.70,
    jewelry: 0.80,
    sports: 0.60,
    pet: 0.65,
    kids: 0.70,
  },
  "composition.color-variation": {
    fashion: 0.80,
    food: 0.40,
    beauty: 0.85,
    interior: 0.75,
    electronics: 0.80,
    jewelry: 0.75,
    sports: 0.70,
    pet: 0.50,
    kids: 0.75,
  },
};

// ============================================================
// 의도 간 유사도 매트릭스
// ============================================================

// 같은 카테고리 내 유사도
const INTRA_CATEGORY_SIMILARITY: Record<string, number> = {
  // with-person 내
  "model-fullbody:model-halfbody": 0.85,
  "model-fullbody:lifestyle-casual": 0.70,
  "model-fullbody:lifestyle-premium": 0.65,
  "model-halfbody:lifestyle-casual": 0.60,
  "hand-holding:hand-using": 0.90,
  "lifestyle-casual:lifestyle-premium": 0.75,

  // product-only 내
  "hero-front:hero-angle": 0.90,
  "hero-front:floating": 0.70,
  "hero-angle:floating": 0.75,
  "flat-lay:multi-angle": 0.60,
  "ghost-mannequin:hero-front": 0.65,

  // detail-focus 내
  "texture:close-up": 0.85,
  "function:close-up": 0.70,
  "ingredient:texture": 0.75,
  "cross-section:ingredient": 0.80,

  // mood-styling 내
  "seasonal-spring:seasonal-fall": 0.50,
  "seasonal-summer:seasonal-winter": 0.40,
  "color-warm:color-cool": 0.30,
  "color-pastel:color-vivid": 0.35,
  "space-minimal:space-cozy": 0.55,
  "space-cozy:space-luxury": 0.60,
  "space-minimal:space-luxury": 0.65,

  // composition 내
  "set-bundle:group-shot": 0.85,
  "color-variation:group-shot": 0.60,
  "size-comparison:group-shot": 0.55,
};

// 카테고리 간 유사도
const INTER_CATEGORY_SIMILARITY: Record<string, number> = {
  "with-person:product-only": 0.40,
  "with-person:detail-focus": 0.35,
  "with-person:mood-styling": 0.60,
  "with-person:composition": 0.45,
  "product-only:detail-focus": 0.65,
  "product-only:mood-styling": 0.55,
  "product-only:composition": 0.70,
  "detail-focus:mood-styling": 0.45,
  "detail-focus:composition": 0.50,
  "mood-styling:composition": 0.55,
};

// ============================================================
// 스코어링 함수
// ============================================================

/**
 * 두 의도 간 유사도 계산
 */
export function calculateIntentSimilarity(
  intent1: ExpressionIntent,
  intent2: ExpressionIntent
): number {
  if (intent1 === intent2) return 1.0;

  const [cat1, sub1] = intent1.split(".");
  const [cat2, sub2] = intent2.split(".");

  // 같은 카테고리
  if (cat1 === cat2) {
    const key1 = `${sub1}:${sub2}`;
    const key2 = `${sub2}:${sub1}`;
    return INTRA_CATEGORY_SIMILARITY[key1] || INTRA_CATEGORY_SIMILARITY[key2] || 0.5;
  }

  // 다른 카테고리
  const catKey1 = `${cat1}:${cat2}`;
  const catKey2 = `${cat2}:${cat1}`;
  return INTER_CATEGORY_SIMILARITY[catKey1] || INTER_CATEGORY_SIMILARITY[catKey2] || 0.3;
}

/**
 * 업종 관련성 점수 계산
 */
export function calculateIndustryRelevance(
  intent: ExpressionIntent,
  industry: Industry
): number {
  const compatScore = getCompatibilityScore(industry, intent);
  const info = EXPRESSION_INTENT_INFO[intent];

  // 호환성 점수 기반
  let score = compatScore / 3; // 0-1 스케일

  // 업종 목록에 포함되어 있으면 보너스
  if (info.applicableIndustries.includes(industry)) {
    score = Math.min(score + 0.2, 1.0);
  }

  return score;
}

/**
 * 인기도 점수 조회
 */
export function getPopularityScore(
  intent: ExpressionIntent,
  industry: Industry
): number {
  const intentScores = POPULARITY_SCORES[intent];
  if (intentScores && intentScores[industry] !== undefined) {
    return intentScores[industry];
  }

  // 기본 인기도 (업종 호환성 기반)
  return calculateIndustryRelevance(intent, industry) * 0.5;
}

/**
 * 사용자 이력 기반 점수 (추후 확장)
 */
export function calculateUserHistoryScore(
  intent: ExpressionIntent,
  _userId: string,
  _recentIntents: ExpressionIntent[]
): number {
  // TODO: 사용자의 최근 사용 이력 기반 점수 계산
  // 현재는 기본값 반환
  return 0.5;
}

/**
 * 최신성 점수 (시즌 관련)
 */
export function calculateRecencyScore(intent: ExpressionIntent): number {
  // 현재 월 기반 시즌 의도 보너스
  const month = new Date().getMonth() + 1;

  if (intent.includes("seasonal-spring") && month >= 3 && month <= 5) {
    return 1.0;
  }
  if (intent.includes("seasonal-summer") && month >= 6 && month <= 8) {
    return 1.0;
  }
  if (intent.includes("seasonal-fall") && month >= 9 && month <= 11) {
    return 1.0;
  }
  if (intent.includes("seasonal-winter") && (month === 12 || month <= 2)) {
    return 1.0;
  }

  return 0.5; // 시즌 무관 의도
}

/**
 * 종합 점수 계산
 */
export function calculateTotalScore(
  targetIntent: ExpressionIntent,
  context: {
    sourceIntent?: ExpressionIntent;
    industry: Industry;
    userId?: string;
    recentIntents?: ExpressionIntent[];
  },
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  const scores = {
    intentSimilarity: context.sourceIntent
      ? calculateIntentSimilarity(context.sourceIntent, targetIntent)
      : 0.5,
    industryRelevance: calculateIndustryRelevance(targetIntent, context.industry),
    popularityScore: getPopularityScore(targetIntent, context.industry),
    userHistory: context.userId && context.recentIntents
      ? calculateUserHistoryScore(targetIntent, context.userId, context.recentIntents)
      : 0.5,
    recency: calculateRecencyScore(targetIntent),
  };

  // 가중 평균
  const totalScore =
    scores.intentSimilarity * weights.intentSimilarity +
    scores.industryRelevance * weights.industryRelevance +
    scores.popularityScore * weights.popularityScore +
    scores.userHistory * weights.userHistory +
    scores.recency * weights.recency;

  return Math.min(Math.max(totalScore, 0), 1); // 0-1 범위로 클램핑
}

/**
 * 점수 상세 분석
 */
export function getScoreBreakdown(
  targetIntent: ExpressionIntent,
  context: {
    sourceIntent?: ExpressionIntent;
    industry: Industry;
    userId?: string;
    recentIntents?: ExpressionIntent[];
  },
  weights: ScoringWeights = DEFAULT_WEIGHTS
): {
  total: number;
  breakdown: Record<keyof ScoringWeights, { score: number; weighted: number }>;
} {
  const scores = {
    intentSimilarity: context.sourceIntent
      ? calculateIntentSimilarity(context.sourceIntent, targetIntent)
      : 0.5,
    industryRelevance: calculateIndustryRelevance(targetIntent, context.industry),
    popularityScore: getPopularityScore(targetIntent, context.industry),
    userHistory: context.userId && context.recentIntents
      ? calculateUserHistoryScore(targetIntent, context.userId, context.recentIntents)
      : 0.5,
    recency: calculateRecencyScore(targetIntent),
  };

  const breakdown: Record<keyof ScoringWeights, { score: number; weighted: number }> = {
    intentSimilarity: {
      score: scores.intentSimilarity,
      weighted: scores.intentSimilarity * weights.intentSimilarity,
    },
    industryRelevance: {
      score: scores.industryRelevance,
      weighted: scores.industryRelevance * weights.industryRelevance,
    },
    popularityScore: {
      score: scores.popularityScore,
      weighted: scores.popularityScore * weights.popularityScore,
    },
    userHistory: {
      score: scores.userHistory,
      weighted: scores.userHistory * weights.userHistory,
    },
    recency: {
      score: scores.recency,
      weighted: scores.recency * weights.recency,
    },
  };

  const total = Object.values(breakdown).reduce((sum, v) => sum + v.weighted, 0);

  return { total: Math.min(Math.max(total, 0), 1), breakdown };
}
