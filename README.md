# FlowStudio

> AI 기반 이미지 생성 플랫폼 - 업종별 최적화 워크플로우로 상업용 이미지를 쉽고 빠르게

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.2-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

---

## 개요

FlowStudio는 패션, 푸드, 뷰티 등 다양한 업종의 상업용 이미지를 AI로 생성하는 SaaS 플랫폼입니다. 복잡한 프롬프트 엔지니어링 없이 **의도 기반 워크플로우**를 통해 누구나 전문가 수준의 이미지를 만들 수 있습니다.

### 핵심 가치
- **업종 특화**: 패션, 푸드, 뷰티 등 업종별 최적화된 워크플로우
- **의도 기반 UX**: 자연어 검색으로 원하는 워크플로우 자동 추천
- **하이브리드 처리**: AI 생성 + 전통적 이미지 처리 결합
- **몰입형 인터페이스**: 풀스크린 오버레이, 스와이프 네비게이션

---

## 주요 기능

### 1. AI 이미지 생성
- Google Gemini, OpenRouter 등 멀티 프로바이더 지원
- 업종별 프롬프트 템플릿 자동 적용
- 업스케일 (고해상도 변환)

### 2. 하이브리드 이미지 처리
- 배경 제거 (AI 기반)
- 색상 추출 및 컬러웨이 생성
- 색상 전이 (Reinhard 알고리즘)
- 필터 프리셋 적용

### 3. 워크플로우 시스템
- 업종별 액션 정의 (모델 착용샷, 제품 컷 등)
- 의도 분석 및 워크플로우 자동 추천
- 동적 가이드 (단계별 분기/스킵 지원)

### 4. 크레딧 시스템
- Hold → Capture 패턴 (안전한 결제)
- 유효기간 관리 (FIFO 소진)
- LemonSqueezy 결제 연동

### 5. 몰입형 UX (Immersive)
- 풀스크린 오버레이
- 스와이프/키보드 네비게이션
- 온보딩 힌트 시스템

---

## 기술 스택

| 카테고리 | 기술 |
|---------|------|
| **Frontend** | Next.js 15.1, React 19, TypeScript 5.7 |
| **Styling** | Tailwind CSS 3.4, Radix UI, Framer Motion |
| **State** | Zustand, React Context |
| **Backend** | Next.js API Routes, Prisma ORM |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | NextAuth.js v5 (Google, Kakao OAuth) |
| **Storage** | Supabase Storage |
| **Payment** | LemonSqueezy |
| **AI** | Google Generative AI, OpenRouter |
| **Testing** | Vitest, Playwright, Testing Library |

---

## 시작하기

### 사전 요구사항

- Node.js 20+
- PostgreSQL (또는 Supabase)
- Google AI API Key
- LemonSqueezy 계정 (결제 기능)

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-org/flowstudio.git
cd flowstudio

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일 편집
```

### 환경 변수

```env
# Database
DATABASE_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
KAKAO_CLIENT_ID="..."
KAKAO_CLIENT_SECRET="..."

# AI Providers
GOOGLE_AI_API_KEY="..."
OPENROUTER_API_KEY="..."

# Payment (LemonSqueezy)
LEMONSQUEEZY_API_KEY="..."
LEMONSQUEEZY_STORE_ID="..."
LEMONSQUEEZY_WEBHOOK_SECRET="..."
```

### 데이터베이스 설정

```bash
# Prisma 클라이언트 생성
npm run db:generate

# 마이그레이션 실행
npm run db:push

# (선택) Prisma Studio 실행
npm run db:studio
```

### 개발 서버 실행

```bash
npm run dev
# http://localhost:3000 에서 확인
```

---

## 프로젝트 구조

```
flowstudio/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 관련 페이지
│   ├── (main)/            # 메인 앱 페이지
│   └── api/               # API 라우트
├── components/            # React 컴포넌트
│   ├── a11y/             # 접근성 컴포넌트
│   ├── generate/         # 이미지 생성 UI
│   ├── immersive/        # 몰입형 UX 컴포넌트
│   ├── layout/           # 레이아웃 컴포넌트
│   ├── payment/          # 결제 UI
│   ├── share/            # 공유 기능
│   ├── studio/           # 이미지 편집 스튜디오
│   ├── ui/               # 공통 UI (shadcn/ui)
│   └── workflow/         # 워크플로우 UI
├── lib/                   # 비즈니스 로직
│   ├── auth/             # 인증
│   ├── cache/            # 캐싱 전략
│   ├── credits/          # 크레딧 시스템
│   ├── imageProcessing/  # 이미지 처리
│   ├── imageProvider/    # AI 이미지 생성
│   ├── images/           # 이미지 CRUD
│   ├── payment/          # 결제 시스템
│   ├── permissions/      # 권한 시스템
│   ├── storage/          # 파일 스토리지
│   ├── user/             # 사용자 관리
│   └── workflow/         # 워크플로우 시스템
├── prisma/               # Prisma 스키마
├── tests/                # 단위 테스트
├── e2e/                  # E2E 테스트
└── docs/                 # 문서
```

---

## 스크립트

```bash
# 개발
npm run dev              # 개발 서버 (Turbopack)
npm run build            # 프로덕션 빌드
npm run start            # 프로덕션 서버

# 테스트
npm run test             # 단위 테스트
npm run test:watch       # 테스트 워치 모드
npm run test:coverage    # 커버리지 리포트
npm run test:e2e         # E2E 테스트
npm run test:e2e:ui      # E2E UI 모드

# 데이터베이스
npm run db:generate      # Prisma 클라이언트 생성
npm run db:push          # DB 스키마 푸시
npm run db:migrate       # 마이그레이션
npm run db:studio        # Prisma Studio

# 문서 검증 (DocOps)
npm run flow:verify      # soft 검증
npm run flow:finish      # 빌드 + 검증 + 스냅샷
```

---

## 업종별 워크플로우

### 패션 (Fashion)
| 액션 | 설명 |
|------|------|
| 모델 착용샷 | 의류를 착용한 모델 이미지 생성 |
| 플랫레이 | 평면 배치 제품 이미지 |
| 디테일샷 | 소재/봉제 등 상세 이미지 |
| 룩북 | 스타일링 컬렉션 이미지 |

### 푸드 (Food)
| 액션 | 설명 |
|------|------|
| 메뉴 촬영 | 음식 단품 이미지 |
| 테이블 세팅 | 풀 테이블 구성 |
| 재료 컷 | 신선한 재료 이미지 |

### 뷰티 (Beauty)
| 액션 | 설명 |
|------|------|
| 제품 컷 | 화장품 단품 이미지 |
| 스와치 | 색상/질감 표현 |
| 모델 착용 | 메이크업 적용 모델 |

---

## API 엔드포인트

### 인증
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js 핸들러

### 워크플로우
- `GET /api/workflows/industries` - 업종 목록
- `POST/GET/PUT /api/workflows/session` - 워크플로우 세션 CRUD
- `POST /api/workflows/intent` - 의도 분석
- `GET /api/workflows/guide` - 가이드 스텝 조회

### 이미지
- `POST /api/generate` - 이미지 생성
- `POST /api/upscale` - 업스케일
- `GET /api/images/list` - 갤러리 목록
- `DELETE /api/images/[id]` - 이미지 삭제

### 결제
- `POST /api/payment/checkout` - 결제 세션 생성
- `POST /api/payment/webhook` - LemonSqueezy 웹훅
- `GET/PUT/DELETE /api/payment/subscription` - 구독 관리

---

## 테스트

```bash
# 단위 테스트 실행
npm run test

# 특정 파일만 테스트
npm run test -- tests/workflow/guide.test.ts

# E2E 테스트 실행
npm run test:e2e

# E2E 테스트 (UI 모드)
npm run test:e2e:ui
```

### 테스트 구조
```
tests/
├── workflow/         # 워크플로우 테스트
├── credits/          # 크레딧 시스템 테스트
└── payment/          # 결제 시스템 테스트

e2e/
├── auth.spec.ts      # 인증 플로우
├── workflow.spec.ts  # 워크플로우 플로우
└── payment.spec.ts   # 결제 플로우
```

---

## 문서

| 문서 | 설명 |
|------|------|
| [PRD](./PRD_FlowStudio_v1.0.md) | 제품 요구사항 문서 |
| [DocOps](./docs/00_ssot/ANCHOR.md) | 문서 시스템 진입점 |
| [Task](./claudedocs/TASK_FLOWSTUDIO.md) | 구현 태스크 현황 |

---

## 기여 가이드

1. Fork 후 feature 브랜치 생성
2. 코드 작성 및 테스트
3. `npm run lint && npm run build` 통과 확인
4. Pull Request 생성

### 코드 컨벤션
- TypeScript strict 모드
- ESLint + Prettier
- Conventional Commits

---

## 라이선스

Private - All Rights Reserved

---

## 연락처

- 이슈: [GitHub Issues](https://github.com/your-org/flowstudio/issues)
- 이메일: support@flowstudio.ai
