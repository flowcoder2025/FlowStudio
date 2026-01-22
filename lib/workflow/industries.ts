/**
 * Industry Definitions
 * Contract: WORKFLOW_FUNC_INDUSTRIES
 * Evidence: IMPLEMENTATION_PLAN.md Phase 3
 */

export const INDUSTRIES = [
  "fashion",
  "food",
  "beauty",
  "interior",
  "electronics",
  "jewelry",
  "sports",
  "pet",
  "kids",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

export interface IndustryInfo {
  id: Industry;
  name: string;
  nameKo: string;
  description: string;
  icon: string;
  color: string;
}

export const INDUSTRY_INFO: Record<Industry, IndustryInfo> = {
  fashion: {
    id: "fashion",
    name: "Fashion",
    nameKo: "패션/의류",
    description: "의류, 액세서리, 신발 등 패션 상품 이미지",
    icon: "👗",
    color: "#EC4899",
  },
  food: {
    id: "food",
    name: "Food & Beverage",
    nameKo: "식품/음료",
    description: "식품, 음료, 베이커리 등 식음료 상품 이미지",
    icon: "🍕",
    color: "#F97316",
  },
  beauty: {
    id: "beauty",
    name: "Beauty",
    nameKo: "뷰티/화장품",
    description: "화장품, 스킨케어, 헤어케어 제품 이미지",
    icon: "💄",
    color: "#D946EF",
  },
  interior: {
    id: "interior",
    name: "Interior",
    nameKo: "인테리어/가구",
    description: "가구, 홈데코, 조명 등 인테리어 상품 이미지",
    icon: "🛋️",
    color: "#84CC16",
  },
  electronics: {
    id: "electronics",
    name: "Electronics",
    nameKo: "전자제품",
    description: "가전제품, IT 기기, 모바일 액세서리 이미지",
    icon: "📱",
    color: "#3B82F6",
  },
  jewelry: {
    id: "jewelry",
    name: "Jewelry",
    nameKo: "주얼리/액세서리",
    description: "보석, 귀금속, 패션 주얼리 이미지",
    icon: "💎",
    color: "#8B5CF6",
  },
  sports: {
    id: "sports",
    name: "Sports & Outdoor",
    nameKo: "스포츠/아웃도어",
    description: "스포츠 용품, 캠핑, 아웃도어 장비 이미지",
    icon: "⚽",
    color: "#22C55E",
  },
  pet: {
    id: "pet",
    name: "Pet",
    nameKo: "반려동물",
    description: "펫 용품, 사료, 장난감 등 반려동물 상품 이미지",
    icon: "🐕",
    color: "#F59E0B",
  },
  kids: {
    id: "kids",
    name: "Kids & Baby",
    nameKo: "키즈/유아",
    description: "유아용품, 장난감, 아동복 이미지",
    icon: "🧸",
    color: "#06B6D4",
  },
};

export function getIndustryInfo(industry: Industry): IndustryInfo {
  return INDUSTRY_INFO[industry];
}

export function getAllIndustries(): IndustryInfo[] {
  return INDUSTRIES.map((id) => INDUSTRY_INFO[id]);
}

export function isValidIndustry(industry: string): industry is Industry {
  return INDUSTRIES.includes(industry as Industry);
}
