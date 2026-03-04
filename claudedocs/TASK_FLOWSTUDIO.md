# FlowStudio 구현 태스크

> **총 122 Contracts** (Phase 1-14)
> **완료**: Phase 1-13 (111 Contracts) ✅ + Phase 14a-e (10 Contracts) ✅
> **완료**: Phase 14 Performance Optimization (10/11) ✅

---

## 작업 규칙

### Phase 종료 시 필수 절차
```bash
1. npm run build          # 빌드 체크
2. npx tsc --noEmit       # 타입 체크
3. npm run lint           # 린트 체크
4. 핸드오프 문서 작성      # claudedocs/HANDOFF_YYYY-MM-DD.md
5. 컨텍스트 클리어         # /clear 또는 새 세션
```

### 작업 재개 시 필수 참조
```
1. claudedocs/TASK_FLOWSTUDIO.md    ← 이 문서
2. claudedocs/HANDOFF_*.md          ← 최신 핸드오프
3. docs/IMPLEMENTATION_PLAN.md      ← 상세 스펙
```

---

## Phase 진행 현황

| Phase | 상태 | Contracts | 핸드오프 |
|-------|------|-----------|----------|
| Phase 1 | ✅ 완료 | 14/14 | HANDOFF_2026-01-21.md |
| Phase 2 | ✅ 완료 | 10/10 | HANDOFF_2026-01-21.md |
| Phase 3 | ✅ 완료 | 7/7 | HANDOFF_2026-01-21.md |
| Phase 4 | ✅ 완료 | 10/10 | HANDOFF_2026-01-21_P4.md |
| Phase 5 | ✅ 완료 | 10/10 | HANDOFF_2026-01-21_P5.md |
| Phase 6 | ✅ 완료 | 7/7 | HANDOFF_2026-01-21_P6.md |
| Phase 7 | ✅ 완료 | 12/12 | HANDOFF_2026-01-21_P7.md |
| Phase 8 | ✅ 완료 | 5/5 | HANDOFF_2026-01-22_P8.md |
| Phase 9 | ✅ 완료 | 8/8 | HANDOFF_2026-01-22_P9.md |
| Phase 10 | ✅ 완료 | 6/6 | HANDOFF_2026-01-22_P10.md |
| Phase 11 | ✅ 완료 | 6/6 | HANDOFF_2026-01-22_P11.md |
| Phase 12 | ✅ 완료 | 6/6 | HANDOFF_2026-01-22_P12_FINAL.md |
| Phase 13 (Immersive) | ✅ 완료 | 10/10 | HANDOFF_2026-01-22_PHASE_E.md |
| **Phase 14 (Perf)** | ✅ 완료 | 10/11 | HANDOFF_2026-01-26_P14e.md |

---

## Phase 1: AUTH + PERMISSION ✅

### Contracts (14개)
- [x] AUTH_FUNC_GOOGLE_OAUTH → `lib/auth/authOptions.ts`
- [x] AUTH_FUNC_KAKAO_OAUTH → `lib/auth/authOptions.ts`
- [x] AUTH_FUNC_SESSION → `lib/auth/authOptions.ts`
- [x] AUTH_FUNC_CALLBACK → `app/api/auth/[...nextauth]/route.ts`
- [x] AUTH_DESIGN_LOGIN_PAGE → `app/(auth)/login/page.tsx`
- [x] AUTH_DESIGN_HEADER_STATE → `components/layout/Header.tsx`
- [x] PERMISSION_FUNC_CHECK → `lib/permissions/check.ts`
- [x] PERMISSION_FUNC_GRANT → `lib/permissions/grant.ts`
- [x] PERMISSION_FUNC_REVOKE → `lib/permissions/revoke.ts`
- [x] PERMISSION_FUNC_LIST → `lib/permissions/list.ts`
- [x] PERMISSION_FUNC_ADMIN → `lib/permissions/admin.ts`
- [x] PERMISSION_FUNC_MIDDLEWARE → `lib/permissions/middleware.ts`
- [x] PERMISSION_FUNC_FALLBACK → `lib/permissions/fallback.ts`
- [x] PERMISSION_DESIGN_SHARE → `components/share/ShareModal.tsx`

### 완료일: 2026-01-21

---

## Phase 2: User & Credit Core ✅

### Contracts (10개)
- [x] USER_FUNC_PROFILE → `lib/user/profile.ts`
- [x] USER_FUNC_BUSINESS_VERIFY → `lib/user/businessVerify.ts`
- [x] USER_FUNC_REFERRAL → `lib/user/referral.ts`
- [x] USER_DESIGN_SETTINGS → `app/(main)/settings/page.tsx`
- [x] CREDIT_FUNC_BALANCE → `lib/credits/balance.ts`
- [x] CREDIT_FUNC_HOLD → `lib/credits/hold.ts`
- [x] CREDIT_FUNC_CAPTURE → `lib/credits/capture.ts`
- [x] CREDIT_FUNC_REFUND → `lib/credits/refund.ts`
- [x] CREDIT_FUNC_EXPIRY → `lib/credits/expiry.ts`
- [x] CREDIT_DESIGN_HEADER → `components/layout/CreditBadge.tsx`

### 완료일: 2026-01-21

---

## Phase 3: Workflow System ✅

### Contracts (7개)
- [x] WORKFLOW_FUNC_INDUSTRIES → `lib/workflow/industries.ts`
- [x] WORKFLOW_FUNC_ACTIONS → `lib/workflow/actions/*.ts`
- [x] WORKFLOW_FUNC_SESSION → `lib/workflow/session.ts`
- [x] WORKFLOW_FUNC_INTENT → `lib/workflow/intentAnalyzer.ts`
- [x] WORKFLOW_DESIGN_HOME → `app/(main)/page.tsx`
- [x] WORKFLOW_DESIGN_WIZARD → `app/(main)/workflow/[industry]/[action]/page.tsx`
- [x] WORKFLOW_DESIGN_PREVIEW → `components/workflow/PromptPreview.tsx`

### 완료일: 2026-01-21

---

## Phase 4: Image Generation ✅

### Contracts (10개)
- [x] IMAGE_FUNC_GENERATE → `lib/imageProvider/generate.ts`
- [x] IMAGE_FUNC_PROVIDER → `lib/imageProvider/selectProvider.ts`
- [x] IMAGE_FUNC_UPSCALE → `lib/imageProvider/upscale.ts`
- [x] IMAGE_FUNC_SAVE → `lib/storage/uploadImage.ts`
- [x] IMAGE_FUNC_LIST → `lib/images/list.ts`
- [x] IMAGE_FUNC_DELETE → `lib/images/delete.ts`
- [x] IMAGE_DESIGN_RESULT → `app/(main)/result/page.tsx`
- [x] IMAGE_DESIGN_GALLERY → `app/(main)/gallery/page.tsx`
- [x] IMAGE_DESIGN_PROGRESS → `components/generate/ProgressOverlay.tsx`
- [x] IMAGE_DESIGN_LAZY → `components/ui/LazyImage.tsx`

### 구현 순서
```
1. lib/imageProvider/googleGenAI.ts    - Google GenAI 연동
2. lib/imageProvider/openRouter.ts     - OpenRouter 연동
3. lib/imageProvider/selectProvider.ts - 프로바이더 선택 로직
4. lib/imageProvider/generate.ts       - 통합 생성 함수
5. lib/imageProvider/upscale.ts        - 업스케일
6. lib/storage/uploadImage.ts          - Supabase Storage 업로드
7. lib/images/list.ts                  - 갤러리 목록
8. lib/images/delete.ts                - 삭제 (soft delete)
9. app/api/generate/route.ts           - 생성 API
10. app/api/images/*.ts                - 이미지 CRUD API
11. app/(main)/result/page.tsx         - 결과 페이지
12. app/(main)/gallery/page.tsx        - 갤러리 페이지
13. components/generate/*.tsx          - 진행률 등 컴포넌트
14. components/ui/LazyImage.tsx        - 지연 로딩
```

### 필요 환경변수
```env
GOOGLE_API_KEY=           # Google AI Studio API 키
OPENROUTER_API_KEY=       # OpenRouter API 키
GOOGLE_GENAI_USE_VERTEXAI=false  # (선택) Vertex AI 사용 시 true
```

### 완료일: 2026-01-21

### 필요 의존성
```bash
npm install @google/genai  # 이미지 생성용 (2026-01-26 변경)
npx shadcn@latest add button card dialog dropdown-menu input progress select skeleton
```

### 2026-01-26 핫픽스: 이미지 생성 로직 교체

원본 FlowStudio 프로젝트 로직 적용:

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 패키지 | `@google/generative-ai` | `@google/genai` |
| API 호출 | `model.generateContent()` | `ai.models.generateContent()` |
| 모델 | `gemini-2.0-flash-exp` | `gemini-3-pro-image-preview` |
| OpenRouter | images/generations API | chat/completions API |

**수정된 파일:**
- `lib/imageProvider/vertexai.ts` - 신규 (GenAI 클라이언트)
- `lib/imageProvider/googleGenAI.ts` - 전면 수정
- `lib/imageProvider/openRouter.ts` - 전면 수정
- `lib/imageProvider/types.ts` - 모델/옵션 확장
- `lib/imageProvider/selectProvider.ts` - 프로바이더 설정 업데이트

**핸드오프**: `HANDOFF_2026-01-26_P14g.md`

---

## Phase 5: Hybrid Processing ✅

### Contracts (10개)
- [x] HYBRID_FUNC_BG_REMOVE → `lib/imageProcessing/removeBackground.ts`
- [x] HYBRID_FUNC_COLOR_TRANSFER → `lib/imageProcessing/colorTransfer.ts`
- [x] HYBRID_FUNC_FILTER → `lib/imageProcessing/applyFilter.ts`
- [x] HYBRID_FUNC_COLOR_EXTRACT → `lib/imageProcessing/extractColor.ts`
- [x] HYBRID_FUNC_SAM → `lib/imageProcessing/segmentAnything.ts`
- [x] HYBRID_FUNC_COLORWAY → `lib/imageProcessing/colorway.ts`
- [x] HYBRID_DESIGN_STUDIO → `app/(main)/color-correction/page.tsx`
- [x] HYBRID_DESIGN_FILTER_TAB → `components/studio/FilterTab.tsx`
- [x] HYBRID_DESIGN_TRANSFER_TAB → `components/studio/ColorTransferTab.tsx`
- [x] HYBRID_DESIGN_BG_REMOVE_TAB → `components/studio/BackgroundRemovalTab.tsx`

### 구현 순서
```
1. lib/imageProcessing/labConversion.ts     - LAB 색공간 변환
2. lib/imageProcessing/removeBackground.ts  - @imgly/background-removal
3. lib/imageProcessing/colorTransfer.ts     - Reinhard 알고리즘
4. lib/imageProcessing/extractColor.ts      - 색상 추출
5. lib/imageProcessing/applyFilter.ts       - Canvas 필터
6. lib/imageProcessing/segmentAnything.ts   - SlimSAM (Transformers.js)
7. lib/imageProcessing/colorway.ts          - 컬러웨이 생성
8. lib/imageProcessing/presets.ts           - 필터 프리셋
9. lib/imageProcessing/worker.ts            - Web Worker
10. app/(main)/color-correction/page.tsx    - 스튜디오 메인
11. components/studio/*.tsx                 - 탭 컴포넌트들
```

### 필요 의존성
```bash
npm install @imgly/background-removal @xenova/transformers
```

### 완료일: 2026-01-21

---

## Phase 6: API Routes Integration ✅

> lib/ 함수는 모두 구현됨. API 라우트 연결 완료.

### Contracts (7개)
- [x] API_ROUTE_WORKFLOW_INDUSTRIES → `app/api/workflows/industries/route.ts`
- [x] API_ROUTE_WORKFLOW_SESSION → `app/api/workflows/session/route.ts`
- [x] API_ROUTE_USER_BUSINESS_VERIFY → `app/api/user/business/verify/route.ts`
- [x] API_ROUTE_USER_REFERRAL → `app/api/user/referral/apply/route.ts`
- [x] API_ROUTE_PERMISSION_GRANT → `app/api/permissions/grant/route.ts`
- [x] API_ROUTE_PERMISSION_REVOKE → `app/api/permissions/revoke/route.ts`
- [x] API_ROUTE_PERMISSION_LIST → `app/api/permissions/list/route.ts`

### 완료일: 2026-01-21

### 구현 순서
```
1. app/api/workflows/industries/route.ts   - GET: 업종 목록 조회
2. app/api/workflows/session/route.ts      - POST/GET/PUT: 세션 CRUD
3. app/api/user/business/verify/route.ts   - POST: 사업자 인증
4. app/api/user/referral/apply/route.ts    - POST: 추천 코드 적용
5. app/api/permissions/grant/route.ts      - POST: 권한 부여
6. app/api/permissions/revoke/route.ts     - DELETE: 권한 회수
7. app/api/permissions/list/route.ts       - GET: 권한 목록 조회
```

### 연결할 lib 함수
```
lib/workflow/industries.ts     → getAllIndustries(), getIndustryInfo()
lib/workflow/session.ts        → createSession(), getSession(), updateSession()
lib/user/businessVerify.ts     → verifyBusinessNumber(), getBusinessStatus()
lib/user/referral.ts           → applyReferralCode(), getReferralCode()
lib/permissions/grant.ts       → grantPermission()
lib/permissions/revoke.ts      → revokePermission()
lib/permissions/list.ts        → listAccessible(), listResourceUsers()
```

### 예상 작업량
- 각 API 라우트: ~50-100 줄
- 총 예상: ~500 줄

---

## Phase 7: Workflow Guide System ✅

> 유기적 워크플로우 연동 UX - 의도 기반 가이드 시스템

### Contracts (12개)

#### Phase 7a: 의도 체계 (4개)
- [x] INTENT_TAXONOMY → `lib/workflow/intents/taxonomy.ts`
- [x] INTENT_MATRIX → `lib/workflow/intents/matrix.ts`
- [x] INTENT_MATCHER → `lib/workflow/intents/matcher.ts`
- [x] API_INTENT_ANALYZE → `app/api/workflows/intent/route.ts`

#### Phase 7b: 추천 시스템 (3개)
- [x] RECOMMEND_SCORING → `lib/workflow/recommend/scoring.ts`
- [x] RECOMMEND_ENGINE → `lib/workflow/recommend/engine.ts`
- [x] RECOMMEND_INDEX → `lib/workflow/recommend/index.ts`

#### Phase 7c: 유연한 가이드 (5개)
- [x] GUIDE_DYNAMIC → `lib/workflow/guide/dynamic.ts`
- [x] GUIDE_BRANCHING → `lib/workflow/guide/branching.ts`
- [x] GUIDE_INDEX → `lib/workflow/guide/index.ts`
- [x] API_GUIDE_STEPS → `app/api/workflows/guide/route.ts`

### 핵심 기능
```
1. 계층형 의도 분류: Layer 1(목적 5개) → Layer 2(표현 35개) → Layer 3(세부 요소)
2. 자동 추천 엔진: 스코어링 5요소, 크로스 인더스트리 추천
3. 동적 가이드: 의도별 단계 자동 구성, 분기/스킵 지원
4. 이미지 첨부: 모든 워크플로우에서 참조 이미지 업로드 가능
```

### 완료일: 2026-01-21

---

## Phase 8: UI Components ✅

> Phase 7에서 구현한 백엔드 로직을 활용하는 프론트엔드 컴포넌트

### Components (5개)
- [x] GuideChat → `components/workflow/GuideChat.tsx` (대화형 가이드 UI)
- [x] RecommendCard → `components/workflow/RecommendCard.tsx` (추천 카드 UI)
- [x] StepFlow → `components/workflow/StepFlow.tsx` (유연한 단계 표시)
- [x] ImageUpload → `components/workflow/ImageUpload.tsx` (참조 이미지 업로드)
- [x] SimilarWorkflows → `components/workflow/SimilarWorkflows.tsx` (크로스 인더스트리 추천)

### 추가 컴포넌트
```
RecommendList        - 추천 리스트 뷰
MiniStepIndicator    - 미니 진행 표시
ImageThumbnailList   - 읽기 전용 썸네일
CrossIndustryList    - 컴팩트 크로스 인더스트리 리스트
IndustryNavigation   - 업종 네비게이션
```

### 완료일: 2026-01-22

---

## Phase 9: Payment System (LemonSqueezy) ✅

> LemonSqueezy 결제 연동 - 크레딧 구매 및 구독 시스템

### Contracts (8개)

#### Phase 9a: LemonSqueezy 연동 (4개)
- [x] PAYMENT_FUNC_WEBHOOK → `lib/payment/webhook.ts::handleWebhook`
  - **Tier**: core
  - **What**: LemonSqueezy 웹훅 수신 및 검증
  - **Evidence**: code: `lib/payment/webhook.ts::handleWebhook`

- [x] PAYMENT_FUNC_CHECKOUT → `lib/payment/checkout.ts::createCheckout`
  - **Tier**: core
  - **What**: 결제 세션 생성 (크레딧 패키지)
  - **Evidence**: code: `lib/payment/checkout.ts::createCheckout`

- [x] PAYMENT_FUNC_SUBSCRIPTION → `lib/payment/subscription.ts::manageSubscription`
  - **Tier**: normal
  - **What**: 구독 관리 (업그레이드/다운그레이드/취소)
  - **Evidence**: code: `lib/payment/subscription.ts::manageSubscription`

- [x] PAYMENT_FUNC_HISTORY → `lib/payment/history.ts::getPaymentHistory`
  - **Tier**: normal
  - **What**: 결제 내역 조회
  - **Evidence**: code: `lib/payment/history.ts::getPaymentHistory`

#### Phase 9b: 결제 UI (4개)
- [x] PAYMENT_DESIGN_PRICING → `app/(main)/pricing/page.tsx::PricingPage`
  - **Tier**: core
  - **What**: 가격 정책 페이지 (크레딧 패키지, 구독 플랜)
  - **Evidence**: ui: `app/(main)/pricing/page.tsx::PricingPage`

- [x] PAYMENT_DESIGN_CHECKOUT → `components/payment/CheckoutModal.tsx::CheckoutModal`
  - **Tier**: core
  - **What**: 결제 모달 (LemonSqueezy 연동)
  - **Evidence**: ui: `components/payment/CheckoutModal.tsx::CheckoutModal`

- [x] PAYMENT_DESIGN_SUCCESS → `app/(main)/payment/success/page.tsx::PaymentSuccessPage`
  - **Tier**: normal
  - **What**: 결제 완료 페이지
  - **Evidence**: ui: `app/(main)/payment/success/page.tsx::PaymentSuccessPage`

- [x] PAYMENT_DESIGN_INSUFFICIENT → `components/payment/InsufficientModal.tsx::InsufficientModal`
  - **Tier**: core
  - **What**: 잔액 부족 모달 (결제 유도)
  - **Evidence**: ui: `components/payment/InsufficientModal.tsx::InsufficientModal`

### 완료일: 2026-01-22

### API Routes
```
app/api/payment/webhook/route.ts     - POST: LemonSqueezy 웹훅
app/api/payment/checkout/route.ts    - POST: 결제 세션 생성
app/api/payment/subscription/route.ts - GET/PUT/DELETE: 구독 관리
app/api/payment/history/route.ts     - GET: 결제 내역
```

### 필요 환경변수
```env
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_WEBHOOK_SECRET=
```

### 필요 의존성
```bash
npm install @lemonsqueezy/lemonsqueezy.js
```

---

## Phase 10: Page Integration ✅

> Phase 8 컴포넌트를 실제 페이지에 통합

### Contracts (6개)

#### Phase 10a: 워크플로우 페이지 통합 (3개)
- [x] INTEGRATION_DESIGN_WORKFLOW_HOME → `app/(main)/page.tsx::HomePage`
  - **Tier**: core
  - **What**: 홈페이지에 GuideChat, RecommendCard 통합
  - **Evidence**: ui: `app/(main)/page.tsx::HomePage`

- [x] INTEGRATION_DESIGN_WORKFLOW_WIZARD → `app/(main)/workflow/[industry]/[action]/page.tsx::WizardPage`
  - **Tier**: core
  - **What**: 워크플로우 마법사에 StepFlow, ImageUpload 통합
  - **Evidence**: ui: `app/(main)/workflow/[industry]/[action]/page.tsx::WizardPage`

- [x] INTEGRATION_DESIGN_WORKFLOW_RESULT → `app/(main)/result/page.tsx::ResultPage`
  - **Tier**: normal
  - **What**: 결과 페이지에 SimilarWorkflows 통합
  - **Evidence**: ui: `app/(main)/result/page.tsx::ResultPage`

#### Phase 10b: 네비게이션 및 상태 연동 (3개)
- [x] INTEGRATION_FUNC_WORKFLOW_STATE → `lib/workflow/store.ts::useWorkflowStore`
  - **Tier**: core
  - **What**: 워크플로우 상태 관리 (Zustand)
  - **Evidence**: code: `lib/workflow/store.ts::useWorkflowStore`

- [x] INTEGRATION_FUNC_GUIDE_CONTEXT → `lib/workflow/context.tsx::GuideProvider`
  - **Tier**: normal
  - **What**: 가이드 컨텍스트 프로바이더
  - **Evidence**: code: `lib/workflow/context.tsx::GuideProvider`

- [x] INTEGRATION_DESIGN_MOBILE_NAV → `components/layout/MobileNav.tsx::MobileNav`
  - **Tier**: normal
  - **What**: 모바일 네비게이션 (워크플로우 진입점)
  - **Evidence**: ui: `components/layout/MobileNav.tsx::MobileNav`

### 필요 의존성
```bash
npm install zustand @radix-ui/react-tabs
```

### 완료일: 2026-01-22

---

## Phase 11: Testing ✅

> 단위 테스트 및 E2E 테스트

### Contracts (6개)

#### Phase 11a: Unit Tests (3개)
- [x] TEST_FUNC_WORKFLOW → `tests/workflow/*.test.ts`
  - **Tier**: core
  - **What**: 워크플로우 로직 단위 테스트
  - **Evidence**: test: `tests/workflow/guide.test.ts::describe("DynamicGuide")`

- [x] TEST_FUNC_CREDITS → `tests/credits/*.test.ts`
  - **Tier**: core
  - **What**: 크레딧 시스템 단위 테스트
  - **Evidence**: test: `tests/credits/balance.test.ts::describe("CreditBalance")`

- [x] TEST_FUNC_PAYMENT → `tests/payment/*.test.ts`
  - **Tier**: core
  - **What**: 결제 시스템 단위 테스트
  - **Evidence**: test: `tests/payment/webhook.test.ts::describe("Webhook")`

#### Phase 11b: E2E Tests (3개)
- [x] TEST_E2E_AUTH_FLOW → `e2e/auth.spec.ts`
  - **Tier**: core
  - **What**: 로그인/로그아웃 플로우
  - **Evidence**: e2e: `e2e/auth.spec.ts::test("login flow")`

- [x] TEST_E2E_WORKFLOW_FLOW → `e2e/workflow.spec.ts`
  - **Tier**: core
  - **What**: 워크플로우 생성 플로우
  - **Evidence**: e2e: `e2e/workflow.spec.ts::test("create workflow")`

- [x] TEST_E2E_PAYMENT_FLOW → `e2e/payment.spec.ts`
  - **Tier**: normal
  - **What**: 결제 플로우 (mock)
  - **Evidence**: e2e: `e2e/payment.spec.ts::test("checkout flow")`

### 필요 의존성
```bash
npm install -D vitest @testing-library/react playwright @playwright/test
```

### 완료일: 2026-01-22

---

## Phase 12: Polish & Optimization ✅

> 성능 최적화, 접근성, 최종 마무리

### Contracts (6개)

#### Phase 12a: 성능 최적화 (3개)
- [x] PERF_FUNC_IMAGE_LAZY → `components/ui/LazyImage.tsx::LazyImage`
  - **Tier**: normal
  - **What**: 이미지 레이지 로딩 최적화
  - **Evidence**: code: `components/ui/LazyImage.tsx::LazyImage`

- [x] PERF_FUNC_BUNDLE_SPLIT → `next.config.ts::bundleSplitConfig`
  - **Tier**: normal
  - **What**: 코드 스플리팅 최적화
  - **Evidence**: code: `next.config.ts::bundleSplitConfig`

- [x] PERF_FUNC_CACHE_STRATEGY → `lib/cache/strategy.ts::cacheStrategy`
  - **Tier**: normal
  - **What**: API 캐싱 전략
  - **Evidence**: code: `lib/cache/strategy.ts::cacheStrategy`

#### Phase 12b: 접근성 (3개)
- [x] A11Y_DESIGN_KEYBOARD_NAV → `components/a11y/KeyboardNav.tsx::KeyboardNav`
  - **Tier**: normal
  - **What**: 키보드 네비게이션 지원
  - **Evidence**: ui: `components/a11y/KeyboardNav.tsx::KeyboardNav`

- [x] A11Y_DESIGN_SCREEN_READER → `components/a11y/ScreenReader.tsx::ScreenReaderAnnounce`
  - **Tier**: normal
  - **What**: 스크린 리더 지원 (ARIA live regions)
  - **Evidence**: ui: `components/a11y/ScreenReader.tsx::ScreenReaderAnnounce`

- [x] A11Y_DESIGN_FOCUS_TRAP → `components/a11y/FocusTrap.tsx::FocusTrap`
  - **Tier**: normal
  - **What**: 모달 포커스 트랩
  - **Evidence**: ui: `components/a11y/FocusTrap.tsx::FocusTrap`

### 완료일: 2026-01-22

---

## 빠른 참조

### 실행 명령어
```bash
npm run dev          # 개발 서버
npm run build        # 빌드
npm run lint         # 린트
npx tsc --noEmit     # 타입 체크
npm run db:generate  # Prisma 생성
npm run db:push      # DB 마이그레이션
```

### 핵심 파일
```
prisma/schema.prisma           - DB 스키마
lib/auth/authOptions.ts        - 인증 설정
lib/permissions/index.ts       - 권한 시스템
lib/credits/index.ts           - 크레딧 시스템
lib/workflow/index.ts          - 워크플로우
```

---

---

## Phase 13: Immersive UX 🔄

> 몰입형 UX 개선 - 풀스크린 오버레이 및 스와이프 인터랙션

### Contracts (10개)

#### Phase A: 스와이프 안내 개선 ✅
- [x] IMMERSIVE_HOOK_ONBOARDING → `components/immersive/hooks/useOnboarding.ts`
- [x] IMMERSIVE_COMP_NAVIGATION → `components/immersive/ImmersiveNavigation.tsx`

#### Phase B: 공통 인프라 구축 ✅
- [x] IMMERSIVE_HOOK_SWIPE → `components/immersive/hooks/useSwipeNavigation.ts`
- [x] IMMERSIVE_HOOK_KEYBOARD → `components/immersive/hooks/useImmersiveKeyboard.ts`
- [x] IMMERSIVE_COMP_CONTAINER → `components/immersive/ImmersiveContainer.tsx`
- [x] IMMERSIVE_COMP_CARD → `components/immersive/ImmersiveCard.tsx`

#### Phase C: 액션 선택 몰입형 전환 ✅
- [x] IMMERSIVE_DESIGN_ACTION_SELECT → `components/workflow/ImmersiveActionSelect.tsx`
- [x] IMMERSIVE_DESIGN_RECOMMEND → `components/workflow/ImmersiveRecommend.tsx`

#### Phase D: 입력 폼 몰입형 전환 ✅
- [x] IMMERSIVE_DESIGN_INPUT_FORM → `components/workflow/ImmersiveInputForm.tsx`

#### Phase E: 결과 화면 몰입형 ✅
- [x] IMMERSIVE_DESIGN_RESULT → `components/workflow/ImmersiveResult.tsx`

#### Phase F: 상태 관리 확장 ✅
- [x] Zustand 스토어 확장 → `lib/workflow/store.ts` (ImmersiveStep, 몰입 모드 상태/액션)

### 생성된 파일
```
components/immersive/
├── hooks/
│   ├── useOnboarding.ts         # 온보딩 상태 관리
│   ├── useSwipeNavigation.ts    # 스와이프 네비게이션
│   └── useImmersiveKeyboard.ts  # 키보드 네비게이션
├── ImmersiveContainer.tsx       # 풀스크린 오버레이 래퍼
├── ImmersiveCard.tsx            # 재사용 대형 카드
├── ImmersiveNavigation.tsx      # 네비게이션 (버튼+도트+힌트)
└── index.ts                     # 배럴 내보내기

components/workflow/
├── ImmersiveRecommend.tsx       # 몰입형 검색 추천
├── ImmersiveActionSelect.tsx    # 몰입형 액션 선택
├── ImmersiveInputForm.tsx       # 몰입형 입력 폼 (Phase D)
└── ImmersiveResult.tsx          # 몰입형 결과 화면 (Phase E)
```

### 완료일: 2026-01-22 (Phase A-F 전체 완료)

### 모든 Phase 완료 🎉
- 모든 Immersive UX Phase가 성공적으로 구현되었습니다.

---

## 전체 Phase 요약

| Phase | 내용 | Contracts | 상태 |
|-------|------|-----------|------|
| Phase 1 | Auth + Permission | 14 | ✅ 완료 |
| Phase 2 | User & Credit Core | 10 | ✅ 완료 |
| Phase 3 | Workflow System | 7 | ✅ 완료 |
| Phase 4 | Image Generation | 10 | ✅ 완료 |
| Phase 5 | Hybrid Processing | 10 | ✅ 완료 |
| Phase 6 | API Routes Integration | 7 | ✅ 완료 |
| Phase 7 | Workflow Guide System | 12 | ✅ 완료 |
| Phase 8 | UI Components | 5 | ✅ 완료 |
| Phase 9 | Payment (LemonSqueezy) | 8 | ✅ 완료 |
| Phase 10 | Page Integration | 6 | ✅ 완료 |
| Phase 11 | Testing | 6 | ✅ 완료 |
| Phase 12 | Polish & Optimization | 6 | ✅ 완료 |
| Phase 13 | Immersive UX | 10 | ✅ 완료 |
| **Phase 14** | **Performance (Vercel BP)** | **0/11** | 🔄 대기 |

**총 Contracts**: 122개 (완료 111, 대기 11)

---

> **마지막 업데이트**: 2026-01-26 Vercel Best Practices 리뷰 추가

---

## UI Style Migration (2026-01-23~)

> Zinc 팔레트, 다크모드, Glassmorphism 헤더, 모바일 최적화

### Phase 진행 현황

| Phase | 내용 | 상태 | 핸드오프 |
|-------|------|------|----------|
| Phase 1 | Foundation (CSS 변수, ThemeProvider) | ✅ 완료 | HANDOFF_2026-01-23_UI_MIGRATION_P1.md |
| Phase 2 | Layout (Header, 레이아웃 다크모드) | ✅ 완료 | HANDOFF_2026-01-23_UI_MIGRATION_P2.md |
| Phase 3 | Components (주요 페이지 다크모드) | ✅ 완료 | HANDOFF_2026-01-23_UI_MIGRATION_P3.md |
| Phase 4 | Mobile (터치 타겟, safe-area) | ✅ 완료 | HANDOFF_2026-01-23_UI_MIGRATION_P4.md |
| Phase 5 | Polish (검증, 다크모드 완성) | ✅ 완료 | HANDOFF_2026-01-23_UI_MIGRATION_P5.md |

### Phase 1: Foundation ✅

- [x] next-themes 패키지 설치
- [x] globals.css - Zinc 팔레트 CSS 변수 추가
- [x] globals.css - @layer components (btn, card, input, chip, glass)
- [x] tailwind.config.ts - 애니메이션 추가
- [x] ThemeProvider.tsx - next-themes 기반 Provider
- [x] Providers.tsx - ThemeProvider 통합
- [x] theme-toggle.tsx - 다크모드 토글 버튼
- [x] layout.tsx - suppressHydrationWarning 추가

### Phase 2: Layout ✅

- [x] Header.tsx - Glassmorphism + ThemeToggle
- [x] (main)/layout.tsx - 다크모드 대응
- [x] (auth)/layout.tsx - 다크모드 대응 (변경 불필요)
- [x] (auth)/login/page.tsx - 다크모드 대응

### Phase 3: Components ✅

**Part 1 완료 (4/11):**
- [x] (main)/page.tsx - 홈페이지
- [x] (main)/settings/page.tsx
- [x] RecommendCard.tsx
- [x] CreditBadge.tsx

**Part 2 완료 (7/11):**
- [x] (main)/result/page.tsx - 결과 페이지 (변경 불필요 - shadcn 토큰 사용)
- [x] (main)/gallery/page.tsx - 갤러리 (변경 불필요 - shadcn 토큰 사용)
- [x] (main)/pricing/page.tsx (변경 불필요 - shadcn 토큰 사용)
- [x] ImmersiveInputForm.tsx - 다크모드 대응
- [x] ImmersiveRecommend.tsx (변경 불필요 - gray-* 없음)
- [x] StepFlow.tsx - 다크모드 대응
- [x] GuideChat.tsx - 다크모드 대응

### Phase 4: Mobile ✅

- [x] Header 터치 타겟 최적화
- [x] MobileNav 다크모드 + 터치 타겟
- [x] ThemeToggle 터치 타겟 강화
- [x] globals.css 터치 피드백 스타일 강화
- [x] Safe-area 유틸리티 적용 (layout)

### Phase 5: Polish ✅

- [x] 빌드 검증
- [x] 다크모드 미적용 파일 검색 (gray-*)
- [x] 12개 파일 다크모드 수정 완료
- [x] 품질 체크 통과

---

## Phase 14: Performance Optimization (Vercel Best Practices) 🔄

> Vercel React Best Practices 기반 성능 최적화 - 코드베이스 리뷰 결과

### 진행 상태

| 우선순위 | 카테고리 | 이슈 수 | 상태 |
|----------|----------|---------|------|
| 🔴 1 | 번들 최적화 (Barrel + Dynamic) | 3 | ✅ 완료 |
| 🟡 2 | SWR/React Query 도입 | 2 | ✅ 완료 (1 스킵) |
| 🟡 3 | Server Component 전환 | 1 | ✅ 완료 |
| 🟢 4 | Re-render 최적화 | 3 | ⬜ 대기 |
| 🟢 5 | 추가 최적화 | 2 | ⬜ 대기 |

### Contracts (11개)

#### Phase 14a: 번들 최적화 (CRITICAL) ✅

- [x] PERF_BUNDLE_BARREL_IMPORTS → `lib/imageProvider/index.ts` 외 10개
  - **Rule**: `bundle-barrel-imports`
  - **What**: Barrel file 직접 import로 변경 (트리쉐이킹 개선)
  - **Files**:
    - `app/api/generate/route.ts` → `@/lib/imageProvider/generate`, `@/lib/imageProvider/types`
    - `app/api/upscale/route.ts` → `@/lib/imageProvider/upscale`, `@/lib/imageProvider/types`
    - `app/api/payment/*.ts` → `@/lib/payment/checkout`, `subscription`, `history`, `webhook`
    - `app/api/images/*.ts` → `@/lib/images/list`, `@/lib/images/delete`
    - `lib/workflow/session.ts` → `@/lib/permissions/grant`
  - **Completed**: 2026-01-26

- [x] PERF_BUNDLE_DYNAMIC_MODAL → `components/workflow/Immersive*.tsx`
  - **Rule**: `bundle-dynamic-imports`
  - **What**: Modal/Dialog 컴포넌트에 next/dynamic 적용
  - **Files**:
    - `app/(main)/page.tsx` → ImmersiveInputForm
    - `app/(main)/result/page.tsx` → ImmersiveResult
    - `app/(main)/workflow/[industry]/page.tsx` → ImmersiveActionSelect
  - **Completed**: 2026-01-26

- [x] PERF_BUNDLE_DYNAMIC_STUDIO → `components/studio/*.tsx`
  - **Rule**: `bundle-dynamic-imports`
  - **What**: Studio 탭 컴포넌트에 next/dynamic 적용
  - **Files**:
    - `app/(main)/color-correction/page.tsx` → FilterTab, ColorTransferTab, BackgroundRemovalTab
  - **Completed**: 2026-01-26

#### Phase 14b: 데이터 페칭 최적화 (HIGH) ✅

- [x] PERF_CLIENT_SWR_GALLERY → `app/(main)/gallery/page.tsx`
  - **Rule**: `client-swr-dedup`
  - **What**: SWR 도입으로 캐싱/중복요청 방지
  - **Current**: useCallback + useEffect + fetch
  - **Expected**: 자동 캐싱, 요청 중복 제거, revalidation
  - **Completed**: 2026-01-26

- [~] PERF_CLIENT_SWR_RESULT → `app/(main)/result/page.tsx` (스킵)
  - **Rule**: `client-swr-dedup`
  - **What**: 결과 페이지 데이터 페칭 SWR 전환
  - **Status**: 아키텍처 부적합으로 스킵 (API 호출 없음, sessionStorage 기반)
  - **Alternative**: Phase 14d Re-render 최적화로 대체

#### Phase 14c: Server Component 전환 (HIGH) ✅

- [x] PERF_SERVER_GALLERY → `app/(main)/gallery/page.tsx`
  - **Rule**: `server-parallel-fetching`
  - **What**: 초기 데이터 서버에서 prefetch
  - **Pattern**: Server Component → Client Component (with initialData)
  - **Expected**: TTFB 30-50% 개선
  - **Completed**: 2026-01-26

#### Phase 14d: Re-render 최적화 (MEDIUM) ✅

- [x] PERF_RERENDER_HOME_LAZY_STATE → `app/(main)/page.tsx`
  - **Rule**: `rerender-lazy-state-init`
  - **What**: popularRecommendations 초기화 최적화
  - **Before**: useEffect로 계산 후 setState
  - **After**: useState(() => ...) lazy init 패턴
  - **Completed**: 2026-01-26

- [x] PERF_RERENDER_RESULT_DEFER_READS → `app/(main)/result/page.tsx`
  - **Rule**: `rerender-defer-reads`
  - **What**: callback 전용 store action 구독 제거
  - **Before**: 개별 selector로 action 구독
  - **After**: useWorkflowStore.getState() 사용
  - **Completed**: 2026-01-26

- [x] PERF_RERENDER_GALLERY_FUNCTIONAL → `components/gallery/GalleryClient.tsx`
  - **Rule**: `rerender-functional-setstate`
  - **What**: setImages에 함수형 업데이트 적용
  - **Status**: SWR 마이그레이션(Phase 14b/c)으로 이미 해결 (setImages 제거됨)
  - **Completed**: 2026-01-26

#### Phase 14e: 추가 최적화 (LOW) ✅

- [x] PERF_ADVANCED_MEMO_COMPONENTS → 대규모 리스트 컴포넌트
  - **Rule**: `rerender-memo`
  - **What**: React.memo 적용
  - **Files**:
    - `RecommendCard.tsx` - ScoreBadge, RecommendCard에 memo 적용
    - `GalleryClient.tsx` - GalleryImageCard 컴포넌트 추출 및 memo 적용
  - **Completed**: 2026-01-26

- [x] PERF_RENDERING_HOIST_JSX → 정적 JSX 추출
  - **Rule**: `rendering-hoist-jsx`
  - **What**: 컴포넌트 외부로 정적 JSX 추출
  - **Files**:
    - `RecommendCard.tsx` - Sparkles, ArrowRight 아이콘 추출
    - `GalleryClient.tsx` - ZoomIn, ImageIcon, MoreVertical, Download, Trash2 아이콘 추출
  - **Completed**: 2026-01-26

### 필요 의존성
```bash
npm install swr
```

### 작업 우선순위
```
1. Phase 14a (번들 최적화) → 영향도 가장 큼
2. Phase 14b (SWR 도입) → UX 개선
3. Phase 14c (Server Component) → 난이도 높음, 나중에
4. Phase 14d (Re-render) → 점진적 적용
5. Phase 14e (추가) → 선택적
```

### 참고 문서
- Vercel React Best Practices: `~/.claude/skills/vercel-react-best-practices/`
- Rules: `rules/bundle-*.md`, `rules/client-*.md`, `rules/rerender-*.md`

---

## Phase 15: 프롬프트 시스템 & 워크플로우 UX 개선 ✅

> Gemini 3 Pro Image 최적화 + 워크플로우 UX 향상

### 진행 상태: 완료

| Phase | 내용 | Contracts | 상태 |
|-------|------|-----------|------|
| Phase 1 | 프롬프트 시스템 개선 | 3/3 | ✅ 완료 |
| Phase 2 | 워크플로우 UX 개선 | 3/3 | ✅ 완료 |

### Phase 1: 프롬프트 시스템 개선 ✅

- [x] Contract 1.1: promptBuilder.ts 생성
  - 6-컴포넌트 구조 (Subject, Action, Environment, Art Style, Lighting, Details)
  - 텍스트 렌더링 방지 접미사 (`NO_TEXT_SUFFIX`)
  - 참조 이미지 지시문 생성 함수
  - **파일**: `lib/imageProvider/promptBuilder.ts`

- [x] Contract 1.2: buildPrompt 함수 개선
  - 6-컴포넌트 구조 적용
  - 텍스트 방지 접미사 자동 추가
  - **파일**: `lib/imageProvider/googleGenAI.ts`

- [x] Contract 1.3: promptTemplate 자연어화
  - 키워드 나열 → 자연어 문장 변환
  - **파일**: `lib/workflow/actions/{fashion,food,beauty,index}.ts`

### Phase 2: 워크플로우 UX 개선 ✅

- [x] Contract 2.1: store.ts에 상태/액션 추가
  - `initialQuery`: 검색 쿼리 저장
  - `imageCount`: 이미지 장수 (1-4)
  - **파일**: `lib/workflow/store.ts`

- [x] Contract 2.2: page.tsx에서 쿼리 전달
  - `setInitialQuery` 호출 추가
  - **파일**: `app/(main)/page.tsx`

- [x] Contract 2.3: ImmersiveInputForm 수정
  - 검색 쿼리 자동 입력
  - 이미지 장수 선택 UI
  - **파일**: `components/workflow/ImmersiveInputForm.tsx`

### 핸드오프
- **완료일**: 2026-01-27
- **핸드오프**: `HANDOFF_2026-01-27_PROMPT_UX.md`

---

## Phase 16: 버그 수정 & UX 개선 ✅

> 보고된 버그 수정 및 불필요한 UI 요소 제거

### 진행 상태: 완료

| Phase | 내용 | Contracts | 상태 |
|-------|------|-----------|------|
| Phase 1 | 버그 수정 | 3/3 | ✅ 완료 |
| Phase 2 | UX 개선 (UI 요소 제거) | 2/2 | ✅ 완료 |

### Phase 1: 버그 수정 ✅

#### Contract 16.1.1: 상품 설명 자동 입력 수정 ✅
- **문제**: 검색 쿼리가 상품 설명 필드에 자동 입력되지 않음
- **원인**: `useEffect`에서 `action` 의존성으로 인해 추천 변경 시 inputs 리셋
- **해결**: useEffect를 두 개로 분리 - 모달 초기화와 자동 입력 분리
- **파일**: `components/workflow/ImmersiveInputForm.tsx`

#### Contract 16.1.2: 이미지 장수 선택 확인 ✅
- **상태**: UI 및 로직 정상 작동 확인
- **파일**: `components/workflow/ImmersiveInputForm.tsx`

#### Contract 16.1.3: 전자제품 참조 이미지 반영 ✅
- **문제**: API 라우트에서 참조 이미지를 전달하지 않음
- **해결**:
  - `app/api/generate/route.ts`에 `refImages` 필드 추가
  - `ImmersiveInputForm.tsx`에서 참조 이미지 URL 전달
- **파일**:
  - `app/api/generate/route.ts`
  - `components/workflow/ImmersiveInputForm.tsx`

### Phase 2: UX 개선 ✅

#### Contract 16.2.1: 홈화면 검색 결과 추천 섹션 제거 ✅
- **해결**: `RecommendList` 렌더링 코드 제거
- **파일**: `app/(main)/page.tsx`

#### Contract 16.2.2: 워크플로우 프롬프트 미리보기 제거 ✅
- **해결**: `PromptPreview` 컴포넌트 및 import 제거
- **파일**: `app/(main)/workflow/[industry]/[action]/page.tsx`

### 핸드오프
- **완료일**: 2026-01-27
- **핸드오프**: `HANDOFF_2026-01-27_BUGFIX_UX.md`

---

## i18n (다국어 지원) Migration

> next-intl 기반 한국어/영어 다국어 지원

### Phase 진행 현황

| Phase | 내용 | 상태 | 핸드오프 |
|-------|------|------|----------|
| Phase 1 | Foundation (next-intl 설정, 미들웨어) | ✅ 완료 | HANDOFF_2026-01-27_I18N_P1.md |
| Phase 2 | Layout (Header, Footer, 네비게이션) | ✅ 완료 | HANDOFF_2026-01-27_I18N_P2.md |
| Phase 3 | 워크플로우 & 결제 시스템 번역 | ✅ 완료 | HANDOFF_2026-01-27_I18N_P3.md |
| Phase 4 | 워크플로우 컴포넌트 번역 | ✅ 완료 | HANDOFF_2026-01-28_I18N_P4.md |
| Phase 5 | 페이지 번역 (홈, 가격, 갤러리, 결과) | ✅ 완료 | HANDOFF_2026-01-28_I18N_P5.md |
| Phase 6 | 데이터 파일 번역 연동 | ✅ 완료 | HANDOFF_2026-01-28_I18N_P6.md |

### Phase 5: 페이지 번역 ✅

#### 번역 적용 파일
- [x] `app/[locale]/(main)/page.tsx` - 홈페이지
- [x] `app/[locale]/(main)/pricing/page.tsx` - 가격 페이지
- [x] `components/gallery/GalleryClient.tsx` - 갤러리 클라이언트
- [x] `app/[locale]/(main)/result/page.tsx` - 결과 페이지

#### 추가된 번역 키
- `pages.home` - 홈페이지 UI 텍스트
- `pages.pricing` - 가격 페이지 UI 텍스트 + FAQ
- `pages.gallery` - 갤러리 페이지 UI 텍스트
- `pages.result` - 결과 페이지 UI 텍스트

#### 완료일: 2026-01-28

### Phase 6: 데이터 파일 번역 연동 ✅

#### 번역 적용 컴포넌트
- [x] `components/workflow/SimilarWorkflows.tsx` - SimilarWorkflows 컴포넌트 번역
- [x] `components/workflow/SimilarWorkflows.tsx` - CrossIndustryList 컴포넌트 번역
- [x] `components/workflow/SimilarWorkflows.tsx` - IndustryNavigation 컴포넌트 번역

#### 추가된 번역 키
- `workflow.similar` 섹션 (ko/en)

#### 아키텍처 결정
데이터 파일(`industries.ts`, `actions/*.ts`, `payment/config.ts`)은 수정하지 않고, **컴포넌트에서 번역 키를 사용하는 방식** 채택. 기존 `nameKo`/`name` 필드는 fallback으로 유지.

#### 완료일: 2026-01-28

### Phase 7: 선택적 추가 작업 ✅

#### 결제 시스템 동적 번역 연동
- [x] `lib/payment/config.ts` - featureKeys 추가 (i18n 번역 키)
- [x] `lib/payment/types.ts` - FeatureKeyItem 타입 추가
- [x] `app/[locale]/(main)/pricing/page.tsx` - 동적 번역 적용

#### 추가된 번역 연동
- 패키지명: `payment.packages.{id}` 키로 동적 번역
- 플랜명: `payment.plans.{id}` 키로 동적 번역
- 기능 목록: `payment.features.{key}` 키로 파라미터 지원 동적 번역

#### 완료일: 2026-01-28

---

## Phase 17: UI/UX 개선 및 연간 구독 ✅

> 홈화면 여백, 워크플로우 연동, 그리드 레이아웃, 연간 구독 옵션

### Phase 17a: 레이아웃 조정 (2 Contracts) ✅
- [x] Contract 17.1.1: 홈화면 여백 개선 → `components/home/HomeClient.tsx`
- [x] Contract 17.1.2: 정보입력 페이지 2-그리드 → `app/[locale]/(main)/workflow/[industry]/[action]/page.tsx`

### Phase 17b: 인터렉티브 워크플로우 연결 (2 Contracts) ✅
- [x] Contract 17.2.1: ImmersiveActionSelect → ImmersiveInputForm 연동
- [x] Contract 17.2.2: Intent 매핑 함수 추가 → `lib/workflow/intents/index.ts`

### Phase 17c: 연간 구독 옵션 (4 Contracts) ✅
- [x] Contract 17.3.1: 연간 플랜 정의 → `lib/payment/config.ts`
- [x] Contract 17.3.2: 월간/연간 토글 UI → `app/[locale]/(main)/pricing/page.tsx`
- [x] Contract 17.3.3: 한국어 번역 → `messages/ko/common.json`
- [x] Contract 17.3.4: 영어 번역 → `messages/en/common.json`

### 완료일: 2026-02-03

---

## Phase 18: Storage & Limits

> 저장공간 제한 및 사용량 추적 시스템

### Phase 18a: Storage Quota (6 Contracts) ✅
- [x] Contract 18.1.1: DB 스키마 → `prisma/schema.prisma` (UserStorageStats 모델)
- [x] Contract 18.1.2: Quota 함수 → `lib/storage/quota.ts` (신규)
- [x] Contract 18.1.3: Storage index → `lib/storage/index.ts`
- [x] Contract 18.1.4: Upload quota 체크 → `lib/storage/uploadImage.ts`
- [x] Contract 18.1.5: Delete usage 감소 → `lib/images/delete.ts`
- [x] Contract 18.1.6: API 에러 핸들링 → `app/api/images/save/route.ts`

### 완료일: 2026-02-03

### 핸드오프: HANDOFF_2026-02-03_P18a.md

---

## Old FlowStudio 기능 포팅

> 5개 이미지 도구 (Edit, Poster, Composite, Detail Edit, Detail Page) 포팅

### Phase 진행 현황

| Phase | 내용 | 상태 | 핸드오프 |
|-------|------|------|----------|
| Phase 0 | 공통 인프라 (API, 컴포넌트, i18n) | ✅ 완료 | HANDOFF_2026-02-24_PORTING_P0.md |
| Phase 1 | EDIT 페이지 (편집) | ✅ 완료 | HANDOFF_2026-02-24_PORTING_P1.md |
| Phase 2 | POSTER 페이지 (포스터) | ✅ 완료 | HANDOFF_2026-02-24_PORTING_P2.md |
| Phase 3 | COMPOSITE 페이지 (합성) | ✅ 완료 | HANDOFF_2026-02-24_PORTING_P3.md |
| Phase 4 | DETAIL_EDIT 페이지 (상세 편집) | ✅ 완료 | HANDOFF_2026-02-24_PORTING_P4.md |
| Phase 5 | DETAIL_PAGE 페이지 (상세 페이지) | ✅ 완료 | HANDOFF_2026-02-24_PORTING_P5.md |
| Phase 6 | 네비게이션 통합 (Header 드롭다운) | ✅ 완료 | HANDOFF_2026-02-24_PORTING_P6.md |

### Phase 0: 공통 인프라 ✅

- [x] API 확장 - `app/api/generate/route.ts`에 sourceImage/maskImage/logoImage/mode 추가
- [x] 공통 컴포넌트 7개 - `components/tools/` (ImageDropzone, GalleryPicker, AspectRatioSelector, PromptInput, GenerationBar, ResultGrid, UpscaleModal)
- [x] 유틸리티 - `lib/tools/` (types, constants, generateClient)
- [x] i18n - `messages/{ko,en}/tools.json` + `i18n/request.ts` 다중 JSON 머지

### 완료일: 2026-02-24
### 핸드오프: HANDOFF_2026-02-24_PORTING_P0.md

### Phase 1: EDIT 페이지 ✅

- [x] `app/[locale]/(main)/edit/page.tsx` - EDIT 페이지 구현
  - 원본 이미지 업로드 (ImageDropzone, required)
  - 참조 이미지 업로드 (ImageDropzone, optional)
  - 비율 선택 (AspectRatioSelector)
  - 프롬프트 입력 + 추천 태그 (PromptInput)
  - 이미지 수 + 생성 (GenerationBar)
  - 결과 그리드 (ResultGrid)
  - API: mode='EDIT', sourceImage + refImages

### 완료일: 2026-02-24
### 핸드오프: HANDOFF_2026-02-24_PORTING_P1.md

### Phase 2: POSTER 페이지 ✅

- [x] `app/[locale]/(main)/poster/page.tsx` - POSTER 페이지 구현
  - 제품 이미지 업로드 (ImageDropzone, required)
  - 로고 이미지 업로드 (ImageDropzone, optional)
  - 카테고리/스타일 선택 (CATEGORIES, getStylesForCategory)
  - 비율 선택 (AspectRatioSelector, 기본 3:4)
  - 프롬프트 입력 + 추천 태그 (PromptInput)
  - 이미지 수 + 생성 (GenerationBar)
  - 결과 그리드 (ResultGrid)
  - API: mode='POSTER', sourceImage + logoImage + style

### 완료일: 2026-02-24
### 핸드오프: HANDOFF_2026-02-24_PORTING_P2.md

### Phase 3: COMPOSITE 페이지 ✅

- [x] `app/[locale]/(main)/composite/page.tsx` - COMPOSITE 페이지 구현
  - 다중 이미지 업로드 (최대 10개, 커스텀 드래그&드롭)
  - 갤러리 다중 선택 (GalleryPicker onMultiSelect)
  - 비율 선택 (AspectRatioSelector)
  - 프롬프트 입력 + 추천 태그 (PromptInput)
  - 이미지 수 + 생성 (GenerationBar)
  - 결과 그리드 (ResultGrid)
  - API: mode='COMPOSITE', refImages (다중)

### 완료일: 2026-02-24
### 핸드오프: HANDOFF_2026-02-24_PORTING_P3.md

### Phase 4: DETAIL_EDIT 페이지 ✅

- [x] `app/[locale]/(main)/detail-edit/page.tsx` - DETAIL_EDIT 페이지 구현
  - 원본 이미지 업로드 (ImageDropzone, required)
  - Canvas 기반 마스크 페인팅 (이중 Canvas, 브러시 도구)
  - 브러시 크기 조절 (5-100px), Undo, 마스크 초기화
  - 마스크 흑백 PNG 내보내기
  - 편집 모드 선택 (AI/텍스트/이미지)
  - 프롬프트 입력 (PromptInput)
  - 결과 그리드 (ResultGrid)
  - API: mode='DETAIL_EDIT', sourceImage + maskImage
- [x] i18n 키 추가 - brushSize, clearMask, paintToSelect, sourceImage

### 완료일: 2026-02-24
### 핸드오프: HANDOFF_2026-02-24_PORTING_P4.md

### Phase 5: DETAIL_PAGE 페이지 ✅

- [x] `app/[locale]/(main)/detail-page/page.tsx` - DETAIL_PAGE 페이지 구현
  - 제품 이미지 업로드 (ImageDropzone, required)
  - 참조 이미지 업로드 (ImageDropzone, optional)
  - 카테고리/스타일 선택 (CATEGORIES, getStylesForCategory)
  - 세그먼트별 프롬프트 + 4장 후보 생성 (9:16 고정)
  - 후보 선택 → 세그먼트 추가
  - 세그먼트 삭제/순서변경/교체
  - 전체 미리보기 (우측 패널)
  - 전체 병합 다운로드 (Canvas API)
  - 세션 히스토리 (메모리 기반)
  - API: mode='DETAIL_PAGE', sourceImage + refImages
- [x] i18n 키 추가 - 14개 detailPage 네임스페이스 키

### 완료일: 2026-02-24
### 핸드오프: HANDOFF_2026-02-24_PORTING_P5.md

### Phase 6: 네비게이션 통합 ✅

- [x] Header 데스크톱 드롭다운 - "도구" 버튼 + 5개 도구 링크 드롭다운
- [x] Header 모바일 햄버거 메뉴 - "도구" 섹션 + 5개 도구 링크
- [x] MobileNav 슬라이드아웃 - "AI 도구" 섹션 (2열 그리드)
- [x] i18n 키 추가 - nav.tools 등 6개 키 (ko/en)

### 완료일: 2026-02-24
### 핸드오프: HANDOFF_2026-02-24_PORTING_P6.md

---

## 도구 몰입형 통합 (Immersive Tool Integration)

> 5개 도구 페이지를 몰입형 워크플로우 UX로 통합

### Phase 진행 현황

| Phase | 내용 | 상태 | 핸드오프 |
|-------|------|------|----------|
| Phase 1 | Store 확장 + 도구 액션 정의 | ✅ 완료 | HANDOFF_2026-02-25_IMMERSIVE_TOOL_P1.md |
| Phase 2 | ImmersiveInputForm 확장 — 새 스텝 타입 렌더링 | ✅ 완료 | HANDOFF_2026-02-25_IMMERSIVE_TOOL_P2.md |
| Phase 3 | Detail Edit 캔버스 마스크 스텝 | ✅ 완료 | HANDOFF_2026-02-25_IMMERSIVE_TOOL_P3.md |
| Phase 4 | Detail Page 세그먼트 루프 스텝 | ✅ 완료 | HANDOFF_2026-02-25_IMMERSIVE_TOOL_P4.md |
| Phase 5 | 진입점 연결 + 기존 페이지 리다이렉트 | ✅ 완료 | HANDOFF_2026-02-25_IMMERSIVE_TOOL_P5.md |
| Phase 6 | 생성 연결 + i18n | ✅ 완료 | HANDOFF_2026-02-25_IMMERSIVE_TOOL_P6.md |

### Phase 1: Store 확장 + 도구 액션 정의 ✅

- [x] Store 확장 - toolMode, toolInputs, toolStepIndex + 6개 액션 (`lib/workflow/store.ts`)
- [x] 도구 스텝 정의 - TOOL_STEP_DEFINITIONS 5개 도구 × 스텝 배열 (`lib/workflow/actions/tools.ts`)

### 완료일: 2026-02-25
### 핸드오프: HANDOFF_2026-02-25_IMMERSIVE_TOOL_P1.md

### Phase 2: ImmersiveInputForm 확장 ✅

- [x] 스텝 컴포넌트 6개 생성 (ImageUpload, AspectRatio, CategoryStyle, MultiImage, Prompt, Confirmation)
- [x] 배럴 내보내기 (`components/workflow/steps/index.ts`)
- [x] ImmersiveInputForm 도구 모드 확장 (ToolStepCard + 도구 렌더링 분기)
- [x] i18n 키 추가 (swipeToNext)

### 완료일: 2026-02-25
### 핸드오프: HANDOFF_2026-02-25_IMMERSIVE_TOOL_P2.md

### Phase 5: 진입점 연결 + 기존 페이지 리다이렉트 ✅

- [x] HomeClient 도구 모드 자동 열기 — `toolMode` 감지 → ImmersiveInputForm 자동 열기
- [x] Header 도구 링크 → `enterToolMode` 버튼으로 변경 (데스크톱 + 모바일)
- [x] MobileNav 도구 링크 → `enterToolMode` 버튼으로 변경
- [x] 기존 5개 도구 페이지 → `ToolRedirect` 컴포넌트로 교체 (홈+몰입형 리다이렉트)

### 완료일: 2026-02-25
### 핸드오프: HANDOFF_2026-02-25_IMMERSIVE_TOOL_P5.md

### Phase 6: 생성 연결 + i18n ✅

- [x] handleToolGenerate 함수 완성 — toolInputs → ToolGenerateRequest 매핑 + generateFromTool API 호출
- [x] ImmersiveResult 연동 — 생성 성공 시 결과 표시, 재생성/닫기 핸들러
- [x] i18n 키 확인 — 기존 키 충분 (추가 불필요)

### 완료일: 2026-02-25
### 핸드오프: HANDOFF_2026-02-25_IMMERSIVE_TOOL_P6.md
