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
  - API 키 관리: localStorage 의존성 완전 제거 → 서버 측 암호화 저장 (AES-256-GCM)
  - `services/geminiService.ts`: 서버 API 프록시로 전환 (`/api/generate` 호출)
  - 모든 페이지에서 `/api/profile/api-key` 엔드포인트를 통한 API 키 검증
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
  - `/api/generate`: 생성된 이미지를 자동으로 Storage에 업로드 후 URL 반환
  - 데이터베이스 부하 감소 및 쿼리 성능 대폭 향상

## 기술 스택

- **프레임워크**: Next.js 16.0.4 (App Router, React 19.2.0, React Server Components)
- **데이터베이스**: PostgreSQL via Supabase (Prisma 5.22.0 ORM)
- **파일 저장소**: Supabase Storage (@supabase/supabase-js)
- **인증**: NextAuth.js 4.24.13 with Google OAuth
- **스타일링**: Tailwind CSS 4 with @tailwindcss/postcss
- **AI 통합**: Google gemini-3-pro-image-preview API (@google/genai)
- **타입 안정성**: TypeScript 5 (strict mode)

## 개발 명령어

```bash
# 개발 서버 실행 (http://localhost:3000)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 린팅
npm run lint

# 데이터베이스 명령어
npx prisma generate              # Prisma Client 생성
npx prisma migrate dev           # 마이그레이션 생성 및 적용
npx prisma migrate dev --name <name>  # 이름이 지정된 마이그레이션
npx prisma studio                # 데이터베이스 GUI (포트 5555)
npx prisma db push               # 스키마 변경사항 푸시 (개발 환경 전용)
```

## 아키텍처 개요

### 애플리케이션 모드

FlowStudio는 4가지 독립적인 모드로 운영됩니다 (`types/index.ts` 참조):

1. **CREATE**: 프롬프트/참조 이미지로부터 새로운 이미지 생성
2. **EDIT**: 프롬프트 기반으로 기존 이미지 수정
3. **DETAIL_PAGE**: 모바일 최적화 세로형 랜딩 페이지 생성
4. **DETAIL_EDIT**: 상세페이지의 특정 섹션 편집

각 모드는 전용 페이지를 가집니다: `/create`, `/edit`, `/detail-page`, `/detail-edit`

### 데이터베이스 아키텍처

**핵심 모델** (Prisma 스키마: `prisma/schema.prisma`):

- **NextAuth 모델**: User, Account, Session, VerificationToken
- **애플리케이션 모델**: ImageProject, ApiKey, UsageStats, GenerationHistory
- **ReBAC 모델**: RelationTuple, RelationDefinition (Google Zanzibar 스타일 권한 시스템)
- **향후 계획**: Subscription (프리미엄 플랜)

**주요 설계 결정사항**:
- 사용자 API 키는 암호화 저장 (AES-256-GCM) `lib/utils/encryption.ts` 사용
- 비용 추정을 위한 사용량 추적 (이미지당 $0.04)
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
- Google OAuth 프로바이더
- 세션 관리를 위한 Prisma 어댑터
- 사용자 가입 시 자동으로 소유자 권한 생성

**이미지 생성** (`/api/generate/route.ts`):
- **보안**: 사용자의 암호화된 API 키를 서버에서 복호화하여 Gemini API 프록시
- **병렬 생성**: 4장의 이미지를 `Promise.all`로 동시 생성
- **Storage 통합**:
  - Gemini API가 base64로 이미지 생성
  - `lib/utils/imageStorage.ts`로 Supabase Storage에 자동 업로드
  - 클라이언트에 Storage 공개 URL 반환
- **사용량 추적**: UsageStats와 GenerationHistory에 자동 기록 (이미지당 $0.04)
- **모델**: `gemini-3-pro-image-preview` (Google Gemini API)
- **기능 지원**:
  - 텍스트 프롬프트 기반 생성
  - 소스 이미지 (EDIT, DETAIL_EDIT 모드)
  - 참조 이미지 (CREATE 모드)
  - 종횡비 설정 (1:1, 9:16 등)
- **응답 형식**: Supabase Storage 공개 URL 배열 (`https://[project].supabase.co/storage/v1/object/public/...`)

**프로젝트** (`/api/projects/*`):
- ImageProject CRUD 작업
- ReBAC 시스템을 통한 권한 확인
- 공유 기능 (`/api/projects/[id]/share`)

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

필수 `.env.local` 변수:

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

# API 키 암호화
ENCRYPTION_KEY="<생성 명령: node -e 'console.log(require(\"crypto\").randomBytes(32).toString(\"hex\"))'>"
```

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

**리소스 생성 시**:
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

**사용자의 프로젝트 목록 조회**:
```typescript
const accessibleIds = await listAccessible(userId, 'image_project', 'viewer')
const projects = await prisma.imageProject.findMany({
  where: { id: { in: accessibleIds } }
})
```

## API 키 보안

**중요**: localStorage 저장 방식을 완전히 제거하고 서버 측 암호화로 전환됨 (Phase 1)

**보안 흐름**:
1. **클라이언트 입력**: 프로필 페이지에서 API 키 입력
2. **서버 저장**: `/api/profile/api-key` POST로 전송 → `lib/utils/encryption.ts`의 AES-256-GCM으로 암호화
3. **데이터베이스**: `ApiKey.encryptedKey`에 저장 (사용자당 1개 레코드)
4. **사용 시**:
   - 페이지 로드 시 `/api/profile/api-key` GET으로 존재 여부 확인
   - 이미지 생성 시 `/api/generate`에서 자동으로 복호화하여 Gemini API 호출
5. **보안 원칙**:
   - 암호화된 키는 절대 클라이언트로 전송하지 않음
   - 복호화는 서버 사이드에서만 수행 (`ENCRYPTION_KEY` 환경 변수 필요)
   - 로그나 에러 메시지에 키 노출 금지

**API 엔드포인트**:
- `GET /api/profile/api-key` - API 키 존재 여부 확인 (`{exists: boolean}`)
- `POST /api/profile/api-key` - API 키 저장 (암호화)
- `DELETE /api/profile/api-key` - API 키 삭제

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
   - 제어: 사용자의 Gemini API 키 쿼터로 자연스럽게 제한
   - 향후: 구독 플랜별 일일 생성 제한 구현 고려

3. **실시간 협업**:
   - 현재: ReBAC 권한 시스템으로 공유/편집 권한만 지원
   - 향후: WebSocket 기반 실시간 동시 편집 고려

4. **구독 모델**:
   - 현재: Prisma 스키마에 `Subscription` 모델 정의됨 (미사용)
   - 향후: Stripe 연동 및 프리미엄 기능 구현

### 개선 우선순위
1. ~~**High**: 이미지 저장소 마이그레이션 (Supabase Storage)~~ ✅ 완료 (Phase 5)
2. **High**: Supabase Storage 버킷 설정 및 RLS (Row Level Security) 정책
3. **Medium**: 구독 플랜 및 결제 시스템
4. **Medium**: 속도 제한 및 쿼터 관리
5. **Low**: 실시간 협업 기능

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
