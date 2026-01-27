/**
 * Food Industry Actions
 * Contract: WORKFLOW_FUNC_ACTIONS
 */

import { Action } from "./types";

export const foodActions: Action[] = [
  {
    id: "food-hero-shot",
    name: "Hero Shot",
    nameKo: "히어로 샷",
    description: "음식의 가장 맛있어 보이는 메인 이미지",
    industry: "food",
    inputs: [
      {
        id: "product",
        label: "음식 설명",
        type: "textarea",
        placeholder: "예: 진한 토마토 소스의 페퍼로니 피자",
        required: true,
      },
      {
        id: "style",
        label: "촬영 스타일",
        type: "select",
        options: [
          { value: "overhead", label: "탑뷰 (위에서)" },
          { value: "45-degree", label: "45도 각도" },
          { value: "side", label: "측면" },
          { value: "close-up", label: "클로즈업" },
        ],
        required: true,
      },
      {
        id: "lighting",
        label: "조명",
        type: "select",
        options: [
          { value: "natural", label: "자연광" },
          { value: "warm", label: "따뜻한 조명" },
          { value: "dramatic", label: "드라마틱" },
          { value: "soft", label: "소프트" },
        ],
        required: true,
      },
    ],
    promptTemplate:
      "Create an appetizing food photograph that showcases {{product}} in its most delicious presentation. " +
      "Captured from a {{style}} angle, the image highlights the dish's textures, colors, and appetizing qualities. " +
      "{{lighting}} lighting creates the perfect mood, making the food look fresh and inviting with visible steam rising. " +
      "Professional food styling ensures every element is positioned to maximize visual appeal and trigger appetite in stunning 4K quality.",
    creditCost: 5,
  },
  {
    id: "food-flat-lay",
    name: "Flat Lay",
    nameKo: "플랫레이",
    description: "재료와 함께 구성한 탑뷰 이미지",
    industry: "food",
    inputs: [
      {
        id: "product",
        label: "음식 설명",
        type: "textarea",
        placeholder: "예: 한식 비빔밥",
        required: true,
      },
      {
        id: "ingredients",
        label: "재료 배치",
        type: "select",
        options: [
          { value: "scattered", label: "흩어진 재료" },
          { value: "organized", label: "정돈된 배치" },
          { value: "minimal", label: "미니멀" },
          { value: "abundant", label: "풍성한 구성" },
        ],
        required: true,
      },
      {
        id: "surface",
        label: "배경 표면",
        type: "select",
        options: [
          { value: "wood", label: "우드" },
          { value: "marble", label: "대리석" },
          { value: "dark-slate", label: "다크 슬레이트" },
          { value: "white", label: "화이트" },
        ],
        required: true,
      },
    ],
    promptTemplate:
      "Create a beautiful food flat lay photograph featuring {{product}} with {{ingredients}} arrangement of fresh ingredients surrounding it. " +
      "Shot from directly above on a {{surface}} surface, the composition tells the story of the dish's preparation and flavors. " +
      "Natural lighting gently illuminates each element, showcasing colors and textures that make the viewer hungry. " +
      "Professional food styling creates a harmonious composition perfect for cookbooks, menus, or social media in 4K clarity.",
    creditCost: 5,
  },
  {
    id: "food-packaging",
    name: "Packaging Shot",
    nameKo: "패키지 샷",
    description: "제품 패키지가 포함된 이미지",
    industry: "food",
    inputs: [
      {
        id: "product",
        label: "제품 설명",
        type: "textarea",
        placeholder: "예: 유기농 그래놀라 시리얼",
        required: true,
      },
      {
        id: "presentation",
        label: "연출 방식",
        type: "select",
        options: [
          { value: "package-only", label: "패키지만" },
          { value: "with-product", label: "내용물과 함께" },
          { value: "lifestyle", label: "라이프스타일" },
          { value: "serving", label: "서빙 상태" },
        ],
        required: true,
      },
    ],
    promptTemplate:
      "Create a professional product photograph showcasing {{product}} packaging in a {{presentation}} style presentation. " +
      "The clean background allows the packaging design to take center stage, highlighting its visual appeal and brand identity. " +
      "Strategic lighting creates attractive reflections and emphasizes the packaging's premium quality and design details. " +
      "This commercial-quality 4K image is perfect for e-commerce, advertising, and marketing materials.",
    creditCost: 5,
  },
  {
    id: "food-action",
    name: "Action Shot",
    nameKo: "액션 샷",
    description: "음식이 만들어지거나 먹는 순간 포착",
    industry: "food",
    inputs: [
      {
        id: "product",
        label: "음식 설명",
        type: "textarea",
        placeholder: "예: 초콜릿이 흐르는 라바케이크",
        required: true,
      },
      {
        id: "action",
        label: "동작",
        type: "select",
        options: [
          { value: "pouring", label: "붓기/따르기" },
          { value: "cutting", label: "자르기" },
          { value: "lifting", label: "들어올리기" },
          { value: "drizzling", label: "뿌리기" },
          { value: "steam-rising", label: "김 피어오르기" },
        ],
        required: true,
      },
    ],
    promptTemplate:
      "Create a dynamic food photograph that captures the exciting moment of {{action}} featuring {{product}}. " +
      "High-speed photography freezes the motion perfectly, showcasing the action in stunning detail. " +
      "This appetizing moment draws viewers in, creating a sense of freshness and culinary excitement. " +
      "Professional lighting ensures every droplet, crumb, and texture is visible in crisp 4K clarity.",
    creditCost: 5,
  },
  {
    id: "food-beverage",
    name: "Beverage Shot",
    nameKo: "음료 샷",
    description: "음료 제품 전문 이미지",
    industry: "food",
    inputs: [
      {
        id: "product",
        label: "음료 설명",
        type: "textarea",
        placeholder: "예: 얼음이 가득한 아이스 아메리카노",
        required: true,
      },
      {
        id: "style",
        label: "스타일",
        type: "select",
        options: [
          { value: "splash", label: "스플래시" },
          { value: "condensation", label: "물방울 맺힌" },
          { value: "clean", label: "깔끔한" },
          { value: "lifestyle", label: "라이프스타일" },
        ],
        required: true,
      },
      {
        id: "glass",
        label: "용기",
        type: "select",
        options: [
          { value: "glass", label: "유리컵" },
          { value: "bottle", label: "병" },
          { value: "can", label: "캔" },
          { value: "tumbler", label: "텀블러" },
        ],
        required: true,
      },
    ],
    promptTemplate:
      "Create a professional beverage photograph featuring {{product}} served in a {{glass}} with {{style}} style presentation. " +
      "The drink looks incredibly refreshing with perfect clarity and inviting appearance. " +
      "Strategic lighting creates beautiful highlights on the liquid and container, emphasizing its refreshing qualities. " +
      "This commercial-quality 4K image captures the essence of the beverage experience.",
    creditCost: 5,
  },
];
