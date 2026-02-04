/**
 * Photo Studio Industry Actions
 * Contract: WORKFLOW_FUNC_ACTIONS
 * AI 사진관 - 증명사진, 프로필사진, 보정, 배경처리 등
 */

import { Action } from "./types";

export const photoStudioActions: Action[] = [
  {
    id: "photo-studio-id-photo",
    name: "ID Photo",
    nameKo: "증명사진",
    description: "여권, 운전면허증, 주민등록증, 비자 등 공식 증명사진 제작",
    industry: "photo-studio",
    inputs: [
      {
        id: "photoType",
        label: "증명사진 종류",
        type: "select",
        options: [
          { value: "passport", label: "여권사진 (3.5×4.5cm)" },
          { value: "driver-license", label: "운전면허증 (3.5×4.5cm)" },
          { value: "id-card", label: "주민등록증 (3×4cm)" },
          { value: "visa", label: "비자사진 (5×5cm)" },
          { value: "resume", label: "이력서용 (3×4cm)" },
          { value: "student-id", label: "학생증 (3×4cm)" },
        ],
        required: true,
      },
      {
        id: "background",
        label: "배경색",
        type: "select",
        options: [
          { value: "white", label: "흰색 배경" },
          { value: "light-gray", label: "연한 회색" },
          { value: "light-blue", label: "연한 파란색" },
        ],
        required: true,
      },
      {
        id: "retouch",
        label: "보정 수준",
        type: "select",
        options: [
          { value: "none", label: "보정 없음 (원본 유지)" },
          { value: "light", label: "가벼운 보정 (피부톤 정리)" },
          { value: "standard", label: "표준 보정 (잡티 제거, 피부 정리)" },
        ],
        required: true,
      },
      {
        id: "requests",
        label: "추가 요청사항",
        type: "textarea",
        placeholder: "원하는 스타일이나 특별한 요청사항을 자유롭게 작성해주세요",
        required: false,
      },
    ],
    promptTemplate:
      "Create a professional {{photoType}} ID photo with a clean {{background}} background. " +
      "The subject is positioned centered with proper head size ratio according to official regulations. " +
      "Apply {{retouch}} level retouching while maintaining natural appearance. " +
      "Professional studio lighting ensures even illumination without harsh shadows. " +
      "{{#requests}}Additional requirements: {{requests}}. {{/requests}}" +
      "The final image meets official document photo standards in high resolution.",
    creditCost: 3,
    examples: ["여권사진", "운전면허사진", "이력서사진"],
  },
  {
    id: "photo-studio-business-profile",
    name: "Business Profile",
    nameKo: "비즈니스 프로필",
    description: "LinkedIn, 명함, 회사 홈페이지용 전문적인 프로필 사진",
    industry: "photo-studio",
    inputs: [
      {
        id: "style",
        label: "스타일",
        type: "select",
        options: [
          { value: "corporate", label: "기업 공식 (정장)" },
          { value: "business-casual", label: "비즈니스 캐주얼" },
          { value: "creative", label: "크리에이티브 전문가" },
          { value: "startup", label: "스타트업/IT" },
        ],
        required: true,
      },
      {
        id: "background",
        label: "배경",
        type: "select",
        options: [
          { value: "studio-gray", label: "스튜디오 그레이" },
          { value: "studio-white", label: "스튜디오 화이트" },
          { value: "office-blur", label: "오피스 블러" },
          { value: "outdoor-natural", label: "아웃도어 자연광" },
        ],
        required: true,
      },
      {
        id: "framing",
        label: "구도",
        type: "select",
        options: [
          { value: "headshot", label: "헤드샷 (얼굴 중심)" },
          { value: "shoulders", label: "어깨까지" },
          { value: "half-body", label: "반신" },
        ],
        required: true,
      },
      {
        id: "retouch",
        label: "보정 수준",
        type: "select",
        options: [
          { value: "natural", label: "자연스러운 보정" },
          { value: "professional", label: "프로페셔널 보정" },
          { value: "minimal", label: "최소 보정" },
        ],
        required: true,
      },
      {
        id: "requests",
        label: "추가 요청사항",
        type: "textarea",
        placeholder: "원하는 스타일이나 특별한 요청사항을 자유롭게 작성해주세요",
        required: false,
      },
    ],
    promptTemplate:
      "Create a professional business profile photograph with {{style}} styling and {{framing}} framing. " +
      "The subject presents a confident and approachable expression suitable for LinkedIn and corporate use. " +
      "Set against a {{background}} background with professional lighting that flatters facial features. " +
      "Apply {{retouch}} retouching to enhance while maintaining authentic appearance. " +
      "{{#requests}}Additional requirements: {{requests}}. {{/requests}}" +
      "This polished headshot conveys professionalism and trustworthiness in stunning 4K quality.",
    creditCost: 5,
    examples: ["LinkedIn 프로필", "명함사진", "회사 홈페이지용"],
  },
  {
    id: "photo-studio-sns-profile",
    name: "SNS Profile",
    nameKo: "SNS 프로필",
    description: "인스타그램, 카카오톡, 페이스북 등 SNS용 프로필 사진",
    industry: "photo-studio",
    inputs: [
      {
        id: "mood",
        label: "분위기",
        type: "select",
        options: [
          { value: "bright-cheerful", label: "밝고 화사한" },
          { value: "soft-dreamy", label: "소프트하고 몽환적인" },
          { value: "cool-trendy", label: "쿨하고 트렌디한" },
          { value: "warm-cozy", label: "따뜻하고 아늑한" },
          { value: "chic-minimal", label: "시크하고 미니멀한" },
        ],
        required: true,
      },
      {
        id: "background",
        label: "배경",
        type: "select",
        options: [
          { value: "solid-color", label: "단색 배경" },
          { value: "gradient", label: "그라데이션" },
          { value: "cafe", label: "카페/인테리어" },
          { value: "nature", label: "자연 배경" },
          { value: "urban", label: "도시/거리" },
        ],
        required: true,
      },
      {
        id: "filter",
        label: "필터 스타일",
        type: "select",
        options: [
          { value: "natural", label: "내추럴 (보정 최소화)" },
          { value: "film", label: "필름 느낌" },
          { value: "vsco", label: "VSCO 스타일" },
          { value: "bright", label: "밝은 톤 강조" },
        ],
        required: true,
      },
      {
        id: "requests",
        label: "추가 요청사항",
        type: "textarea",
        placeholder: "원하는 스타일이나 특별한 요청사항을 자유롭게 작성해주세요",
        required: false,
      },
    ],
    promptTemplate:
      "Create an attractive SNS profile photograph with {{mood}} mood and atmosphere. " +
      "The subject looks natural and photogenic against a {{background}} background. " +
      "Apply {{filter}} color grading to create the perfect social media aesthetic. " +
      "{{#requests}}Additional requirements: {{requests}}. {{/requests}}" +
      "The composition is optimized for square format commonly used on Instagram and social platforms. " +
      "This stunning profile photo is designed to make a great first impression on social media.",
    creditCost: 4,
    examples: ["인스타그램 프로필", "카카오톡 프로필", "페이스북 프로필"],
  },
  {
    id: "photo-studio-job-application",
    name: "Job Application Photo",
    nameKo: "취업용 사진",
    description: "이력서, 입사지원서, 자기소개서용 전문적인 사진",
    industry: "photo-studio",
    inputs: [
      {
        id: "industry",
        label: "지원 업종",
        type: "select",
        options: [
          { value: "finance", label: "금융/보험" },
          { value: "it-tech", label: "IT/테크" },
          { value: "manufacturing", label: "제조/엔지니어링" },
          { value: "service", label: "서비스/유통" },
          { value: "creative", label: "광고/디자인" },
          { value: "medical", label: "의료/제약" },
          { value: "public", label: "공공기관/공무원" },
        ],
        required: true,
      },
      {
        id: "attire",
        label: "복장",
        type: "select",
        options: [
          { value: "formal-suit", label: "정장 (타이 착용)" },
          { value: "semi-formal", label: "세미 정장 (노타이)" },
          { value: "smart-casual", label: "스마트 캐주얼" },
        ],
        required: true,
      },
      {
        id: "expression",
        label: "표정",
        type: "select",
        options: [
          { value: "confident", label: "자신감 있는" },
          { value: "friendly", label: "친근하고 밝은" },
          { value: "professional", label: "프로페셔널한" },
          { value: "approachable", label: "편안하고 다가가기 쉬운" },
        ],
        required: true,
      },
      {
        id: "requests",
        label: "추가 요청사항",
        type: "textarea",
        placeholder: "원하는 스타일이나 특별한 요청사항을 자유롭게 작성해주세요",
        required: false,
      },
    ],
    promptTemplate:
      "Create a professional job application photograph for {{industry}} industry positions. " +
      "The subject wears {{attire}} attire and presents a {{expression}} expression. " +
      "Clean studio lighting with neutral background creates a polished, professional appearance. " +
      "{{#requests}}Additional requirements: {{requests}}. {{/requests}}" +
      "Natural skin retouching ensures an authentic yet refined look suitable for corporate applications. " +
      "This high-quality photograph conveys competence and professionalism in stunning clarity.",
    creditCost: 4,
    examples: ["이력서 사진", "입사지원용 사진", "자기소개서용"],
  },
  {
    id: "photo-studio-beauty-retouch",
    name: "Beauty Retouch",
    nameKo: "뷰티 보정",
    description: "피부 보정, 얼굴형 보정, 체형 보정 등 자연스러운 뷰티 리터칭",
    industry: "photo-studio",
    inputs: [
      {
        id: "skinRetouch",
        label: "피부 보정",
        type: "select",
        options: [
          { value: "none", label: "보정 없음" },
          { value: "light", label: "가벼운 보정 (잡티 제거)" },
          { value: "moderate", label: "적당한 보정 (피부결 정리)" },
          { value: "smooth", label: "매끄러운 피부 (에어브러시)" },
        ],
        required: true,
      },
      {
        id: "faceShape",
        label: "얼굴형 보정",
        type: "select",
        options: [
          { value: "none", label: "보정 없음" },
          { value: "slim", label: "갸름하게" },
          { value: "jawline", label: "턱선 정리" },
          { value: "symmetry", label: "좌우 대칭 보정" },
        ],
        required: true,
      },
      {
        id: "eyeRetouch",
        label: "눈 보정",
        type: "select",
        options: [
          { value: "none", label: "보정 없음" },
          { value: "brighten", label: "눈 밝게" },
          { value: "enlarge", label: "약간 키우기" },
          { value: "double-eyelid", label: "쌍꺼풀 강조" },
        ],
        required: true,
      },
      {
        id: "colorTone",
        label: "피부톤",
        type: "select",
        options: [
          { value: "natural", label: "자연스러운 톤 유지" },
          { value: "brighten", label: "밝게 보정" },
          { value: "warm", label: "웜톤 강조" },
          { value: "cool", label: "쿨톤 강조" },
        ],
        required: true,
      },
      {
        id: "requests",
        label: "추가 요청사항",
        type: "textarea",
        placeholder: "원하는 보정 스타일이나 특별한 요청사항을 자유롭게 작성해주세요",
        required: false,
      },
    ],
    promptTemplate:
      "Apply professional beauty retouching to the portrait photograph. " +
      "Skin retouching level: {{skinRetouch}}, maintaining natural skin texture. " +
      "Face shape adjustment: {{faceShape}} while preserving facial proportions. " +
      "Eye enhancement: {{eyeRetouch}} for a more attractive appearance. " +
      "Color tone adjustment: {{colorTone}} to complement the subject's natural features. " +
      "{{#requests}}Additional requirements: {{requests}}. {{/requests}}" +
      "The final result looks polished yet authentic, enhancing natural beauty without over-editing.",
    creditCost: 5,
    examples: ["피부 보정", "얼굴형 보정", "전체 뷰티 리터칭"],
  },
  {
    id: "photo-studio-background-change",
    name: "Background Change",
    nameKo: "배경 교체",
    description: "AI 누끼 추출 및 배경 교체 (흰색, 그레이, 컬러 배경 등)",
    industry: "photo-studio",
    inputs: [
      {
        id: "backgroundType",
        label: "새 배경",
        type: "select",
        options: [
          { value: "white", label: "흰색 배경" },
          { value: "gray", label: "회색 배경" },
          { value: "blue", label: "파란색 배경" },
          { value: "gradient-soft", label: "소프트 그라데이션" },
          { value: "studio", label: "스튜디오 배경" },
          { value: "office", label: "오피스 배경" },
          { value: "nature", label: "자연 배경" },
          { value: "transparent", label: "투명 배경 (PNG)" },
        ],
        required: true,
      },
      {
        id: "edgeQuality",
        label: "가장자리 품질",
        type: "select",
        options: [
          { value: "sharp", label: "선명한 윤곽" },
          { value: "soft", label: "부드러운 윤곽" },
          { value: "feathered", label: "페더링 효과" },
        ],
        required: true,
      },
      {
        id: "hairDetail",
        label: "머리카락 처리",
        type: "select",
        options: [
          { value: "standard", label: "표준 처리" },
          { value: "detailed", label: "세밀한 처리 (머리카락 한 올까지)" },
        ],
        required: true,
      },
      {
        id: "requests",
        label: "추가 요청사항",
        type: "textarea",
        placeholder: "원하는 배경 스타일이나 특별한 요청사항을 자유롭게 작성해주세요",
        required: false,
      },
    ],
    promptTemplate:
      "Extract the subject from the original background using AI-powered cutout technology. " +
      "Apply {{hairDetail}} hair extraction for natural-looking edges. " +
      "Place the subject against a new {{backgroundType}} background. " +
      "Ensure {{edgeQuality}} edge quality for seamless integration. " +
      "{{#requests}}Additional requirements: {{requests}}. {{/requests}}" +
      "Adjust lighting and shadows to match the new background for a professional composite result.",
    creditCost: 4,
    examples: ["배경 누끼", "흰 배경으로 교체", "스튜디오 배경"],
  },
  {
    id: "photo-studio-group-composite",
    name: "Group Photo Composite",
    nameKo: "단체사진 합성",
    description: "단체사진에 인물 추가/제거, 자연스러운 합성 처리",
    industry: "photo-studio",
    inputs: [
      {
        id: "compositeType",
        label: "합성 유형",
        type: "select",
        options: [
          { value: "add-person", label: "인물 추가" },
          { value: "remove-person", label: "인물 제거" },
          { value: "swap-face", label: "얼굴 교체" },
          { value: "combine-photos", label: "여러 사진 합성" },
        ],
        required: true,
      },
      {
        id: "occasion",
        label: "촬영 용도",
        type: "select",
        options: [
          { value: "family", label: "가족사진" },
          { value: "graduation", label: "졸업사진" },
          { value: "company", label: "회사 단체사진" },
          { value: "event", label: "행사/이벤트" },
          { value: "doljanchi", label: "돌잔치/백일" },
        ],
        required: true,
      },
      {
        id: "blendQuality",
        label: "합성 품질",
        type: "select",
        options: [
          { value: "standard", label: "표준 품질" },
          { value: "premium", label: "프리미엄 (자연스러운 조명/그림자)" },
        ],
        required: true,
      },
      {
        id: "requests",
        label: "추가 요청사항",
        type: "textarea",
        placeholder: "합성할 위치나 특별한 요청사항을 자유롭게 작성해주세요",
        required: false,
      },
    ],
    promptTemplate:
      "Perform {{compositeType}} operation for a {{occasion}} group photograph. " +
      "Use advanced AI compositing techniques to ensure seamless integration. " +
      "Apply {{blendQuality}} quality blending with matching lighting, color, and perspective. " +
      "{{#requests}}Additional requirements: {{requests}}. {{/requests}}" +
      "Ensure natural shadow placement and skin tone consistency across all subjects. " +
      "The final composite appears as a genuine single photograph taken together.",
    creditCost: 8,
    examples: ["가족사진 합성", "졸업사진 인물 추가", "단체사진 인물 제거"],
  },
  {
    id: "photo-studio-personal-color",
    name: "Personal Color",
    nameKo: "퍼스널컬러",
    description: "퍼스널컬러 진단에 맞는 배경색 및 색보정 적용",
    industry: "photo-studio",
    inputs: [
      {
        id: "personalColor",
        label: "퍼스널컬러",
        type: "select",
        options: [
          { value: "spring-warm", label: "봄 웜톤 (밝고 선명한)" },
          { value: "summer-cool", label: "여름 쿨톤 (부드럽고 연한)" },
          { value: "autumn-warm", label: "가을 웜톤 (깊고 따뜻한)" },
          { value: "winter-cool", label: "겨울 쿨톤 (선명하고 차가운)" },
        ],
        required: true,
      },
      {
        id: "application",
        label: "적용 대상",
        type: "select",
        options: [
          { value: "background", label: "배경색 변경" },
          { value: "color-grade", label: "전체 색보정" },
          { value: "both", label: "배경 + 색보정" },
        ],
        required: true,
      },
      {
        id: "intensity",
        label: "적용 강도",
        type: "select",
        options: [
          { value: "subtle", label: "은은하게" },
          { value: "moderate", label: "적당하게" },
          { value: "strong", label: "강하게" },
        ],
        required: true,
      },
      {
        id: "requests",
        label: "추가 요청사항",
        type: "textarea",
        placeholder: "원하는 컬러 스타일이나 특별한 요청사항을 자유롭게 작성해주세요",
        required: false,
      },
    ],
    promptTemplate:
      "Apply {{personalColor}} personal color analysis to the portrait photograph. " +
      "Adjust {{application}} to complement the subject's natural undertones. " +
      "Apply {{intensity}} intensity color grading that enhances the subject's appearance. " +
      "{{#requests}}Additional requirements: {{requests}}. {{/requests}}" +
      "Select background colors and tones that harmonize with the personal color palette. " +
      "The final image showcases how the right colors can enhance natural beauty and radiance.",
    creditCost: 5,
    examples: ["봄 웜톤 프로필", "퍼스널컬러 배경", "컬러 진단 적용"],
  },
];
