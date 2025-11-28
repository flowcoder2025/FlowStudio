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
  { id: '1:1', label: '1:1 (정방형)', desc: '기본, 인스타 피드' },
  { id: '9:16', label: '9:16 (세로)', desc: '스토리, 릴스, 틱톡' },
  { id: '16:9', label: '16:9 (가로)', desc: '유튜브 썸네일, 배너' },
];

// Usage & Cost Estimation Constants
export const ESTIMATED_COST_PER_IMAGE_USD = 0.04; // Estimated cost for gemini-3-pro-image-preview
export const EXCHANGE_RATE_KRW = 1400; // Approximate exchange rate
