/**
 * Recommend Module Index
 * Contract: RECOMMEND_SCORING, RECOMMEND_ENGINE
 * Evidence: Workflow Guide System Phase 7
 */

// Scoring exports
export {
  DEFAULT_WEIGHTS,
  type ScoringWeights,
  calculateIntentSimilarity,
  calculateIndustryRelevance,
  getPopularityScore,
  calculateUserHistoryScore,
  calculateRecencyScore,
  calculateTotalScore,
  getScoreBreakdown,
} from "./scoring";

// Engine exports
export {
  type WorkflowRecommendation,
  type RecommendationResponse,
  type CategoryRecommendation,
  type RecommendationTrigger,
  type RecommendationConfig,
  DEFAULT_CONFIG,
  generateRecommendations,
  quickRecommend,
  seasonalRecommend,
  personalizedRecommend,
} from "./engine";
