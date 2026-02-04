/**
 * Intent Analyzer Service
 * Contract: WORKFLOW_FUNC_INTENT
 * Evidence: IMPLEMENTATION_PLAN.md Phase 3
 *
 * Analyzes user input to suggest appropriate industry and action
 */

import { Industry, INDUSTRIES, INDUSTRY_INFO } from "./industries";
import { getIndustryActions, Action } from "./actions";

export interface IntentAnalysisResult {
  suggestedIndustry: Industry | null;
  suggestedActions: Array<{
    action: Action;
    confidence: number;
    reason: string;
  }>;
  extractedKeywords: string[];
  confidence: number;
}

// Keyword mappings for industries
const INDUSTRY_KEYWORDS: Record<Industry, string[]> = {
  fashion: ["옷", "의류", "패션", "티셔츠", "셔츠", "바지", "원피스", "자켓", "코트", "청바지", "드레스", "의상", "착용", "모델"],
  food: ["음식", "식품", "음료", "요리", "케이크", "피자", "커피", "디저트", "과일", "야채", "반찬", "식재료", "베이커리"],
  beauty: ["화장품", "립스틱", "파운데이션", "스킨케어", "세럼", "크림", "마스크팩", "향수", "네일", "뷰티", "메이크업"],
  interior: ["가구", "소파", "테이블", "의자", "침대", "조명", "인테리어", "홈데코", "수납", "책상"],
  electronics: ["전자제품", "스마트폰", "노트북", "이어폰", "태블릿", "가전", "카메라", "스피커", "충전기", "케이블"],
  jewelry: ["주얼리", "반지", "목걸이", "귀걸이", "팔찌", "시계", "보석", "악세사리", "금", "은"],
  sports: ["스포츠", "운동", "헬스", "요가", "러닝", "축구", "농구", "캠핑", "아웃도어", "등산"],
  pet: ["반려동물", "강아지", "고양이", "펫", "사료", "간식", "장난감", "용품"],
  kids: ["아이", "유아", "아동", "장난감", "키즈", "베이비", "육아", "어린이"],
  "photo-studio": ["증명사진", "프로필", "오디션", "이력서", "취업", "여권", "비자", "인물사진", "프로필사진", "이미지메이킹", "배우", "모델촬영"],
};

// Action keyword mappings
const ACTION_KEYWORDS: Record<string, string[]> = {
  "model-shot": ["모델", "착용", "입은", "입고"],
  "flat-lay": ["플랫레이", "평면", "위에서", "탑뷰"],
  "detail": ["디테일", "클로즈업", "확대", "질감"],
  "hero": ["메인", "히어로", "대표"],
  "lifestyle": ["라이프스타일", "일상", "생활"],
  "texture": ["텍스처", "질감", "발색"],
  "packaging": ["패키지", "포장", "박스"],
  "action": ["액션", "동작", "움직임"],
};

/**
 * Analyze user text input to determine intent
 */
export function analyzeIntent(userInput: string): IntentAnalysisResult {
  const normalizedInput = userInput.toLowerCase();
  const extractedKeywords: string[] = [];

  // Find matching industry
  let bestIndustry: Industry | null = null;
  let bestIndustryScore = 0;

  for (const industry of INDUSTRIES) {
    const keywords = INDUSTRY_KEYWORDS[industry];
    let score = 0;

    for (const keyword of keywords) {
      if (normalizedInput.includes(keyword)) {
        score++;
        extractedKeywords.push(keyword);
      }
    }

    if (score > bestIndustryScore) {
      bestIndustryScore = score;
      bestIndustry = industry;
    }
  }

  // Find matching actions within the industry
  const suggestedActions: IntentAnalysisResult["suggestedActions"] = [];

  if (bestIndustry) {
    const industryActions = getIndustryActions(bestIndustry);

    for (const action of industryActions) {
      let actionScore = 0;
      const matchedKeywords: string[] = [];

      // Check action-specific keywords
      for (const [actionType, keywords] of Object.entries(ACTION_KEYWORDS)) {
        if (action.id.includes(actionType)) {
          for (const keyword of keywords) {
            if (normalizedInput.includes(keyword)) {
              actionScore += 2;
              matchedKeywords.push(keyword);
            }
          }
        }
      }

      // Check if action name is mentioned
      if (normalizedInput.includes(action.nameKo.toLowerCase())) {
        actionScore += 3;
        matchedKeywords.push(action.nameKo);
      }

      // Base score for matching industry
      if (actionScore === 0) {
        actionScore = 1;
      }

      suggestedActions.push({
        action,
        confidence: Math.min(actionScore / 5, 1),
        reason:
          matchedKeywords.length > 0
            ? `키워드 매칭: ${matchedKeywords.join(", ")}`
            : `${INDUSTRY_INFO[bestIndustry].nameKo} 카테고리 기본 추천`,
      });
    }

    // Sort by confidence
    suggestedActions.sort((a, b) => b.confidence - a.confidence);
  }

  return {
    suggestedIndustry: bestIndustry,
    suggestedActions: suggestedActions.slice(0, 5),
    extractedKeywords: Array.from(new Set(extractedKeywords)),
    confidence: bestIndustryScore > 0 ? Math.min(bestIndustryScore / 3, 1) : 0,
  };
}

/**
 * Get recommended actions based on previous user behavior
 * (Placeholder for future ML-based recommendations)
 */
export function getPersonalizedRecommendations(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _userId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _recentActions: string[]
): Action[] {
  // TODO: Implement ML-based recommendations based on user history
  // For now, return most popular actions

  const allActions: Action[] = [];

  for (const industry of INDUSTRIES) {
    const actions = getIndustryActions(industry);
    allActions.push(...actions.slice(0, 2));
  }

  return allActions.slice(0, 10);
}
