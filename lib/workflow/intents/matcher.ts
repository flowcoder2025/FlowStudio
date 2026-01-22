/**
 * Intent Matcher - 자연어 → 의도 매칭
 * Contract: INTENT_MATCHER
 * Evidence: Workflow Guide System Phase 7
 */

import { Industry, INDUSTRIES, INDUSTRY_INFO } from "../industries";
import {
  PurposeIntent,
  PURPOSE_INTENTS,
  PURPOSE_INTENT_INFO,
  ExpressionIntent,
  EXPRESSION_INTENTS,
  EXPRESSION_INTENT_INFO,
  ExpressionCategory,
  EXPRESSION_CATEGORY_INFO,
  getExpressionCategory,
  getExpressionsByCategory,
} from "./taxonomy";
import {
  getCompatibilityScore,
  getCompatibleIntentsForIndustry,
  recommendCrossIndustryIntents,
} from "./matrix";

// ============================================================
// 매칭 결과 타입
// ============================================================

export interface IntentMatchResult {
  // 분석된 의도
  purpose: {
    intent: PurposeIntent | null;
    confidence: number;
    matchedKeywords: string[];
  };
  expression: {
    intent: ExpressionIntent | null;
    confidence: number;
    matchedKeywords: string[];
    category: ExpressionCategory | null;
  };
  industry: {
    detected: Industry | null;
    confidence: number;
    matchedKeywords: string[];
  };

  // 추천
  recommendations: {
    primary: RecommendedWorkflow | null;
    alternatives: RecommendedWorkflow[];
    crossIndustry: CrossIndustryRecommendation[];
  };

  // 메타 정보
  meta: {
    inputText: string;
    allExtractedKeywords: string[];
    overallConfidence: number;
    needsClarification: boolean;
    clarificationQuestions: string[];
  };
}

export interface RecommendedWorkflow {
  industry: Industry;
  expressionIntent: ExpressionIntent;
  purposeIntent?: PurposeIntent;
  confidence: number;
  reason: string;
  exampleImage?: string;
}

export interface CrossIndustryRecommendation {
  industry: Industry;
  intent: ExpressionIntent;
  similarity: number;
  reason: string;
}

// ============================================================
// 키워드 사전 확장
// ============================================================

// 업종 키워드 (기존 intentAnalyzer.ts에서 확장)
const INDUSTRY_KEYWORDS: Record<Industry, string[]> = {
  fashion: [
    "옷", "의류", "패션", "티셔츠", "셔츠", "바지", "원피스", "자켓", "코트",
    "청바지", "드레스", "의상", "착용", "니트", "블라우스", "스커트", "후드",
    "맨투맨", "가디건", "점퍼", "패딩", "아우터", "상의", "하의", "정장",
  ],
  food: [
    "음식", "식품", "음료", "요리", "케이크", "피자", "커피", "디저트", "과일",
    "야채", "반찬", "식재료", "베이커리", "빵", "샐러드", "파스타", "햄버거",
    "치킨", "라면", "김밥", "떡볶이", "아이스크림", "초콜릿", "쿠키", "도넛",
  ],
  beauty: [
    "화장품", "립스틱", "파운데이션", "스킨케어", "세럼", "크림", "마스크팩",
    "향수", "네일", "뷰티", "메이크업", "로션", "에센스", "토너", "클렌저",
    "선크림", "아이섀도", "블러셔", "마스카라", "립글로스", "쿠션", "컨실러",
  ],
  interior: [
    "가구", "소파", "테이블", "의자", "침대", "조명", "인테리어", "홈데코",
    "수납", "책상", "서랍", "선반", "커튼", "러그", "쿠션", "화분", "액자",
    "시계", "거울", "캔들", "디퓨저", "방향제", "수건", "이불", "베개",
  ],
  electronics: [
    "전자제품", "스마트폰", "노트북", "이어폰", "태블릿", "가전", "카메라",
    "스피커", "충전기", "케이블", "마우스", "키보드", "모니터", "TV", "에어팟",
    "워치", "게임기", "공기청정기", "선풍기", "청소기", "냉장고", "세탁기",
  ],
  jewelry: [
    "주얼리", "반지", "목걸이", "귀걸이", "팔찌", "시계", "보석", "악세사리",
    "금", "은", "다이아몬드", "진주", "앵클릿", "브로치", "커프스", "펜던트",
  ],
  sports: [
    "스포츠", "운동", "헬스", "요가", "러닝", "축구", "농구", "캠핑", "아웃도어",
    "등산", "수영", "테니스", "골프", "자전거", "스키", "보드", "피트니스",
    "운동화", "레깅스", "트레이닝", "짐백", "요가매트", "덤벨", "밴드",
  ],
  pet: [
    "반려동물", "강아지", "고양이", "펫", "사료", "간식", "장난감", "용품",
    "목줄", "하네스", "켄넬", "캣타워", "배변패드", "스크래쳐", "급식기",
  ],
  kids: [
    "아이", "유아", "아동", "장난감", "키즈", "베이비", "육아", "어린이",
    "유모차", "젖병", "기저귀", "분유", "이유식", "완구", "인형", "블록",
    "퍼즐", "그림책", "아동복", "유아복", "돌잔치", "백일", "어린이집",
  ],
};

// 목적 키워드
const PURPOSE_KEYWORDS: Record<PurposeIntent, string[]> = {
  ecommerce: [
    "판매", "쇼핑몰", "스마트스토어", "쿠팡", "상품등록", "온라인", "마켓",
    "네이버", "11번가", "지마켓", "옥션", "위메프", "티몬", "이커머스",
  ],
  "brand-building": [
    "브랜드", "브랜딩", "이미지", "정체성", "고급", "프리미엄", "하이엔드",
    "럭셔리", "아이덴티티", "비주얼", "콘셉트", "톤앤매너",
  ],
  "social-marketing": [
    "인스타", "SNS", "마케팅", "광고", "피드", "스토리", "릴스", "틱톡",
    "유튜브", "숏폼", "바이럴", "콘텐츠", "해시태그", "인플루언서",
  ],
  catalog: [
    "카탈로그", "룩북", "인쇄", "브로슈어", "매거진", "PDF", "책자",
    "팸플릿", "리플렛", "전단지",
  ],
  "detail-page": [
    "상세페이지", "상세", "설명", "기능", "특징", "스펙", "정보", "안내",
  ],
};

// 표현 방식 키워드
const EXPRESSION_KEYWORDS: Record<ExpressionIntent, string[]> = {
  // 인물 등장
  "with-person.model-fullbody": [
    "모델", "전신", "착용", "입은", "신은", "풀샷", "걸친", "착샷",
  ],
  "with-person.model-halfbody": [
    "반신", "상반신", "얼굴", "표정", "클로즈", "바스트샷",
  ],
  "with-person.hand-holding": [
    "손", "들고", "쥐고", "잡고", "핸드", "손모델",
  ],
  "with-person.hand-using": [
    "사용", "바르는", "뿌리는", "누르는", "작동", "쓰는",
  ],
  "with-person.lifestyle-casual": [
    "일상", "캐주얼", "자연스러운", "생활", "편안한", "데일리",
  ],
  "with-person.lifestyle-premium": [
    "프리미엄", "럭셔리", "고급", "세련된", "품격", "하이엔드",
  ],

  // 제품 단독
  "product-only.hero-front": [
    "정면", "메인", "히어로", "대표", "썸네일", "메인컷",
  ],
  "product-only.hero-angle": [
    "각도", "앵글", "3/4", "입체", "다이나믹", "비스듬히",
  ],
  "product-only.flat-lay": [
    "플랫레이", "탑뷰", "위에서", "평면", "버즈아이", "내려다",
  ],
  "product-only.ghost-mannequin": [
    "고스트", "마네킹", "형태", "실루엣", "인비저블", "투명마네킹",
  ],
  "product-only.floating": [
    "플로팅", "떠있는", "공중", "부유", "무중력", "레비테이션",
  ],
  "product-only.multi-angle": [
    "다각도", "360", "여러각도", "전후좌우", "사방", "회전",
  ],

  // 디테일 포커스
  "detail-focus.texture": [
    "질감", "소재", "텍스처", "촉감", "원단", "재질", "표면",
  ],
  "detail-focus.function": [
    "기능", "작동", "사용법", "특징", "성능", "효과",
  ],
  "detail-focus.ingredient": [
    "성분", "원료", "재료", "원재료", "추출물", "배합",
  ],
  "detail-focus.close-up": [
    "클로즈업", "확대", "디테일", "세부", "마크로", "접사",
  ],
  "detail-focus.cross-section": [
    "단면", "절단면", "속", "내부", "레이어", "층",
  ],

  // 분위기 연출
  "mood-styling.seasonal-spring": [
    "봄", "스프링", "벚꽃", "싱그러운", "화사한", "꽃",
  ],
  "mood-styling.seasonal-summer": [
    "여름", "썸머", "시원한", "청량", "바다", "휴가", "서머",
  ],
  "mood-styling.seasonal-fall": [
    "가을", "어텀", "단풍", "따뜻한", "포근한", "낙엽",
  ],
  "mood-styling.seasonal-winter": [
    "겨울", "윈터", "눈", "크리스마스", "연말", "홀리데이",
  ],
  "mood-styling.color-warm": [
    "웜톤", "따뜻한컬러", "오렌지", "베이지", "브라운", "머스타드",
  ],
  "mood-styling.color-cool": [
    "쿨톤", "차가운컬러", "블루", "그레이", "실버", "민트",
  ],
  "mood-styling.color-pastel": [
    "파스텔", "연한", "부드러운", "핑크", "라벤더", "소프트",
  ],
  "mood-styling.color-vivid": [
    "비비드", "선명한", "강렬한", "팝", "컬러풀", "네온",
  ],
  "mood-styling.space-minimal": [
    "미니멀", "심플", "깔끔한", "화이트", "모던", "단순한",
  ],
  "mood-styling.space-cozy": [
    "아늑한", "코지", "포근한", "홈", "따뜻한공간", "아늑",
  ],
  "mood-styling.space-luxury": [
    "럭셔리", "호텔", "프리미엄", "하이엔드", "고급스러운공간",
  ],

  // 비교/구성
  "composition.color-variation": [
    "컬러", "색상", "배리에이션", "옵션", "종류", "컬러옵션",
  ],
  "composition.set-bundle": [
    "세트", "번들", "구성", "패키지", "키트", "모음",
  ],
  "composition.size-comparison": [
    "사이즈", "크기", "비교", "스케일", "치수", "실측",
  ],
  "composition.before-after": [
    "비포", "애프터", "전후", "변화", "효과비교", "사용전후",
  ],
  "composition.group-shot": [
    "그룹", "여러개", "모음", "컬렉션", "라인업", "전체",
  ],
};

// ============================================================
// 매칭 알고리즘
// ============================================================

/**
 * 텍스트에서 키워드 매칭 수행
 */
function matchKeywords(
  text: string,
  keywords: string[]
): { matched: string[]; score: number } {
  const normalizedText = text.toLowerCase().replace(/\s+/g, "");
  const matched: string[] = [];

  for (const keyword of keywords) {
    const normalizedKeyword = keyword.toLowerCase().replace(/\s+/g, "");
    if (normalizedText.includes(normalizedKeyword)) {
      matched.push(keyword);
    }
  }

  return {
    matched,
    score: matched.length > 0 ? Math.min(matched.length / 3, 1) : 0,
  };
}

/**
 * 업종 감지
 */
function detectIndustry(text: string): {
  industry: Industry | null;
  confidence: number;
  matchedKeywords: string[];
} {
  let bestIndustry: Industry | null = null;
  let bestScore = 0;
  let bestMatched: string[] = [];

  for (const industry of INDUSTRIES) {
    const { matched, score } = matchKeywords(text, INDUSTRY_KEYWORDS[industry]);
    if (score > bestScore) {
      bestScore = score;
      bestIndustry = industry;
      bestMatched = matched;
    }
  }

  return {
    industry: bestIndustry,
    confidence: bestScore,
    matchedKeywords: bestMatched,
  };
}

/**
 * 목적 감지
 */
function detectPurpose(text: string): {
  intent: PurposeIntent | null;
  confidence: number;
  matchedKeywords: string[];
} {
  let bestIntent: PurposeIntent | null = null;
  let bestScore = 0;
  let bestMatched: string[] = [];

  for (const purpose of PURPOSE_INTENTS) {
    const { matched, score } = matchKeywords(text, PURPOSE_KEYWORDS[purpose]);
    if (score > bestScore) {
      bestScore = score;
      bestIntent = purpose;
      bestMatched = matched;
    }
  }

  return {
    intent: bestIntent,
    confidence: bestScore,
    matchedKeywords: bestMatched,
  };
}

/**
 * 표현 방식 감지
 */
function detectExpression(
  text: string,
  industry: Industry | null
): {
  intent: ExpressionIntent | null;
  confidence: number;
  matchedKeywords: string[];
  category: ExpressionCategory | null;
} {
  let bestIntent: ExpressionIntent | null = null;
  let bestScore = 0;
  let bestMatched: string[] = [];

  for (const expression of EXPRESSION_INTENTS) {
    const keywords = EXPRESSION_KEYWORDS[expression];
    const { matched, score } = matchKeywords(text, keywords);

    // 업종 호환성 보너스
    let adjustedScore = score;
    if (industry && score > 0) {
      const compatScore = getCompatibilityScore(industry, expression);
      adjustedScore = score * (0.5 + compatScore * 0.2); // 호환성에 따른 가중치
    }

    if (adjustedScore > bestScore) {
      bestScore = adjustedScore;
      bestIntent = expression;
      bestMatched = matched;
    }
  }

  return {
    intent: bestIntent,
    confidence: bestScore,
    matchedKeywords: bestMatched,
    category: bestIntent ? getExpressionCategory(bestIntent) : null,
  };
}

/**
 * 추천 워크플로우 생성
 */
function generateRecommendations(
  industry: Industry | null,
  expression: ExpressionIntent | null,
  purpose: PurposeIntent | null,
  confidence: number
): {
  primary: RecommendedWorkflow | null;
  alternatives: RecommendedWorkflow[];
  crossIndustry: CrossIndustryRecommendation[];
} {
  const alternatives: RecommendedWorkflow[] = [];
  const crossIndustry: CrossIndustryRecommendation[] = [];

  // Primary 추천
  let primary: RecommendedWorkflow | null = null;
  if (industry && expression) {
    const expressionInfo = EXPRESSION_INTENT_INFO[expression];
    primary = {
      industry,
      expressionIntent: expression,
      purposeIntent: purpose || undefined,
      confidence,
      reason: `${INDUSTRY_INFO[industry].nameKo}의 ${expressionInfo.nameKo} 촬영`,
      exampleImage: expressionInfo.exampleImage,
    };

    // 크로스 인더스트리 추천
    const crossRecs = recommendCrossIndustryIntents(industry, expression);
    crossIndustry.push(...crossRecs);
  }

  // 대안 추천 (같은 업종, 다른 의도)
  if (industry) {
    const compatibleIntents = getCompatibleIntentsForIndustry(industry, 2);
    for (const intent of compatibleIntents) {
      if (intent !== expression) {
        const intentInfo = EXPRESSION_INTENT_INFO[intent];
        alternatives.push({
          industry,
          expressionIntent: intent,
          purposeIntent: purpose || undefined,
          confidence: 0.6,
          reason: `${intentInfo.nameKo} 스타일도 추천`,
          exampleImage: intentInfo.exampleImage,
        });
        if (alternatives.length >= 4) break;
      }
    }
  }

  return { primary, alternatives, crossIndustry };
}

/**
 * 명확화 질문 생성
 */
function generateClarificationQuestions(
  industry: Industry | null,
  expression: ExpressionIntent | null,
  confidence: number
): string[] {
  const questions: string[] = [];

  if (!industry || confidence < 0.3) {
    questions.push("어떤 종류의 상품인가요? (예: 의류, 음식, 화장품 등)");
  }

  if (!expression || confidence < 0.3) {
    questions.push("어떤 스타일의 사진이 필요하세요? (예: 모델 착용, 제품 단독, 분위기 연출 등)");
  }

  if (industry && !expression) {
    const categoryOptions = Object.entries(EXPRESSION_CATEGORY_INFO)
      .map(([_, info]) => `${info.icon} ${info.nameKo}`)
      .join(", ");
    questions.push(`촬영 스타일을 선택해주세요: ${categoryOptions}`);
  }

  return questions;
}

// ============================================================
// 메인 매칭 함수
// ============================================================

/**
 * 사용자 입력 텍스트를 분석하여 의도 매칭 결과 반환
 */
export function matchIntent(userInput: string): IntentMatchResult {
  const normalizedInput = userInput.trim();

  // 1. 업종 감지
  const industryResult = detectIndustry(normalizedInput);

  // 2. 목적 감지
  const purposeResult = detectPurpose(normalizedInput);

  // 3. 표현 방식 감지
  const expressionResult = detectExpression(normalizedInput, industryResult.industry);

  // 4. 전체 신뢰도 계산
  const overallConfidence = Math.max(
    industryResult.confidence * 0.3 +
      expressionResult.confidence * 0.5 +
      purposeResult.confidence * 0.2,
    industryResult.confidence,
    expressionResult.confidence
  );

  // 5. 추천 생성
  const recommendations = generateRecommendations(
    industryResult.industry,
    expressionResult.intent,
    purposeResult.intent,
    overallConfidence
  );

  // 6. 명확화 질문 생성
  const clarificationQuestions = generateClarificationQuestions(
    industryResult.industry,
    expressionResult.intent,
    overallConfidence
  );

  // 7. 모든 추출된 키워드 수집
  const allExtractedKeywords = [
    ...industryResult.matchedKeywords,
    ...purposeResult.matchedKeywords,
    ...expressionResult.matchedKeywords,
  ];

  return {
    purpose: {
      intent: purposeResult.intent,
      confidence: purposeResult.confidence,
      matchedKeywords: purposeResult.matchedKeywords,
    },
    expression: {
      intent: expressionResult.intent,
      confidence: expressionResult.confidence,
      matchedKeywords: expressionResult.matchedKeywords,
      category: expressionResult.category,
    },
    industry: {
      detected: industryResult.industry,
      confidence: industryResult.confidence,
      matchedKeywords: industryResult.matchedKeywords,
    },
    recommendations,
    meta: {
      inputText: normalizedInput,
      allExtractedKeywords,
      overallConfidence,
      needsClarification: overallConfidence < 0.5,
      clarificationQuestions,
    },
  };
}

/**
 * 카테고리 기반 의도 추천
 * 사용자가 카테고리만 선택했을 때 세부 의도 추천
 */
export function suggestIntentsForCategory(
  category: ExpressionCategory,
  industry?: Industry
): ExpressionIntent[] {
  const categoryIntents = getExpressionsByCategory(category);

  if (!industry) {
    return categoryIntents;
  }

  // 업종 호환성 기준으로 정렬
  return categoryIntents
    .filter((intent) => {
      const info = EXPRESSION_INTENT_INFO[intent];
      return info.applicableIndustries.includes(industry);
    })
    .sort((a, b) => {
      const scoreA = getCompatibilityScore(industry, a);
      const scoreB = getCompatibilityScore(industry, b);
      return scoreB - scoreA;
    });
}

/**
 * 빠른 의도 추천
 * 업종만 알 때 가장 적합한 의도 목록 반환
 */
export function quickSuggestIntents(
  industry: Industry,
  limit: number = 6
): Array<{
  intent: ExpressionIntent;
  info: typeof EXPRESSION_INTENT_INFO[ExpressionIntent];
  score: number;
}> {
  const compatibleIntents = getCompatibleIntentsForIndustry(industry, 2);

  return compatibleIntents.slice(0, limit).map((intent) => ({
    intent,
    info: EXPRESSION_INTENT_INFO[intent],
    score: getCompatibilityScore(industry, intent),
  }));
}
