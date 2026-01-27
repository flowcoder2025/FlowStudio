/**
 * Beauty Industry Actions
 * Contract: WORKFLOW_FUNC_ACTIONS
 */

import { Action } from "./types";

export const beautyActions: Action[] = [
  {
    id: "beauty-product-hero",
    name: "Product Hero",
    nameKo: "제품 히어로",
    description: "화장품 제품의 메인 이미지",
    industry: "beauty",
    inputs: [
      {
        id: "product",
        label: "제품 설명",
        type: "textarea",
        placeholder: "예: 로즈골드 컬러의 립스틱",
        required: true,
      },
      {
        id: "style",
        label: "촬영 스타일",
        type: "select",
        options: [
          { value: "luxury", label: "럭셔리" },
          { value: "minimal", label: "미니멀" },
          { value: "natural", label: "내추럴" },
          { value: "editorial", label: "에디토리얼" },
        ],
        required: true,
      },
      {
        id: "background",
        label: "배경",
        type: "select",
        options: [
          { value: "gradient", label: "그라데이션" },
          { value: "marble", label: "대리석" },
          { value: "fabric", label: "실크/패브릭" },
          { value: "water", label: "물/웨이브" },
        ],
        required: true,
      },
    ],
    promptTemplate:
      "Create a luxurious cosmetic product photograph featuring {{product}} with a {{style}} aesthetic presentation. " +
      "Set against an elegant {{background}} background, the product exudes premium quality and brand sophistication. " +
      "Perfect lighting creates beautiful reflections and highlights that emphasize the product's finish and design. " +
      "This high-end beauty photograph captures the essence of luxury skincare and cosmetics in stunning 4K quality.",
    creditCost: 5,
  },
  {
    id: "beauty-texture",
    name: "Texture Shot",
    nameKo: "텍스처 샷",
    description: "제품의 질감을 강조한 이미지",
    industry: "beauty",
    inputs: [
      {
        id: "product",
        label: "제품 설명",
        type: "textarea",
        placeholder: "예: 크림 타입 파운데이션",
        required: true,
      },
      {
        id: "texture",
        label: "텍스처 표현",
        type: "select",
        options: [
          { value: "swatch", label: "스와치" },
          { value: "smear", label: "스미어" },
          { value: "drop", label: "드롭" },
          { value: "spread", label: "펼쳐진" },
        ],
        required: true,
      },
      {
        id: "surface",
        label: "표면",
        type: "select",
        options: [
          { value: "skin", label: "피부 위" },
          { value: "glass", label: "유리" },
          { value: "acrylic", label: "아크릴" },
          { value: "paper", label: "종이" },
        ],
        required: true,
      },
    ],
    promptTemplate:
      "Create a captivating texture photograph of {{product}} showing a beautiful {{texture}} presentation on {{surface}}. " +
      "Macro photography reveals the product's unique consistency, formula, and sensory qualities in intricate detail. " +
      "The lighting emphasizes the texture's luxurious appearance and helps viewers imagine how it feels on the skin. " +
      "This professional cosmetic photograph showcases the product's quality and efficacy in stunning 4K clarity.",
    creditCost: 5,
  },
  {
    id: "beauty-model",
    name: "Model Application",
    nameKo: "모델 적용샷",
    description: "모델이 제품을 사용한 이미지",
    industry: "beauty",
    inputs: [
      {
        id: "product",
        label: "제품 설명",
        type: "textarea",
        placeholder: "예: 레드 컬러 립스틱",
        required: true,
      },
      {
        id: "application",
        label: "적용 부위",
        type: "select",
        options: [
          { value: "lips", label: "입술" },
          { value: "eyes", label: "눈/아이" },
          { value: "face", label: "얼굴 전체" },
          { value: "skin", label: "피부/스킨케어" },
          { value: "nails", label: "네일" },
        ],
        required: true,
      },
      {
        id: "model",
        label: "모델",
        type: "select",
        options: [
          { value: "korean-female-20s", label: "한국 여성 20대" },
          { value: "korean-female-30s", label: "한국 여성 30대" },
          { value: "diverse", label: "다양한 피부톤" },
        ],
        required: true,
      },
    ],
    promptTemplate:
      "Create a stunning beauty campaign photograph featuring a {{model}} model with {{product}} beautifully applied on the {{application}}. " +
      "The model's flawless skin showcases the product's transformative qualities and color payoff. " +
      "Professional beauty lighting flatters every angle and creates the perfect canvas for the makeup. " +
      "This high-end cosmetic advertising photograph embodies elegance and aspiration in gorgeous 4K quality.",
    creditCost: 5,
  },
  {
    id: "beauty-flatlay",
    name: "Flat Lay Collection",
    nameKo: "플랫레이 컬렉션",
    description: "여러 제품을 함께 구성한 이미지",
    industry: "beauty",
    inputs: [
      {
        id: "products",
        label: "제품들",
        type: "textarea",
        placeholder: "예: 스킨케어 라인업 - 토너, 세럼, 크림",
        required: true,
      },
      {
        id: "arrangement",
        label: "배치 스타일",
        type: "select",
        options: [
          { value: "geometric", label: "기하학적" },
          { value: "organic", label: "유기적" },
          { value: "symmetrical", label: "대칭적" },
          { value: "scattered", label: "자연스럽게 흩어진" },
        ],
        required: true,
      },
      {
        id: "props",
        label: "소품",
        type: "select",
        options: [
          { value: "flowers", label: "꽃" },
          { value: "ingredients", label: "원료/성분" },
          { value: "none", label: "소품 없음" },
          { value: "lifestyle", label: "라이프스타일 소품" },
        ],
        required: true,
      },
    ],
    promptTemplate:
      "Create a beautiful flat lay photograph showcasing {{products}} in a {{arrangement}} arrangement, complemented by {{props}}. " +
      "Shot from a top-down perspective, the composition tells the story of a complete beauty routine. " +
      "Soft natural lighting creates an inviting atmosphere that highlights each product's design and packaging. " +
      "This premium cosmetic brand photograph embodies elegance and luxury in stunning 4K clarity.",
    creditCost: 5,
  },
  {
    id: "beauty-skincare",
    name: "Skincare Focus",
    nameKo: "스킨케어 포커스",
    description: "스킨케어 제품 전문 이미지",
    industry: "beauty",
    inputs: [
      {
        id: "product",
        label: "제품 설명",
        type: "textarea",
        placeholder: "예: 히알루론산 수분 세럼",
        required: true,
      },
      {
        id: "element",
        label: "표현 요소",
        type: "select",
        options: [
          { value: "water-splash", label: "물 스플래시" },
          { value: "bubble", label: "거품/버블" },
          { value: "gel-texture", label: "젤 텍스처" },
          { value: "dropper", label: "드로퍼/스포이드" },
        ],
        required: true,
      },
      {
        id: "mood",
        label: "분위기",
        type: "select",
        options: [
          { value: "fresh", label: "프레시/상쾌" },
          { value: "luxurious", label: "럭셔리" },
          { value: "clinical", label: "클리니컬/과학적" },
          { value: "natural", label: "내추럴" },
        ],
        required: true,
      },
    ],
    promptTemplate:
      "Create a professional skincare photograph featuring {{product}} with a stunning {{element}} effect that emphasizes hydration and freshness. " +
      "The image conveys a {{mood}} mood that aligns with the product's brand identity and benefits. " +
      "Clean, refreshing visual elements communicate the product's hydrating and nourishing qualities. " +
      "This professional cosmetic photograph captures the essence of effective skincare in beautiful 4K quality.",
    creditCost: 5,
  },
];
