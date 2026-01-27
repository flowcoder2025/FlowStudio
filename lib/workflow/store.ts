/**
 * Workflow State Store (Zustand)
 * Contract: INTEGRATION_FUNC_WORKFLOW_STATE
 * Evidence: Phase 10 Page Integration
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Industry } from "./industries";
import type { ExpressionIntent } from "./intents";
import type { DynamicGuide, StepType } from "./guide";
import type { WorkflowRecommendation } from "./recommend";
import type { UploadedImage } from "@/components/workflow/ImageUpload";
import type { ReferenceMode } from "@/lib/imageProvider/types";

// ============================================================
// Types
// ============================================================

export interface GeneratedImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  provider: string;
  model: string;
}

export interface GenerationResult {
  success: boolean;
  images: GeneratedImage[];
  creditsUsed: number;
  provider: string;
  model: string;
  duration?: number;
  error?: string;
  sessionId?: string;
}

export interface WorkflowSession {
  id: string;
  industry: Industry;
  action: string;
  intent?: ExpressionIntent;
  inputs: Record<string, unknown>;
  referenceImages: UploadedImage[];
  createdAt: Date;
  updatedAt: Date;
}

export type WorkflowStep =
  | "industry-select"
  | "action-select"
  | "guide"
  | "generating"
  | "result";

export type ImmersiveStep =
  | "recommend"
  | "action"
  | "input"
  | "generating"
  | "result";

export interface WorkflowState {
  // Current workflow state
  currentStep: WorkflowStep;
  selectedIndustry: Industry | null;
  selectedAction: string | null;
  selectedIntent: ExpressionIntent | null;

  // User inputs
  inputs: Record<string, unknown>;
  referenceImages: UploadedImage[];
  /** 참조 이미지 활용 모드 */
  referenceMode: ReferenceMode;

  // Initial query from search (for auto-fill)
  initialQuery: string;
  // Image count for generation (1-4)
  imageCount: number;

  // Guide state
  guide: DynamicGuide | null;

  // Generation state
  isGenerating: boolean;
  generationProgress: number;
  generationResult: GenerationResult | null;

  // Recommendations
  recommendations: WorkflowRecommendation[];

  // Session
  session: WorkflowSession | null;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Immersive mode state
  isImmersiveMode: boolean;
  immersiveStep: ImmersiveStep;
  showOnboarding: boolean;
  showImmersiveResult: boolean;

  // History (recent workflows)
  recentWorkflows: Array<{
    industry: Industry;
    action: string;
    intent?: ExpressionIntent;
    timestamp: Date;
  }>;
}

export interface WorkflowActions {
  // Navigation
  setCurrentStep: (step: WorkflowStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;

  // Selection
  selectIndustry: (industry: Industry) => void;
  selectAction: (action: string) => void;
  selectIntent: (intent: ExpressionIntent) => void;

  // Inputs
  setInput: (key: string, value: unknown) => void;
  setInputs: (inputs: Record<string, unknown>) => void;
  clearInputs: () => void;

  // Reference images
  setReferenceImages: (images: UploadedImage[]) => void;
  addReferenceImage: (image: UploadedImage) => void;
  removeReferenceImage: (imageId: string) => void;
  setReferenceMode: (mode: ReferenceMode) => void;

  // Guide
  setGuide: (guide: DynamicGuide | null) => void;
  updateGuideStep: (stepId: StepType, value: unknown) => void;
  completeGuide: () => void;
  resetGuide: () => void;

  // Generation
  startGeneration: () => void;
  updateProgress: (progress: number) => void;
  setGenerationResult: (result: GenerationResult | null) => void;

  // Recommendations
  setRecommendations: (recommendations: WorkflowRecommendation[]) => void;

  // Session
  createSession: () => WorkflowSession;
  loadSession: (session: WorkflowSession) => void;
  clearSession: () => void;

  // Error handling
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;

  // Reset
  resetWorkflow: () => void;
  resetAll: () => void;

  // History
  addToHistory: (workflow: { industry: Industry; action: string; intent?: ExpressionIntent }) => void;
  clearHistory: () => void;

  // Immersive mode
  enterImmersiveMode: () => void;
  exitImmersiveMode: () => void;
  setImmersiveStep: (step: ImmersiveStep) => void;
  dismissOnboarding: () => void;
  openImmersiveResult: () => void;
  closeImmersiveResult: () => void;

  // Initial query & image count
  setInitialQuery: (query: string) => void;
  setImageCount: (count: number) => void;
}

// ============================================================
// Initial State
// ============================================================

const initialState: WorkflowState = {
  currentStep: "industry-select",
  selectedIndustry: null,
  selectedAction: null,
  selectedIntent: null,
  inputs: {},
  referenceImages: [],
  referenceMode: "full",
  initialQuery: "",
  imageCount: 1,
  guide: null,
  isGenerating: false,
  generationProgress: 0,
  generationResult: null,
  recommendations: [],
  session: null,
  isLoading: false,
  error: null,
  isImmersiveMode: true,
  immersiveStep: "recommend",
  showOnboarding: true,
  showImmersiveResult: false,
  recentWorkflows: [],
};

// ============================================================
// Store
// ============================================================

export const useWorkflowStore = create<WorkflowState & WorkflowActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Navigation
        setCurrentStep: (step) => set({ currentStep: step }),

        goToNextStep: () => {
          const { currentStep, selectedIndustry, selectedAction } = get();
          const stepOrder: WorkflowStep[] = [
            "industry-select",
            "action-select",
            "guide",
            "generating",
            "result",
          ];
          const currentIndex = stepOrder.indexOf(currentStep);

          // Validation
          if (currentStep === "industry-select" && !selectedIndustry) return;
          if (currentStep === "action-select" && !selectedAction) return;

          if (currentIndex < stepOrder.length - 1) {
            set({ currentStep: stepOrder[currentIndex + 1] });
          }
        },

        goToPreviousStep: () => {
          const { currentStep } = get();
          const stepOrder: WorkflowStep[] = [
            "industry-select",
            "action-select",
            "guide",
            "generating",
            "result",
          ];
          const currentIndex = stepOrder.indexOf(currentStep);

          if (currentIndex > 0) {
            set({ currentStep: stepOrder[currentIndex - 1] });
          }
        },

        // Selection
        selectIndustry: (industry) => {
          set({
            selectedIndustry: industry,
            selectedAction: null,
            selectedIntent: null,
            inputs: {},
            guide: null,
            error: null,
          });
        },

        selectAction: (action) => {
          set({
            selectedAction: action,
            inputs: {},
            error: null,
          });
        },

        selectIntent: (intent) => {
          set({ selectedIntent: intent });
        },

        // Inputs
        setInput: (key, value) => {
          set((state) => ({
            inputs: { ...state.inputs, [key]: value },
          }));
        },

        setInputs: (inputs) => set({ inputs }),

        clearInputs: () => set({ inputs: {} }),

        // Reference images
        setReferenceImages: (images) => set({ referenceImages: images }),

        addReferenceImage: (image) => {
          set((state) => ({
            referenceImages: [...state.referenceImages, image],
          }));
        },

        removeReferenceImage: (imageId) => {
          set((state) => ({
            referenceImages: state.referenceImages.filter((img) => img.id !== imageId),
          }));
        },

        setReferenceMode: (mode) => set({ referenceMode: mode }),

        // Guide
        setGuide: (guide) => set({ guide }),

        updateGuideStep: (stepId, value) => {
          const { guide, inputs } = get();
          if (!guide) return;

          // Update inputs with guide step value
          set({
            inputs: { ...inputs, [stepId]: value },
          });
        },

        completeGuide: () => {
          set({ currentStep: "generating" });
        },

        resetGuide: () => {
          const { guide } = get();
          if (!guide) return;

          set({
            guide: {
              ...guide,
              currentStep: 0,
              completedSteps: [],
            },
            inputs: {},
          });
        },

        // Generation
        startGeneration: () => {
          set({
            isGenerating: true,
            generationProgress: 0,
            generationResult: null,
            error: null,
            currentStep: "generating",
          });
        },

        updateProgress: (progress) => {
          set({ generationProgress: progress });
        },

        setGenerationResult: (result) => {
          const { selectedIndustry, selectedAction, selectedIntent } = get();

          set({
            generationResult: result,
            isGenerating: false,
            generationProgress: 100,
            currentStep: result?.success ? "result" : "guide",
          });

          // Add to history on success
          if (result?.success && selectedIndustry && selectedAction) {
            get().addToHistory({
              industry: selectedIndustry,
              action: selectedAction,
              intent: selectedIntent ?? undefined,
            });
          }
        },

        // Recommendations
        setRecommendations: (recommendations) => set({ recommendations }),

        // Session
        createSession: () => {
          const {
            selectedIndustry,
            selectedAction,
            selectedIntent,
            inputs,
            referenceImages,
          } = get();

          if (!selectedIndustry || !selectedAction) {
            throw new Error("Industry and action must be selected");
          }

          const session: WorkflowSession = {
            id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            industry: selectedIndustry,
            action: selectedAction,
            intent: selectedIntent ?? undefined,
            inputs,
            referenceImages,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          set({ session });
          return session;
        },

        loadSession: (session) => {
          set({
            session,
            selectedIndustry: session.industry,
            selectedAction: session.action,
            selectedIntent: session.intent ?? null,
            inputs: session.inputs,
            referenceImages: session.referenceImages,
          });
        },

        clearSession: () => {
          set({ session: null });
        },

        // Error handling
        setError: (error) => set({ error }),
        setLoading: (loading) => set({ isLoading: loading }),

        // Reset
        resetWorkflow: () => {
          set({
            currentStep: "industry-select",
            selectedAction: null,
            selectedIntent: null,
            inputs: {},
            referenceImages: [],
            referenceMode: "full",
            guide: null,
            isGenerating: false,
            generationProgress: 0,
            generationResult: null,
            session: null,
            error: null,
            immersiveStep: "recommend",
          });
        },

        resetAll: () => {
          set(initialState);
        },

        // History
        addToHistory: (workflow) => {
          set((state) => {
            const newEntry = { ...workflow, timestamp: new Date() };
            // Keep only last 10 workflows
            const updated = [newEntry, ...state.recentWorkflows].slice(0, 10);
            return { recentWorkflows: updated };
          });
        },

        clearHistory: () => set({ recentWorkflows: [] }),

        // Immersive mode
        enterImmersiveMode: () => {
          set({ isImmersiveMode: true });
        },

        exitImmersiveMode: () => {
          set({ isImmersiveMode: false });
        },

        setImmersiveStep: (step) => {
          set({ immersiveStep: step });
        },

        dismissOnboarding: () => {
          set({ showOnboarding: false });
        },

        openImmersiveResult: () => {
          set({ showImmersiveResult: true, immersiveStep: "result" });
        },

        closeImmersiveResult: () => {
          set({ showImmersiveResult: false });
        },

        // Initial query & image count
        setInitialQuery: (query) => {
          set({ initialQuery: query });
        },

        setImageCount: (count) => {
          // Clamp count between 1 and 4
          const validCount = Math.max(1, Math.min(4, count));
          set({ imageCount: validCount });
        },
      }),
      {
        name: "flowstudio-workflow",
        partialize: (state) => ({
          recentWorkflows: state.recentWorkflows,
        }),
      }
    ),
    { name: "WorkflowStore" }
  )
);

// ============================================================
// Selectors
// ============================================================

export const selectCurrentWorkflow = (state: WorkflowState) => ({
  industry: state.selectedIndustry,
  action: state.selectedAction,
  intent: state.selectedIntent,
  inputs: state.inputs,
  referenceImages: state.referenceImages,
  referenceMode: state.referenceMode,
});

export const selectGuideState = (state: WorkflowState) => ({
  guide: state.guide,
  inputs: state.inputs,
});

export const selectGenerationState = (state: WorkflowState) => ({
  isGenerating: state.isGenerating,
  progress: state.generationProgress,
  result: state.generationResult,
});

export const selectUIState = (state: WorkflowState) => ({
  currentStep: state.currentStep,
  isLoading: state.isLoading,
  error: state.error,
});

// ============================================================
// Hooks
// ============================================================

export const useCurrentWorkflow = () => useWorkflowStore(selectCurrentWorkflow);
export const useGuideState = () => useWorkflowStore(selectGuideState);
export const useGenerationState = () => useWorkflowStore(selectGenerationState);
export const useUIState = () => useWorkflowStore(selectUIState);
