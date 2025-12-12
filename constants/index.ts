import { Category, StyleOption, LayoutOption } from '@/types';

export const COMMON_STYLES: StyleOption[] = [
  { id: 'realistic', label: '리얼리스틱', promptModifier: 'photorealistic, high quality, 4k, highly detailed', previewColor: 'bg-blue-100' },
  { id: 'studio', label: '스튜디오 조명', promptModifier: 'professional studio lighting, clean background, product photography', previewColor: 'bg-gray-100' },
  { id: 'warm', label: '따뜻한 감성', promptModifier: 'warm tones, cozy atmosphere, natural sunlight, soft shadows', previewColor: 'bg-orange-100' },
  { id: 'minimal', label: '미니멀리즘', promptModifier: 'minimalist, clean lines, simple composition, negative space', previewColor: 'bg-slate-100' },
];

export const CATEGORIES: Category[] = [
  {
    id: 'product_shot',
    label: '제품 스튜디오 촬영',
    icon: 'camera',
    description: '쇼핑몰 상세페이지나 썸네일에 사용할 깔끔한 누끼/배경 사진',
    styles: [
      { id: 'white_bg', label: '흰색 배경 (누끼)', promptModifier: 'pure white background, isolated product, commercial photography', previewColor: 'bg-white border' },
      { id: 'marble', label: '고급 대리석', promptModifier: 'on a luxury marble table, elegant reflection, premium feel', previewColor: 'bg-stone-200' },
      { id: 'nature', label: '자연 친화적', promptModifier: 'surrounded by leaves, wood texture, organic feel, natural light', previewColor: 'bg-green-100' },
      ...COMMON_STYLES
    ]
  },
  {
    id: 'sns_post',
    label: 'SNS 포스팅 (인스타/스레드)',
    icon: 'instagram',
    description: '인스타그램, 페이스북 등 소셜 미디어 감성의 트렌디한 이미지',
    styles: [
      { id: 'trendy', label: '인스타 감성', promptModifier: 'instagram aesthetic, trendy, lifestyle photography, blurred background', previewColor: 'bg-pink-100' },
      { id: 'flatlay', label: '항공샷 (Flatlay)', promptModifier: 'flatlay composition, objects arranged neatly, view from above', previewColor: 'bg-purple-100' },
      { id: 'retro', label: '레트로 필터', promptModifier: 'retro film grain, vintage colors, 90s vibe, nostalgic', previewColor: 'bg-yellow-100' },
      ...COMMON_STYLES
    ]
  },
  {
    id: 'menu_board',
    label: '메뉴판/음식 사진',
    icon: 'utensils',
    description: '식당, 카페 메뉴판에 들어갈 먹음직스러운 음식 연출',
    styles: [
      { id: 'appetizing', label: '식욕 자극', promptModifier: 'extremely appetizing, glistening textures, steam rising, macro shot', previewColor: 'bg-red-100' },
      { id: 'cafe', label: '카페 분위기', promptModifier: 'cozy cafe interior background, coffee shop vibes, ambient lighting', previewColor: 'bg-amber-100' },
      { id: 'dark_mood', label: '고급 다이닝', promptModifier: 'dark moody lighting, elegant plating, fine dining atmosphere', previewColor: 'bg-zinc-800 text-white' },
    ]
  },
  {
    id: 'offline_ad',
    label: '전단지/포스터/현수막',
    icon: 'poster',
    description: '오프라인 홍보를 위한 고화질의 주목도 높은 이미지',
    styles: [
      { id: 'vibrant', label: '강렬한 색감', promptModifier: 'vibrant colors, high contrast, eye-catching, pop art style', previewColor: 'bg-yellow-200' },
      { id: 'clean_ad', label: '신뢰감 있는 광고', promptModifier: 'clean corporate style, bright lighting, trustworthy, professional advertisement', previewColor: 'bg-blue-200' },
    ]
  },
  {
    id: 'model_fit',
    label: '가상 착용/사용 컷',
    icon: 'user',
    description: '제품을 실제 사람이 사용하거나 착용한 듯한 연출',
    styles: [
      { id: 'korean_model', label: '한국인 모델', promptModifier: 'photo of a korean model utilizing the product, lifestyle shot, natural pose', previewColor: 'bg-rose-50' },
      { id: 'street', label: '스트릿 스냅', promptModifier: 'street photography style, outdoors, city background, candid', previewColor: 'bg-gray-200' },
    ]
  }
];

export const POSTER_CATEGORIES: Category[] = [
  {
    id: 'sale_event',
    label: '세일/이벤트 포스터',
    icon: 'megaphone',
    description: '할인, 프로모션, 특별 행사 홍보용 포스터',
    styles: [
      { id: 'vibrant_sale', label: '강렬한 세일', promptModifier: 'vibrant colors, high contrast, sale poster, eye-catching, bold typography, energetic', previewColor: 'bg-red-100' },
      { id: 'elegant_event', label: '우아한 이벤트', promptModifier: 'elegant event poster, sophisticated colors, premium feeling, clean design', previewColor: 'bg-purple-100' },
      { id: 'fun_promotion', label: '재미있는 프로모션', promptModifier: 'fun and playful, bright colors, friendly atmosphere, casual event poster', previewColor: 'bg-yellow-100' },
    ]
  },
  {
    id: 'grand_opening',
    label: '오픈/리뉴얼',
    icon: 'store',
    description: '신규 오픈, 리뉴얼 오픈 안내 포스터',
    styles: [
      { id: 'fresh_opening', label: '신선한 오픈', promptModifier: 'grand opening poster, fresh and new, welcoming atmosphere, bright and inviting', previewColor: 'bg-green-100' },
      { id: 'modern_renewal', label: '모던 리뉴얼', promptModifier: 'modern renewal design, sleek and contemporary, sophisticated branding', previewColor: 'bg-blue-100' },
    ]
  },
  {
    id: 'menu_poster',
    label: '메뉴판 포스터',
    icon: 'utensils',
    description: '식당, 카페 메뉴 안내 포스터',
    styles: [
      { id: 'appetizing_menu', label: '식욕 자극 메뉴', promptModifier: 'appetizing food photography, menu board design, delicious presentation, warm tones', previewColor: 'bg-orange-100' },
      { id: 'cafe_menu', label: '카페 메뉴판', promptModifier: 'cafe menu board, coffee shop vibes, minimalist design, chalkboard style', previewColor: 'bg-amber-100' },
    ]
  },
  {
    id: 'info_poster',
    label: '정보 안내 포스터',
    icon: 'info',
    description: '영업시간, 주차, 공지사항 등 정보 전달용',
    styles: [
      { id: 'clear_info', label: '명확한 안내', promptModifier: 'clear information design, easy to read, organized layout, professional', previewColor: 'bg-blue-50' },
      { id: 'friendly_notice', label: '친근한 공지', promptModifier: 'friendly notice poster, warm colors, approachable design, casual tone', previewColor: 'bg-teal-100' },
    ]
  },
  {
    id: 'product_promo',
    label: '제품 홍보 포스터',
    icon: 'package',
    description: '특정 제품이나 신제품 홍보용 포스터',
    styles: [
      { id: 'premium_product', label: '프리미엄 제품', promptModifier: 'premium product showcase, luxury branding, high-end photography, sophisticated', previewColor: 'bg-slate-800 text-white' },
      { id: 'new_arrival', label: '신제품 출시', promptModifier: 'new product launch, exciting and fresh, modern design, attention-grabbing', previewColor: 'bg-indigo-100' },
    ]
  }
];

export const DETAIL_PAGE_CATEGORIES: Category[] = [
  {
    id: 'cosmetics',
    label: '화장품/뷰티',
    icon: 'sparkles',
    description: '고급스럽고 깨끗한 톤의 뷰티 제품 상세페이지',
    styles: [
      { id: 'clean_beauty', label: '순수/깨끗함', promptModifier: 'clean beauty, white and pastel tones, water droplets, pure atmosphere, vertical layout for mobile detail page', previewColor: 'bg-cyan-50' },
      { id: 'luxury_gold', label: '럭셔리 골드', promptModifier: 'luxury cosmetic branding, gold accents, black background, premium feeling, vertical layout', previewColor: 'bg-yellow-900 text-white' },
    ]
  },
  {
    id: 'food_detail',
    label: '식품/밀키트',
    icon: 'utensils',
    description: '신선함이 돋보이는 식품 상세페이지',
    styles: [
      { id: 'fresh_market', label: '산지 직송', promptModifier: 'fresh ingredients background, organic farm feel, bright sunlight, vertical layout detail page', previewColor: 'bg-green-100' },
      { id: 'table_setting', label: '플레이팅', promptModifier: 'beautiful table setting, ready to eat, warm home atmosphere, vertical layout', previewColor: 'bg-orange-100' },
    ]
  },
  {
    id: 'fashion_detail',
    label: '의류/잡화',
    icon: 'shirt',
    description: '핏과 재질을 강조하는 패션 상세페이지',
    styles: [
      { id: 'editorial', label: '매거진 스타일', promptModifier: 'fashion magazine layout, typography overlay, chic vibe, vertical layout', previewColor: 'bg-zinc-100' },
      { id: 'minimal_look', label: '감성 데일리', promptModifier: 'minimalist daily look, soft beige tones, natural lighting, vertical layout', previewColor: 'bg-stone-100' },
    ]
  },
  {
    id: 'tech_detail',
    label: '디지털/가전',
    icon: 'monitor',
    description: '기능과 스펙을 보여주는 테크 상세페이지',
    styles: [
      { id: 'tech_spec', label: '미래지향적', promptModifier: 'futuristic blue lighting, tech specs visualization, sleek design, vertical layout', previewColor: 'bg-blue-900 text-white' },
      { id: 'simple_white', label: '심플 화이트', promptModifier: 'apple style, minimal white, product focus, clean shadows, vertical layout', previewColor: 'bg-white border' },
    ]
  }
];

export const LAYOUT_OPTIONS: LayoutOption[] = [
  {
    id: 'single',
    label: '1단 (전체 강조)',
    icon: 'square',
    description: '이미지 중심의 임팩트 있는 레이아웃',
    promptModifier: 'Single column layout. Full-width impactful image dominant design. Clean and minimal.'
  },
  {
    id: 'split',
    label: '2단 (좌우 분할)',
    icon: 'columns',
    description: '이미지와 텍스트가 좌우로 배치됨',
    promptModifier: '2-Column split layout. Image on one side, text description on the other side. Balanced composition.'
  },
  {
    id: 'grid',
    label: '3단 그리드',
    icon: 'grid',
    description: '특징/성분 나열에 좋은 그리드형',
    promptModifier: '3-Column grid layout. Structured arrangement for listing features or ingredients. Repeated pattern style.'
  },
  {
    id: 'zigzag',
    label: '지그재그',
    icon: 'move-diagonal-2',
    description: '리듬감 있는 지그재그 배치',
    promptModifier: 'Zigzag layout. Alternating text and image placement to create a dynamic reading flow.'
  },
];

// Aspect Ratio Options for Image Generation
export const ASPECT_RATIOS = [
  { value: '1:1', label: '1:1 (정방형)', description: '기본, 인스타 피드' },
  { value: '3:4', label: '3:4 (세로)', description: '세로형 포스터, 포트레이트' },
  { value: '4:3', label: '4:3 (가로)', description: '가로형 포스터, 프레젠테이션' },
  { value: '9:16', label: '9:16 (세로)', description: '스토리, 릴스, 틱톡' },
  { value: '16:9', label: '16:9 (가로)', description: '유튜브 썸네일, 배너' },
];

// Image Resolution Options (Gemini API)
export const IMAGE_RESOLUTIONS = [
  { value: '1K', label: '1K (기본)', description: '빠른 생성, 웹 미리보기용' },
  { value: '2K', label: '2K (고화질)', description: '기본 생성 화질, 대부분의 용도' },
  { value: '4K', label: '4K (초고화질)', description: '업스케일 전용, 인쇄 및 고품질 출력' },
] as const;

export type ImageResolution = typeof IMAGE_RESOLUTIONS[number]['value'];

// Composite/Staging Categories for multi-image composition
export const COMPOSITE_CATEGORIES: Category[] = [
  {
    id: 'product_staging',
    label: '제품 연출/합성',
    icon: 'layers',
    description: '제품과 소품(재료)을 자연스럽게 배치하여 연출',
    styles: [
      { id: 'harmonious', label: '자연스러운 조화', promptModifier: 'seamless composition, harmonious arrangement of objects, natural interaction between items, photorealistic', previewColor: 'bg-indigo-50' },
      { id: 'creative_float', label: '공중 부양', promptModifier: 'creative product photography, objects floating in mid-air, dynamic composition, clean background', previewColor: 'bg-sky-100' },
      { id: 'flatlay_comp', label: '탑뷰 배치', promptModifier: 'organized flatlay, items arranged neatly on a surface, top-down view, balanced spacing', previewColor: 'bg-slate-100' },
      ...COMMON_STYLES
    ]
  },
  {
    id: 'fashion_coordi',
    label: '패션/코디',
    icon: 'shirt',
    description: '여러 의류/잡화 아이템을 모델 착용샷이나 코디셋으로 합성',
    styles: [
      { id: 'model_wear', label: '모델 착용', promptModifier: 'photo of a model wearing all the provided items together, fashion lookbook style, realistic fitting', previewColor: 'bg-rose-50' },
      { id: 'ghost_mannequin', label: '고스트 마네킹', promptModifier: 'invisible mannequin style, 3D clothing effect, clean focus on outfit coordination', previewColor: 'bg-gray-100' },
      ...COMMON_STYLES
    ]
  },
  {
    id: 'interior',
    label: '인테리어/가구',
    icon: 'armchair',
    description: '가구와 소품을 하나의 공간에 배치',
    styles: [
      { id: 'room_set', label: '룸 세트', promptModifier: 'interior design photography, items arranged in a realistic room setting, cozy atmosphere', previewColor: 'bg-amber-100' },
      { id: 'showroom', label: '쇼룸', promptModifier: 'professional furniture showroom, bright lighting, clean lines, modern interior', previewColor: 'bg-white border' },
      ...COMMON_STYLES
    ]
  },
  {
    id: 'food_plating',
    label: '음식 플레이팅',
    icon: 'utensils',
    description: '요리 재료와 완성된 음식을 함께 연출',
    styles: [
      { id: 'ingredients_together', label: '재료와 함께', promptModifier: 'food photography with fresh ingredients surrounding the dish, farm-to-table concept', previewColor: 'bg-green-100' },
      { id: 'table_scene', label: '테이블 장면', promptModifier: 'beautiful table setting with multiple dishes, dinner party atmosphere, warm lighting', previewColor: 'bg-orange-100' },
      ...COMMON_STYLES
    ]
  }
];

// Usage & Cost Estimation Constants
export const ESTIMATED_COST_PER_IMAGE_USD = 0.14; // Estimated cost for gemini-3-pro-image-preview
export const EXCHANGE_RATE_KRW = 1400; // Approximate exchange rate
