/**
 * Intent Taxonomy - 계층형 의도 분류 체계
 * Contract: INTENT_TAXONOMY
 * Evidence: Workflow Guide System Phase 7
 */

import { Industry } from "../industries";

// ============================================================
// Layer 1: 촬영 목적 (WHY)
// ============================================================

export const PURPOSE_INTENTS = [
  "ecommerce",        // 판매용 (쇼핑몰, 마켓플레이스)
  "brand-building",   // 브랜딩 (브랜드 이미지 구축)
  "social-marketing", // SNS/마케팅 (인스타, 페이스북 등)
  "catalog",          // 카탈로그 (인쇄물, 룩북)
  "detail-page",      // 상세페이지 (상품 설명용)
] as const;

export type PurposeIntent = (typeof PURPOSE_INTENTS)[number];

export interface PurposeIntentInfo {
  id: PurposeIntent;
  name: string;
  nameKo: string;
  description: string;
  icon: string;
  keywords: string[];
  exampleImage?: string;
}

export const PURPOSE_INTENT_INFO: Record<PurposeIntent, PurposeIntentInfo> = {
  ecommerce: {
    id: "ecommerce",
    name: "E-commerce",
    nameKo: "판매용",
    description: "쇼핑몰, 마켓플레이스에 등록할 상품 이미지",
    icon: "🛒",
    keywords: ["판매", "쇼핑몰", "스마트스토어", "쿠팡", "상품등록", "온라인"],
  },
  "brand-building": {
    id: "brand-building",
    name: "Brand Building",
    nameKo: "브랜딩",
    description: "브랜드 이미지와 정체성을 구축하는 이미지",
    icon: "✨",
    keywords: ["브랜드", "브랜딩", "이미지", "정체성", "고급", "프리미엄"],
  },
  "social-marketing": {
    id: "social-marketing",
    name: "Social Marketing",
    nameKo: "SNS/마케팅",
    description: "SNS 채널과 마케팅 캠페인용 이미지",
    icon: "📱",
    keywords: ["인스타", "SNS", "마케팅", "광고", "피드", "스토리", "릴스"],
  },
  catalog: {
    id: "catalog",
    name: "Catalog",
    nameKo: "카탈로그",
    description: "인쇄물, 룩북, PDF 카탈로그용 이미지",
    icon: "📖",
    keywords: ["카탈로그", "룩북", "인쇄", "브로슈어", "매거진"],
  },
  "detail-page": {
    id: "detail-page",
    name: "Detail Page",
    nameKo: "상세페이지",
    description: "상품 상세 설명에 사용할 이미지",
    icon: "📄",
    keywords: ["상세페이지", "상세", "설명", "기능", "특징"],
  },
};

// ============================================================
// Layer 2: 표현 방식 (HOW)
// ============================================================

export const EXPRESSION_INTENTS = [
  // 인물 등장
  "with-person.model-fullbody",    // 모델 전신
  "with-person.model-halfbody",    // 모델 반신
  "with-person.hand-holding",      // 손 들고 있는
  "with-person.hand-using",        // 손 사용 중
  "with-person.lifestyle-casual",  // 라이프스타일 캐주얼
  "with-person.lifestyle-premium", // 라이프스타일 프리미엄

  // 제품 단독
  "product-only.hero-front",       // 히어로 정면
  "product-only.hero-angle",       // 히어로 각도
  "product-only.flat-lay",         // 플랫레이
  "product-only.ghost-mannequin",  // 고스트 마네킹
  "product-only.floating",         // 플로팅
  "product-only.multi-angle",      // 다각도

  // 디테일 포커스
  "detail-focus.texture",          // 질감/소재
  "detail-focus.function",         // 기능 부각
  "detail-focus.ingredient",       // 성분/원료
  "detail-focus.close-up",         // 클로즈업
  "detail-focus.cross-section",    // 단면

  // 분위기 연출
  "mood-styling.seasonal-spring",  // 봄 시즌
  "mood-styling.seasonal-summer",  // 여름 시즌
  "mood-styling.seasonal-fall",    // 가을 시즌
  "mood-styling.seasonal-winter",  // 겨울 시즌
  "mood-styling.color-warm",       // 따뜻한 컬러
  "mood-styling.color-cool",       // 차가운 컬러
  "mood-styling.color-pastel",     // 파스텔
  "mood-styling.color-vivid",      // 비비드
  "mood-styling.space-minimal",    // 미니멀 공간
  "mood-styling.space-cozy",       // 아늑한 공간
  "mood-styling.space-luxury",     // 럭셔리 공간

  // 비교/구성
  "composition.color-variation",   // 컬러 배리에이션
  "composition.set-bundle",        // 세트 구성
  "composition.size-comparison",   // 사이즈 비교
  "composition.before-after",      // 비포/애프터
  "composition.group-shot",        // 그룹샷

  // 인물 사진 (AI 사진관)
  "portrait.id-photo",             // 증명사진 (여권, 운전면허, 주민등록 등)
  "portrait.business-profile",     // 비즈니스 프로필 (LinkedIn, 명함용)
  "portrait.sns-profile",          // SNS 프로필 (인스타, 카카오톡 등)
  "portrait.job-application",      // 취업용 사진 (이력서, 입사지원)
  "portrait.beauty-retouch",       // 뷰티 보정 (피부, 얼굴형, 체형)
  "portrait.background-change",    // 배경 교체 (누끼, 배경합성)
  "portrait.group-composite",      // 단체사진 합성 (인물추가/제거)
  "portrait.personal-color",       // 퍼스널컬러 진단/적용
] as const;

export type ExpressionIntent = (typeof EXPRESSION_INTENTS)[number];

// 표현 방식 카테고리
export type ExpressionCategory =
  | "with-person"
  | "product-only"
  | "detail-focus"
  | "mood-styling"
  | "composition"
  | "portrait";

export interface ExpressionIntentInfo {
  id: ExpressionIntent;
  category: ExpressionCategory;
  name: string;
  nameKo: string;
  description: string;
  icon: string;
  keywords: string[];
  exampleImage?: string;
  applicableIndustries: Industry[];
}

export const EXPRESSION_CATEGORY_INFO: Record<ExpressionCategory, {
  name: string;
  nameKo: string;
  icon: string;
}> = {
  "with-person": {
    name: "With Person",
    nameKo: "인물 등장",
    icon: "👤",
  },
  "product-only": {
    name: "Product Only",
    nameKo: "제품 단독",
    icon: "📦",
  },
  "detail-focus": {
    name: "Detail Focus",
    nameKo: "디테일 강조",
    icon: "🔍",
  },
  "mood-styling": {
    name: "Mood & Styling",
    nameKo: "분위기 연출",
    icon: "🎨",
  },
  composition: {
    name: "Composition",
    nameKo: "구성/비교",
    icon: "📐",
  },
  portrait: {
    name: "Portrait",
    nameKo: "인물 사진",
    icon: "📷",
  },
};

export const EXPRESSION_INTENT_INFO: Record<ExpressionIntent, ExpressionIntentInfo> = {
  // 인물 등장
  "with-person.model-fullbody": {
    id: "with-person.model-fullbody",
    category: "with-person",
    name: "Model Full Body",
    nameKo: "모델 전신",
    description: "모델이 상품을 착용/사용한 전신 이미지",
    icon: "🧍",
    keywords: ["모델", "전신", "착용", "입은", "신은", "풀샷"],
    applicableIndustries: ["fashion", "jewelry", "sports", "kids"],
  },
  "with-person.model-halfbody": {
    id: "with-person.model-halfbody",
    category: "with-person",
    name: "Model Half Body",
    nameKo: "모델 반신",
    description: "모델의 상반신 또는 하반신 이미지",
    icon: "👤",
    keywords: ["반신", "상반신", "클로즈", "얼굴"],
    applicableIndustries: ["fashion", "beauty", "jewelry", "kids"],
  },
  "with-person.hand-holding": {
    id: "with-person.hand-holding",
    category: "with-person",
    name: "Hand Holding",
    nameKo: "손 들고 있는",
    description: "손으로 상품을 들고 있는 이미지",
    icon: "🤲",
    keywords: ["손", "들고", "쥐고", "잡고", "핸드"],
    applicableIndustries: ["fashion", "food", "beauty", "electronics", "jewelry", "pet", "kids"],
  },
  "with-person.hand-using": {
    id: "with-person.hand-using",
    category: "with-person",
    name: "Hand Using",
    nameKo: "손 사용 중",
    description: "손으로 상품을 사용하는 이미지",
    icon: "✋",
    keywords: ["사용", "바르는", "뿌리는", "누르는", "작동"],
    applicableIndustries: ["beauty", "electronics", "food", "kids"],
  },
  "with-person.lifestyle-casual": {
    id: "with-person.lifestyle-casual",
    category: "with-person",
    name: "Lifestyle Casual",
    nameKo: "라이프스타일 캐주얼",
    description: "일상적인 상황에서 자연스러운 이미지",
    icon: "🏠",
    keywords: ["일상", "캐주얼", "자연스러운", "생활", "편안한"],
    applicableIndustries: ["fashion", "food", "beauty", "interior", "electronics", "pet", "kids"],
  },
  "with-person.lifestyle-premium": {
    id: "with-person.lifestyle-premium",
    category: "with-person",
    name: "Lifestyle Premium",
    nameKo: "라이프스타일 프리미엄",
    description: "고급스러운 환경에서의 프리미엄 이미지",
    icon: "🏛️",
    keywords: ["프리미엄", "럭셔리", "고급", "세련된", "품격"],
    applicableIndustries: ["fashion", "beauty", "interior", "jewelry"],
  },

  // 제품 단독
  "product-only.hero-front": {
    id: "product-only.hero-front",
    category: "product-only",
    name: "Hero Front",
    nameKo: "히어로 정면",
    description: "상품의 정면을 강조한 메인 이미지",
    icon: "🎯",
    keywords: ["정면", "메인", "히어로", "대표", "썸네일"],
    applicableIndustries: ["fashion", "food", "beauty", "interior", "electronics", "jewelry", "sports", "pet", "kids"],
  },
  "product-only.hero-angle": {
    id: "product-only.hero-angle",
    category: "product-only",
    name: "Hero Angle",
    nameKo: "히어로 각도",
    description: "상품을 입체적으로 보여주는 각도 이미지",
    icon: "📐",
    keywords: ["각도", "앵글", "3/4", "입체", "다이나믹"],
    applicableIndustries: ["fashion", "food", "beauty", "interior", "electronics", "jewelry", "sports", "pet", "kids"],
  },
  "product-only.flat-lay": {
    id: "product-only.flat-lay",
    category: "product-only",
    name: "Flat Lay",
    nameKo: "플랫레이",
    description: "위에서 내려다 본 탑뷰 이미지",
    icon: "⬇️",
    keywords: ["플랫레이", "탑뷰", "위에서", "평면", "버즈아이"],
    applicableIndustries: ["fashion", "food", "beauty", "electronics", "jewelry", "sports", "pet", "kids"],
  },
  "product-only.ghost-mannequin": {
    id: "product-only.ghost-mannequin",
    category: "product-only",
    name: "Ghost Mannequin",
    nameKo: "고스트 마네킹",
    description: "보이지 않는 마네킹으로 옷의 형태 강조",
    icon: "👻",
    keywords: ["고스트", "마네킹", "형태", "실루엣", "인비저블"],
    applicableIndustries: ["fashion"],
  },
  "product-only.floating": {
    id: "product-only.floating",
    category: "product-only",
    name: "Floating",
    nameKo: "플로팅",
    description: "공중에 떠 있는 듯한 이미지",
    icon: "🎈",
    keywords: ["플로팅", "떠있는", "공중", "부유", "무중력"],
    applicableIndustries: ["fashion", "beauty", "electronics", "jewelry", "sports", "kids"],
  },
  "product-only.multi-angle": {
    id: "product-only.multi-angle",
    category: "product-only",
    name: "Multi Angle",
    nameKo: "다각도",
    description: "여러 각도에서 촬영한 이미지 세트",
    icon: "🔄",
    keywords: ["다각도", "360", "여러각도", "전후좌우"],
    applicableIndustries: ["fashion", "food", "beauty", "interior", "electronics", "jewelry", "sports", "pet", "kids"],
  },

  // 디테일 포커스
  "detail-focus.texture": {
    id: "detail-focus.texture",
    category: "detail-focus",
    name: "Texture",
    nameKo: "질감/소재",
    description: "상품의 질감과 소재를 강조한 이미지",
    icon: "🧵",
    keywords: ["질감", "소재", "텍스처", "촉감", "원단", "재질"],
    applicableIndustries: ["fashion", "food", "beauty", "interior", "jewelry"],
  },
  "detail-focus.function": {
    id: "detail-focus.function",
    category: "detail-focus",
    name: "Function",
    nameKo: "기능 부각",
    description: "상품의 기능을 보여주는 이미지",
    icon: "⚙️",
    keywords: ["기능", "작동", "사용법", "특징", "성능"],
    applicableIndustries: ["beauty", "interior", "electronics", "sports", "pet", "kids"],
  },
  "detail-focus.ingredient": {
    id: "detail-focus.ingredient",
    category: "detail-focus",
    name: "Ingredient",
    nameKo: "성분/원료",
    description: "성분이나 원료를 보여주는 이미지",
    icon: "🌿",
    keywords: ["성분", "원료", "재료", "원재료", "추출물"],
    applicableIndustries: ["food", "beauty", "pet"],
  },
  "detail-focus.close-up": {
    id: "detail-focus.close-up",
    category: "detail-focus",
    name: "Close Up",
    nameKo: "클로즈업",
    description: "상품의 특정 부분을 확대한 이미지",
    icon: "🔎",
    keywords: ["클로즈업", "확대", "디테일", "세부", "마크로"],
    applicableIndustries: ["fashion", "food", "beauty", "interior", "electronics", "jewelry", "sports"],
  },
  "detail-focus.cross-section": {
    id: "detail-focus.cross-section",
    category: "detail-focus",
    name: "Cross Section",
    nameKo: "단면",
    description: "상품의 단면을 보여주는 이미지",
    icon: "🔪",
    keywords: ["단면", "절단면", "속", "내부", "레이어"],
    applicableIndustries: ["food", "beauty"],
  },

  // 분위기 연출
  "mood-styling.seasonal-spring": {
    id: "mood-styling.seasonal-spring",
    category: "mood-styling",
    name: "Spring Season",
    nameKo: "봄 시즌",
    description: "봄 분위기의 시즌 연출",
    icon: "🌸",
    keywords: ["봄", "스프링", "벚꽃", "싱그러운", "화사한"],
    applicableIndustries: ["fashion", "food", "beauty", "interior", "jewelry", "kids"],
  },
  "mood-styling.seasonal-summer": {
    id: "mood-styling.seasonal-summer",
    category: "mood-styling",
    name: "Summer Season",
    nameKo: "여름 시즌",
    description: "여름 분위기의 시즌 연출",
    icon: "☀️",
    keywords: ["여름", "썸머", "시원한", "청량", "바다", "휴가"],
    applicableIndustries: ["fashion", "food", "beauty", "sports", "kids"],
  },
  "mood-styling.seasonal-fall": {
    id: "mood-styling.seasonal-fall",
    category: "mood-styling",
    name: "Fall Season",
    nameKo: "가을 시즌",
    description: "가을 분위기의 시즌 연출",
    icon: "🍂",
    keywords: ["가을", "어텀", "단풍", "따뜻한", "포근한"],
    applicableIndustries: ["fashion", "food", "beauty", "interior", "jewelry", "kids"],
  },
  "mood-styling.seasonal-winter": {
    id: "mood-styling.seasonal-winter",
    category: "mood-styling",
    name: "Winter Season",
    nameKo: "겨울 시즌",
    description: "겨울 분위기의 시즌 연출",
    icon: "❄️",
    keywords: ["겨울", "윈터", "눈", "크리스마스", "따뜻한"],
    applicableIndustries: ["fashion", "food", "beauty", "interior", "jewelry", "kids"],
  },
  "mood-styling.color-warm": {
    id: "mood-styling.color-warm",
    category: "mood-styling",
    name: "Warm Colors",
    nameKo: "따뜻한 컬러",
    description: "웜톤 컬러 무드 연출",
    icon: "🔥",
    keywords: ["웜톤", "따뜻한", "오렌지", "베이지", "브라운"],
    applicableIndustries: ["fashion", "food", "beauty", "interior", "jewelry", "kids"],
  },
  "mood-styling.color-cool": {
    id: "mood-styling.color-cool",
    category: "mood-styling",
    name: "Cool Colors",
    nameKo: "차가운 컬러",
    description: "쿨톤 컬러 무드 연출",
    icon: "💎",
    keywords: ["쿨톤", "차가운", "블루", "그레이", "실버"],
    applicableIndustries: ["fashion", "beauty", "electronics", "jewelry"],
  },
  "mood-styling.color-pastel": {
    id: "mood-styling.color-pastel",
    category: "mood-styling",
    name: "Pastel Colors",
    nameKo: "파스텔",
    description: "파스텔톤 컬러 무드 연출",
    icon: "🎀",
    keywords: ["파스텔", "연한", "부드러운", "핑크", "라벤더"],
    applicableIndustries: ["fashion", "beauty", "interior", "jewelry", "kids"],
  },
  "mood-styling.color-vivid": {
    id: "mood-styling.color-vivid",
    category: "mood-styling",
    name: "Vivid Colors",
    nameKo: "비비드",
    description: "비비드한 컬러 무드 연출",
    icon: "🌈",
    keywords: ["비비드", "선명한", "강렬한", "팝", "컬러풀"],
    applicableIndustries: ["fashion", "food", "beauty", "sports", "kids"],
  },
  "mood-styling.space-minimal": {
    id: "mood-styling.space-minimal",
    category: "mood-styling",
    name: "Minimal Space",
    nameKo: "미니멀 공간",
    description: "미니멀한 공간 연출",
    icon: "⬜",
    keywords: ["미니멀", "심플", "깔끔한", "화이트", "모던"],
    applicableIndustries: ["fashion", "beauty", "interior", "electronics", "jewelry"],
  },
  "mood-styling.space-cozy": {
    id: "mood-styling.space-cozy",
    category: "mood-styling",
    name: "Cozy Space",
    nameKo: "아늑한 공간",
    description: "아늑하고 따뜻한 공간 연출",
    icon: "🏡",
    keywords: ["아늑한", "코지", "포근한", "홈", "따뜻한"],
    applicableIndustries: ["fashion", "food", "interior", "pet", "kids"],
  },
  "mood-styling.space-luxury": {
    id: "mood-styling.space-luxury",
    category: "mood-styling",
    name: "Luxury Space",
    nameKo: "럭셔리 공간",
    description: "럭셔리하고 고급스러운 공간 연출",
    icon: "🏰",
    keywords: ["럭셔리", "고급", "프리미엄", "하이엔드", "호텔"],
    applicableIndustries: ["fashion", "beauty", "interior", "jewelry"],
  },

  // 비교/구성
  "composition.color-variation": {
    id: "composition.color-variation",
    category: "composition",
    name: "Color Variation",
    nameKo: "컬러 배리에이션",
    description: "다양한 컬러 옵션을 보여주는 이미지",
    icon: "🎨",
    keywords: ["컬러", "색상", "배리에이션", "옵션", "종류"],
    applicableIndustries: ["fashion", "beauty", "interior", "electronics", "jewelry", "sports", "kids"],
  },
  "composition.set-bundle": {
    id: "composition.set-bundle",
    category: "composition",
    name: "Set Bundle",
    nameKo: "세트 구성",
    description: "세트 상품 구성을 보여주는 이미지",
    icon: "📦",
    keywords: ["세트", "번들", "구성", "패키지", "키트"],
    applicableIndustries: ["fashion", "food", "beauty", "interior", "electronics", "jewelry", "sports", "pet", "kids"],
  },
  "composition.size-comparison": {
    id: "composition.size-comparison",
    category: "composition",
    name: "Size Comparison",
    nameKo: "사이즈 비교",
    description: "사이즈를 비교할 수 있는 이미지",
    icon: "📏",
    keywords: ["사이즈", "크기", "비교", "스케일", "치수"],
    applicableIndustries: ["fashion", "interior", "electronics", "jewelry", "pet", "kids"],
  },
  "composition.before-after": {
    id: "composition.before-after",
    category: "composition",
    name: "Before After",
    nameKo: "비포/애프터",
    description: "사용 전후를 비교하는 이미지",
    icon: "↔️",
    keywords: ["비포", "애프터", "전후", "변화", "효과"],
    applicableIndustries: ["beauty", "interior", "pet"],
  },
  "composition.group-shot": {
    id: "composition.group-shot",
    category: "composition",
    name: "Group Shot",
    nameKo: "그룹샷",
    description: "여러 상품을 함께 보여주는 이미지",
    icon: "👥",
    keywords: ["그룹", "여러개", "모음", "컬렉션", "라인업"],
    applicableIndustries: ["fashion", "food", "beauty", "interior", "electronics", "jewelry", "sports", "pet", "kids"],
  },

  // 인물 사진 (AI 사진관)
  "portrait.id-photo": {
    id: "portrait.id-photo",
    category: "portrait",
    name: "ID Photo",
    nameKo: "증명사진",
    description: "여권, 운전면허증, 주민등록증, 비자, 학생증 등 공식 증명사진",
    icon: "🪪",
    keywords: ["증명사진", "여권사진", "운전면허", "주민등록", "비자", "학생증", "반명함"],
    applicableIndustries: ["photo-studio"],
  },
  "portrait.business-profile": {
    id: "portrait.business-profile",
    category: "portrait",
    name: "Business Profile",
    nameKo: "비즈니스 프로필",
    description: "LinkedIn, 명함, 회사 홈페이지용 전문적인 프로필 사진",
    icon: "💼",
    keywords: ["비즈니스", "프로필", "링크드인", "LinkedIn", "명함", "헤드샷", "전문가"],
    applicableIndustries: ["photo-studio"],
  },
  "portrait.sns-profile": {
    id: "portrait.sns-profile",
    category: "portrait",
    name: "SNS Profile",
    nameKo: "SNS 프로필",
    description: "인스타그램, 카카오톡, 페이스북 등 SNS용 프로필 사진",
    icon: "📱",
    keywords: ["SNS", "인스타", "카카오톡", "프로필", "소셜미디어", "페이스북"],
    applicableIndustries: ["photo-studio"],
  },
  "portrait.job-application": {
    id: "portrait.job-application",
    category: "portrait",
    name: "Job Application Photo",
    nameKo: "취업용 사진",
    description: "이력서, 입사지원서, 자기소개서용 전문적인 사진",
    icon: "📋",
    keywords: ["취업", "이력서", "입사", "지원서", "취업사진", "취준"],
    applicableIndustries: ["photo-studio"],
  },
  "portrait.beauty-retouch": {
    id: "portrait.beauty-retouch",
    category: "portrait",
    name: "Beauty Retouch",
    nameKo: "뷰티 보정",
    description: "피부 보정, 얼굴형 보정, 체형 보정 등 자연스러운 뷰티 리터칭",
    icon: "✨",
    keywords: ["보정", "피부", "얼굴형", "갸름", "체형", "리터칭", "뷰티"],
    applicableIndustries: ["photo-studio", "beauty"],
  },
  "portrait.background-change": {
    id: "portrait.background-change",
    category: "portrait",
    name: "Background Change",
    nameKo: "배경 교체",
    description: "AI 누끼 추출 및 배경 교체 (흰색, 그레이, 컬러 배경)",
    icon: "🖼️",
    keywords: ["배경", "누끼", "배경제거", "배경교체", "합성", "흰배경"],
    applicableIndustries: ["photo-studio"],
  },
  "portrait.group-composite": {
    id: "portrait.group-composite",
    category: "portrait",
    name: "Group Photo Composite",
    nameKo: "단체사진 합성",
    description: "단체사진에 인물 추가/제거, 자연스러운 합성 처리",
    icon: "👨‍👩‍👧‍👦",
    keywords: ["단체사진", "합성", "인물추가", "인물제거", "가족사진", "그룹"],
    applicableIndustries: ["photo-studio"],
  },
  "portrait.personal-color": {
    id: "portrait.personal-color",
    category: "portrait",
    name: "Personal Color",
    nameKo: "퍼스널컬러",
    description: "퍼스널컬러 진단에 맞는 배경색 및 색보정 적용",
    icon: "🎨",
    keywords: ["퍼스널컬러", "웜톤", "쿨톤", "색진단", "컬러진단", "톤"],
    applicableIndustries: ["photo-studio", "beauty"],
  },
};

// ============================================================
// Layer 3: 세부 요소 (WHAT) - 동적 옵션
// ============================================================

export const DETAIL_ELEMENTS = {
  background: [
    { id: "white-studio", nameKo: "화이트 스튜디오", icon: "⬜" },
    { id: "gray-studio", nameKo: "그레이 스튜디오", icon: "⬛" },
    { id: "gradient", nameKo: "그라데이션", icon: "🌅" },
    { id: "natural", nameKo: "자연 배경", icon: "🌿" },
    { id: "urban", nameKo: "도시 배경", icon: "🏙️" },
    { id: "interior", nameKo: "인테리어 배경", icon: "🏠" },
    { id: "texture-marble", nameKo: "대리석", icon: "🪨" },
    { id: "texture-wood", nameKo: "우드", icon: "🪵" },
    { id: "texture-fabric", nameKo: "패브릭", icon: "🧵" },
    { id: "transparent", nameKo: "투명 배경", icon: "🔲" },
  ],

  lighting: [
    { id: "natural-soft", nameKo: "자연광 소프트", icon: "☀️" },
    { id: "natural-hard", nameKo: "자연광 하드", icon: "🌞" },
    { id: "studio-soft", nameKo: "스튜디오 소프트", icon: "💡" },
    { id: "studio-dramatic", nameKo: "드라마틱", icon: "🎭" },
    { id: "backlit", nameKo: "역광", icon: "🌅" },
    { id: "rim-light", nameKo: "림라이트", icon: "✨" },
    { id: "golden-hour", nameKo: "골든아워", icon: "🌇" },
    { id: "neon", nameKo: "네온", icon: "🔮" },
  ],

  angle: [
    { id: "front", nameKo: "정면", icon: "⏺️" },
    { id: "three-quarter", nameKo: "3/4 앵글", icon: "📐" },
    { id: "side", nameKo: "측면", icon: "➡️" },
    { id: "back", nameKo: "후면", icon: "⏪" },
    { id: "top-down", nameKo: "탑다운", icon: "⬇️" },
    { id: "low-angle", nameKo: "로우앵글", icon: "⬆️" },
    { id: "eye-level", nameKo: "아이레벨", icon: "👁️" },
    { id: "dutch", nameKo: "더치앵글", icon: "📱" },
  ],

  props: [
    { id: "none", nameKo: "소품 없음", icon: "❌" },
    { id: "minimal", nameKo: "미니멀 소품", icon: "🪴" },
    { id: "lifestyle", nameKo: "라이프스타일 소품", icon: "☕" },
    { id: "seasonal", nameKo: "시즌 소품", icon: "🎄" },
    { id: "brand-elements", nameKo: "브랜드 요소", icon: "🏷️" },
    { id: "food-ingredients", nameKo: "식재료", icon: "🥬" },
    { id: "beauty-elements", nameKo: "뷰티 소품", icon: "💄" },
  ],
} as const;

export type DetailElementType = keyof typeof DETAIL_ELEMENTS;

// ============================================================
// 복합 의도 구조
// ============================================================

export interface CompleteIntent {
  purpose?: PurposeIntent;           // Layer 1: 촬영 목적
  expression: ExpressionIntent;      // Layer 2: 표현 방식 (필수)
  details?: {                        // Layer 3: 세부 요소 (선택)
    background?: string;
    lighting?: string;
    angle?: string;
    props?: string;
  };
  referenceImage?: string;           // 참조 이미지 URL
  additionalNotes?: string;          // 추가 설명
}

// ============================================================
// 유틸리티 함수
// ============================================================

export function getExpressionCategory(intent: ExpressionIntent): ExpressionCategory {
  return intent.split(".")[0] as ExpressionCategory;
}

export function getExpressionsByCategory(category: ExpressionCategory): ExpressionIntent[] {
  return EXPRESSION_INTENTS.filter(
    (intent) => intent.startsWith(`${category}.`)
  );
}

export function getIntentsByIndustry(industry: Industry): ExpressionIntent[] {
  return EXPRESSION_INTENTS.filter(
    (intent) => EXPRESSION_INTENT_INFO[intent].applicableIndustries.includes(industry)
  );
}

export function isPurposeIntent(value: string): value is PurposeIntent {
  return PURPOSE_INTENTS.includes(value as PurposeIntent);
}

export function isExpressionIntent(value: string): value is ExpressionIntent {
  return EXPRESSION_INTENTS.includes(value as ExpressionIntent);
}
