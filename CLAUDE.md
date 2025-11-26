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

최근 마이그레이션: Vite → Next.js 16 전체 UI 구현 완료 (커밋 7a2f304)

## 기술 스택

- **프레임워크**: Next.js 16.0.4 (App Router, React 19.2.0, React Server Components)
- **데이터베이스**: PostgreSQL via Supabase (Prisma 5.22.0 ORM)
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
- ImageProject의 소프트 삭제 (`deletedAt` 필드 사용)
- Vercel 배포를 위한 Prisma 바이너리 타겟에 `rhel-openssl-3.0.x` 포함

### 권한 시스템 (ReBAC)

`lib/permissions.ts`에 위치하며, 관계 기반 접근 제어(Relationship-Based Access Control)를 구현합니다:

**권한 관계**: owner > editor > viewer (상속 모델)

**주요 함수**:
- `check(userId, namespace, objectId, relation)` - 권한 확인
- `grant(namespace, objectId, relation, subjectType, subjectId)` - 권한 부여
- `revoke()` - 권한 제거
- `listAccessible()` - 사용자가 접근 가능한 리소스 조회
- 미들웨어: `requireAdmin()`, `requireImageProjectOwner()` 등

**시스템 관리자**: `system:global:admin` 권한을 가진 사용자는 모든 리소스에 접근 가능

### API 라우트

**인증** (`/api/auth/[...nextauth]/route.ts`):
- Google OAuth 프로바이더
- 세션 관리를 위한 Prisma 어댑터
- 사용자 가입 시 자동으로 소유자 권한 생성

**이미지 생성** (`/api/generate/route.ts`):
- 사용자의 암호화된 API 키로 Gemini API 프록시
- 4장의 이미지를 병렬 생성 (Promise.all)
- UsageStats와 GenerationHistory에 사용량/비용 추적
- 모델: `gemini-3-pro-image-preview`
- 텍스트 프롬프트, 소스 이미지, 참조 이미지, 종횡비 지원

**프로젝트** (`/api/projects/*`):
- ImageProject CRUD 작업
- ReBAC 시스템을 통한 권한 확인
- 공유 기능 (`/api/projects/[id]/share`)

### 컴포넌트 구조

**주요 컴포넌트**:
- `Header.tsx` - 모드 전환이 포함된 전역 네비게이션
- `AuthProvider.tsx` - NextAuth 세션 래퍼
- `ResultGrid.tsx` - 생성된 이미지 표시
- `LoadingOverlay.tsx` - 생성 진행 상황 UI

**클라이언트 vs 서버 컴포넌트**:
- 페이지는 `'use client'` 지시문 사용 (인터랙티브 기능)
- API 라우트는 서버 사이드 전용
- 인증 유틸리티는 서버 사이드에서 `getServerSession()` 사용

### 환경 변수 설정

필수 `.env.local` 변수:

```bash
# Supabase (데이터베이스)
DATABASE_URL="postgresql://..." # 포트 6543 (연결 풀링)
DIRECT_URL="postgresql://..."    # 포트 5432 (마이그레이션)

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

사용자가 제공한 Gemini API 키는:
1. AES-256-GCM으로 암호화 (lib/utils/encryption.ts)
2. ApiKey.encryptedKey에 저장 (사용자당 1개)
3. API 라우트에서 필요 시 복호화
4. 로그 기록이나 클라이언트 노출 절대 금지

## 코드 컨벤션

- **파일 구조**: App Router 구조 (`app/` 디렉토리)
- **TypeScript**: Strict 모드 활성화, 에러 핸들러 외 `any` 사용 금지
- **에러 처리**: API 응답에 사용자 친화적 한글 메시지
- **비동기 패턴**: 가능한 경우 `Promise.all`로 병렬 작업 수행
- **데이터베이스 접근**: 항상 `lib/prisma.ts` 싱글톤 사용, 직접 인스턴스화 금지
- **한글 현지화**: 모든 사용자 대면 텍스트는 한글 (UI, 에러, 주석 적절히 활용)

## 배포 고려사항

- **Vercel 최적화**: Prisma 바이너리 타겟에 `rhel-openssl-3.0.x` 포함
- **데이터베이스 풀링**: 런타임에는 DATABASE_URL 사용 (연결 풀링)
- **환경 변수**: Vercel 대시보드에서 모든 `.env.local` 변수 설정
- **빌드**: `npm run build`로 프로덕션 준비 상태 검증
- **콜드 스타트**: Prisma Client 생성으로 첫 요청 지연 증가 (허용 가능)

## 테스트 전략

현재 테스트 스위트는 구현되지 않음. 향후 고려사항:
- 권한 로직 단위 테스트 (`lib/permissions.ts`)
- API 라우트 통합 테스트
- 주요 사용자 플로우 E2E 테스트 (프로젝트 생성, 이미지 생성)

## 알려진 제약사항

- 이미지 생성에 대한 속도 제한 없음 (사용자가 API 키 비용으로 제어)
- 이미지 저장소 미구현 (데이터베이스에 base64 저장, 프로덕션 스케일링 시 Supabase Storage 고려)
- 실시간 협업 기능 없음
- 구독 모델 정의되었으나 미구현
