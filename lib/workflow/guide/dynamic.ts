/**
 * Dynamic Guide Generator - 동적 단계 생성기
 * Contract: GUIDE_DYNAMIC
 * Evidence: Workflow Guide System Phase 7
 */

import { Industry } from "../industries";
import {
  ExpressionIntent,
  ExpressionCategory,
  DETAIL_ELEMENTS,
  getExpressionCategory,
} from "../intents";

// ============================================================
// 단계 타입 정의
// ============================================================

export type StepType =
  | "product-description"    // 상품 설명 (필수)
  | "reference-image"        // 참조 이미지 업로드 (선택)
  | "subject-selection"      // 피사체 선택 (모델/제품/공간)
  | "model-details"          // 모델 상세 (성별, 연령대, 포즈)
  | "style-mood"             // 스타일/무드
  | "background-setting"     // 배경 설정
  | "lighting-atmosphere"    // 조명/분위기
  | "angle-composition"      // 앵글/구도
  | "props-styling"          // 소품/스타일링
  | "color-scheme"           // 컬러 스킴
  | "detail-focus"           // 디테일 포커스
  | "seasonal-elements"      // 시즌 요소
  | "final-review";          // 최종 확인

export interface StepOption {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  imageUrl?: string;           // 옵션별 예시 이미지
  triggersSteps?: StepType[];  // 이 옵션 선택 시 추가될 단계
  skipsSteps?: StepType[];     // 이 옵션 선택 시 스킵될 단계
}

export interface GuideStep {
  id: StepType;
  title: string;
  titleKo: string;
  description: string;
  type: "select" | "multi-select" | "text" | "textarea" | "image-upload" | "color" | "slider";
  required: boolean;
  options?: StepOption[];
  placeholder?: string;
  defaultValue?: string | string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    maxFileSize?: number;      // 이미지 업로드용 (bytes)
    acceptedFormats?: string[]; // 이미지 업로드용
  };
  helperText?: string;
  exampleImages?: string[];    // 단계별 예시 이미지들
}

export interface DynamicGuide {
  intent: ExpressionIntent;
  industry: Industry;
  totalSteps: number;
  steps: GuideStep[];
  currentStep: number;
  completedSteps: StepType[];
  userSelections: Record<StepType, unknown>;
}

// ============================================================
// 단계 정의
// ============================================================

const STEP_DEFINITIONS: Record<StepType, Omit<GuideStep, "options">> = {
  "product-description": {
    id: "product-description",
    title: "Product Description",
    titleKo: "상품 설명",
    description: "촬영할 상품에 대해 설명해주세요",
    type: "textarea",
    required: true,
    placeholder: "예: 네이비 린넨 셔츠, 캐주얼한 핏, 여름용 시원한 소재",
    validation: { minLength: 10, maxLength: 500 },
    helperText: "상품의 특징, 소재, 컬러 등을 자세히 적어주세요",
  },
  "reference-image": {
    id: "reference-image",
    title: "Reference Image",
    titleKo: "참조 이미지",
    description: "원하는 스타일의 참조 이미지를 업로드해주세요 (선택)",
    type: "image-upload",
    required: false,
    validation: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      acceptedFormats: ["image/jpeg", "image/png", "image/webp"],
    },
    helperText: "비슷한 분위기의 이미지가 있다면 업로드해주세요",
  },
  "subject-selection": {
    id: "subject-selection",
    title: "Subject Selection",
    titleKo: "피사체 선택",
    description: "촬영 스타일을 선택해주세요",
    type: "select",
    required: true,
  },
  "model-details": {
    id: "model-details",
    title: "Model Details",
    titleKo: "모델 상세",
    description: "모델 특성을 선택해주세요",
    type: "multi-select",
    required: true,
  },
  "style-mood": {
    id: "style-mood",
    title: "Style & Mood",
    titleKo: "스타일/무드",
    description: "원하는 분위기를 선택해주세요",
    type: "select",
    required: true,
  },
  "background-setting": {
    id: "background-setting",
    title: "Background Setting",
    titleKo: "배경 설정",
    description: "배경 스타일을 선택해주세요",
    type: "select",
    required: true,
  },
  "lighting-atmosphere": {
    id: "lighting-atmosphere",
    title: "Lighting & Atmosphere",
    titleKo: "조명/분위기",
    description: "조명 스타일을 선택해주세요",
    type: "select",
    required: false,
  },
  "angle-composition": {
    id: "angle-composition",
    title: "Angle & Composition",
    titleKo: "앵글/구도",
    description: "촬영 각도를 선택해주세요",
    type: "select",
    required: true,
  },
  "props-styling": {
    id: "props-styling",
    title: "Props & Styling",
    titleKo: "소품/스타일링",
    description: "소품 스타일링을 선택해주세요",
    type: "select",
    required: false,
  },
  "color-scheme": {
    id: "color-scheme",
    title: "Color Scheme",
    titleKo: "컬러 스킴",
    description: "컬러 톤을 선택해주세요",
    type: "select",
    required: false,
  },
  "detail-focus": {
    id: "detail-focus",
    title: "Detail Focus",
    titleKo: "디테일 강조점",
    description: "강조할 부분을 선택해주세요",
    type: "select",
    required: true,
  },
  "seasonal-elements": {
    id: "seasonal-elements",
    title: "Seasonal Elements",
    titleKo: "시즌 요소",
    description: "시즌 분위기를 선택해주세요",
    type: "select",
    required: true,
  },
  "final-review": {
    id: "final-review",
    title: "Final Review",
    titleKo: "최종 확인",
    description: "선택하신 내용을 확인해주세요",
    type: "text",
    required: false,
    helperText: "수정이 필요하면 이전 단계로 돌아가세요",
  },
};

// ============================================================
// 의도별 단계 매핑
// ============================================================

type IntentStepConfig = {
  requiredSteps: StepType[];
  conditionalSteps?: Array<{
    condition: string;
    steps: StepType[];
  }>;
};

const INTENT_STEP_MAPPINGS: Partial<Record<ExpressionIntent, IntentStepConfig>> = {
  // 모델 전신
  "with-person.model-fullbody": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "model-details",
      "style-mood",
      "background-setting",
      "angle-composition",
      "final-review",
    ],
  },
  // 모델 반신
  "with-person.model-halfbody": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "model-details",
      "style-mood",
      "background-setting",
      "final-review",
    ],
  },
  // 손 들고 있는
  "with-person.hand-holding": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "background-setting",
      "angle-composition",
      "lighting-atmosphere",
      "final-review",
    ],
  },
  // 손 사용 중
  "with-person.hand-using": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "background-setting",
      "angle-composition",
      "final-review",
    ],
  },
  // 라이프스타일 캐주얼
  "with-person.lifestyle-casual": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "model-details",
      "style-mood",
      "background-setting",
      "props-styling",
      "final-review",
    ],
  },
  // 라이프스타일 프리미엄
  "with-person.lifestyle-premium": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "model-details",
      "style-mood",
      "background-setting",
      "lighting-atmosphere",
      "props-styling",
      "final-review",
    ],
  },
  // 히어로 정면
  "product-only.hero-front": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "background-setting",
      "lighting-atmosphere",
      "final-review",
    ],
  },
  // 히어로 각도
  "product-only.hero-angle": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "background-setting",
      "angle-composition",
      "lighting-atmosphere",
      "final-review",
    ],
  },
  // 플랫레이
  "product-only.flat-lay": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "background-setting",
      "props-styling",
      "color-scheme",
      "final-review",
    ],
  },
  // 고스트 마네킹
  "product-only.ghost-mannequin": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "angle-composition",
      "final-review",
    ],
  },
  // 플로팅
  "product-only.floating": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "background-setting",
      "lighting-atmosphere",
      "angle-composition",
      "final-review",
    ],
  },
  // 다각도
  "product-only.multi-angle": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "background-setting",
      "final-review",
    ],
  },
  // 질감 디테일
  "detail-focus.texture": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "detail-focus",
      "lighting-atmosphere",
      "final-review",
    ],
  },
  // 기능 부각
  "detail-focus.function": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "detail-focus",
      "angle-composition",
      "final-review",
    ],
  },
  // 성분/원료
  "detail-focus.ingredient": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "props-styling",
      "background-setting",
      "final-review",
    ],
  },
  // 클로즈업
  "detail-focus.close-up": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "detail-focus",
      "lighting-atmosphere",
      "final-review",
    ],
  },
  // 단면
  "detail-focus.cross-section": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "background-setting",
      "lighting-atmosphere",
      "final-review",
    ],
  },
  // 시즌 (봄/여름/가을/겨울 공통 구조)
  "mood-styling.seasonal-spring": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "seasonal-elements",
      "props-styling",
      "color-scheme",
      "final-review",
    ],
  },
  "mood-styling.seasonal-summer": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "seasonal-elements",
      "props-styling",
      "color-scheme",
      "final-review",
    ],
  },
  "mood-styling.seasonal-fall": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "seasonal-elements",
      "props-styling",
      "color-scheme",
      "final-review",
    ],
  },
  "mood-styling.seasonal-winter": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "seasonal-elements",
      "props-styling",
      "color-scheme",
      "final-review",
    ],
  },
  // 컬러 관련
  "mood-styling.color-warm": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "color-scheme",
      "background-setting",
      "lighting-atmosphere",
      "final-review",
    ],
  },
  "mood-styling.color-cool": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "color-scheme",
      "background-setting",
      "lighting-atmosphere",
      "final-review",
    ],
  },
  "mood-styling.color-pastel": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "color-scheme",
      "background-setting",
      "props-styling",
      "final-review",
    ],
  },
  "mood-styling.color-vivid": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "color-scheme",
      "background-setting",
      "lighting-atmosphere",
      "final-review",
    ],
  },
  // 공간 연출
  "mood-styling.space-minimal": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "background-setting",
      "lighting-atmosphere",
      "final-review",
    ],
  },
  "mood-styling.space-cozy": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "background-setting",
      "props-styling",
      "lighting-atmosphere",
      "final-review",
    ],
  },
  "mood-styling.space-luxury": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "background-setting",
      "props-styling",
      "lighting-atmosphere",
      "final-review",
    ],
  },
  // 구성/비교
  "composition.color-variation": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "background-setting",
      "angle-composition",
      "final-review",
    ],
  },
  "composition.set-bundle": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "background-setting",
      "props-styling",
      "angle-composition",
      "final-review",
    ],
  },
  "composition.size-comparison": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "background-setting",
      "props-styling",
      "final-review",
    ],
  },
  "composition.before-after": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "background-setting",
      "lighting-atmosphere",
      "final-review",
    ],
  },
  "composition.group-shot": {
    requiredSteps: [
      "product-description",
      "reference-image",
      "background-setting",
      "angle-composition",
      "props-styling",
      "final-review",
    ],
  },
};

// ============================================================
// 옵션 생성 함수
// ============================================================

function generateSubjectOptions(_industry: Industry): StepOption[] {
  return [
    {
      id: "model-full",
      label: "모델 전신",
      icon: "🧍",
      description: "모델이 상품을 착용/사용한 전신",
      triggersSteps: ["model-details"],
    },
    {
      id: "model-half",
      label: "모델 반신",
      icon: "👤",
      description: "모델 상반신 또는 하반신",
      triggersSteps: ["model-details"],
    },
    {
      id: "hand-only",
      label: "손만 등장",
      icon: "✋",
      description: "손으로 제품을 들거나 사용",
      skipsSteps: ["model-details"],
    },
    {
      id: "product-only",
      label: "제품 단독",
      icon: "📦",
      description: "제품만 촬영",
      skipsSteps: ["model-details"],
    },
  ];
}

function generateModelOptions(): StepOption[] {
  return [
    { id: "korean-female-20s", label: "한국 여성 20대", icon: "👩" },
    { id: "korean-female-30s", label: "한국 여성 30대", icon: "👩" },
    { id: "korean-male-20s", label: "한국 남성 20대", icon: "👨" },
    { id: "korean-male-30s", label: "한국 남성 30대", icon: "👨" },
    { id: "western-female", label: "서양 여성", icon: "👱‍♀️" },
    { id: "western-male", label: "서양 남성", icon: "👱" },
  ];
}

function generateBackgroundOptions(): StepOption[] {
  return DETAIL_ELEMENTS.background.map((bg) => ({
    id: bg.id,
    label: bg.nameKo,
    icon: bg.icon,
  }));
}

function generateLightingOptions(): StepOption[] {
  return DETAIL_ELEMENTS.lighting.map((light) => ({
    id: light.id,
    label: light.nameKo,
    icon: light.icon,
  }));
}

function generateAngleOptions(): StepOption[] {
  return DETAIL_ELEMENTS.angle.map((angle) => ({
    id: angle.id,
    label: angle.nameKo,
    icon: angle.icon,
  }));
}

function generatePropsOptions(): StepOption[] {
  return DETAIL_ELEMENTS.props.map((prop) => ({
    id: prop.id,
    label: prop.nameKo,
    icon: prop.icon,
  }));
}

function generateStyleMoodOptions(category: ExpressionCategory): StepOption[] {
  const baseOptions: StepOption[] = [
    { id: "minimal", label: "미니멀", icon: "⬜", description: "깔끔하고 심플한" },
    { id: "modern", label: "모던", icon: "🏢", description: "현대적이고 세련된" },
    { id: "natural", label: "내추럴", icon: "🌿", description: "자연스럽고 편안한" },
    { id: "luxurious", label: "럭셔리", icon: "✨", description: "고급스럽고 품격있는" },
    { id: "playful", label: "플레이풀", icon: "🎈", description: "활기차고 재미있는" },
    { id: "warm", label: "따뜻한", icon: "🔥", description: "포근하고 아늑한" },
    { id: "cool", label: "시원한", icon: "❄️", description: "청량하고 시원한" },
  ];

  // 카테고리별 추가 옵션
  if (category === "with-person") {
    baseOptions.push(
      { id: "casual", label: "캐주얼", icon: "👕", description: "편안하고 일상적인" },
      { id: "formal", label: "포멀", icon: "👔", description: "격식있고 단정한" }
    );
  }

  return baseOptions;
}

function generateDetailFocusOptions(industry: Industry): StepOption[] {
  const baseOptions: StepOption[] = [
    { id: "texture", label: "질감/소재", icon: "🧵" },
    { id: "stitching", label: "봉제/스티칭", icon: "🪡" },
    { id: "hardware", label: "하드웨어/장식", icon: "⚙️" },
    { id: "logo", label: "로고/브랜드", icon: "🏷️" },
    { id: "pattern", label: "패턴/프린트", icon: "🎨" },
  ];

  // 업종별 추가 옵션
  if (industry === "food") {
    baseOptions.push(
      { id: "cross-section", label: "단면", icon: "🔪" },
      { id: "steam", label: "스팀/열기", icon: "♨️" },
      { id: "drip", label: "물방울/윤기", icon: "💧" }
    );
  }

  if (industry === "beauty") {
    baseOptions.push(
      { id: "swatch", label: "발색", icon: "💄" },
      { id: "dispense", label: "제형", icon: "🧴" }
    );
  }

  return baseOptions;
}

function generateSeasonalOptions(): StepOption[] {
  return [
    { id: "spring-flowers", label: "봄꽃", icon: "🌸", description: "벚꽃, 튤립 등 봄 꽃" },
    { id: "spring-green", label: "새싹/그린", icon: "🌱", description: "싱그러운 새싹" },
    { id: "summer-beach", label: "바다/비치", icon: "🏖️", description: "바다, 모래사장" },
    { id: "summer-fruits", label: "여름과일", icon: "🍉", description: "수박, 레몬 등" },
    { id: "fall-leaves", label: "단풍/낙엽", icon: "🍂", description: "가을 단풍" },
    { id: "fall-harvest", label: "추수/열매", icon: "🎃", description: "호박, 곡물 등" },
    { id: "winter-snow", label: "눈/겨울", icon: "❄️", description: "눈, 서리" },
    { id: "winter-holiday", label: "홀리데이", icon: "🎄", description: "크리스마스 분위기" },
  ];
}

function generateColorSchemeOptions(): StepOption[] {
  return [
    { id: "warm-tone", label: "웜톤", icon: "🔥", description: "따뜻한 색감" },
    { id: "cool-tone", label: "쿨톤", icon: "💎", description: "차가운 색감" },
    { id: "pastel", label: "파스텔", icon: "🎀", description: "연하고 부드러운" },
    { id: "vivid", label: "비비드", icon: "🌈", description: "선명하고 강렬한" },
    { id: "monochrome", label: "모노크롬", icon: "⬛", description: "단색 톤" },
    { id: "earth-tone", label: "어스톤", icon: "🤎", description: "자연의 색감" },
  ];
}

// ============================================================
// 가이드 생성 함수
// ============================================================

/**
 * 의도와 업종에 맞는 동적 가이드 생성
 */
export function generateDynamicGuide(
  intent: ExpressionIntent,
  industry: Industry
): DynamicGuide {
  const intentConfig = INTENT_STEP_MAPPINGS[intent];
  const category = getExpressionCategory(intent);

  // 기본 단계 목록
  const stepTypes: StepType[] = intentConfig?.requiredSteps || [
    "product-description",
    "reference-image",
    "background-setting",
    "final-review",
  ];

  // 단계 정의에 옵션 추가
  const steps: GuideStep[] = stepTypes.map((stepType) => {
    const baseDef = STEP_DEFINITIONS[stepType];
    let options: StepOption[] | undefined;

    switch (stepType) {
      case "subject-selection":
        options = generateSubjectOptions(industry);
        break;
      case "model-details":
        options = generateModelOptions();
        break;
      case "background-setting":
        options = generateBackgroundOptions();
        break;
      case "lighting-atmosphere":
        options = generateLightingOptions();
        break;
      case "angle-composition":
        options = generateAngleOptions();
        break;
      case "props-styling":
        options = generatePropsOptions();
        break;
      case "style-mood":
        options = generateStyleMoodOptions(category);
        break;
      case "detail-focus":
        options = generateDetailFocusOptions(industry);
        break;
      case "seasonal-elements":
        options = generateSeasonalOptions();
        break;
      case "color-scheme":
        options = generateColorSchemeOptions();
        break;
    }

    return {
      ...baseDef,
      options,
    };
  });

  return {
    intent,
    industry,
    totalSteps: steps.length,
    steps,
    currentStep: 0,
    completedSteps: [],
    userSelections: {} as Record<StepType, unknown>,
  };
}

/**
 * 사용자 선택에 따라 단계 업데이트
 */
export function updateGuideSteps(
  guide: DynamicGuide,
  stepId: StepType,
  selectedOptionId: string
): DynamicGuide {
  const step = guide.steps.find((s) => s.id === stepId);
  if (!step || !step.options) return guide;

  const selectedOption = step.options.find((o) => o.id === selectedOptionId);
  if (!selectedOption) return guide;

  let updatedSteps = [...guide.steps];

  // 추가될 단계 처리
  if (selectedOption.triggersSteps) {
    const finalReviewIndex = updatedSteps.findIndex((s) => s.id === "final-review");
    const currentStepIndex = updatedSteps.findIndex((s) => s.id === stepId);

    for (const newStepType of selectedOption.triggersSteps) {
      // 이미 존재하는지 확인
      if (!updatedSteps.some((s) => s.id === newStepType)) {
        const newStep: GuideStep = {
          ...STEP_DEFINITIONS[newStepType],
          options: getOptionsForStep(newStepType, guide.industry),
        };
        // final-review 앞에 삽입
        const insertIndex = finalReviewIndex > currentStepIndex
          ? finalReviewIndex
          : updatedSteps.length - 1;
        updatedSteps.splice(insertIndex, 0, newStep);
      }
    }
  }

  // 스킵될 단계 처리
  if (selectedOption.skipsSteps) {
    updatedSteps = updatedSteps.filter(
      (s) => !selectedOption.skipsSteps!.includes(s.id)
    );
  }

  return {
    ...guide,
    steps: updatedSteps,
    totalSteps: updatedSteps.length,
    userSelections: {
      ...guide.userSelections,
      [stepId]: selectedOptionId,
    },
    completedSteps: [...guide.completedSteps, stepId],
  };
}

/**
 * 단계별 옵션 조회 헬퍼
 */
function getOptionsForStep(stepType: StepType, industry: Industry): StepOption[] | undefined {
  switch (stepType) {
    case "model-details":
      return generateModelOptions();
    case "background-setting":
      return generateBackgroundOptions();
    case "lighting-atmosphere":
      return generateLightingOptions();
    case "angle-composition":
      return generateAngleOptions();
    case "props-styling":
      return generatePropsOptions();
    case "detail-focus":
      return generateDetailFocusOptions(industry);
    default:
      return undefined;
  }
}

/**
 * 가이드 완료 여부 확인
 */
export function isGuideComplete(guide: DynamicGuide): boolean {
  const requiredSteps = guide.steps.filter((s) => s.required);
  return requiredSteps.every((s) => guide.completedSteps.includes(s.id));
}

/**
 * 다음 단계 조회
 */
export function getNextStep(guide: DynamicGuide): GuideStep | null {
  const currentIndex = guide.steps.findIndex(
    (s) => !guide.completedSteps.includes(s.id)
  );
  return currentIndex >= 0 ? guide.steps[currentIndex] : null;
}

/**
 * 진행률 계산
 */
export function calculateProgress(guide: DynamicGuide): number {
  if (guide.totalSteps === 0) return 0;
  return Math.round((guide.completedSteps.length / guide.totalSteps) * 100);
}
