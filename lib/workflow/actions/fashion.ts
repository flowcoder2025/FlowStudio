/**
 * Fashion Industry Actions
 * Contract: WORKFLOW_FUNC_ACTIONS
 */

import { Action } from "./types";

export const fashionActions: Action[] = [
  {
    id: "fashion-model-shot",
    name: "Model Shot",
    nameKo: "모델 착용샷",
    description: "모델이 의류를 착용한 전신 또는 반신 이미지",
    industry: "fashion",
    inputs: [
      {
        id: "product",
        label: "상품 설명",
        type: "textarea",
        placeholder: "예: 네이비 린넨 셔츠, 캐주얼한 핏",
        required: true,
      },
      {
        id: "model",
        label: "모델 특성",
        type: "select",
        options: [
          { value: "korean-female-20s", label: "한국 여성 20대" },
          { value: "korean-female-30s", label: "한국 여성 30대" },
          { value: "korean-male-20s", label: "한국 남성 20대" },
          { value: "korean-male-30s", label: "한국 남성 30대" },
          { value: "western-female", label: "서양 여성" },
          { value: "western-male", label: "서양 남성" },
        ],
        required: true,
      },
      {
        id: "pose",
        label: "포즈",
        type: "select",
        options: [
          { value: "standing-front", label: "정면 서기" },
          { value: "standing-side", label: "측면 서기" },
          { value: "walking", label: "걷는 모습" },
          { value: "sitting", label: "앉은 모습" },
          { value: "dynamic", label: "역동적 포즈" },
        ],
        required: true,
      },
      {
        id: "background",
        label: "배경",
        type: "select",
        options: [
          { value: "white-studio", label: "화이트 스튜디오" },
          { value: "urban-street", label: "도시 거리" },
          { value: "nature", label: "자연 배경" },
          { value: "cafe", label: "카페" },
          { value: "minimal", label: "미니멀" },
        ],
        required: true,
      },
    ],
    promptTemplate:
      "Create a professional fashion photograph that captures a {{model}} model naturally wearing {{product}}. " +
      "The model is shown in a {{pose}} pose, positioned against a {{background}} background. " +
      "The scene features soft, diffused natural lighting that beautifully highlights the texture, color, and fit of the garment. " +
      "Shot from a flattering angle with a professional camera, the image embodies high-end editorial fashion photography with 4K clarity and crisp focus on every detail of the clothing.",
    creditCost: 5,
    examples: ["여름 원피스 착용 모델", "캐주얼 셔츠 모델 착용컷"],
  },
  {
    id: "fashion-flat-lay",
    name: "Flat Lay",
    nameKo: "플랫레이",
    description: "의류를 펼쳐 놓은 탑뷰 이미지",
    industry: "fashion",
    inputs: [
      {
        id: "product",
        label: "상품 설명",
        type: "textarea",
        placeholder: "예: 화이트 코튼 티셔츠",
        required: true,
      },
      {
        id: "styling",
        label: "스타일링",
        type: "select",
        options: [
          { value: "minimal", label: "미니멀" },
          { value: "with-accessories", label: "액세서리 포함" },
          { value: "seasonal", label: "시즌 소품" },
          { value: "lifestyle", label: "라이프스타일" },
        ],
        required: true,
      },
      {
        id: "background",
        label: "배경",
        type: "select",
        options: [
          { value: "white", label: "화이트" },
          { value: "marble", label: "대리석" },
          { value: "wood", label: "우드" },
          { value: "fabric", label: "패브릭" },
        ],
        required: true,
      },
    ],
    promptTemplate:
      "Create a beautiful flat lay photograph showcasing {{product}} arranged with {{styling}} styling. " +
      "The items are carefully placed on a {{background}} surface, captured from a perfect top-down perspective. " +
      "Soft, diffused lighting creates gentle shadows that add depth while maintaining the clean, professional aesthetic. " +
      "Every detail of the fabric, texture, and craftsmanship is visible in stunning 4K clarity.",
    creditCost: 5,
  },
  {
    id: "fashion-detail",
    name: "Detail Shot",
    nameKo: "디테일 샷",
    description: "옷의 소재, 디테일을 강조한 클로즈업",
    industry: "fashion",
    inputs: [
      {
        id: "product",
        label: "상품 설명",
        type: "textarea",
        placeholder: "예: 자수 디테일이 있는 데님 재킷",
        required: true,
      },
      {
        id: "focus",
        label: "강조 부분",
        type: "select",
        options: [
          { value: "fabric-texture", label: "원단 질감" },
          { value: "stitching", label: "스티칭/봉제" },
          { value: "buttons", label: "버튼/장식" },
          { value: "embroidery", label: "자수/프린트" },
          { value: "zipper", label: "지퍼/하드웨어" },
        ],
        required: true,
      },
    ],
    promptTemplate:
      "Create a stunning macro detail photograph of {{product}} with an extreme close-up focus on the {{focus}}. " +
      "The camera captures every intricate detail with razor-sharp precision, revealing the quality of craftsmanship. " +
      "Professional studio lighting illuminates the textures beautifully, creating depth and dimension. " +
      "This high-resolution 4K image showcases the premium quality and attention to detail that defines the garment.",
    creditCost: 5,
  },
  {
    id: "fashion-ghost-mannequin",
    name: "Ghost Mannequin",
    nameKo: "고스트 마네킹",
    description: "보이지 않는 마네킹 효과로 옷의 형태 강조",
    industry: "fashion",
    inputs: [
      {
        id: "product",
        label: "상품 설명",
        type: "textarea",
        placeholder: "예: 블랙 테일러드 재킷",
        required: true,
      },
      {
        id: "angle",
        label: "촬영 각도",
        type: "select",
        options: [
          { value: "front", label: "정면" },
          { value: "back", label: "후면" },
          { value: "side", label: "측면" },
          { value: "three-quarter", label: "3/4 각도" },
        ],
        required: true,
      },
    ],
    promptTemplate:
      "Create a professional ghost mannequin photograph of {{product}} captured from a {{angle}} view. " +
      "The invisible mannequin technique reveals the garment's true shape and structure, showing how it naturally drapes and fits. " +
      "Set against a clean white background, the image maintains a minimal e-commerce aesthetic perfect for online retail. " +
      "Professional lighting ensures every detail is clearly visible in crisp 4K quality.",
    creditCost: 5,
  },
  {
    id: "fashion-lifestyle",
    name: "Lifestyle",
    nameKo: "라이프스타일",
    description: "일상적인 상황에서의 착용 이미지",
    industry: "fashion",
    inputs: [
      {
        id: "product",
        label: "상품 설명",
        type: "textarea",
        placeholder: "예: 베이지 트렌치코트",
        required: true,
      },
      {
        id: "scene",
        label: "장면",
        type: "select",
        options: [
          { value: "commuting", label: "출퇴근" },
          { value: "weekend", label: "주말 외출" },
          { value: "travel", label: "여행" },
          { value: "date", label: "데이트" },
          { value: "work", label: "오피스" },
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
          { value: "korean-male-20s", label: "한국 남성 20대" },
          { value: "korean-male-30s", label: "한국 남성 30대" },
        ],
        required: true,
      },
    ],
    promptTemplate:
      "Create an authentic lifestyle fashion photograph featuring a {{model}} naturally wearing {{product}} in a {{scene}} setting. " +
      "The image captures a candid, genuine moment that feels relatable and aspirational. " +
      "Warm ambient lighting creates an inviting atmosphere that connects emotionally with the viewer. " +
      "Shot in documentary style with 4K clarity, this photograph tells a story about the lifestyle the clothing represents.",
    creditCost: 5,
  },
];
