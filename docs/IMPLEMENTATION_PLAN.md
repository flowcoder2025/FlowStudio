# FlowStudio 구현 계획서

> 54개 Contract → 코드 구현 로드맵
> 결제 기능 제외 (CREDIT_FUNC_PURCHASE 등)

---

## 목차

1. [아키텍처 개요](#1-아키텍처-개요)
2. [Phase 1: Foundation (AUTH + PERMISSION)](#phase-1-foundation)
3. [Phase 2: User & Credit Core](#phase-2-user--credit-core)
4. [Phase 3: Workflow System](#phase-3-workflow-system)
5. [Phase 4: Image Generation](#phase-4-image-generation)
6. [Phase 5: Hybrid Processing](#phase-5-hybrid-processing)
7. [디렉토리 구조](#디렉토리-구조)
8. [Prisma 스키마](#prisma-스키마)

---

## 1. 아키텍처 개요

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  app/(auth)/ │ app/(main)/ │ components/ │ hooks/       │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                    API Routes                            │
│  app/api/auth/ │ app/api/generate/ │ app/api/images/    │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   Service Layer                          │
│  lib/auth/ │ lib/credits/ │ lib/permissions/ │ lib/...  │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│              Prisma ORM + Supabase PostgreSQL           │
└─────────────────────────────────────────────────────────┘
```

### 기술 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | Next.js 16 App Router, React 19, TailwindCSS |
| Backend | Next.js API Routes, Server Actions |
| Database | Supabase PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v5 (Google, Kakao OAuth) |
| Storage | Supabase Storage |
| AI Provider | Google GenAI (Gemini 3 Pro) + OpenRouter |

---

## Phase 1: Foundation

> AUTH + PERMISSION 시스템 구축
> **Contracts**: 14개 | **예상 파일**: 15개

### 목표
- 사용자 인증 시스템 (Google, Kakao OAuth)
- ReBAC 기반 권한 시스템

### Contract 목록

| Contract ID | 설명 | 구현 파일 |
|-------------|------|-----------|
| AUTH_FUNC_GOOGLE_OAUTH | Google OAuth 로그인 | `lib/auth/authOptions.ts` |
| AUTH_FUNC_KAKAO_OAUTH | Kakao OAuth 로그인 | `lib/auth/authOptions.ts` |
| AUTH_FUNC_SESSION | 세션 관리 | `lib/auth/authOptions.ts` |
| AUTH_FUNC_CALLBACK | OAuth 콜백 | `app/api/auth/[...nextauth]/route.ts` |
| AUTH_DESIGN_LOGIN_PAGE | 로그인 페이지 | `app/(auth)/login/page.tsx` |
| AUTH_DESIGN_HEADER_STATE | 헤더 인증 상태 | `components/layout/Header.tsx` |
| PERMISSION_FUNC_CHECK | 권한 확인 | `lib/permissions/check.ts` |
| PERMISSION_FUNC_GRANT | 권한 부여 | `lib/permissions/grant.ts` |
| PERMISSION_FUNC_REVOKE | 권한 회수 | `lib/permissions/revoke.ts` |
| PERMISSION_FUNC_LIST | 접근 가능 목록 | `lib/permissions/list.ts` |
| PERMISSION_FUNC_ADMIN | 관리자 권한 | `lib/permissions/admin.ts` |
| PERMISSION_FUNC_MIDDLEWARE | API 미들웨어 | `lib/permissions/middleware.ts` |
| PERMISSION_FUNC_FALLBACK | userId 폴백 | `lib/permissions/fallback.ts` |
| PERMISSION_DESIGN_SHARE | 공유 모달 (v1.1) | `components/share/ShareModal.tsx` |

### 구현 순서

```
1. Prisma 스키마 정의 (User, Account, Session, RelationTuple)
   └── prisma/schema.prisma

2. NextAuth 설정
   ├── lib/auth/authOptions.ts (Google + Kakao providers)
   └── app/api/auth/[...nextauth]/route.ts

3. ReBAC 권한 시스템
   ├── lib/permissions/check.ts
   ├── lib/permissions/grant.ts
   ├── lib/permissions/revoke.ts
   ├── lib/permissions/list.ts
   ├── lib/permissions/admin.ts
   └── lib/permissions/middleware.ts

4. UI 컴포넌트
   ├── app/(auth)/login/page.tsx
   └── components/layout/Header.tsx
```

### 의존성

```
@auth/prisma-adapter
next-auth@5
@prisma/client
```

---

## Phase 2: User & Credit Core

> 사용자 프로필 + 크레딧 시스템 (결제 제외)
> **Contracts**: 10개 | **예상 파일**: 12개

### 목표
- 사용자 프로필 관리
- 크레딧 잔액 조회 및 차감 시스템
- Hold/Capture/Refund 2-phase commit

### Contract 목록

| Contract ID | 설명 | 구현 파일 |
|-------------|------|-----------|
| USER_FUNC_PROFILE | 프로필 조회/수정 | `lib/user/profile.ts` |
| USER_FUNC_BUSINESS_VERIFY | 사업자 인증 | `lib/user/businessVerify.ts` |
| USER_FUNC_REFERRAL | 추천인 시스템 | `lib/user/referral.ts` |
| USER_DESIGN_SETTINGS | 설정 페이지 | `app/(main)/settings/page.tsx` |
| CREDIT_FUNC_BALANCE | 잔액 조회 | `lib/credits/balance.ts` |
| CREDIT_FUNC_HOLD | 크레딧 홀드 | `lib/credits/hold.ts` |
| CREDIT_FUNC_CAPTURE | 크레딧 캡처 | `lib/credits/capture.ts` |
| CREDIT_FUNC_REFUND | 크레딧 환불 | `lib/credits/refund.ts` |
| CREDIT_FUNC_EXPIRY | 만료 처리 | `lib/credits/expiry.ts` |
| CREDIT_DESIGN_HEADER | 잔액 표시 | `components/layout/CreditBadge.tsx` |

### 제외 항목 (결제 관련)

- ~~CREDIT_FUNC_PURCHASE~~ - 결제 처리
- ~~CREDIT_DESIGN_PURCHASE~~ - 결제 페이지
- ~~CREDIT_DESIGN_INSUFFICIENT~~ - 잔액 부족 모달

### 구현 순서

```
1. Prisma 스키마 확장 (Credit, CreditTransaction, CreditLedger)
   └── prisma/schema.prisma

2. 사용자 서비스
   ├── lib/user/profile.ts
   ├── lib/user/businessVerify.ts
   └── lib/user/referral.ts

3. 크레딧 서비스 (Hold/Capture/Refund)
   ├── lib/credits/balance.ts
   ├── lib/credits/hold.ts
   ├── lib/credits/capture.ts
   ├── lib/credits/refund.ts
   └── lib/credits/expiry.ts

4. API 엔드포인트
   ├── app/api/user/profile/route.ts
   └── app/api/credits/balance/route.ts

5. UI 컴포넌트
   ├── app/(main)/settings/page.tsx
   └── components/layout/CreditBadge.tsx
```

### 크레딧 플로우

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  HOLD    │ →  │ CAPTURE  │ →  │ COMPLETE │
│ (예약)   │    │ (확정)   │    │ (완료)   │
└──────────┘    └──────────┘    └──────────┘
      │                              │
      └──────────────────────────────┘
                REFUND (실패 시 환불)
```

---

## Phase 3: Workflow System

> 9개 업종 × 10-12 액션 워크플로우
> **Contracts**: 7개 | **예상 파일**: 20개+

### 목표
- 업종별 액션 정의 시스템
- 의도 분석 AI
- 워크플로우 세션 관리

### Contract 목록

| Contract ID | 설명 | 구현 파일 |
|-------------|------|-----------|
| WORKFLOW_FUNC_INDUSTRIES | 9개 업종 정의 | `lib/workflow/industries.ts` |
| WORKFLOW_FUNC_ACTIONS | 업종별 액션 | `lib/workflow/actions/*.ts` |
| WORKFLOW_FUNC_SESSION | 세션 관리 | `lib/workflow/session.ts` |
| WORKFLOW_FUNC_INTENT | 의도 분석 | `lib/workflow/intentAnalyzer.ts` |
| WORKFLOW_DESIGN_HOME | 홈 (업종 선택) | `app/(main)/page.tsx` |
| WORKFLOW_DESIGN_WIZARD | 단계별 입력 | `app/(main)/workflow/[industry]/[action]/page.tsx` |
| WORKFLOW_DESIGN_PREVIEW | 프롬프트 미리보기 | `components/workflow/PromptPreview.tsx` |

### 업종 목록 (9개)

```typescript
const INDUSTRIES = [
  'fashion',      // 패션/의류
  'food',         // 식품/음료
  'beauty',       // 뷰티/화장품
  'interior',     // 인테리어/가구
  'electronics',  // 전자제품
  'jewelry',      // 주얼리/액세서리
  'sports',       // 스포츠/아웃도어
  'pet',          // 반려동물
  'kids',         // 키즈/유아
] as const;
```

### 구현 순서

```
1. 업종/액션 데이터 구조
   ├── lib/workflow/industries.ts (업종 정의)
   └── lib/workflow/actions/
       ├── fashion.ts (10-12 액션)
       ├── food.ts
       ├── beauty.ts
       ├── interior.ts
       ├── electronics.ts
       ├── jewelry.ts
       ├── sports.ts
       ├── pet.ts
       └── kids.ts

2. 세션 관리
   ├── lib/workflow/session.ts
   └── prisma/schema.prisma (WorkflowSession)

3. 의도 분석
   └── lib/workflow/intentAnalyzer.ts (AI 기반)

4. API 엔드포인트
   ├── app/api/workflows/industries/route.ts
   ├── app/api/workflows/[industry]/actions/route.ts
   ├── app/api/workflows/session/route.ts
   └── app/api/analyze-intent/route.ts

5. UI 페이지
   ├── app/(main)/page.tsx (업종 선택)
   ├── app/(main)/workflow/[industry]/page.tsx (액션 선택)
   ├── app/(main)/workflow/[industry]/[action]/page.tsx (위저드)
   └── components/workflow/PromptPreview.tsx
```

---

## Phase 4: Image Generation

> AI 이미지 생성 + 갤러리
> **Contracts**: 10개 | **예상 파일**: 15개

### 목표
- 다중 프로바이더 AI 이미지 생성
- 4K 업스케일
- 갤러리 관리

### Contract 목록

| Contract ID | 설명 | 구현 파일 |
|-------------|------|-----------|
| IMAGE_FUNC_GENERATE | AI 이미지 생성 | `lib/imageProvider/generate.ts` |
| IMAGE_FUNC_PROVIDER | 프로바이더 선택 | `lib/imageProvider/selectProvider.ts` |
| IMAGE_FUNC_UPSCALE | 4K 업스케일 | `lib/imageProvider/upscale.ts` |
| IMAGE_FUNC_SAVE | 이미지 저장 | `lib/storage/uploadImage.ts` |
| IMAGE_FUNC_LIST | 갤러리 목록 | `lib/images/list.ts` |
| IMAGE_FUNC_DELETE | 이미지 삭제 | `lib/images/delete.ts` |
| IMAGE_DESIGN_RESULT | 결과 화면 | `app/(main)/result/page.tsx` |
| IMAGE_DESIGN_GALLERY | 갤러리 페이지 | `app/(main)/gallery/page.tsx` |
| IMAGE_DESIGN_PROGRESS | 진행률 표시 | `components/generate/ProgressOverlay.tsx` |
| IMAGE_DESIGN_LAZY | 지연 로딩 | `components/ui/LazyImage.tsx` |

### 다중 프로바이더 전략

```
┌─────────────────────────────────────────────┐
│            Provider Selection               │
├─────────────────────────────────────────────┤
│  1. Google GenAI (Primary)                  │
│     - Gemini 3 Pro                          │
│     - Rate: 10 RPM                          │
│                                             │
│  2. OpenRouter (Fallback)                   │
│     - Flux, SDXL                            │
│     - Rate limit 대응                        │
│                                             │
│  3. Hybrid Mode                             │
│     - 배치 크기 기준 자동 선택               │
└─────────────────────────────────────────────┘
```

### 구현 순서

```
1. Prisma 스키마 (ImageProject)
   └── prisma/schema.prisma

2. 이미지 프로바이더
   ├── lib/imageProvider/generate.ts
   ├── lib/imageProvider/selectProvider.ts
   ├── lib/imageProvider/googleGenAI.ts
   ├── lib/imageProvider/openRouter.ts
   └── lib/imageProvider/upscale.ts

3. 스토리지/갤러리
   ├── lib/storage/uploadImage.ts
   ├── lib/images/list.ts
   └── lib/images/delete.ts

4. API 엔드포인트
   ├── app/api/generate/route.ts
   ├── app/api/upscale/route.ts
   ├── app/api/images/save/route.ts
   ├── app/api/images/list/route.ts
   └── app/api/images/[id]/route.ts

5. UI 페이지
   ├── app/(main)/result/page.tsx
   ├── app/(main)/gallery/page.tsx
   ├── components/generate/ProgressOverlay.tsx
   ├── components/gallery/ImageCard.tsx
   └── components/ui/LazyImage.tsx
```

### 크레딧 연동

```typescript
// 이미지 생성 플로우
const holdId = await holdCredits(userId, 5 * count); // 5크레딧/장
try {
  const images = await generate(prompt, count);
  await captureCredits(holdId);
  return images;
} catch (error) {
  await refundCredits(holdId);
  throw error;
}
```

---

## Phase 5: Hybrid Processing

> 브라우저 기반 무료 이미지 처리
> **Contracts**: 10개 | **예상 파일**: 12개

### 목표
- 클라이언트 사이드 이미지 처리 (무료)
- 배경 제거, 색상 전송, 필터

### Contract 목록

| Contract ID | 설명 | 구현 파일 |
|-------------|------|-----------|
| HYBRID_FUNC_BG_REMOVE | 배경 제거 | `lib/imageProcessing/removeBackground.ts` |
| HYBRID_FUNC_COLOR_TRANSFER | 색상 전송 | `lib/imageProcessing/colorTransfer.ts` |
| HYBRID_FUNC_FILTER | 필터 보정 | `lib/imageProcessing/applyFilter.ts` |
| HYBRID_FUNC_COLOR_EXTRACT | 색상 추출 | `lib/imageProcessing/extractColor.ts` |
| HYBRID_FUNC_SAM | SAM 영역 선택 | `lib/imageProcessing/segmentAnything.ts` |
| HYBRID_FUNC_COLORWAY | 컬러웨이 | `lib/imageProcessing/colorway.ts` |
| HYBRID_DESIGN_STUDIO | 스튜디오 페이지 | `app/(main)/color-correction/page.tsx` |
| HYBRID_DESIGN_FILTER_TAB | 필터 탭 | `components/studio/FilterTab.tsx` |
| HYBRID_DESIGN_TRANSFER_TAB | 색상 전송 탭 | `components/studio/ColorTransferTab.tsx` |
| HYBRID_DESIGN_BG_REMOVE_TAB | 배경 제거 탭 | `components/studio/BackgroundRemovalTab.tsx` |

### 기술 스택 (브라우저)

| 기능 | 라이브러리 | 처리 위치 |
|------|-----------|----------|
| 배경 제거 | @imgly/background-removal | WebGPU |
| SAM 영역 | Transformers.js (SlimSAM) | WebGPU |
| 색상 전송 | Reinhard (LAB) | Canvas 2D |
| 필터 | Canvas filter API | Canvas 2D |

### 구현 순서

```
1. 핵심 처리 함수 (브라우저)
   ├── lib/imageProcessing/removeBackground.ts
   ├── lib/imageProcessing/colorTransfer.ts
   ├── lib/imageProcessing/labConversion.ts
   ├── lib/imageProcessing/applyFilter.ts
   ├── lib/imageProcessing/extractColor.ts
   ├── lib/imageProcessing/segmentAnything.ts
   └── lib/imageProcessing/colorway.ts

2. Web Worker (무거운 연산)
   └── lib/imageProcessing/worker.ts

3. 색상 프리셋
   └── lib/imageProcessing/presets.ts

4. UI 페이지
   ├── app/(main)/color-correction/page.tsx
   ├── components/studio/FilterTab.tsx
   ├── components/studio/ColorTransferTab.tsx
   └── components/studio/BackgroundRemovalTab.tsx
```

---

## 디렉토리 구조

```
flowstudio/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx                    # AUTH_DESIGN_LOGIN_PAGE
│   ├── (main)/
│   │   ├── page.tsx                          # WORKFLOW_DESIGN_HOME
│   │   ├── gallery/page.tsx                  # IMAGE_DESIGN_GALLERY
│   │   ├── settings/page.tsx                 # USER_DESIGN_SETTINGS
│   │   ├── result/page.tsx                   # IMAGE_DESIGN_RESULT
│   │   ├── color-correction/page.tsx         # HYBRID_DESIGN_STUDIO
│   │   └── workflow/
│   │       └── [industry]/
│   │           └── [action]/page.tsx         # WORKFLOW_DESIGN_WIZARD
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts       # AUTH_FUNC_*
│   │   ├── user/profile/route.ts             # USER_FUNC_PROFILE
│   │   ├── credits/balance/route.ts          # CREDIT_FUNC_BALANCE
│   │   ├── generate/route.ts                 # IMAGE_FUNC_GENERATE
│   │   ├── upscale/route.ts                  # IMAGE_FUNC_UPSCALE
│   │   ├── images/
│   │   │   ├── save/route.ts                 # IMAGE_FUNC_SAVE
│   │   │   ├── list/route.ts                 # IMAGE_FUNC_LIST
│   │   │   └── [id]/route.ts                 # IMAGE_FUNC_DELETE
│   │   ├── workflows/
│   │   │   ├── industries/route.ts           # WORKFLOW_FUNC_INDUSTRIES
│   │   │   ├── [industry]/actions/route.ts   # WORKFLOW_FUNC_ACTIONS
│   │   │   └── session/route.ts              # WORKFLOW_FUNC_SESSION
│   │   └── analyze-intent/route.ts           # WORKFLOW_FUNC_INTENT
│   └── layout.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx                        # AUTH_DESIGN_HEADER_STATE
│   │   └── CreditBadge.tsx                   # CREDIT_DESIGN_HEADER
│   ├── workflow/
│   │   └── PromptPreview.tsx                 # WORKFLOW_DESIGN_PREVIEW
│   ├── generate/
│   │   └── ProgressOverlay.tsx               # IMAGE_DESIGN_PROGRESS
│   ├── gallery/
│   │   └── ImageCard.tsx
│   ├── studio/
│   │   ├── FilterTab.tsx                     # HYBRID_DESIGN_FILTER_TAB
│   │   ├── ColorTransferTab.tsx              # HYBRID_DESIGN_TRANSFER_TAB
│   │   └── BackgroundRemovalTab.tsx          # HYBRID_DESIGN_BG_REMOVE_TAB
│   ├── share/
│   │   └── ShareModal.tsx                    # PERMISSION_DESIGN_SHARE
│   └── ui/
│       └── LazyImage.tsx                     # IMAGE_DESIGN_LAZY
├── lib/
│   ├── auth/
│   │   └── authOptions.ts                    # AUTH_FUNC_*
│   ├── user/
│   │   ├── profile.ts                        # USER_FUNC_PROFILE
│   │   ├── businessVerify.ts                 # USER_FUNC_BUSINESS_VERIFY
│   │   └── referral.ts                       # USER_FUNC_REFERRAL
│   ├── credits/
│   │   ├── balance.ts                        # CREDIT_FUNC_BALANCE
│   │   ├── hold.ts                           # CREDIT_FUNC_HOLD
│   │   ├── capture.ts                        # CREDIT_FUNC_CAPTURE
│   │   ├── refund.ts                         # CREDIT_FUNC_REFUND
│   │   └── expiry.ts                         # CREDIT_FUNC_EXPIRY
│   ├── permissions/
│   │   ├── check.ts                          # PERMISSION_FUNC_CHECK
│   │   ├── grant.ts                          # PERMISSION_FUNC_GRANT
│   │   ├── revoke.ts                         # PERMISSION_FUNC_REVOKE
│   │   ├── list.ts                           # PERMISSION_FUNC_LIST
│   │   ├── admin.ts                          # PERMISSION_FUNC_ADMIN
│   │   ├── middleware.ts                     # PERMISSION_FUNC_MIDDLEWARE
│   │   └── fallback.ts                       # PERMISSION_FUNC_FALLBACK
│   ├── workflow/
│   │   ├── industries.ts                     # WORKFLOW_FUNC_INDUSTRIES
│   │   ├── session.ts                        # WORKFLOW_FUNC_SESSION
│   │   ├── intentAnalyzer.ts                 # WORKFLOW_FUNC_INTENT
│   │   └── actions/
│   │       ├── fashion.ts
│   │       ├── food.ts
│   │       ├── beauty.ts
│   │       ├── interior.ts
│   │       ├── electronics.ts
│   │       ├── jewelry.ts
│   │       ├── sports.ts
│   │       ├── pet.ts
│   │       └── kids.ts
│   ├── imageProvider/
│   │   ├── generate.ts                       # IMAGE_FUNC_GENERATE
│   │   ├── selectProvider.ts                 # IMAGE_FUNC_PROVIDER
│   │   ├── googleGenAI.ts
│   │   ├── openRouter.ts
│   │   └── upscale.ts                        # IMAGE_FUNC_UPSCALE
│   ├── storage/
│   │   └── uploadImage.ts                    # IMAGE_FUNC_SAVE
│   ├── images/
│   │   ├── list.ts                           # IMAGE_FUNC_LIST
│   │   └── delete.ts                         # IMAGE_FUNC_DELETE
│   └── imageProcessing/
│       ├── removeBackground.ts               # HYBRID_FUNC_BG_REMOVE
│       ├── colorTransfer.ts                  # HYBRID_FUNC_COLOR_TRANSFER
│       ├── labConversion.ts
│       ├── applyFilter.ts                    # HYBRID_FUNC_FILTER
│       ├── extractColor.ts                   # HYBRID_FUNC_COLOR_EXTRACT
│       ├── segmentAnything.ts                # HYBRID_FUNC_SAM
│       ├── colorway.ts                       # HYBRID_FUNC_COLORWAY
│       ├── worker.ts
│       └── presets.ts
└── prisma/
    └── schema.prisma
```

---

## Prisma 스키마

```prisma
// =====================
// NextAuth Models
// =====================

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// =====================
// User Model
// =====================

model User {
  id               String    @id @default(cuid())
  email            String    @unique
  name             String?
  image            String?
  emailVerified    DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  // Credit
  creditBalance    Int       @default(0)

  // Business
  businessNumber   String?
  businessVerified Boolean   @default(false)

  // Referral
  referralCode     String    @unique @default(cuid())
  referredBy       String?

  // Relations
  accounts         Account[]
  sessions         Session[]
  credits          Credit[]
  transactions     CreditTransaction[]
  imageProjects    ImageProject[]
  workflowSessions WorkflowSession[]
}

// =====================
// Credit Models
// =====================

model Credit {
  id        String    @id @default(cuid())
  userId    String
  amount    Int
  source    String    // "purchase", "bonus", "referral"
  expiresAt DateTime?
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([expiresAt])
}

model CreditTransaction {
  id          String   @id @default(cuid())
  userId      String
  amount      Int
  type        String   // "hold", "capture", "refund", "expire"
  description String?
  holdId      String?  // for capture/refund reference
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([holdId])
}

model CreditLedger {
  id            String   @id @default(cuid())
  userId        String
  creditId      String
  change        Int
  balanceAfter  Int
  reason        String
  createdAt     DateTime @default(now())

  @@index([userId])
  @@index([creditId])
}

// =====================
// Permission Model (ReBAC)
// =====================

model RelationTuple {
  id         String   @id @default(cuid())
  namespace  String   // "image_project", "system"
  objectId   String   // resource ID
  relation   String   // "owner", "editor", "viewer", "admin"
  subjectId  String   // user ID
  createdAt  DateTime @default(now())

  @@unique([namespace, objectId, relation, subjectId])
  @@index([subjectId, namespace, relation])
}

// =====================
// Business Models
// =====================

model WorkflowSession {
  id        String   @id @default(cuid())
  userId    String
  industry  String
  action    String
  inputs    Json
  status    String   @default("draft") // "draft", "generating", "completed"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
}

model ImageProject {
  id          String    @id @default(cuid())
  userId      String
  title       String?
  prompt      String    @db.Text
  imageUrl    String
  thumbnailUrl String?
  metadata    Json?     // generation options
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime? // soft delete

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([deletedAt])
}
```

---

## 검증 방법

각 Phase 완료 후:

```bash
# 드리프트 검증
./scripts/specctl verify --level=soft

# Evidence 연결 확인
./scripts/specctl verify --verbose

# 최종 검증 (strict)
./scripts/specctl verify --level=strict
```

---

## 제외된 Contract (결제 관련)

| Contract ID | 이유 |
|-------------|------|
| CREDIT_FUNC_PURCHASE | 결제 처리 기능 |
| CREDIT_DESIGN_PURCHASE | 결제 페이지 UI |
| CREDIT_DESIGN_INSUFFICIENT | 잔액 부족 모달 |

> 결제 기능은 추후 별도 Phase로 구현 예정

---

## 요약

| Phase | Contracts | 핵심 내용 |
|-------|-----------|----------|
| 1 | 14개 | AUTH + PERMISSION 기반 |
| 2 | 10개 | User + Credit (결제 제외) |
| 3 | 7개 | Workflow 시스템 |
| 4 | 10개 | Image 생성/갤러리 |
| 5 | 10개 | Hybrid 처리 (브라우저) |
| **Total** | **51개** | (결제 3개 제외) |

---

> **생성일**: 2026-01-21
> **기준 문서**: PRD_FlowStudio_v1.0.md, DocOps SPEC 문서 7개
