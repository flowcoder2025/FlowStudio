/**
 * Prompt Builder Utility
 * Contract: PROMPT_BUILDER
 * Evidence: Phase 1 - 프롬프트 시스템 개선
 *
 * Google 공식 문서 + Nano Banana Pro 베스트 프랙티스 기반
 * - 6컴포넌트 구조: Subject + Action + Environment + Art Style + Lighting + Details
 * - 자연어 문장 변환
 * - 텍스트 렌더링 방지 접미사
 */

// ============================================================
// 상수 - 프롬프트 접미사
// ============================================================

/**
 * 텍스트 렌더링 방지 접미사 (Nano Banana Pro 가이드 기반)
 * 항상 프롬프트 마지막에 추가하여 이미지에 텍스트가 나타나지 않도록 함
 */
export const NO_TEXT_SUFFIX =
  "IMPORTANT: The image must contain absolutely no text, no logos, no watermarks, no written words, no letters, no numbers, no brand names visible anywhere in the image.";

/**
 * 품질 향상 접미사 (Google 공식 권장)
 * 전문적인 품질의 이미지 생성을 위한 기본 지시
 */
export const QUALITY_SUFFIX =
  "Professional photography quality with sharp focus, high detail, and photorealistic rendering.";

/**
 * 조명 향상 접미사
 */
export const LIGHTING_SUFFIX =
  "Soft natural lighting with beautiful highlights and gentle shadows that enhance the subject.";

// ============================================================
// 타입 정의
// ============================================================

import type { ReferenceMode } from './types';

export interface PromptBuilderOptions {
  /** 주요 피사체 설명 (Subject) */
  subject: string;
  /** 동작/상태 설명 (Action) - 선택 */
  action?: string;
  /** 환경/배경 설명 (Environment) - 선택 */
  environment?: string;
  /** 아트 스타일 (Art Style) - 선택 */
  artStyle?: string;
  /** 조명 스타일 (Lighting) - 선택 */
  lighting?: string;
  /** 추가 세부사항 (Details) - 선택 */
  details?: string;
  /** 네거티브 프롬프트 - 피해야 할 요소 */
  negativePrompt?: string;
  /** 참조 이미지 수 (있을 경우) */
  referenceImageCount?: number;
  /** 참조 이미지 활용 모드 */
  referenceMode?: ReferenceMode;
  /** 품질 접미사 포함 여부 (기본: true) */
  includeQualitySuffix?: boolean;
  /** 텍스트 방지 접미사 포함 여부 (기본: true) */
  includeNoTextSuffix?: boolean;
}

export interface PromptComponents {
  subject: string;
  action?: string;
  environment?: string;
  artStyle?: string;
  lighting?: string;
  details?: string;
}

// ============================================================
// 참조 이미지 지시문 생성
// ============================================================

/**
 * 참조 이미지 사용 시 지시문 생성 (모드 지원 버전)
 * @param count 참조 이미지 수
 * @param position 지시문 위치 - 'start' (프롬프트 시작), 'middle' (상기용), 'end' (마무리)
 * @param mode 참조 모드 - style/product/composition/full
 * @returns 참조 이미지 지시문
 */
export function buildReferenceImageInstruction(
  count: number,
  position: 'start' | 'middle' | 'end' = 'start',
  mode: ReferenceMode = 'full'
): string {
  if (count <= 0) return "";

  const countText = count === 1 ? 'the provided reference image' : `the provided ${count} reference images`;

  if (position === 'start') {
    // 프롬프트 시작 - 모드별 강력한 지시
    switch (mode) {
      case 'style':
        return (
          `STYLE REFERENCE MODE: Analyze ${countText} to extract the visual style, color palette, lighting mood, and artistic atmosphere. ` +
          "Apply these stylistic elements to create a NEW image with DIFFERENT subjects/content as described below. " +
          "Do NOT copy the actual objects, people, or scenes from the reference - only inherit its aesthetic qualities."
        );
      case 'product':
        return (
          `PRODUCT PRESERVATION MODE: The product/subject shown in ${countText} MUST be preserved exactly as it appears. ` +
          "Keep the product's shape, details, colors, and identifying features identical. " +
          "You may change the background, lighting style, or surrounding elements, but the main product must remain unchanged."
        );
      case 'composition':
        return (
          `COMPOSITION REFERENCE MODE: Use ${countText} as a guide for spatial layout and arrangement. ` +
          "Match the positioning, framing, angles, and visual hierarchy from the reference. " +
          "The actual subjects and content can be different, but maintain similar composition structure."
        );
      case 'full':
      default:
        if (count === 1) {
          return (
            "CRITICAL INSTRUCTION: You MUST use the provided reference image as the PRIMARY visual guide. " +
            "The generated image should closely replicate the reference image's composition, subject placement, " +
            "color scheme, lighting, mood, and overall visual style. Treat the reference as the foundation."
          );
        }
        return (
          `CRITICAL INSTRUCTION: You MUST use the provided ${count} reference images as PRIMARY visual guides. ` +
          "Analyze each reference carefully and synthesize their visual elements - composition, colors, lighting, " +
          "and style - into the generated image."
        );
    }
  }

  if (position === 'middle') {
    // 중간 상기용 - 모드별
    switch (mode) {
      case 'style':
        return (
          "STYLE REMINDER: Apply the color palette, lighting mood, and artistic style from the reference. " +
          "The CONTENT should be different, but the AESTHETIC should match."
        );
      case 'product':
        return (
          "PRODUCT REMINDER: Ensure the product remains IDENTICAL to the reference. " +
          "Only the environment and presentation style should change."
        );
      case 'composition':
        return (
          "COMPOSITION REMINDER: Maintain the spatial arrangement and framing from the reference."
        );
      case 'full':
      default:
        return (
          "REMINDER: The reference image(s) provided should directly influence the visual output. " +
          "Do NOT ignore or deviate significantly from the reference."
        );
    }
  }

  // 마무리 (legacy 호환)
  if (count === 1) {
    return "Ensure the output closely matches the reference image's visual characteristics.";
  }
  return `Ensure the output synthesizes the visual characteristics from all ${count} reference images.`;
}

// ============================================================
// 키워드 → 자연어 변환
// ============================================================

/**
 * 템플릿 변수가 포함된 키워드 스타일 문장을 자연어로 변환
 * (이미 자연어인 경우 그대로 반환)
 *
 * @param template 템플릿 문자열 ({{variable}} 형식)
 * @returns 자연어 형태의 문장
 */
export function convertKeywordsToNaturalLanguage(template: string): string {
  // 이미 문장 형태인지 체크 (마침표, 쉼표로 구분된 절이 있는지)
  const hasSentenceStructure =
    template.includes(". ") ||
    (template.includes(", ") && template.split(", ").length > 3);

  // 이미 문장 형태면 그대로 반환
  if (hasSentenceStructure) {
    return template;
  }

  // 키워드 나열 형태 → 문장으로 변환
  // 쉼표로 분리된 키워드들을 자연스러운 문장으로 연결
  const parts = template.split(", ").filter((p) => p.trim());

  if (parts.length <= 1) {
    return template;
  }

  // 첫 번째 부분은 주어로, 나머지는 설명으로 연결
  const [subject, ...descriptions] = parts;

  if (descriptions.length === 0) {
    return subject;
  }

  // 마지막 요소는 "and"로 연결
  if (descriptions.length === 1) {
    return `${subject} featuring ${descriptions[0]}`;
  }

  const lastDesc = descriptions.pop()!;
  const middleDescs = descriptions.join(", ");

  return `${subject} featuring ${middleDescs}, and ${lastDesc}`;
}

// ============================================================
// 메인 프롬프트 빌더
// ============================================================

/**
 * 6컴포넌트 구조로 최적화된 프롬프트 생성
 *
 * @param options 프롬프트 빌드 옵션
 * @returns 최적화된 프롬프트 문자열
 */
export function buildOptimizedPrompt(options: PromptBuilderOptions): string {
  const {
    subject,
    action,
    environment,
    artStyle,
    lighting,
    details,
    negativePrompt,
    referenceImageCount,
    referenceMode = 'full',
    includeQualitySuffix = true,
    includeNoTextSuffix = true,
  } = options;

  const components: string[] = [];

  // 참조 이미지가 있으면 먼저 강력한 지시 추가 (프롬프트 최상단)
  if (referenceImageCount && referenceImageCount > 0) {
    components.push(buildReferenceImageInstruction(referenceImageCount, 'start', referenceMode));
  }

  // 1. 주요 피사체 (Subject) - 필수
  components.push(subject);

  // 2. 동작/상태 (Action) - 선택
  if (action) {
    components.push(`The scene captures ${action}.`);
  }

  // 3. 환경/배경 (Environment) - 선택
  if (environment) {
    components.push(
      `The setting is ${environment}, creating a cohesive visual context.`
    );
  }

  // 4. 아트 스타일 (Art Style) - 선택 (style 모드에서는 참조 이미지가 스타일 정의)
  if (artStyle && referenceMode !== 'style') {
    components.push(
      `The visual style follows ${artStyle} with attention to aesthetic coherence and artistic excellence.`
    );
  }

  // 5. 조명 (Lighting) - 선택 (full/product 모드에서는 참조 이미지 조명 유지)
  const skipLighting = referenceImageCount && referenceImageCount > 0 &&
    (referenceMode === 'full' || referenceMode === 'product' || referenceMode === 'style');
  if (lighting && !skipLighting) {
    components.push(
      `Illuminated with ${lighting} that beautifully highlights textures and creates depth.`
    );
  }

  // 6. 세부사항 (Details) - 선택
  if (details) {
    components.push(details);
  }

  // 참조 이미지 상기 지시 (프롬프트 중간에 다시 강조)
  if (referenceImageCount && referenceImageCount > 0) {
    components.push(buildReferenceImageInstruction(referenceImageCount, 'middle', referenceMode));
  }

  // 네거티브 프롬프트 (문장형)
  if (negativePrompt) {
    components.push(`Avoid depicting: ${negativePrompt}.`);
  }

  // 품질 지시 (선택) - 참조 모드에 따라 다른 지시
  if (includeQualitySuffix) {
    if (referenceImageCount && referenceImageCount > 0 && (referenceMode === 'full' || referenceMode === 'product')) {
      components.push(
        "Maintain the lighting style and quality level from the reference image(s) with sharp focus and high detail."
      );
    } else {
      components.push(QUALITY_SUFFIX);
    }
  }

  // 텍스트 렌더링 방지 (기본 포함 - 중요!)
  if (includeNoTextSuffix) {
    components.push(NO_TEXT_SUFFIX);
  }

  // 공백으로 연결하여 자연스러운 단락 형성
  return components.join(" ");
}

// ============================================================
// 편의 함수
// ============================================================

/**
 * 간단한 프롬프트 생성 (기본 옵션 사용)
 *
 * @param subject 주요 피사체 설명
 * @param style 스타일 (선택)
 * @returns 최적화된 프롬프트
 */
export function buildSimplePrompt(subject: string, style?: string): string {
  return buildOptimizedPrompt({
    subject,
    artStyle: style,
    includeQualitySuffix: true,
    includeNoTextSuffix: true,
  });
}

/**
 * 패션 전문 프롬프트 생성
 *
 * @param product 상품 설명
 * @param model 모델 특성
 * @param pose 포즈
 * @param background 배경
 * @returns 패션 촬영용 프롬프트
 */
export function buildFashionPrompt(
  product: string,
  model: string,
  pose: string,
  background: string
): string {
  return buildOptimizedPrompt({
    subject: `Create a professional fashion photograph that captures a ${model} model naturally wearing ${product}.`,
    action: `showing the model in a ${pose} pose that highlights the garment's silhouette and drape`,
    environment: `a ${background} setting`,
    artStyle: "high-end fashion editorial photography",
    lighting: "soft, diffused natural lighting",
    details:
      "Shot from a flattering angle with a professional camera, emphasizing the texture, color, and fit of the clothing with crisp 4K clarity.",
  });
}

/**
 * 음식 전문 프롬프트 생성
 *
 * @param food 음식 설명
 * @param angle 촬영 각도
 * @param lighting 조명 스타일
 * @returns 음식 촬영용 프롬프트
 */
export function buildFoodPrompt(
  food: string,
  angle: string,
  lighting: string
): string {
  return buildOptimizedPrompt({
    subject: `Create an appetizing food photograph that showcases ${food} in its most delicious presentation.`,
    action: `captured from a ${angle} angle that emphasizes the dish's textures and colors`,
    artStyle: "professional food styling and photography",
    lighting: `${lighting} that makes the food look fresh and inviting`,
    details:
      "The image should evoke appetite with visible steam, glistening surfaces, and perfect plating that highlights every delicious detail.",
  });
}

/**
 * 뷰티 전문 프롬프트 생성
 *
 * @param product 제품 설명
 * @param style 촬영 스타일
 * @param background 배경
 * @returns 뷰티 제품 촬영용 프롬프트
 */
export function buildBeautyPrompt(
  product: string,
  style: string,
  background: string
): string {
  return buildOptimizedPrompt({
    subject: `Create a luxurious cosmetic product photograph featuring ${product}.`,
    environment: `an elegant ${background} background`,
    artStyle: `${style} beauty photography aesthetic`,
    lighting:
      "professional beauty lighting with perfect reflections and highlights",
    details:
      "The image should convey premium quality with attention to the product's finish, color accuracy, and overall brand appeal.",
  });
}
