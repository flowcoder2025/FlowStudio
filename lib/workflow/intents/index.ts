/**
 * Intents Module Index
 * Contract: INTENT_TAXONOMY, INTENT_MATRIX, INTENT_MATCHER
 * Evidence: Workflow Guide System Phase 7
 */

// Import types for internal use
import type { ExpressionIntent } from "./taxonomy";

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

// ============================================================
// Action → Intent 매핑 헬퍼 함수
// ============================================================

/**
 * 액션 ID를 기반으로 적합한 ExpressionIntent를 반환합니다.
 * ImmersiveActionSelect에서 ImmersiveInputForm으로 연결할 때 사용됩니다.
 */
export function getIntentForAction(actionId: string): ExpressionIntent {
  const actionIntentMap: Record<string, ExpressionIntent> = {
    // Fashion
    "fashion-model-shot": "with-person.model-fullbody",
    "fashion-flatlay": "product-only.flat-lay",
    "fashion-flat-lay": "product-only.flat-lay",
    "fashion-lookbook": "with-person.lifestyle-casual",
    "fashion-detail": "detail-focus.texture",
    "fashion-ghost-mannequin": "product-only.ghost-mannequin",
    "fashion-lifestyle": "with-person.lifestyle-casual",

    // Food
    "food-hero": "product-only.hero-front",
    "food-hero-shot": "product-only.hero-front",
    "food-menu": "product-only.hero-angle",
    "food-flat-lay": "product-only.flat-lay",
    "food-lifestyle": "with-person.lifestyle-casual",
    "food-packaging": "product-only.hero-front",
    "food-action": "with-person.hand-using",
    "food-beverage": "product-only.hero-front",

    // Beauty
    "beauty-product": "product-only.hero-front",
    "beauty-product-hero": "product-only.hero-front",
    "beauty-lifestyle": "with-person.lifestyle-premium",
    "beauty-swatch": "detail-focus.texture",
    "beauty-texture": "detail-focus.texture",
    "beauty-model": "with-person.model-halfbody",
    "beauty-flatlay": "product-only.flat-lay",
    "beauty-skincare": "product-only.hero-front",

    // Interior
    "interior-room-scene": "mood-styling.space-minimal",

    // Electronics
    "electronics-product": "product-only.hero-angle",

    // Jewelry
    "jewelry-glamour": "product-only.hero-angle",

    // Sports
    "sports-action": "with-person.lifestyle-casual",

    // Pet
    "pet-product": "with-person.lifestyle-casual",

    // Kids
    "kids-playful": "with-person.lifestyle-casual",

    // Photo Studio
    "photo-studio-id-photo": "portrait.id-photo",
    "photo-studio-business-profile": "portrait.business-profile",
    "photo-studio-sns-profile": "portrait.sns-profile",
    "photo-studio-job-application": "portrait.job-application",
    "photo-studio-beauty-retouch": "portrait.beauty-retouch",
    "photo-studio-background-change": "portrait.background-change",
    "photo-studio-group-composite": "portrait.group-composite",
    "photo-studio-personal-color": "portrait.personal-color",
  };

  return actionIntentMap[actionId] || "product-only.hero-front";
}
