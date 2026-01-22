/**
 * Actions Index
 * Contract: WORKFLOW_FUNC_ACTIONS
 */

import { Industry } from "../industries";
import { Action } from "./types";
import { fashionActions } from "./fashion";
import { foodActions } from "./food";
import { beautyActions } from "./beauty";

export * from "./types";

// Re-export individual action modules
export { fashionActions } from "./fashion";
export { foodActions } from "./food";
export { beautyActions } from "./beauty";

// Placeholder actions for other industries (to be implemented)
const interiorActions: Action[] = [
  {
    id: "interior-room-scene",
    name: "Room Scene",
    nameKo: "룸 씬",
    description: "가구가 배치된 방 전체 이미지",
    industry: "interior",
    inputs: [
      { id: "product", label: "가구 설명", type: "textarea", required: true },
      {
        id: "room",
        label: "방 종류",
        type: "select",
        options: [
          { value: "living", label: "거실" },
          { value: "bedroom", label: "침실" },
          { value: "office", label: "오피스" },
        ],
        required: true,
      },
    ],
    promptTemplate: "Interior design photography of {{product}} in a {{room}}, modern Scandinavian style, natural lighting, 4K",
    creditCost: 5,
  },
];

const electronicsActions: Action[] = [
  {
    id: "electronics-product",
    name: "Product Shot",
    nameKo: "제품 샷",
    description: "전자제품 메인 이미지",
    industry: "electronics",
    inputs: [
      { id: "product", label: "제품 설명", type: "textarea", required: true },
      {
        id: "angle",
        label: "촬영 각도",
        type: "select",
        options: [
          { value: "front", label: "정면" },
          { value: "hero", label: "히어로 각도" },
          { value: "floating", label: "플로팅" },
        ],
        required: true,
      },
    ],
    promptTemplate: "Professional electronics product photography of {{product}}, {{angle}} view, clean background, tech aesthetic, 4K",
    creditCost: 5,
  },
];

const jewelryActions: Action[] = [
  {
    id: "jewelry-glamour",
    name: "Glamour Shot",
    nameKo: "글래머 샷",
    description: "보석의 반짝임을 강조한 이미지",
    industry: "jewelry",
    inputs: [
      { id: "product", label: "주얼리 설명", type: "textarea", required: true },
      {
        id: "lighting",
        label: "조명",
        type: "select",
        options: [
          { value: "sparkle", label: "스파클" },
          { value: "soft", label: "소프트" },
          { value: "dramatic", label: "드라마틱" },
        ],
        required: true,
      },
    ],
    promptTemplate: "Luxury jewelry photography of {{product}}, {{lighting}} lighting, elegant presentation, diamond-like sparkle, 4K",
    creditCost: 5,
  },
];

const sportsActions: Action[] = [
  {
    id: "sports-action",
    name: "Action Shot",
    nameKo: "액션 샷",
    description: "스포츠 용품 사용 이미지",
    industry: "sports",
    inputs: [
      { id: "product", label: "제품 설명", type: "textarea", required: true },
      {
        id: "activity",
        label: "활동",
        type: "select",
        options: [
          { value: "running", label: "러닝" },
          { value: "gym", label: "헬스" },
          { value: "outdoor", label: "아웃도어" },
        ],
        required: true,
      },
    ],
    promptTemplate: "Dynamic sports photography featuring {{product}} during {{activity}}, action freeze frame, energetic atmosphere, 4K",
    creditCost: 5,
  },
];

const petActions: Action[] = [
  {
    id: "pet-product",
    name: "Product with Pet",
    nameKo: "반려동물과 제품",
    description: "반려동물이 제품과 함께하는 이미지",
    industry: "pet",
    inputs: [
      { id: "product", label: "제품 설명", type: "textarea", required: true },
      {
        id: "pet",
        label: "반려동물",
        type: "select",
        options: [
          { value: "dog", label: "강아지" },
          { value: "cat", label: "고양이" },
        ],
        required: true,
      },
    ],
    promptTemplate: "Adorable pet product photography of {{product}} with a cute {{pet}}, warm and friendly atmosphere, 4K",
    creditCost: 5,
  },
];

const kidsActions: Action[] = [
  {
    id: "kids-playful",
    name: "Playful Scene",
    nameKo: "플레이풀 씬",
    description: "아이가 제품과 즐거워하는 이미지",
    industry: "kids",
    inputs: [
      { id: "product", label: "제품 설명", type: "textarea", required: true },
      {
        id: "mood",
        label: "분위기",
        type: "select",
        options: [
          { value: "playful", label: "즐거운" },
          { value: "cozy", label: "편안한" },
          { value: "educational", label: "교육적" },
        ],
        required: true,
      },
    ],
    promptTemplate: "Cheerful kids product photography of {{product}}, {{mood}} atmosphere, bright and colorful, family-friendly, 4K",
    creditCost: 5,
  },
];

// Map industries to their actions
const ACTION_MAP: Record<Industry, Action[]> = {
  fashion: fashionActions,
  food: foodActions,
  beauty: beautyActions,
  interior: interiorActions,
  electronics: electronicsActions,
  jewelry: jewelryActions,
  sports: sportsActions,
  pet: petActions,
  kids: kidsActions,
};

/**
 * Get all actions for an industry
 */
export function getIndustryActions(industry: Industry): Action[] {
  return ACTION_MAP[industry] || [];
}

/**
 * Get a specific action by ID
 */
export function getAction(actionId: string): Action | undefined {
  for (const actions of Object.values(ACTION_MAP)) {
    const action = actions.find((a) => a.id === actionId);
    if (action) return action;
  }
  return undefined;
}

/**
 * Get all actions across all industries
 */
export function getAllActions(): Action[] {
  return Object.values(ACTION_MAP).flat();
}
