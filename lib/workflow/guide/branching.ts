/**
 * Guide Branching Logic - 분기/스킵 로직
 * Contract: GUIDE_BRANCHING
 * Evidence: Workflow Guide System Phase 7
 */

import {
  DynamicGuide,
  GuideStep,
  StepType,
} from "./dynamic";

// ============================================================
// 분기 규칙 타입
// ============================================================

export interface BranchRule {
  id: string;
  description: string;
  condition: BranchCondition;
  actions: BranchAction[];
}

export type BranchCondition =
  | { type: "step-selected"; stepId: StepType; optionId: string }
  | { type: "step-skipped"; stepId: StepType }
  | { type: "value-contains"; stepId: StepType; contains: string }
  | { type: "multiple-selected"; stepId: StepType; optionIds: string[] }
  | { type: "composite"; operator: "and" | "or"; conditions: BranchCondition[] };

export type BranchAction =
  | { type: "add-step"; stepType: StepType; afterStep?: StepType }
  | { type: "remove-step"; stepType: StepType }
  | { type: "modify-step"; stepType: StepType; modifications: Partial<GuideStep> }
  | { type: "set-required"; stepType: StepType; required: boolean }
  | { type: "set-default"; stepType: StepType; defaultValue: string | string[] };

// ============================================================
// 스킵 규칙
// ============================================================

export interface SkipRule {
  stepType: StepType;
  skipCondition: SkipCondition;
  behavior: SkipBehavior;
}

export type SkipCondition =
  | "already-answered"    // 이전에 이미 답변됨
  | "not-applicable"      // 현재 맥락에서 해당 안됨
  | "default-ok"          // 기본값으로 충분
  | "user-skipped";       // 사용자가 스킵 요청

export type SkipBehavior =
  | "auto-skip"           // 자동으로 스킵 (표시 안함)
  | "show-collapsed"      // 접힌 상태로 표시
  | "ask-confirmation";   // 스킵 여부 확인

// ============================================================
// 기본 분기 규칙
// ============================================================

const DEFAULT_BRANCH_RULES: BranchRule[] = [
  // 제품 단독 선택 시 모델 관련 단계 제거
  {
    id: "product-only-removes-model",
    description: "제품 단독 선택 시 모델 단계 제거",
    condition: {
      type: "step-selected",
      stepId: "subject-selection",
      optionId: "product-only",
    },
    actions: [
      { type: "remove-step", stepType: "model-details" },
    ],
  },

  // 손만 등장 선택 시 모델 단계 제거, 앵글 필수화
  {
    id: "hand-only-adjustments",
    description: "손만 등장 선택 시 조정",
    condition: {
      type: "step-selected",
      stepId: "subject-selection",
      optionId: "hand-only",
    },
    actions: [
      { type: "remove-step", stepType: "model-details" },
      { type: "set-required", stepType: "angle-composition", required: true },
    ],
  },

  // 모델 전신 선택 시 포즈/앵글 추가
  {
    id: "model-full-adds-pose",
    description: "모델 전신 선택 시 포즈 단계 추가",
    condition: {
      type: "step-selected",
      stepId: "subject-selection",
      optionId: "model-full",
    },
    actions: [
      { type: "add-step", stepType: "angle-composition", afterStep: "model-details" },
      { type: "set-required", stepType: "angle-composition", required: true },
    ],
  },

  // 미니멀 스타일 선택 시 소품 기본값 설정
  {
    id: "minimal-defaults-no-props",
    description: "미니멀 스타일 시 소품 없음 기본 설정",
    condition: {
      type: "step-selected",
      stepId: "style-mood",
      optionId: "minimal",
    },
    actions: [
      { type: "set-default", stepType: "props-styling", defaultValue: "none" },
    ],
  },

  // 럭셔리 스타일 선택 시 조명 필수화
  {
    id: "luxury-requires-lighting",
    description: "럭셔리 스타일 시 조명 필수",
    condition: {
      type: "step-selected",
      stepId: "style-mood",
      optionId: "luxurious",
    },
    actions: [
      { type: "set-required", stepType: "lighting-atmosphere", required: true },
    ],
  },

  // 플랫레이 선택 시 앵글 자동 설정
  {
    id: "flatlay-sets-topdown",
    description: "플랫레이 시 탑다운 앵글 자동 설정",
    condition: {
      type: "step-selected",
      stepId: "subject-selection",
      optionId: "flatlay",
    },
    actions: [
      { type: "set-default", stepType: "angle-composition", defaultValue: "top-down" },
      {
        type: "modify-step",
        stepType: "angle-composition",
        modifications: { required: false, helperText: "플랫레이는 기본 탑다운 앵글입니다" },
      },
    ],
  },

  // 시즌 요소 선택 시 컬러 스킴 추가
  {
    id: "seasonal-adds-color",
    description: "시즌 요소 선택 시 컬러 스킴 추가",
    condition: {
      type: "composite",
      operator: "or",
      conditions: [
        { type: "step-selected", stepId: "seasonal-elements", optionId: "spring-flowers" },
        { type: "step-selected", stepId: "seasonal-elements", optionId: "fall-leaves" },
        { type: "step-selected", stepId: "seasonal-elements", optionId: "winter-holiday" },
      ],
    },
    actions: [
      { type: "add-step", stepType: "color-scheme", afterStep: "seasonal-elements" },
    ],
  },
];

// ============================================================
// 기본 스킵 규칙
// ============================================================

const DEFAULT_SKIP_RULES: SkipRule[] = [
  // 참조 이미지는 기본적으로 스킵 가능
  {
    stepType: "reference-image",
    skipCondition: "default-ok",
    behavior: "show-collapsed",
  },

  // 조명은 선택사항으로 스킵 가능
  {
    stepType: "lighting-atmosphere",
    skipCondition: "default-ok",
    behavior: "show-collapsed",
  },

  // 소품은 선택사항으로 스킵 가능
  {
    stepType: "props-styling",
    skipCondition: "default-ok",
    behavior: "show-collapsed",
  },

  // 컬러 스킴은 선택사항으로 스킵 가능
  {
    stepType: "color-scheme",
    skipCondition: "default-ok",
    behavior: "show-collapsed",
  },
];

// ============================================================
// 분기 평가 함수
// ============================================================

/**
 * 조건 평가
 */
export function evaluateCondition(
  condition: BranchCondition,
  guide: DynamicGuide
): boolean {
  switch (condition.type) {
    case "step-selected": {
      const selection = guide.userSelections[condition.stepId];
      return selection === condition.optionId;
    }

    case "step-skipped": {
      return !guide.completedSteps.includes(condition.stepId);
    }

    case "value-contains": {
      const value = guide.userSelections[condition.stepId];
      if (typeof value === "string") {
        return value.toLowerCase().includes(condition.contains.toLowerCase());
      }
      return false;
    }

    case "multiple-selected": {
      const selection = guide.userSelections[condition.stepId];
      if (Array.isArray(selection)) {
        return condition.optionIds.some((id) => selection.includes(id));
      }
      return condition.optionIds.includes(selection as string);
    }

    case "composite": {
      if (condition.operator === "and") {
        return condition.conditions.every((c) => evaluateCondition(c, guide));
      } else {
        return condition.conditions.some((c) => evaluateCondition(c, guide));
      }
    }

    default:
      return false;
  }
}

/**
 * 분기 액션 적용
 */
export function applyBranchAction(
  guide: DynamicGuide,
  action: BranchAction
): DynamicGuide {
  const updatedGuide = { ...guide };

  switch (action.type) {
    case "add-step": {
      // 이미 존재하면 추가하지 않음
      if (updatedGuide.steps.some((s) => s.id === action.stepType)) {
        return updatedGuide;
      }

      // afterStep 위치 찾기
      let insertIndex = updatedGuide.steps.length - 1; // 기본: final-review 앞
      if (action.afterStep) {
        const afterIndex = updatedGuide.steps.findIndex(
          (s) => s.id === action.afterStep
        );
        if (afterIndex >= 0) {
          insertIndex = afterIndex + 1;
        }
      }

      // 새 단계 생성 (기본 정의에서)
      const newStep: GuideStep = {
        id: action.stepType,
        title: action.stepType,
        titleKo: getStepTitleKo(action.stepType),
        description: "",
        type: "select",
        required: false,
      };

      const newSteps = [...updatedGuide.steps];
      newSteps.splice(insertIndex, 0, newStep);

      return {
        ...updatedGuide,
        steps: newSteps,
        totalSteps: newSteps.length,
      };
    }

    case "remove-step": {
      return {
        ...updatedGuide,
        steps: updatedGuide.steps.filter((s) => s.id !== action.stepType),
        totalSteps: updatedGuide.steps.length - 1,
      };
    }

    case "modify-step": {
      return {
        ...updatedGuide,
        steps: updatedGuide.steps.map((s) =>
          s.id === action.stepType ? { ...s, ...action.modifications } : s
        ),
      };
    }

    case "set-required": {
      return {
        ...updatedGuide,
        steps: updatedGuide.steps.map((s) =>
          s.id === action.stepType ? { ...s, required: action.required } : s
        ),
      };
    }

    case "set-default": {
      return {
        ...updatedGuide,
        steps: updatedGuide.steps.map((s) =>
          s.id === action.stepType ? { ...s, defaultValue: action.defaultValue } : s
        ),
      };
    }

    default:
      return updatedGuide;
  }
}

/**
 * 모든 분기 규칙 적용
 */
export function applyBranchRules(
  guide: DynamicGuide,
  customRules: BranchRule[] = []
): DynamicGuide {
  const allRules = [...DEFAULT_BRANCH_RULES, ...customRules];
  let updatedGuide = { ...guide };

  for (const rule of allRules) {
    if (evaluateCondition(rule.condition, updatedGuide)) {
      for (const action of rule.actions) {
        updatedGuide = applyBranchAction(updatedGuide, action);
      }
    }
  }

  return updatedGuide;
}

// ============================================================
// 스킵 로직
// ============================================================

/**
 * 단계 스킵 가능 여부 확인
 */
export function canSkipStep(
  guide: DynamicGuide,
  stepType: StepType,
  customRules: SkipRule[] = []
): { canSkip: boolean; behavior: SkipBehavior; reason: string } {
  const allRules = [...DEFAULT_SKIP_RULES, ...customRules];
  const rule = allRules.find((r) => r.stepType === stepType);

  if (!rule) {
    // 규칙 없으면 필수 여부로 판단
    const step = guide.steps.find((s) => s.id === stepType);
    if (step?.required) {
      return {
        canSkip: false,
        behavior: "ask-confirmation",
        reason: "필수 단계입니다",
      };
    }
    return {
      canSkip: true,
      behavior: "ask-confirmation",
      reason: "선택 단계입니다",
    };
  }

  // 규칙 기반 판단
  switch (rule.skipCondition) {
    case "already-answered":
      return {
        canSkip: guide.completedSteps.includes(stepType),
        behavior: rule.behavior,
        reason: "이미 답변한 단계입니다",
      };

    case "not-applicable":
      return {
        canSkip: true,
        behavior: rule.behavior,
        reason: "현재 선택에서는 해당되지 않습니다",
      };

    case "default-ok":
      return {
        canSkip: true,
        behavior: rule.behavior,
        reason: "기본값으로 진행할 수 있습니다",
      };

    case "user-skipped":
      return {
        canSkip: true,
        behavior: rule.behavior,
        reason: "스킵을 요청했습니다",
      };

    default:
      return {
        canSkip: false,
        behavior: "ask-confirmation",
        reason: "확인이 필요합니다",
      };
  }
}

/**
 * 단계 스킵 처리
 */
export function skipStep(
  guide: DynamicGuide,
  stepType: StepType
): DynamicGuide {
  const { canSkip } = canSkipStep(guide, stepType);

  if (!canSkip) {
    return guide; // 스킵 불가
  }

  // 기본값이 있으면 적용
  const step = guide.steps.find((s) => s.id === stepType);
  const defaultValue = step?.defaultValue;

  return {
    ...guide,
    completedSteps: [...guide.completedSteps, stepType],
    userSelections: {
      ...guide.userSelections,
      [stepType]: defaultValue || null,
    },
  };
}

/**
 * 스킵 가능한 단계 목록 조회
 */
export function getSkippableSteps(
  guide: DynamicGuide,
  customRules: SkipRule[] = []
): Array<{ step: GuideStep; reason: string; behavior: SkipBehavior }> {
  return guide.steps
    .filter((step) => !guide.completedSteps.includes(step.id))
    .map((step) => {
      const { canSkip, reason, behavior } = canSkipStep(
        guide,
        step.id,
        customRules
      );
      return canSkip ? { step, reason, behavior } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

// ============================================================
// 유틸리티 함수
// ============================================================

function getStepTitleKo(stepType: StepType): string {
  const titles: Record<StepType, string> = {
    "product-description": "상품 설명",
    "reference-image": "참조 이미지",
    "subject-selection": "피사체 선택",
    "model-details": "모델 상세",
    "style-mood": "스타일/무드",
    "background-setting": "배경 설정",
    "lighting-atmosphere": "조명/분위기",
    "angle-composition": "앵글/구도",
    "props-styling": "소품/스타일링",
    "color-scheme": "컬러 스킴",
    "detail-focus": "디테일 강조점",
    "seasonal-elements": "시즌 요소",
    "final-review": "최종 확인",
  };
  return titles[stepType] || stepType;
}

/**
 * 사용자 선택 후 가이드 업데이트 (분기 포함)
 */
export function processUserSelection(
  guide: DynamicGuide,
  stepId: StepType,
  selection: string | string[]
): DynamicGuide {
  // 1. 기본 업데이트
  let updatedGuide: DynamicGuide = {
    ...guide,
    userSelections: {
      ...guide.userSelections,
      [stepId]: selection,
    },
    completedSteps: [...guide.completedSteps, stepId],
  };

  // 2. 분기 규칙 적용
  updatedGuide = applyBranchRules(updatedGuide);

  return updatedGuide;
}

/**
 * 이전 단계로 돌아가기
 */
export function goToPreviousStep(guide: DynamicGuide): DynamicGuide {
  if (guide.completedSteps.length === 0) {
    return guide;
  }

  const lastCompleted = guide.completedSteps[guide.completedSteps.length - 1];
  const newCompleted = guide.completedSteps.slice(0, -1);

  // 해당 선택 제거
  const newSelections = { ...guide.userSelections };
  delete newSelections[lastCompleted];

  return {
    ...guide,
    completedSteps: newCompleted,
    userSelections: newSelections,
    currentStep: Math.max(0, guide.currentStep - 1),
  };
}

/**
 * 가이드 초기화
 */
export function resetGuide(guide: DynamicGuide): DynamicGuide {
  return {
    ...guide,
    completedSteps: [],
    userSelections: {} as Record<StepType, unknown>,
    currentStep: 0,
  };
}
