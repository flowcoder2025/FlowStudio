# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 필요한 지침을 제공합니다.

## 🇰🇷 한글 소통 규칙

**필수 사항**: 이 프로젝트에서는 모든 대화를 한글로 진행합니다.

- 사용자와의 모든 응답은 한글로 작성
- 코드 설명, 에러 메시지, 제안사항 모두 한글 사용
- 단, 코드 자체(변수명, 함수명, 주석)는 영어 유지
- 기술 용어는 한글-영어 병기 가능 (예: "마이그레이션(migration)")

## 프로젝트 개요

**FlowStudio**는 Next.js 16 (App Router) 기반의 AI 이미지 생성 플랫폼으로, 한국 이커머스 비즈니스를 타겟으로 합니다. Google Gemini의 이미지 생성 API를 활용하여 전문가급 제품 사진과 마케팅 자료를 생성할 수 있습니다.

**최근 주요 개선사항** (2025-01):
- **아키텍처 마이그레이션**: Vite → Next.js 16 전체 UI 구현 완료 (커밋 7a2f304)
- **보안 강화 (Phase 1)**:
  - ~~API 키 관리: localStorage 의존성 완전 제거 → 서버 측 암호화 저장 (AES-256-GCM)~~ (Phase 6에서 Vertex AI로 대체)
  - `services/geminiService.ts`: 서버 API 프록시로 전환 (`/api/generate` 호출)
- **권한 시스템 개선 (Phase 2)**:
  - `lib/permissions.ts`에 `isAdmin()` 헬퍼 함수 추가 (비-throwing 불린 체크)
  - 관리자 권한 체크 로직 재사용성 향상
- **네비게이션 현대화 (Phase 3)**:
  - `hooks/useNavigation.ts`: 타입 안전한 네비게이션 훅 구현
  - `components/Header.tsx`: `onNavigate` prop 제거, 내부적으로 훅 사용
  - 6개 페이지에서 56+ 줄의 중복 `window.location.href` 코드 제거
- **타입 안전성 & 에러 핸들링 (Phase 4)**:
  - `types/api.ts`: 모든 API 응답에 대한 포괄적인 타입 정의
  - `lib/errors.ts`: 커스텀 에러 클래스 계층 (AppError, ValidationError, UnauthorizedError 등)
  - `components/ErrorBoundary.tsx`: React 에러 바운더리로 앱 전체 에러 처리
- **이미지 저장소 개선 (Phase 5)** ✨:
  - Supabase Storage 통합: base64 데이터베이스 저장 → URL 참조 방식으로 전환
  - `lib/supabase.ts`: Supabase Storage 클라이언트 (service role key 사용)
  - `lib/utils/imageStorage.ts`: 이미지 업로드/삭제 유틸리티
  - **주의**: `/api/generate`는 base64만 반환, Storage 저장은 `/api/images/save`에서 처리
  - 데이터베이스 부하 감소 및 쿼리 성능 대폭 향상
- **Vertex AI 전환 (Phase 6)** 🚀:
  - 사용자 개별 API 키 방식 → 중앙화된 GenAI 인증
  - `lib/vertexai.ts`: 듀얼 모드 지원 (Google AI Studio / Vertex AI)
  - `/api/generate`, `/api/upscale`: API 키 로직 제거, 중앙화된 GenAI 클라이언트 사용
  - UX 개선: 사용자는 크레딧만 구매하면 즉시 사용 가능 (API 키 설정 불필요)
  - 중앙화된 비용 관리 및 모니터링, 보안 향상
- **GenAI 듀얼 모드 (Phase 6.1)** 🔄:
  - `GOOGLE_GENAI_USE_VERTEXAI` 환경 변수로 모드 전환
  - `false` (기본값): Google AI Studio 모드 (GOOGLE_API_KEY 필요)
  - `true`: Vertex AI 모드 (GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION 필요)
  - 모든 페이지에서 validateApiKey 함수 제거 (중앙화된 인증 사용)
- **ReBAC 후방 호환성 (Phase 7)** 🔒:
  - `/api/images/list`: 기존 데이터를 위한 userId fallback 로직 추가
  - DetailPageDraft 이미지 갤러리 표시 지원
  - `scripts/migrate-project-permissions.ts`: 기존 프로젝트 권한 일괄 부여 스크립트
  - 모든 프로젝트 생성 경로에서 자동 권한 부여 확인 완료
- **수익화 기능 강화 (Phase 8)** 💰:
  - 갤러리 4K 업스케일 버튼: `/api/images/list`에 `isUpscaled` 필드 추가
  - 만료 예정 크레딧 알림: `CreditBalance` 컴포넌트에 툴팁 UI
  - PortOne V2 정기 구독 결제: `/api/subscription/portone/webhook` 웹훅 추가
  - 워터마크 기능: 임시 비활성화 (`WATERMARK_ENABLED = false`)

## 기술 스택

- **프레임워크**: Next.js 16.0.4 (App Router, React 19.2.0, React Server Components)
- **데이터베이스**: PostgreSQL via Supabase (Prisma 5.22.0 ORM)
- **파일 저장소**: Supabase Storage (@supabase/supabase-js)
- **인증**: NextAuth.js 4.24.13 with Google OAuth + Kakao OAuth
- **스타일링**: Tailwind CSS 4 with @tailwindcss/postcss
- **AI 통합**: Google GenAI 듀얼 모드 - Gemini 3 Pro Image Preview (@google/genai)
- **타입 안정성**: TypeScript 5 (strict mode)

## 개발 명령어

```bash
# 개발 서버 실행 (http://localhost:3000)
npm run dev

# 프로덕션 빌드 (Prisma Client 자동 생성 포함)
npm run build

# 프로덕션 서버 실행
npm start

# 린팅
npm run lint

# 타입 체크
npx tsc --noEmit

# 데이터베이스 명령어
npx prisma generate              # Prisma Client 생성
npx prisma migrate dev           # 마이그레이션 생성 및 적용
npx prisma migrate dev --name <name>  # 이름이 지정된 마이그레이션
npx prisma studio                # 데이터베이스 GUI (포트 5555)
npx prisma db push               # 스키마 변경사항 푸시 (개발 환경 전용)

# 유틸리티 스크립트
npx tsx scripts/migrate-project-permissions.ts  # 기존 프로젝트 권한 마이그레이션
```

## 아키텍처 개요

### 애플리케이션 모드

FlowStudio는 7가지 독립적인 모드로 운영됩니다 (`types/index.ts` AppMode enum):

1. **HOME**: 메인 랜딩 페이지 (`/`)
2. **CREATE**: 프롬프트/참조 이미지로부터 새로운 이미지 생성 (`/create`)
3. **EDIT**: 프롬프트 기반으로 기존 이미지 수정 (`/edit`)
4. **DETAIL_PAGE**: 모바일 최적화 세로형 상세페이지 생성 (`/detail-page`)
5. **DETAIL_EDIT**: 상세페이지의 특정 섹션 편집 (`/detail-edit`)
6. **POSTER**: 포스터 이미지 생성 (`/poster`)
7. **COLOR_CORRECTION**: 비-AI 색상 보정 스튜디오 (`/color-correction`)

**추가 주요 페이지**:
- `/gallery` - 생성된 이미지 갤러리 및 관리
- `/profile` - 사용자 프로필 및 설정
- `/credits/purchase` - 크레딧 구매
- `/subscription` - 구독 플랜 관리
- `/admin` - 관리자 대시보드

### 데이터베이스 아키텍처

**핵심 모델** (Prisma 스키마: `prisma/schema.prisma`):

- **NextAuth 모델**: User, Account, Session, VerificationToken
- **애플리케이션 모델**: ImageProject, ApiKey, UsageStats, GenerationHistory
- **ReBAC 모델**: RelationTuple, RelationDefinition (Google Zanzibar 스타일 권한 시스템)
- **향후 계획**: Subscription (프리미엄 플랜)

**주요 설계 결정사항**:
- ~~사용자 API 키는 암호화 저장 (AES-256-GCM) `lib/utils/encryption.ts` 사용~~ (Phase 6에서 Vertex AI로 전환)
- Vertex AI를 통한 중앙화된 이미지 생성 (Application Default Credentials 사용)
- 크레딧 기반 과금 시스템 (이미지당 API 비용 추적: $0.14)
- **이미지 저장**: Supabase Storage에 업로드 후 URL만 데이터베이스에 저장
- ImageProject의 소프트 삭제 (`deletedAt` 필드 사용)
- Vercel 배포를 위한 Prisma 바이너리 타겟에 `rhel-openssl-3.0.x` 포함

### 권한 시스템 (ReBAC)

`lib/permissions.ts`에 위치하며, 관계 기반 접근 제어(Relationship-Based Access Control)를 구현합니다:

**권한 관계**: owner > editor > viewer (상속 모델)

**주요 함수**:
- `check(userId, namespace, objectId, relation)` - 권한 확인 (불린 반환)
- `isAdmin(userId)` - 시스템 관리자 여부 확인 (불린 반환, throwing 없음)
- `grant(namespace, objectId, relation, subjectType, subjectId)` - 권한 부여
- `revoke()` - 권한 제거
- `listAccessible(userId, namespace, relation)` - 사용자가 접근 가능한 리소스 조회
- **미들웨어** (권한 없으면 에러 throw):
  - `requireAdmin(userId)` - 관리자 권한 필수
  - `requireImageProjectOwner(userId, projectId)` - 프로젝트 소유자 필수
  - `requireImageProjectEditor(userId, projectId)` - 프로젝트 편집자 이상 필수
  - `requireImageProjectViewer(userId, projectId)` - 프로젝트 조회자 이상 필수

**시스템 관리자**: `system:global:admin` 권한을 가진 사용자는 모든 리소스에 접근 가능

**사용 패턴**:
```typescript
// 조건부 로직에서는 isAdmin() 사용
if (await isAdmin(userId)) {
  // 관리자 전용 기능
}

// API 라우트에서는 require* 미들웨어 사용
await requireImageProjectEditor(userId, projectId) // 권한 없으면 에러
```

### API 라우트

**인증** (`/api/auth/[...nextauth]/route.ts`):
- Google OAuth + Kakao OAuth 프로바이더
- 세션 관리를 위한 Prisma 어댑터
- 사용자 가입 시 자동으로 소유자 권한 생성 및 보너스 크레딧 지급

**이미지 생성** (`/api/generate/route.ts`):
- **Vertex AI 통합**: Google Cloud Vertex AI로 중앙화된 인증 (Phase 6)
- **병렬 생성**: 4장의 이미지를 `Promise.all`로 동시 생성
- **응답 형식**: **base64 이미지 배열** (Storage 저장 없음)
  - 사용자가 원하는 이미지만 선택 저장 가능 (`/api/images/save`)
  - Storage 비용 절감 및 사용자 선택권 강화
- **사용량 추적**: UsageStats와 GenerationHistory에 자동 기록 (이미지당 $0.14)
- **크레딧 차감**: 4장 생성 = 20 크레딧 (생성 시점 차감)
- **모델**: `gemini-3-pro-image-preview` (Gemini 3 Pro Image)
- **기능 지원**:
  - 텍스트 프롬프트 기반 생성
  - 소스 이미지 (EDIT, DETAIL_EDIT 모드)
  - 참조 이미지 (CREATE 모드)
  - 종횡비 설정 (1:1, 9:16 등)
- **동시 생성 제한**: 구독 플랜별 제한 (FREE: 1건, PLUS: 3건, PRO: 5건)

**이미지 저장** (`/api/images/save/route.ts`):
- **역할**: 사용자가 선택한 이미지를 Supabase Storage에 업로드 및 프로젝트 생성
- **Storage 업로드**: `lib/utils/imageStorage.ts` 사용
- **권한 부여**: 새 프로젝트 생성 시 자동으로 owner 권한 부여 (`grantImageProjectOwnership`)
- **응답**: Storage 공개 URL로 변환된 이미지 배열

**업스케일링** (`/api/upscale/route.ts`):
- **4K 고해상도**: 2K → 4K 업스케일링 (1장)
- **Storage 저장**: 업스케일된 이미지 자동으로 Supabase Storage에 저장
- **크레딧**: 1회 = 10 크레딧
- **응답**: Storage 공개 URL

**프로젝트** (`/api/projects/*`):
- ImageProject CRUD 작업
- ReBAC 시스템을 통한 권한 확인
- 공유 기능 (`/api/projects/[id]/share`)
- 프로젝트 생성 시 자동으로 owner 권한 부여

**이미지 목록 조회** (`/api/images/list/route.ts`):
- **ReBAC 통합**: `listAccessible()`로 접근 가능한 프로젝트만 조회
- **후방 호환성**: ReBAC 권한이 없는 경우 userId 기반 fallback
- **DetailPageDraft 지원**: DETAIL_PAGE 모드 이미지 포함
- **필터링**: mode, tag, dateFrom/dateTo 파라미터 지원
- **응답**: 개별 이미지 단위 데이터 (UserImage 타입)
- **4K 판별**: `isUpscaled` 필드로 업스케일 여부 확인 (URL에 `/upscaled/` 포함 시 true)

**정기 구독 결제** (`/api/subscription/portone/webhook/route.ts`):
- **PortOne V2 웹훅**: 결제 완료/실패/빌링키 삭제 이벤트 처리
- **서명 검증**: HMAC-SHA256으로 웹훅 무결성 검증
- **구독 활성화**: 결제 성공 시 자동으로 구독 티어 업그레이드
- **유예 기간**: 결제 실패 시 7일 유예 후 다운그레이드

### 컴포넌트 구조

**주요 컴포넌트**:
- `Header.tsx` - 모드 전환이 포함된 전역 네비게이션
  - `useNavigation` 훅을 내부적으로 사용 (더 이상 `onNavigate` prop 불필요)
  - 타입 안전한 라우팅으로 Next.js App Router와 완전 통합
- `AuthProvider.tsx` - NextAuth 세션 래퍼 (클라이언트 전용)
- `ResultGrid.tsx` - 생성된 이미지 그리드 표시
- `LoadingOverlay.tsx` - 생성 진행 상황 오버레이 UI
- `ErrorBoundary.tsx` - React 에러 바운더리 (전역 에러 핸들링)

**훅**:
- `hooks/useNavigation.ts` - 타입 안전한 네비게이션 커스텀 훅
  - `navigateToMode(mode: AppMode)` - 모드별 라우팅
  - `navigateTo(path: string)` - 직접 경로 라우팅
  - `navigateBack()` - 뒤로가기
  - Next.js `useRouter`를 래핑하여 일관된 네비게이션 API 제공

**클라이언트 vs 서버 컴포넌트**:
- **클라이언트**: 모든 페이지, Header, 인터랙티브 UI (`'use client'` 지시문)
- **서버**: API 라우트, 인증 유틸리티 (`getServerSession()` 사용)
- **타입 안전성**: `types/api.ts`로 클라이언트-서버 간 타입 일관성 보장

### 환경 변수 설정

필수 `.env.local` 변수 (`.env.example` 파일 참조):

```bash
# Supabase (데이터베이스)
DATABASE_URL="postgresql://..." # 포트 6543 (연결 풀링)
DIRECT_URL="postgresql://..."    # 포트 5432 (마이그레이션)

# Supabase Storage (이미지 저장)
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<Supabase Dashboard → Project Settings → API → service_role>"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<생성 명령: openssl rand -base64 32>"

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Kakao OAuth
KAKAO_CLIENT_ID="<Kakao Developers → 앱 키 → REST API 키>"
KAKAO_CLIENT_SECRET="<Kakao Developers → 보안 → Client Secret>"
# 콜백 URL: http://localhost:3000/api/auth/callback/kakao (로컬)
#           https://your-domain.com/api/auth/callback/kakao (프로덕션)

# Google GenAI (이미지 생성) - 듀얼 모드 지원
# GOOGLE_GENAI_USE_VERTEXAI: true=Vertex AI, false=Google AI Studio (기본값)
GOOGLE_GENAI_USE_VERTEXAI="false"

# [Google AI Studio 모드] - GOOGLE_GENAI_USE_VERTEXAI="false"
GOOGLE_API_KEY="<https://aistudio.google.com/apikey 에서 생성>"

# [Vertex AI 모드] - GOOGLE_GENAI_USE_VERTEXAI="true" 시 활성화
# GOOGLE_CLOUD_PROJECT="your-google-cloud-project-id"
# GOOGLE_CLOUD_LOCATION="global"
# Vercel 배포 시: GOOGLE_APPLICATION_CREDENTIALS='{"type":"service_account",...}'

# PortOne V2 (결제 시스템)
NEXT_PUBLIC_PORTONE_STORE_ID="..."      # 스토어 ID
NEXT_PUBLIC_PORTONE_CHANNEL_KEY="..."   # 채널 키
PORTONE_WEBHOOK_SECRET="..."            # 웹훅 서명 검증용
PORTONE_API_SECRET="..."                # API 호출용
```

**참고**: Vertex AI 인증은 별도로 `gcloud auth application-default login` 명령을 통해 설정합니다. 자세한 내용은 [Vertex AI 인증](#vertex-ai-인증) 섹션을 참조하세요.

## 데이터베이스 작업 흐름

1. **스키마 변경**: `prisma/schema.prisma` 편집
2. **마이그레이션 생성**: `npx prisma migrate dev --name <설명적인_이름>`
3. **Supabase 적용**: DIRECT_URL을 통해 마이그레이션 자동 적용
4. **클라이언트 재생성**: `npx prisma generate` (설치 후 자동 실행)
5. **검증**: `npx prisma studio`로 데이터 검사

**연결 전략**:
- 런타임 쿼리: DATABASE_URL 사용 (연결 풀링, 포트 6543)
- 마이그레이션: DIRECT_URL 사용 (직접 연결, 포트 5432)
- `lib/prisma.ts`의 싱글톤 패턴으로 인스턴스 누수 방지

## 권한 패턴

**리소스 생성 시** (반드시 권한 부여 필요):
```typescript
const project = await prisma.imageProject.create({...})
await grantImageProjectOwnership(project.id, userId)
```

**리소스 접근 전**:
```typescript
await requireImageProjectViewer(userId, projectId) // 권한 없으면 에러 발생
// 또는 수동으로:
const canEdit = await check(userId, 'image_project', projectId, 'editor')
if (!canEdit) throw new Error('Forbidden')
```

**사용자의 프로젝트 목록 조회** (후방 호환성 포함):
```typescript
// 1. ReBAC 권한으로 조회
let accessibleIds = await listAccessible(userId, 'image_project', 'viewer')

// 2. 기존 데이터 호환성: 권한이 없으면 userId 기반 fallback
if (accessibleIds.length === 0) {
  const userProjects = await prisma.imageProject.findMany({
    where: { userId, deletedAt: null },
    select: { id: true }
  })
  accessibleIds = userProjects.map(p => p.id)
}

// 3. 프로젝트 조회
const projects = await prisma.imageProject.findMany({
  where: { id: { in: accessibleIds } }
})
```

**권한 마이그레이션**:
기존 프로젝트에 권한을 일괄 부여하려면:
```bash
npx tsx scripts/migrate-project-permissions.ts
```

## GenAI 듀얼 모드 인증

**Phase 6**: 사용자 개별 API 키 방식을 중앙화된 GenAI 인증으로 전환

**듀얼 모드 지원** (`lib/vertexai.ts`):
- `GOOGLE_GENAI_USE_VERTEXAI=false` (기본값): Google AI Studio 모드
- `GOOGLE_GENAI_USE_VERTEXAI=true`: Vertex AI 모드

### Google AI Studio 모드 (권장: 개발/테스트)

```bash
# .env.local
GOOGLE_GENAI_USE_VERTEXAI="false"
GOOGLE_API_KEY="your-api-key"  # https://aistudio.google.com/apikey
```

### Vertex AI 모드 (프로덕션)

**로컬 개발**:
```bash
# 1. gcloud CLI 인증
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID

# 2. .env.local
GOOGLE_GENAI_USE_VERTEXAI="true"
GOOGLE_CLOUD_PROJECT="your-project-id"
GOOGLE_CLOUD_LOCATION="global"  # gemini-3-pro-image-preview는 global만 지원
```

**Vercel 배포**:
1. 서비스 계정 생성 (Google Cloud Console → IAM → Service Accounts)
2. 권한: `Vertex AI User`, `AI Platform Developer`
3. JSON 키 생성 후 Vercel 환경 변수에 추가:
   - `GOOGLE_GENAI_USE_VERTEXAI`: `true`
   - `GOOGLE_CLOUD_PROJECT`: 프로젝트 ID
   - `GOOGLE_CLOUD_LOCATION`: `global`
   - `GOOGLE_APPLICATION_CREDENTIALS`: JSON 키 전체 (한 줄로)

### 관련 파일
- `lib/vertexai.ts`: GenAI 듀얼 모드 클라이언트
- `/api/generate/route.ts`: 2K 이미지 생성 (4장)
- `/api/upscale/route.ts`: 4K 업스케일링 (1장)

## 코드 컨벤션

- **파일 구조**: Next.js 16 App Router 구조 (`app/` 디렉토리)
- **TypeScript**: Strict 모드 활성화, 에러 핸들러 외 `any` 사용 금지
- **타입 정의**:
  - API 응답: `types/api.ts` 사용 (`ApiResponse<T>`, `GenerationResponse` 등)
  - 컴포넌트 props: 인라인 또는 별도 interface 정의
- **에러 처리**:
  - 커스텀 에러: `lib/errors.ts`의 에러 클래스 사용 (`ValidationError`, `UnauthorizedError` 등)
  - API 응답: `formatApiError()`, `createErrorResponse()` 유틸리티 사용
  - UI 에러: `ErrorBoundary` 컴포넌트로 감싸기
  - 에러 메시지는 항상 한글 (사용자 친화적)
- **비동기 패턴**: 가능한 경우 `Promise.all`로 병렬 작업 수행 (예: 4장 이미지 생성)
- **데이터베이스 접근**: 항상 `lib/prisma.ts` 싱글톤 사용, 직접 인스턴스화 금지
- **네비게이션**: `hooks/useNavigation.ts` 사용, `window.location.href` 지양
- **권한 체크**:
  - 조건부 로직: `isAdmin()`, `check()` 사용
  - API 보호: `requireAdmin()`, `requireImageProjectEditor()` 등 미들웨어 사용
- **한글 현지화**: 모든 사용자 대면 텍스트는 한글 (UI, 에러, 주석 적절히 활용)

## 배포 고려사항

- **Vercel 최적화**: Prisma 바이너리 타겟에 `rhel-openssl-3.0.x` 포함
- **데이터베이스 풀링**: 런타임에는 DATABASE_URL 사용 (연결 풀링)
- **환경 변수**: Vercel 대시보드에서 모든 `.env.local` 변수 설정
- **빌드**: `npm run build`로 프로덕션 준비 상태 검증
- **콜드 스타트**: Prisma Client 생성으로 첫 요청 지연 증가 (허용 가능)

## 테스트 전략

**현재 상태**: 테스트 스위트 미구현

**향후 우선순위 고려사항**:
1. **단위 테스트**:
   - `lib/permissions.ts` - ReBAC 로직 검증
   - `lib/errors.ts` - 에러 클래스 및 포맷팅
   - `lib/utils/encryption.ts` - 암호화/복호화 정확성
   - `hooks/useNavigation.ts` - 네비게이션 로직
2. **통합 테스트**:
   - `/api/generate` - 이미지 생성 플로우
   - `/api/profile/api-key` - API 키 관리
   - `/api/projects/*` - 프로젝트 CRUD 및 권한
3. **E2E 테스트** (Playwright 권장):
   - 프로젝트 생성 → 이미지 생성 → 결과 저장
   - API 키 설정 → 프로필 업데이트
   - 권한 공유 → 협업 시나리오

## 알려진 제약사항 및 향후 개선 방향

### 현재 제약사항
1. **이미지 저장 방식**: ✅ 해결됨 (Phase 5)
   - ~~이전: 데이터베이스에 base64 인코딩으로 저장~~
   - **현재**: Supabase Storage에 업로드 후 URL만 데이터베이스에 저장
   - 데이터베이스 부하 감소, 쿼리 성능 향상, 확장성 확보

2. **속도 제한**:
   - 현재: 애플리케이션 레벨 속도 제한 없음
   - 제어: Vertex AI 할당량으로 제한 (Phase 6 전환 완료)
   - 향후: 크레딧 기반 일일 생성 제한 구현 고려

3. **실시간 협업**:
   - 현재: ReBAC 권한 시스템으로 공유/편집 권한만 지원
   - 향후: WebSocket 기반 실시간 동시 편집 고려

4. **구독 모델**: ✅ 구현됨 (Phase 8)
   - PortOne V2 정기 결제 연동 완료
   - `/api/subscription/portone/webhook` 웹훅 처리
   - 구독 페이지 UI 및 결제 플로우 구현

### 개선 우선순위
1. ~~**High**: 이미지 저장소 마이그레이션 (Supabase Storage)~~ ✅ 완료 (Phase 5)
2. **High**: Supabase Storage 버킷 설정 및 RLS (Row Level Security) 정책
3. ~~**Medium**: 구독 플랜 및 결제 시스템~~ ✅ 완료 (Phase 8)
4. **Medium**: 속도 제한 및 쿼터 관리
5. **Low**: 실시간 협업 기능
6. **Low**: 워터마크 기능 재활성화 (현재 임시 OFF)

### 추가 작업 필요 (Supabase Storage 설정)
Phase 5 구현이 완료되었으나, Supabase Dashboard에서 수동 설정이 필요합니다:

1. **Storage 버킷 생성**:
   ```sql
   -- Supabase Dashboard → Storage → Create Bucket
   -- Bucket name: flowstudio-images
   -- Public: Yes (공개 URL 접근 허용)
   ```

2. **RLS 정책 설정** (선택, 보안 강화 시):
   ```sql
   -- 사용자는 자신의 이미지만 삭제 가능
   CREATE POLICY "Users can delete own images"
   ON storage.objects FOR DELETE
   USING (bucket_id = 'flowstudio-images' AND auth.uid()::text = (storage.foldername(name))[2]);
   ```

3. **Service Role Key 설정**:
   - `.env.local`에 `SUPABASE_SERVICE_ROLE_KEY` 추가
   - Supabase Dashboard → Project Settings → API → service_role 복사
