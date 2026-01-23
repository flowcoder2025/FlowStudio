/**
 * Recommendation Engine - 자동 추천 엔진
 * Contract: RECOMMEND_ENGINE
 * Evidence: Workflow Guide System Phase 7
 */

import { Industry, INDUSTRIES, INDUSTRY_INFO } from "../industries";
import {
  ExpressionIntent,
  EXPRESSION_INTENT_INFO,
  ExpressionCategory,
  EXPRESSION_CATEGORY_INFO,
  getExpressionCategory,
  getExpressionsByCategory,
  getCompatibleIntentsForIndustry,
  recommendCrossIndustryIntents,
  type IntentMatchResult,
} from "../intents";
import {
  calculateTotalScore,
  DEFAULT_WEIGHTS,
  type ScoringWeights,
} from "./scoring";

// ============================================================
// 추천 결과 타입
// ============================================================

export interface WorkflowRecommendation {
  intent: ExpressionIntent;
  industry: Industry;
  score: number;
  rank: number;
  reason: string;
  tags: string[];
  exampleImageUrl?: string;
}

export interface RecommendationResponse {
  primary: WorkflowRecommendation | null;
  alternatives: WorkflowRecommendation[];
  crossIndustry: WorkflowRecommendation[];
  categories: CategoryRecommendation[];
  meta: {
    totalCandidates: number;
    processingTimeMs: number;
    confidence: number;
  };
}

export interface CategoryRecommendation {
  category: ExpressionCategory;
  name: string;
  nameKo: string;
  icon: string;
  topIntents: Array<{
    intent: ExpressionIntent;
    name: string;
    score: number;
  }>;
}

// ============================================================
// 추천 트리거 타입
// ============================================================

export type RecommendationTrigger =
  | "always"          // 항상 자동 추천
  | "low-confidence"  // 신뢰도 낮을 때만
  | "ambiguous"       // 모호할 때만
  | "user-request";   // 사용자 요청 시

export interface RecommendationConfig {
  trigger: RecommendationTrigger;
  maxPrimary: number;
  maxAlternatives: number;
  maxCrossIndustry: number;
  minScore: number;
  weights: ScoringWeights;
  includeCategories: boolean;
}

export const DEFAULT_CONFIG: RecommendationConfig = {
  trigger: "always",
  maxPrimary: 1,
  maxAlternatives: 4,
  maxCrossIndustry: 3,
  minScore: 0.3,
  weights: DEFAULT_WEIGHTS,
  includeCategories: true,
};

// ============================================================
// 추천 엔진 메인 함수
// ============================================================

/**
 * 의도 분석 결과 기반 자동 추천
 */
export function generateRecommendations(
  matchResult: IntentMatchResult,
  config: Partial<RecommendationConfig> = {}
): RecommendationResponse {
  const startTime = Date.now();
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const industry = matchResult.industry.detected;
  const sourceIntent = matchResult.expression.intent;
  const confidence = matchResult.meta.overallConfidence;

  // 트리거 조건 체크
  const shouldRecommend = checkTrigger(cfg.trigger, confidence, matchResult);
  if (!shouldRecommend) {
    return createEmptyResponse(startTime);
  }

  // 업종이 없으면 모든 업종 대상으로 추천
  if (!industry) {
    return generateIndustryAgnosticRecommendations(matchResult, cfg, startTime);
  }

  // 후보 생성 및 스코어링
  const candidates = generateCandidates(industry, sourceIntent);
  const scoredCandidates = scoreCandidates(candidates, {
    industry,
    sourceIntent: sourceIntent || undefined,
  }, cfg.weights);

  // 정렬 및 필터링
  const filtered = scoredCandidates
    .filter((c) => c.score >= cfg.minScore)
    .sort((a, b) => b.score - a.score);

  // Primary 추천
  const primary = filtered.length > 0 ? filtered[0] : null;

  // Alternative 추천 (Primary 제외)
  const alternatives = filtered.slice(1, cfg.maxAlternatives + 1);

  // Cross-Industry 추천
  const crossIndustry = sourceIntent
    ? generateCrossIndustryRecommendations(industry, sourceIntent, cfg)
    : [];

  // 카테고리별 추천
  const categories = cfg.includeCategories
    ? generateCategoryRecommendations(industry, cfg.weights)
    : [];

  const processingTimeMs = Date.now() - startTime;

  return {
    primary,
    alternatives,
    crossIndustry,
    categories,
    meta: {
      totalCandidates: candidates.length,
      processingTimeMs,
      confidence,
    },
  };
}

/**
 * 업종 지정 없이 추천 (업종 선택 유도)
 */
function generateIndustryAgnosticRecommendations(
  matchResult: IntentMatchResult,
  cfg: RecommendationConfig,
  startTime: number
): RecommendationResponse {
  const recommendations: WorkflowRecommendation[] = [];

  // 각 업종별 최고 추천 하나씩
  for (const industry of INDUSTRIES) {
    const topIntents = getCompatibleIntentsForIndustry(industry, 2).slice(0, 1);
    for (const intent of topIntents) {
      const info = EXPRESSION_INTENT_INFO[intent];
      const score = calculateTotalScore(intent, { industry }, cfg.weights);

      recommendations.push({
        intent,
        industry,
        score,
        rank: 0,
        reason: `${INDUSTRY_INFO[industry].nameKo} 추천`,
        tags: [INDUSTRY_INFO[industry].nameKo, info.nameKo],
        exampleImageUrl: info.exampleImage,
      });
    }
  }

  // 점수순 정렬
  recommendations.sort((a, b) => b.score - a.score);
  recommendations.forEach((r, i) => (r.rank = i + 1));

  return {
    primary: recommendations[0] || null,
    alternatives: recommendations.slice(1, cfg.maxAlternatives + 1),
    crossIndustry: [],
    categories: [],
    meta: {
      totalCandidates: recommendations.length,
      processingTimeMs: Date.now() - startTime,
      confidence: matchResult.meta.overallConfidence,
    },
  };
}

/**
 * 트리거 조건 체크
 */
function checkTrigger(
  trigger: RecommendationTrigger,
  confidence: number,
  matchResult: IntentMatchResult
): boolean {
  switch (trigger) {
    case "always":
      return true;
    case "low-confidence":
      return confidence < 0.6;
    case "ambiguous":
      return matchResult.meta.needsClarification;
    case "user-request":
      return false; // 명시적 요청에만 응답
    default:
      return true;
  }
}

/**
 * 빈 응답 생성
 */
function createEmptyResponse(startTime: number): RecommendationResponse {
  return {
    primary: null,
    alternatives: [],
    crossIndustry: [],
    categories: [],
    meta: {
      totalCandidates: 0,
      processingTimeMs: Date.now() - startTime,
      confidence: 0,
    },
  };
}

/**
 * 후보 생성
 */
function generateCandidates(
  industry: Industry,
  sourceIntent: ExpressionIntent | null
): ExpressionIntent[] {
  const candidates = new Set<ExpressionIntent>();

  // 1. 업종 호환 의도 추가
  const compatibleIntents = getCompatibleIntentsForIndustry(industry, 1);
  compatibleIntents.forEach((i) => candidates.add(i));

  // 2. 소스 의도의 같은 카테고리 의도 추가
  if (sourceIntent) {
    const category = getExpressionCategory(sourceIntent);
    const categoryIntents = getExpressionsByCategory(category);
    categoryIntents.forEach((i) => {
      const info = EXPRESSION_INTENT_INFO[i];
      if (info.applicableIndustries.includes(industry)) {
        candidates.add(i);
      }
    });
  }

  return Array.from(candidates);
}

/**
 * 후보 스코어링
 */
function scoreCandidates(
  candidates: ExpressionIntent[],
  context: {
    industry: Industry;
    sourceIntent?: ExpressionIntent;
    userId?: string;
    recentIntents?: ExpressionIntent[];
  },
  weights: ScoringWeights
): WorkflowRecommendation[] {
  return candidates.map((intent, index) => {
    const info = EXPRESSION_INTENT_INFO[intent];
    const score = calculateTotalScore(intent, context, weights);

    return {
      intent,
      industry: context.industry,
      score,
      rank: index + 1,
      reason: generateReason(intent, context.sourceIntent, score),
      tags: generateTags(intent, context.industry),
      exampleImageUrl: info.exampleImage,
    };
  });
}

/**
 * 크로스 인더스트리 추천 생성
 */
function generateCrossIndustryRecommendations(
  industry: Industry,
  sourceIntent: ExpressionIntent,
  cfg: RecommendationConfig
): WorkflowRecommendation[] {
  const crossRecs = recommendCrossIndustryIntents(industry, sourceIntent, cfg.maxCrossIndustry);

  return crossRecs.map((rec, index) => {
    const info = EXPRESSION_INTENT_INFO[rec.intent];
    return {
      intent: rec.intent,
      industry: rec.industry,
      score: rec.similarity,
      rank: index + 1,
      reason: rec.reason,
      tags: [
        INDUSTRY_INFO[rec.industry].nameKo,
        info.nameKo,
        "다른 업종 참고",
      ],
      exampleImageUrl: info.exampleImage,
    };
  });
}

/**
 * 카테고리별 추천 생성
 */
function generateCategoryRecommendations(
  industry: Industry,
  weights: ScoringWeights
): CategoryRecommendation[] {
  const categories = Object.keys(EXPRESSION_CATEGORY_INFO) as ExpressionCategory[];

  return categories.map((category) => {
    const catInfo = EXPRESSION_CATEGORY_INFO[category];
    const categoryIntents = getExpressionsByCategory(category);

    // 업종 호환 의도만 필터링
    const compatibleIntents = categoryIntents.filter((intent) => {
      const info = EXPRESSION_INTENT_INFO[intent];
      return info.applicableIndustries.includes(industry);
    });

    // 스코어링 및 상위 3개 선택
    const scored = compatibleIntents
      .map((intent) => ({
        intent,
        name: EXPRESSION_INTENT_INFO[intent].nameKo,
        score: calculateTotalScore(intent, { industry }, weights),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return {
      category,
      name: catInfo.name,
      nameKo: catInfo.nameKo,
      icon: catInfo.icon,
      topIntents: scored,
    };
  });
}

/**
 * 추천 이유 생성
 */
function generateReason(
  intent: ExpressionIntent,
  sourceIntent: ExpressionIntent | undefined,
  score: number
): string {
  const info = EXPRESSION_INTENT_INFO[intent];

  if (sourceIntent && sourceIntent === intent) {
    return "입력하신 의도와 정확히 일치";
  }

  if (score >= 0.8) {
    return `${info.nameKo} - 매우 추천`;
  }

  if (score >= 0.6) {
    return `${info.nameKo} - 추천`;
  }

  if (sourceIntent) {
    const sourceCategory = getExpressionCategory(sourceIntent);
    const targetCategory = getExpressionCategory(intent);
    if (sourceCategory === targetCategory) {
      return `${info.nameKo} - 유사한 스타일`;
    }
  }

  return `${info.nameKo} 스타일`;
}

/**
 * 태그 생성
 */
function generateTags(intent: ExpressionIntent, industry: Industry): string[] {
  const info = EXPRESSION_INTENT_INFO[intent];
  const category = getExpressionCategory(intent);
  const catInfo = EXPRESSION_CATEGORY_INFO[category];

  const tags = [
    INDUSTRY_INFO[industry].nameKo,
    catInfo.nameKo,
    info.nameKo,
  ];

  // 키워드에서 추가 태그
  if (info.keywords.length > 0) {
    tags.push(info.keywords[0]);
  }

  return tags;
}

// ============================================================
// 특수 추천 함수
// ============================================================

/**
 * 빠른 추천 (업종만으로)
 */
export function quickRecommend(
  industry: Industry,
  limit: number = 5
): WorkflowRecommendation[] {
  const intents = getCompatibleIntentsForIndustry(industry, 2).slice(0, limit);

  return intents.map((intent, index) => {
    const info = EXPRESSION_INTENT_INFO[intent];
    const score = calculateTotalScore(intent, { industry }, DEFAULT_WEIGHTS);

    return {
      intent,
      industry,
      score,
      rank: index + 1,
      reason: `${info.nameKo} - ${INDUSTRY_INFO[industry].nameKo} 인기`,
      tags: [INDUSTRY_INFO[industry].nameKo, info.nameKo],
      exampleImageUrl: info.exampleImage,
    };
  });
}

/**
 * 시즌 기반 추천
 */
export function seasonalRecommend(industry: Industry): WorkflowRecommendation[] {
  const month = new Date().getMonth() + 1;
  let seasonIntent: ExpressionIntent;

  if (month >= 3 && month <= 5) {
    seasonIntent = "mood-styling.seasonal-spring";
  } else if (month >= 6 && month <= 8) {
    seasonIntent = "mood-styling.seasonal-summer";
  } else if (month >= 9 && month <= 11) {
    seasonIntent = "mood-styling.seasonal-fall";
  } else {
    seasonIntent = "mood-styling.seasonal-winter";
  }

  const info = EXPRESSION_INTENT_INFO[seasonIntent];

  // 업종 호환성 체크
  if (!info.applicableIndustries.includes(industry)) {
    return [];
  }

  return [{
    intent: seasonIntent,
    industry,
    score: 0.9,
    rank: 1,
    reason: `${info.nameKo} - 지금 시즌에 딱!`,
    tags: [INDUSTRY_INFO[industry].nameKo, info.nameKo, "시즌 추천"],
    exampleImageUrl: info.exampleImage,
  }];
}

/**
 * 사용자 히스토리 기반 추천 (추후 확장)
 */
export function personalizedRecommend(
  industry: Industry,
  _userId: string,
  _recentIntents: ExpressionIntent[],
  limit: number = 5
): WorkflowRecommendation[] {
  // TODO: 사용자 히스토리 기반 개인화 추천 구현
  // 현재는 기본 추천으로 대체
  return quickRecommend(industry, limit);
}
