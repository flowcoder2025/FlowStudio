# FlowStudio 성능 분석 보고서

**분석 일자**: 2025-12-12
**환경**: Vercel Pro 배포 환경
**분석 목적**: 페이지 로딩, 이미지 로딩, DB 읽기 등의 반응성 저해요인 및 개선요인 분석

---

## 목차
1. [Executive Summary](#executive-summary)
2. [현재 아키텍처 분석](#현재-아키텍처-분석)
3. [성능 저해요인 (Bottlenecks)](#성능-저해요인-bottlenecks)
4. [현재 최적화 현황 (Strengths)](#현재-최적화-현황-strengths)
5. [개선 권장사항](#개선-권장사항)
6. [우선순위별 실행 계획](#우선순위별-실행-계획)
7. [예상 개선 효과](#예상-개선-효과)

---

## Executive Summary

### 핵심 발견사항

| 영역 | 현재 상태 | 심각도 | 예상 개선 효과 |
|------|----------|--------|----------------|
| **페이지 로딩** | 모든 페이지 CSR | 🔴 높음 | TTFB 50-70% 개선 가능 |
| **이미지 로딩** | Supabase CDN 활용 | 🟢 양호 | 10-20% 추가 개선 가능 |
| **DB 쿼리** | 권한 체크 비효율 | 🟡 중간 | 쿼리 수 60-75% 감소 가능 |
| **API 응답** | 캐싱 미적용 | 🟡 중간 | 응답 시간 30-50% 개선 가능 |
| **Serverless 최적화** | 콜드 스타트 영향 | 🟡 중간 | 초기 로딩 200-500ms 개선 |

### 긴급 조치 필요 사항
1. **CreditBalance 컴포넌트**: 매 렌더링마다 2개 API 호출 → 캐싱 필수
2. **ReBAC 권한 체크**: 최대 4회 DB 쿼리 → 1회로 통합 필요
3. **페이지 SSR 전환**: 핵심 페이지 Server Components 활용

---

## 현재 아키텍처 분석

### 기술 스택

```
Frontend: Next.js 16 (App Router) + React 19 + Tailwind CSS 4
Backend:  Next.js API Routes (Serverless Functions)
Database: PostgreSQL (Supabase) + Prisma 5.22.0
Storage:  Supabase Storage (S3 호환 CDN)
AI:       Google GenAI (Gemini 3 Pro Image)
Auth:     NextAuth.js 4.24.13 (JWT Strategy)
Deploy:   Vercel Pro (120초 함수 타임아웃)
```

### 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────────┐
│                         사용자 요청                                  │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Vercel Edge Network (CDN)                                          │
│ - 정적 자산 (JS, CSS, Fonts) ✅ 캐싱됨                              │
│ - 이미지 (next/image) ✅ 최적화됨                                   │
│ - API 응답 ❌ force-dynamic으로 캐싱 안됨                           │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Vercel Serverless Function (각 API Route)                          │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 1. 콜드 스타트 (첫 요청만)                                       │ │
│ │    - Prisma Client 초기화: ~100-200ms                          │ │
│ │    - GenAI Client 초기화: ~50-100ms                            │ │
│ │    - NextAuth 세션 로딩: ~50-100ms                             │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 2. 요청 처리                                                    │ │
│ │    - getServerSession(): ~20-50ms (매 요청)                     │ │
│ │    - DB 쿼리: ~10-50ms (연결 풀링 활용)                         │ │
│ │    - 권한 체크: ~40-160ms (최대 4회 쿼리)                       │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Supabase (PostgreSQL + Storage)                                    │
│ - DB: Connection Pooling (6543) / Direct (5432)                   │
│ - Storage: CDN 배포된 이미지 서빙                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 성능 저해요인 (Bottlenecks)

### 1. 페이지 로딩 성능

#### 1.1 모든 페이지가 클라이언트 컴포넌트 🔴

**문제점**:
```typescript
// app/page.tsx, app/create/page.tsx, app/gallery/page.tsx 등 모든 페이지
'use client'; // ← 모든 페이지에 선언됨

export default function HomePage() { ... }
```

**영향**:
- 서버 사이드 렌더링(SSR) 이점 완전 상실
- 빈 HTML 전송 → JavaScript 다운로드 → 하이드레이션 → 렌더링
- TTFB(Time to First Byte)부터 FCP(First Contentful Paint)까지 지연
- SEO 점수 저하 (검색엔진 크롤러가 빈 페이지 인식)

**측정 예상값**:
| 지표 | 현재 (CSR) | 개선 후 (SSR) |
|------|------------|--------------|
| TTFB | ~100-200ms | ~100-200ms |
| FCP | ~800-1200ms | ~300-500ms |
| LCP | ~1500-2500ms | ~500-800ms |
| TTI | ~2000-3000ms | ~800-1500ms |

#### 1.2 CreditBalance 컴포넌트의 과도한 API 호출 🔴

**문제점**:
```typescript
// components/CreditBalance.tsx:35-44
const fetchData = async () => {
  // 페이지 로드마다 2개 API 병렬 호출
  const [balanceRes, expiringRes] = await Promise.all([
    fetch('/api/credits/balance'),    // ← 매번 DB 조회
    fetch('/api/credits/expiring')    // ← 매번 DB 조회
  ])
}
```

**영향**:
- Header가 모든 페이지에 렌더링됨
- 페이지 이동마다 2개 API 요청 발생
- 각 API에서 최소 1-2회 DB 쿼리
- 네트워크 왕복 + DB 조회 = 100-300ms 추가 지연

#### 1.3 useSession 훅의 클라이언트 측 세션 로딩 🟡

**문제점**:
```typescript
// 모든 페이지에서 사용
const { data: session, status } = useSession();

useEffect(() => {
  if (status === 'unauthenticated') {
    router.push('/login');
  }
}, [status, router]);
```

**영향**:
- 세션 상태 확인까지 `status === 'loading'` 상태 유지
- 로딩 스피너 표시 후 실제 콘텐츠 렌더링
- 인증 상태에 따른 리다이렉트가 클라이언트에서 발생

---

### 2. 이미지 로딩 성능

#### 2.1 base64 이미지 최적화 비활성화 🟡

**문제점**:
```typescript
// app/create/page.tsx:237-242
<Image
  src={uploadedImage}
  ...
  unoptimized={uploadedImage.startsWith('data:')}  // ← 최적화 비활성화
/>
```

**영향**:
- 업로드된 base64 이미지는 Next.js Image 최적화 우회
- WebP 변환, 크기 조정 없이 원본 전송
- 특히 모바일에서 대용량 이미지 로딩 지연

#### 2.2 갤러리 페이지 프리로딩 미적용 🟡

**현재 구현**:
```typescript
// app/gallery/page.tsx - Infinite Scroll
const ITEMS_PER_PAGE = 30;

// IntersectionObserver로 스크롤 시 로드
observerRef.current = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
      fetchImages(false);
    }
  },
  { threshold: 0.1 }
);
```

**개선 필요**:
- 다음 페이지 데이터 프리페칭 없음
- 이미지 프리로딩 없음 (스크롤 시 로딩 시작)
- 사용자가 스크롤할 때마다 로딩 스피너 표시

---

### 3. 데이터베이스 쿼리 성능

#### 3.1 ReBAC 권한 체크 비효율 🔴

**문제점**:
```typescript
// lib/permissions.ts:56-123
export async function check(userId, namespace, objectId, relation): Promise<boolean> {
  // 1단계: 직접 권한 확인 (쿼리 1회)
  const directPermission = await prisma.relationTuple.findFirst({...})
  if (directPermission) return true

  // 2단계: 상속 권한 확인 (쿼리 2회)
  const inheritedPermission = await prisma.relationTuple.findFirst({...})
  if (inheritedPermission) return true

  // 3단계: 시스템 admin 확인 (쿼리 3회)
  const systemAdmin = await prisma.relationTuple.findFirst({...})
  if (systemAdmin) return true

  // 4단계: 와일드카드 확인 (쿼리 4회)
  const wildcardPermission = await prisma.relationTuple.findFirst({...})
  return !!wildcardPermission
}
```

**영향**:
- 권한 체크당 최대 4회 DB 쿼리
- 프로젝트 목록 조회 시: `listAccessible()` 1회 + 각 프로젝트 권한 체크
- 50개 프로젝트 조회 시 최대 200+ 쿼리 가능

**해결 방안**:
```typescript
// 개선: 단일 쿼리로 모든 조건 확인
export async function check(userId, namespace, objectId, relation): Promise<boolean> {
  const inheritedRelations = [relation, ...getInheritedRelations(relation)]

  const permission = await prisma.relationTuple.findFirst({
    where: {
      OR: [
        // 직접 권한 + 상속 권한
        {
          namespace,
          objectId,
          relation: { in: inheritedRelations },
          subjectType: 'user',
          subjectId: userId,
        },
        // 시스템 admin
        {
          namespace: 'system',
          objectId: 'global',
          relation: 'admin',
          subjectType: 'user',
          subjectId: userId,
        },
        // 와일드카드
        {
          namespace,
          objectId,
          relation,
          subjectType: 'user',
          subjectId: '*',
        },
      ],
    },
  })

  return !!permission
}
```

#### 3.2 /api/images/list의 복잡한 쿼리 패턴 🟡

**현재 구현**:
```typescript
// app/api/images/list/route.ts

// 1. ReBAC 권한 조회
let accessibleIds = await listAccessible(userId, 'image_project', 'viewer')

// 2. Fallback: userId 기반 조회 (권한 없는 기존 데이터)
if (accessibleIds.length === 0) {
  const userProjects = await prisma.imageProject.findMany({...})
  accessibleIds = userProjects.map(p => p.id)
}

// 3. 프로젝트 조회
const projects = await prisma.imageProject.findMany({
  where: { id: { in: accessibleIds } }
})

// 4. 전체 개수 조회
const totalProjects = await prisma.imageProject.count({...})

// 5. DetailPageDraft 조회 (DETAIL_PAGE 모드)
const detailPageDrafts = await prisma.detailPageDraft.findMany({...})

// 6. DetailPageDraft 개수 조회
const totalDetailPageDrafts = await prisma.detailPageDraft.count({...})
```

**영향**:
- 단일 API 호출에 최소 4-6회 DB 쿼리
- 응답 시간: 100-300ms (쿼리 복잡도에 따라)

#### 3.3 크레딧 관련 중복 쿼리 🟡

**문제점**:
```typescript
// /api/generate/route.ts

// 1. 크레딧 잔액 확인
const hasEnough = await hasEnoughCredits(userId, CREDIT_PRICES.GENERATION_4)
// → getCreditBalance() 호출 → prisma.credit.findUnique()

// 2. 동시 생성 상태 확인
const concurrencyStatus = await getConcurrencyStatus(userId)
// → 추가 쿼리

// 3. 동시 생성 슬롯 확보
generationRequestId = await acquireGenerationSlot(userId)
// → 추가 쿼리

// ... 이미지 생성 후 ...

// 4. 크레딧 차감
await deductForGeneration(userId, projectId)
// → hasEnoughCredits() 다시 호출! → 중복 쿼리
// → prisma.$transaction() 내에서 추가 쿼리
```

---

### 4. API 라우트 성능

#### 4.1 캐싱 완전 비활성화 🟡

**문제점**:
```typescript
// app/api/generate/route.ts, app/api/upscale/route.ts
export const dynamic = 'force-dynamic' // ← 모든 API에서 캐싱 비활성화
```

**영향**:
- `/api/credits/balance` 같은 자주 변하지 않는 데이터도 매번 DB 조회
- Edge 캐싱 활용 불가
- Vercel의 ISR(Incremental Static Regeneration) 이점 상실

#### 4.2 getServerSession 오버헤드 🟡

**현재 구현**:
```typescript
// 모든 보호된 API Route
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions) // ← 매 요청마다
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ...
}
```

**영향**:
- 매 API 요청마다 세션 검증
- JWT 디코딩 + (필요시) DB 조회
- 약 20-50ms 추가 지연

---

### 5. Serverless 환경 특성

#### 5.1 콜드 스타트 지연 🟡

**영향 요소**:
```
콜드 스타트 총 시간: ~300-600ms
├── Node.js 런타임 초기화: ~50-100ms
├── Prisma Client 생성: ~100-200ms
│   └── 바이너리 로딩 (rhel-openssl-3.0.x)
├── GenAI Client 초기화: ~50-100ms
│   └── Vertex AI 인증 (credentials 파일 생성)
└── 모듈 임포트: ~50-150ms
    └── next-auth, @prisma/client, @google/genai 등
```

**발생 시점**:
- 5분 이상 미사용 후 첫 요청
- 새 배포 직후
- 리전별 첫 요청

#### 5.2 메모리 사용량 🟡

**문제점**:
```typescript
// /api/generate/route.ts
// base64 이미지 4장을 메모리에 동시 보유
const results = await Promise.all([
  generateWithGemini(), // ~2MB base64
  generateWithGemini(), // ~2MB base64
  generateWithGemini(), // ~2MB base64
  generateWithGemini(), // ~2MB base64
])
// → 최대 8-10MB+ 메모리 사용
```

**영향**:
- Vercel 함수 메모리 제한(1024MB 기본)에 영향
- 동시 요청 시 메모리 압박
- GC(Garbage Collection) 오버헤드

---

## 현재 최적화 현황 (Strengths)

### 잘 설계된 부분

#### 1. 싱글톤 패턴 적용 ✅

```typescript
// lib/prisma.ts - Prisma 싱글톤
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()
if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

// lib/vertexai.ts - GenAI 싱글톤
let genAIClient: GoogleGenAI | null = null
export function getGenAIClient(): GoogleGenAI {
  if (genAIClient) return genAIClient
  // 초기화 후 재사용
}
```

**효과**: 개발 환경 인스턴스 누수 방지, 프로덕션 연결 재사용

#### 2. 병렬 처리 활용 ✅

```typescript
// 이미지 4장 병렬 생성
const results = await Promise.all([
  generateWithGemini(),
  generateWithGemini(),
  generateWithGemini(),
  generateWithGemini(),
])

// 크레딧/만료 정보 병렬 조회
const [balanceRes, expiringRes] = await Promise.all([
  fetch('/api/credits/balance'),
  fetch('/api/credits/expiring')
])
```

**효과**: 순차 실행 대비 60-70% 시간 단축

#### 3. 적절한 인덱스 설정 ✅

```prisma
// prisma/schema.prisma
model ImageProject {
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

model RelationTuple {
  @@index([namespace, objectId, relation])
  @@index([subjectType, subjectId])
  @@index([namespace, relation, subjectId])
}

model CreditTransaction {
  @@index([userId, createdAt])
  @@index([type])
  @@index([expiresAt])
}
```

**효과**: 쿼리 성능 최적화, 풀 스캔 방지

#### 4. Supabase Storage CDN 활용 ✅

```typescript
// lib/utils/imageStorage.ts
const { data } = await supabase.storage
  .from(IMAGE_BUCKET)
  .upload(fileName, buffer, {
    cacheControl: '3600', // 1시간 캐시
  })
```

**효과**: 이미지 서빙 시 Edge 캐싱, 전역 배포

#### 5. 선택적 이미지 저장 설계 ✅

```
이전 방식: 생성 → 자동 저장 (4장 모두)
현재 방식: 생성 → base64 반환 → 사용자 선택 → 저장

효과:
- Storage 비용 50-70% 절감 (미선택 이미지 제외)
- 사용자 선택권 강화
- 네트워크 트래픽 감소
```

#### 6. JWT 세션 전략 ✅

```typescript
// lib/auth.ts
session: {
  strategy: 'jwt', // Serverless 환경에 최적
}
```

**효과**: 세션 조회 시 DB 접근 불필요, Serverless 환경 적합

---

## 개선 권장사항

### 🔴 High Priority (즉시 적용 권장)

#### H1. Server Components 활용

**현재**:
```typescript
// app/page.tsx
'use client'; // 모든 페이지가 클라이언트 컴포넌트
```

**개선**:
```typescript
// app/page.tsx - 서버 컴포넌트로 변경
// 'use client' 제거

import { getServerSession } from 'next-auth'
import { HomeClientSection } from './components/HomeClientSection'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  return (
    <>
      {/* 정적 콘텐츠는 서버에서 렌더링 */}
      <Header session={session} />

      {/* 인터랙티브 부분만 클라이언트 */}
      <HomeClientSection />
    </>
  )
}
```

**예상 효과**: FCP 50-70% 개선, SEO 점수 향상

#### H2. CreditBalance 캐싱/최적화

**현재**:
```typescript
// 매 렌더링마다 API 호출
useEffect(() => {
  fetchData()
}, [session])
```

**개선 옵션 1: React Query/SWR 도입**:
```typescript
import useSWR from 'swr'

export function CreditBalance() {
  const { data: balance, error } = useSWR(
    session?.user ? '/api/credits/balance' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30초 캐싱
    }
  )
}
```

**개선 옵션 2: Server Component + 캐싱**:
```typescript
// app/layout.tsx 또는 Header를 서버 컴포넌트로
import { unstable_cache } from 'next/cache'

const getCachedBalance = unstable_cache(
  async (userId: string) => getCreditBalance(userId),
  ['credit-balance'],
  { revalidate: 60 } // 1분 캐시
)
```

**예상 효과**: API 호출 90% 감소, 응답 시간 50% 개선

#### H3. ReBAC 권한 체크 최적화

**현재**: 최대 4회 쿼리
**개선**: 단일 쿼리로 통합

```typescript
// lib/permissions.ts - 개선된 check 함수
export async function check(
  userId: string,
  namespace: Namespace,
  objectId: string,
  relation: Relation
): Promise<boolean> {
  const inheritedRelations = [relation, ...getInheritedRelations(relation)]

  const permission = await prisma.relationTuple.findFirst({
    where: {
      OR: [
        // 직접 권한 + 상속 권한 (1개 조건)
        {
          namespace,
          objectId,
          relation: { in: inheritedRelations },
          subjectType: 'user',
          subjectId: userId,
        },
        // 시스템 admin (1개 조건)
        {
          namespace: 'system',
          objectId: 'global',
          relation: 'admin',
          subjectType: 'user',
          subjectId: userId,
        },
        // 와일드카드 (1개 조건)
        {
          namespace,
          objectId,
          relation,
          subjectType: 'user',
          subjectId: '*',
        },
      ],
    },
  })

  return !!permission
}
```

**예상 효과**: 쿼리 수 75% 감소 (4회 → 1회)

---

### 🟡 Medium Priority (2-4주 내 적용)

#### M1. API 응답 캐싱 전략

**정적 데이터 캐싱**:
```typescript
// app/api/credits/balance/route.ts
export const revalidate = 30 // 30초 캐시

// 또는 세분화된 캐싱
import { unstable_cache } from 'next/cache'

const getCachedBalance = unstable_cache(
  async (userId: string) => {
    const credit = await prisma.credit.findUnique({ where: { userId } })
    return credit?.balance ?? 0
  },
  ['credit-balance'],
  { revalidate: 30, tags: ['credits'] }
)
```

**캐시 무효화**:
```typescript
// 크레딧 변경 시
import { revalidateTag } from 'next/cache'

await deductCredits(userId, amount)
revalidateTag('credits') // 캐시 무효화
```

#### M2. 갤러리 프리페칭

```typescript
// app/gallery/page.tsx
import { useRouter } from 'next/navigation'

// 다음 페이지 프리페칭
useEffect(() => {
  if (hasMore && !loadingMore) {
    const nextParams = new URLSearchParams(params)
    nextParams.set('offset', String(currentOffset + ITEMS_PER_PAGE))
    router.prefetch(`/api/images/list?${nextParams}`)
  }
}, [currentOffset, hasMore])

// 이미지 프리로딩
const preloadImages = (images: UserImage[]) => {
  images.slice(0, 6).forEach(img => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = img.url
    document.head.appendChild(link)
  })
}
```

#### M3. Edge Middleware 인증

```typescript
// middleware.ts
import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })

  // 보호된 경로 체크
  const protectedPaths = ['/create', '/edit', '/gallery', '/profile']
  const isProtected = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 인증된 요청에 userId 헤더 추가
  if (token?.sub) {
    const response = NextResponse.next()
    response.headers.set('x-user-id', token.sub)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/create/:path*', '/edit/:path*', '/gallery/:path*', '/profile/:path*']
}
```

**효과**: API Route에서 `getServerSession` 호출 감소

#### M4. 크레딧 체크 최적화

```typescript
// 개선: 크레딧 확인과 차감을 단일 트랜잭션으로
export async function deductCreditsAtomic(
  userId: string,
  amount: number,
  type: 'GENERATION' | 'UPSCALE',
  description: string,
  metadata?: CreditTransactionMetadata
): Promise<{ success: boolean; balance: number; error?: string }> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 잔액 확인 + 차감을 원자적으로 수행
      const credit = await tx.credit.update({
        where: {
          userId,
          balance: { gte: amount } // 잔액이 충분할 때만 업데이트
        },
        data: { balance: { decrement: amount } }
      })

      await tx.creditTransaction.create({
        data: { userId, amount: -amount, type, description, metadata }
      })

      return credit
    })

    return { success: true, balance: result.balance }
  } catch (error) {
    // P2025: 조건을 만족하는 레코드 없음 (잔액 부족)
    if (error.code === 'P2025') {
      const balance = await getCreditBalance(userId)
      return { success: false, balance, error: '크레딧 부족' }
    }
    throw error
  }
}
```

---

### 🟢 Low Priority (장기 개선)

#### L1. Streaming/Suspense 활용

```typescript
// app/gallery/page.tsx
import { Suspense } from 'react'
import { ImageGrid, ImageGridSkeleton } from './components'

export default function GalleryPage() {
  return (
    <div>
      <Header />
      <Filters />
      <Suspense fallback={<ImageGridSkeleton />}>
        <ImageGrid />
      </Suspense>
    </div>
  )
}
```

#### L2. React Server Components 스트리밍

```typescript
// app/gallery/components/ImageGrid.tsx (Server Component)
export async function ImageGrid({ searchParams }) {
  const images = await getImages(searchParams) // 서버에서 직접 조회

  return (
    <div className="grid grid-cols-6 gap-4">
      {images.map(image => (
        <ImageCard key={image.id} image={image} />
      ))}
    </div>
  )
}
```

#### L3. 이미지 생성 진행률 스트리밍

```typescript
// Server-Sent Events로 진행률 전송
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // 진행률 업데이트
      controller.enqueue(encoder.encode(`data: {"progress": 25}\n\n`))

      const image1 = await generateImage()
      controller.enqueue(encoder.encode(`data: {"progress": 50, "image": 1}\n\n`))

      // ... 계속

      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    }
  })
}
```

---

## 우선순위별 실행 계획

### Phase 1: 즉시 적용 (1-2주)

| 작업 | 예상 공수 | 예상 효과 | 위험도 |
|------|----------|----------|--------|
| CreditBalance SWR 적용 | 2시간 | API 호출 90% 감소 | 낮음 |
| ReBAC check() 최적화 | 4시간 | 쿼리 75% 감소 | 중간 |
| 홈페이지 SSR 전환 | 8시간 | FCP 50% 개선 | 중간 |

### Phase 2: 단기 개선 (3-4주)

| 작업 | 예상 공수 | 예상 효과 | 위험도 |
|------|----------|----------|--------|
| Edge Middleware 인증 | 8시간 | API 응답 20% 개선 | 중간 |
| API 응답 캐싱 | 4시간 | 응답 시간 30% 개선 | 낮음 |
| 크레딧 체크 원자화 | 4시간 | 쿼리 50% 감소 | 낮음 |
| 갤러리 프리페칭 | 4시간 | UX 개선 | 낮음 |

### Phase 3: 장기 개선 (1-2개월)

| 작업 | 예상 공수 | 예상 효과 | 위험도 |
|------|----------|----------|--------|
| 전체 페이지 SSR 전환 | 24시간 | 전체 성능 40% 개선 | 높음 |
| React Query 전면 도입 | 16시간 | 캐싱/상태 관리 개선 | 중간 |
| Suspense/Streaming | 16시간 | 점진적 로딩 UX | 중간 |

---

## 예상 개선 효과

### 성능 지표 개선 예상

| 지표 | 현재 | Phase 1 후 | Phase 2 후 | Phase 3 후 |
|------|------|-----------|-----------|-----------|
| **TTFB** | 100-200ms | 100-200ms | 80-150ms | 50-100ms |
| **FCP** | 800-1200ms | 400-600ms | 350-500ms | 250-400ms |
| **LCP** | 1500-2500ms | 800-1200ms | 600-900ms | 400-700ms |
| **TTI** | 2000-3000ms | 1200-1800ms | 1000-1500ms | 600-1000ms |

### 리소스 사용량 개선 예상

| 리소스 | 현재 | 개선 후 | 절감률 |
|--------|------|--------|--------|
| **DB 쿼리/요청** | 8-12회 | 2-4회 | 60-70% |
| **API 호출/페이지** | 3-5회 | 1-2회 | 50-70% |
| **네트워크 전송** | 500KB-1MB | 200-400KB | 40-60% |

### 사용자 경험 개선

- **페이지 전환**: 체감 속도 50% 이상 개선
- **이미지 로딩**: 스켈레톤 → 점진적 로딩으로 끊김 최소화
- **인터랙션**: 버튼 클릭 후 즉각적인 피드백
- **에러 처리**: 더 빠른 에러 감지 및 복구

---

## 부록

### A. 성능 모니터링 도구 권장

1. **Vercel Analytics**: 웹 바이탈 자동 추적
2. **Vercel Speed Insights**: 실제 사용자 성능 데이터
3. **Prisma Metrics**: DB 쿼리 성능 모니터링
4. **Sentry**: 에러 추적 및 성능 모니터링

### B. 테스트 시나리오

```typescript
// 성능 테스트 시나리오
describe('Performance Tests', () => {
  test('홈페이지 FCP < 500ms', async () => {
    const start = performance.now()
    await render(<HomePage />)
    const fcp = performance.now() - start
    expect(fcp).toBeLessThan(500)
  })

  test('갤러리 API 응답 < 200ms', async () => {
    const start = performance.now()
    await fetch('/api/images/list?limit=30')
    const duration = performance.now() - start
    expect(duration).toBeLessThan(200)
  })

  test('권한 체크 쿼리 1회 이내', async () => {
    const queryCount = await measureQueries(() =>
      check(userId, 'image_project', projectId, 'editor')
    )
    expect(queryCount).toBeLessThanOrEqual(1)
  })
})
```

### C. 참고 자료

- [Next.js 16 App Router 최적화 가이드](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Vercel Edge Functions 문서](https://vercel.com/docs/functions/edge-functions)
- [Prisma 성능 최적화](https://www.prisma.io/docs/guides/performance-and-optimization)
- [React Server Components 패턴](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023)

---

**문서 작성**: Claude Code
**검토 필요**: 개발팀
**다음 업데이트**: 개선 사항 적용 후 성능 측정 결과 추가
