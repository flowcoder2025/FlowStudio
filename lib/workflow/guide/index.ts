/**
 * Guide Module Index
 * Contract: GUIDE_DYNAMIC, GUIDE_BRANCHING
 * Evidence: Workflow Guide System Phase 7
 */

// Dynamic exports
export {
  type StepType,
  type StepOption,
  type GuideStep,
  type DynamicGuide,
  generateDynamicGuide,
  updateGuideSteps,
  isGuideComplete,
  getNextStep,
  calculateProgress,
} from "./dynamic";

// Branching exports
export {
  type BranchRule,
  type BranchCondition,
  type BranchAction,
  type SkipRule,
  type SkipCondition,
  type SkipBehavior,
  evaluateCondition,
  applyBranchAction,
  applyBranchRules,
  canSkipStep,
  skipStep,
  getSkippableSteps,
  processUserSelection,
  goToPreviousStep,
  resetGuide,
} from "./branching";
