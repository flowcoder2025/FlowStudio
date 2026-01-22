/**
 * Guide Context Provider
 * Contract: INTEGRATION_FUNC_GUIDE_CONTEXT
 * Evidence: Phase 10 Page Integration
 */

"use client";

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useWorkflowStore } from "./store";
import {
  generateDynamicGuide,
  updateGuideSteps,
  processUserSelection,
  canSkipStep,
  skipStep,
  resetGuide as resetGuideUtil,
  type DynamicGuide,
  type StepType,
  type GuideStep,
} from "./guide";
import {
  generateRecommendations,
  quickRecommend,
  type WorkflowRecommendation,
} from "./recommend";
import { matchIntent } from "./intents";
import type { Industry } from "./industries";
import type { ExpressionIntent } from "./intents";

// ============================================================
// Types
// ============================================================

export interface GuideContextValue {
  // Guide state
  guide: DynamicGuide | null;
  currentStep: GuideStep | null;
  isComplete: boolean;
  progress: number;

  // Actions
  initializeGuide: (industry: Industry, intent?: ExpressionIntent) => void;
  completeStep: (stepId: StepType, value: unknown) => void;
  skipCurrentStep: () => void;
  goToStep: (stepId: StepType) => void;
  resetGuide: () => void;

  // Step utilities
  canSkip: (stepId: StepType) => boolean;
  getStepValue: (stepId: StepType) => unknown;

  // Recommendations
  recommendations: WorkflowRecommendation[];
  loadRecommendations: (query?: string, userHistory?: Array<{ industry: Industry; intent: ExpressionIntent }>) => void;
  getQuickRecommendations: (industry: Industry) => WorkflowRecommendation[];

  // Navigation helpers
  handleRecommendationSelect: (recommendation: WorkflowRecommendation) => void;
}

// ============================================================
// Context
// ============================================================

const GuideContext = createContext<GuideContextValue | null>(null);

// ============================================================
// Provider Props
// ============================================================

export interface GuideProviderProps {
  children: ReactNode;
}

// ============================================================
// Provider Component
// ============================================================

export function GuideProvider({ children }: GuideProviderProps) {
  // Get store state and actions
  const guide = useWorkflowStore((state) => state.guide);
  const inputs = useWorkflowStore((state) => state.inputs);
  const recommendations = useWorkflowStore((state) => state.recommendations);
  const selectedIndustry = useWorkflowStore((state) => state.selectedIndustry);
  const setGuide = useWorkflowStore((state) => state.setGuide);
  const setInput = useWorkflowStore((state) => state.setInput);
  const setRecommendations = useWorkflowStore((state) => state.setRecommendations);
  const selectIndustry = useWorkflowStore((state) => state.selectIndustry);
  const selectIntent = useWorkflowStore((state) => state.selectIntent);
  const setCurrentStep = useWorkflowStore((state) => state.setCurrentStep);

  // Derived state
  const currentStep = useMemo(() => {
    if (!guide) return null;
    return guide.steps[guide.currentStep] || null;
  }, [guide]);

  const isComplete = useMemo(() => {
    if (!guide) return false;
    return guide.currentStep >= guide.totalSteps;
  }, [guide]);

  const progress = useMemo(() => {
    if (!guide) return 0;
    const requiredSteps = guide.steps.filter((s) => s.required).length;
    const completedRequired = guide.completedSteps.filter((stepId) =>
      guide.steps.find((s) => s.id === stepId && s.required)
    ).length;
    return requiredSteps > 0 ? Math.round((completedRequired / requiredSteps) * 100) : 0;
  }, [guide]);

  // Initialize guide
  const initializeGuide = useCallback(
    (industry: Industry, intent?: ExpressionIntent) => {
      if (intent) {
        const newGuide = generateDynamicGuide(intent, industry);
        setGuide(newGuide);
      }
    },
    [setGuide]
  );

  // Complete a step
  const completeStep = useCallback(
    (stepId: StepType, value: unknown) => {
      if (!guide) return;

      // Store the value
      setInput(stepId, value);

      // Process selection and update guide
      // Convert value to string | string[] for processUserSelection
      const selection = Array.isArray(value)
        ? value.map(String)
        : typeof value === "string"
          ? value
          : String(value);
      const updatedGuide = processUserSelection(guide, stepId, selection);
      setGuide(updatedGuide);
    },
    [guide, setGuide, setInput]
  );

  // Skip current step
  const skipCurrentStep = useCallback(() => {
    if (!guide || !currentStep) return;

    if (canSkipStep(guide, currentStep.id)) {
      const updatedGuide = skipStep(guide, currentStep.id);
      setGuide(updatedGuide);
    }
  }, [guide, currentStep, setGuide]);

  // Go to specific step
  const goToStep = useCallback(
    (stepId: StepType) => {
      if (!guide) return;

      const stepIndex = guide.steps.findIndex((s) => s.id === stepId);
      if (stepIndex !== -1 && stepIndex <= guide.currentStep) {
        setGuide({
          ...guide,
          currentStep: stepIndex,
        });
      }
    },
    [guide, setGuide]
  );

  // Reset guide
  const resetGuideHandler = useCallback(() => {
    if (!guide) return;

    const resetGuideState = resetGuideUtil(guide);
    setGuide(resetGuideState);
  }, [guide, setGuide]);

  // Check if step can be skipped
  const canSkip = useCallback(
    (stepId: StepType): boolean => {
      if (!guide) return false;
      const result = canSkipStep(guide, stepId);
      return result.canSkip;
    },
    [guide]
  );

  // Get step value
  const getStepValue = useCallback(
    (stepId: StepType): unknown => {
      return inputs[stepId];
    },
    [inputs]
  );

  // Load recommendations
  const loadRecommendations = useCallback(
    (query?: string, _userHistory?: Array<{ industry: Industry; intent: ExpressionIntent }>) => {
      // Build search string from query and selected industry
      const searchString = [query, selectedIndustry].filter(Boolean).join(" ");
      const intentResult = matchIntent(searchString || "");
      const result = generateRecommendations(intentResult);
      // Combine primary and alternatives
      const allRecs = [
        ...(result.primary ? [result.primary] : []),
        ...result.alternatives,
      ];
      setRecommendations(allRecs);
    },
    [selectedIndustry, setRecommendations]
  );

  // Get quick recommendations for industry
  const getQuickRecommendations = useCallback((industry: Industry): WorkflowRecommendation[] => {
    return quickRecommend(industry);
  }, []);

  // Handle recommendation selection
  const handleRecommendationSelect = useCallback(
    (recommendation: WorkflowRecommendation) => {
      // Select industry and intent
      selectIndustry(recommendation.industry);
      selectIntent(recommendation.intent);

      // Initialize guide with recommendation (intent first, then industry)
      const newGuide = generateDynamicGuide(recommendation.intent, recommendation.industry);
      setGuide(newGuide);

      // Navigate to guide step
      setCurrentStep("guide");
    },
    [selectIndustry, selectIntent, setGuide, setCurrentStep]
  );

  // Context value
  const value = useMemo<GuideContextValue>(
    () => ({
      guide,
      currentStep,
      isComplete,
      progress,
      initializeGuide,
      completeStep,
      skipCurrentStep,
      goToStep,
      resetGuide: resetGuideHandler,
      canSkip,
      getStepValue,
      recommendations,
      loadRecommendations,
      getQuickRecommendations,
      handleRecommendationSelect,
    }),
    [
      guide,
      currentStep,
      isComplete,
      progress,
      initializeGuide,
      completeStep,
      skipCurrentStep,
      goToStep,
      resetGuideHandler,
      canSkip,
      getStepValue,
      recommendations,
      loadRecommendations,
      getQuickRecommendations,
      handleRecommendationSelect,
    ]
  );

  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>;
}

// ============================================================
// Hook
// ============================================================

export function useGuide(): GuideContextValue {
  const context = useContext(GuideContext);
  if (!context) {
    throw new Error("useGuide must be used within a GuideProvider");
  }
  return context;
}

// ============================================================
// Optional: Guide Provider with Auto-initialization
// ============================================================

export interface AutoGuideProviderProps {
  industry: Industry;
  intent?: ExpressionIntent;
  children: ReactNode;
}

export function AutoGuideProvider({
  industry,
  intent,
  children,
}: AutoGuideProviderProps) {
  return (
    <GuideProvider>
      <AutoGuideInitializer industry={industry} intent={intent}>
        {children}
      </AutoGuideInitializer>
    </GuideProvider>
  );
}

// Internal component to auto-initialize guide
function AutoGuideInitializer({
  industry,
  intent,
  children,
}: AutoGuideProviderProps) {
  const { guide, initializeGuide } = useGuide();

  // Initialize on mount if no guide exists
  useMemo(() => {
    if (!guide) {
      initializeGuide(industry, intent);
    }
  }, [guide, industry, intent, initializeGuide]);

  return <>{children}</>;
}
