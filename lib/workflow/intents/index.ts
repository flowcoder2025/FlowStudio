/**
 * Intents Module Index
 * Contract: INTENT_TAXONOMY, INTENT_MATRIX, INTENT_MATCHER
 * Evidence: Workflow Guide System Phase 7
 */

// Taxonomy exports
export {
  // Layer 1: Purpose
  PURPOSE_INTENTS,
  PURPOSE_INTENT_INFO,
  type PurposeIntent,
  type PurposeIntentInfo,

  // Layer 2: Expression
  EXPRESSION_INTENTS,
  EXPRESSION_INTENT_INFO,
  EXPRESSION_CATEGORY_INFO,
  type ExpressionIntent,
  type ExpressionIntentInfo,
  type ExpressionCategory,

  // Layer 3: Details
  DETAIL_ELEMENTS,
  type DetailElementType,

  // Complete Intent
  type CompleteIntent,

  // Utilities
  getExpressionCategory,
  getExpressionsByCategory,
  getIntentsByIndustry,
  isPurposeIntent,
  isExpressionIntent,
} from "./taxonomy";

// Matrix exports
export {
  CATEGORY_INDUSTRY_MATRIX,
  INTENT_ACTION_MAPPINGS,
  CROSS_INDUSTRY_SIMILARITIES,

  // Functions
  getCompatibilityScore,
  getCompatibleIntentsForIndustry,
  getActionsForIntent,
  getSimilarCrossIndustryWorkflows,
  getAllSimilarWorkflowsForIntent,
  recommendCrossIndustryIntents,
  getPopularIntentsForIndustry,
  getCommonIntentsBetweenIndustries,
} from "./matrix";

// Matcher exports
export {
  type IntentMatchResult,
  type RecommendedWorkflow,
  type CrossIndustryRecommendation,

  // Main functions
  matchIntent,
  suggestIntentsForCategory,
  quickSuggestIntents,
} from "./matcher";
