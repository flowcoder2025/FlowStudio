# 크레딧 시스템 구현 가이드

## ✅ 완료된 작업 (Phase 1)

### 1. 데이터베이스 스키마 설계 완료

**파일**: `prisma/schema.prisma`

세 가지 핵심 모델 추가:

#### `Credit` 모델
- 사용자별 크레딧 잔액 관리
- `userId` 1:1 관계로 중복 방지
- `balance`: 크레딧 잔액 (1 크레딧 = ₩100)

#### `CreditTransaction` 모델
- 모든 크레딧 입출금 기록
- 양수: 충전/보너스/레퍼럴
- 음수: 사용 (이미지 생성/업스케일링)
- `metadata` JSON 필드로 유연한 추가 정보 저장

#### `Subscription` 모델 (향상)
- 기존 단순 모델 → 풍부한 티어 시스템으로 업그레이드
- 티어별 혜택: 저장 공간, 동시 생성 제한, 워터마크, 우선 처리
- 외부 결제 시스템 통합 준비 (Toss, Stripe)

### 2. 마이그레이션 파일 생성

**파일**: `prisma/migrations/20251210_add_credit_system/migration.sql`

⚠️ **중요**: 마이그레이션이 아직 데이터베이스에 적용되지 않았습니다.

**적용 방법 (수동)**:

```bash
# Supabase SQL Editor에서 실행
# Dashboard → SQL Editor → New Query

# migration.sql 파일 내용 전체를 복사하여 실행
```

또는 로컬에서 Prisma CLI로 적용:

```bash
# DIRECT_URL 환경 변수가 설정되어 있어야 함
npx prisma db push
```

### 3. Credit 관리 유틸리티 완성

**파일**: `lib/utils/creditManager.ts`

#### 주요 함수

**잔액 조회**:
```typescript
await getCreditBalance(userId) // 현재 잔액 반환
await hasEnoughCredits(userId, 20) // 충분한지 확인
```

**크레딧 추가**:
```typescript
// 유료 충전
await addCredits(userId, 100, 'PURCHASE', '스타터 패키지', {
  packageId: 'starter',
  paymentId: 'toss_abc123'
})

// 가입 보너스
await grantSignupBonus(userId, 'general') // 30 크레딧
await grantSignupBonus(userId, 'business') // 100 크레딧

// 레퍼럴 보상
await grantReferralReward(referrerId, refereeId) // 각 40 크레딧
```

**크레딧 사용**:
```typescript
// 2K 이미지 생성 (4장) - 20 크레딧
await deductForGeneration(userId, projectId)

// 4K 업스케일링 (1장) - 10 크레딧
await deductForUpscale(userId, projectId)

// 또는 직접 차감
await deductCredits(userId, 20, 'GENERATION', '설명', { metadata })
```

**트랜잭션 조회**:
```typescript
// 최근 50개 트랜잭션
const { transactions, total, hasMore } = await getCreditTransactions(userId)

// 특정 타입만 필터링
await getCreditTransactions(userId, { type: 'PURCHASE', limit: 20 })

// 통계 조회
const stats = await getCreditStats(userId)
// {
//   balance: 150,
//   totalAdded: 200,
//   totalUsed: 50,
//   totalPurchased: 100,
//   totalBonus: 30,
//   totalReferral: 40,
//   totalGeneration: 40,
//   totalUpscale: 10
// }
```

### 4. 에러 처리 추가

**파일**: `lib/errors.ts`

새로운 에러 클래스 추가:

```typescript
import { InsufficientCreditsError } from '@/lib/errors'

// 크레딧 부족 시 자동으로 throw
try {
  await deductForGeneration(userId, projectId)
} catch (error) {
  if (error instanceof InsufficientCreditsError) {
    // 402 Payment Required 응답
    // 메시지: "크레딧이 부족합니다 (필요: 20, 보유: 5)"
  }
}
```

---

## 📋 다음 단계 (Phase 2: API 통합)

### 1. 크레딧 조회 API 구현

**파일**: `app/api/credits/balance/route.ts` (신규 생성)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getCreditBalance } from '@/lib/utils/creditManager'
import { UnauthorizedError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new UnauthorizedError()
    }

    const balance = await getCreditBalance(session.user.id)

    return NextResponse.json({ balance })
  } catch (error) {
    // 에러 핸들링
    return NextResponse.json(
      { error: '크레딧 조회 실패' },
      { status: 500 }
    )
  }
}
```

### 2. 크레딧 충전 API 구현

**파일**: `app/api/credits/purchase/route.ts` (신규 생성)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { addCredits } from '@/lib/utils/creditManager'
import { ValidationError } from '@/lib/errors'

// 크레딧 패키지 정의
const PACKAGES = {
  starter: { credits: 100, price: 10000, name: '스타터' },
  basic: { credits: 300, price: 28000, name: '베이직' },
  pro: { credits: 1000, price: 90000, name: '프로' },
  business: { credits: 3000, price: 250000, name: '비즈니스' }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new UnauthorizedError()
    }

    const { packageId, paymentId, paymentProvider } = await request.json()

    const pkg = PACKAGES[packageId as keyof typeof PACKAGES]
    if (!pkg) {
      throw new ValidationError('유효하지 않은 패키지입니다')
    }

    // TODO: 결제 검증 로직 (Toss, Stripe 등)
    // - paymentId로 실제 결제 확인
    // - 금액 일치 여부 검증
    // - 중복 결제 방지

    const result = await addCredits(
      session.user.id,
      pkg.credits,
      'PURCHASE',
      `${pkg.name} 패키지 충전`,
      { packageId, paymentId, paymentProvider }
    )

    return NextResponse.json({
      success: true,
      balance: result.balance,
      purchased: pkg.credits
    })
  } catch (error) {
    // 에러 핸들링
    return NextResponse.json(
      { error: '충전 실패' },
      { status: 500 }
    )
  }
}
```

### 3. `/api/generate` 라우트 수정

**파일**: `app/api/generate/route.ts` (기존 파일 수정)

크레딧 차감 로직 추가:

```typescript
// 기존 코드 상단에 추가
import {
  deductForGeneration,
  hasEnoughCredits,
  CREDIT_PRICES
} from '@/lib/utils/creditManager'
import { InsufficientCreditsError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new UnauthorizedError()
    }

    // 1. 크레딧 잔액 확인
    const hasEnough = await hasEnoughCredits(
      session.user.id,
      CREDIT_PRICES.GENERATION_2K
    )

    if (!hasEnough) {
      throw new InsufficientCreditsError(
        `크레딧이 부족합니다. 2K 생성에는 ${CREDIT_PRICES.GENERATION_2K} 크레딧이 필요합니다.`
      )
    }

    // 2. 이미지 생성 (기존 코드)
    const images = await generateImages(/* ... */)

    // 3. 성공 시 크레딧 차감
    await deductForGeneration(session.user.id, projectId)

    // 4. 응답 반환 (기존 코드)
    return NextResponse.json({ images })

  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { error: error.message },
        { status: 402 } // Payment Required
      )
    }
    // 기타 에러 핸들링
  }
}
```

### 4. 프론트엔드: 크레딧 표시 컴포넌트

**파일**: `components/CreditBalance.tsx` (신규 생성)

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export function CreditBalance() {
  const { data: session } = useSession()
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    if (!session?.user) return

    fetch('/api/credits/balance')
      .then(res => res.json())
      .then(data => setBalance(data.balance))
  }, [session])

  if (!session?.user || balance === null) return null

  const won = balance * 100 // 1 크레딧 = ₩100

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
      <span className="text-sm font-medium text-gray-700">보유 크레딧</span>
      <span className="text-lg font-bold text-blue-600">{balance}</span>
      <span className="text-xs text-gray-500">(₩{won.toLocaleString()})</span>
    </div>
  )
}
```

**Header에 추가** (`components/Header.tsx`):

```typescript
import { CreditBalance } from './CreditBalance'

// Header 컴포넌트 내부
<div className="flex items-center gap-4">
  <CreditBalance />
  {/* 기존 프로필 드롭다운 등 */}
</div>
```

---

## 📋 다음 단계 (Phase 3: 업스케일링 API)

### 1. 업스케일링 API 엔드포인트 생성

**파일**: `app/api/upscale/route.ts` (신규 생성)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import {
  deductForUpscale,
  hasEnoughCredits,
  CREDIT_PRICES
} from '@/lib/utils/creditManager'
import { InsufficientCreditsError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new UnauthorizedError()
    }

    const { imageUrl, projectId } = await request.json()

    // 1. 크레딧 확인
    const hasEnough = await hasEnoughCredits(
      session.user.id,
      CREDIT_PRICES.UPSCALE_4K
    )

    if (!hasEnough) {
      throw new InsufficientCreditsError(
        `크레딧이 부족합니다. 업스케일링에는 ${CREDIT_PRICES.UPSCALE_4K} 크레딧이 필요합니다.`
      )
    }

    // 2. Gemini API로 4K 업스케일링 요청
    // TODO: Gemini 업스케일링 API 호출
    const upscaledImage = await callGeminiUpscale(imageUrl)

    // 3. Supabase Storage에 업로드
    // TODO: Storage 업로드 로직

    // 4. 크레딧 차감
    await deductForUpscale(session.user.id, projectId)

    // 5. 응답 반환
    return NextResponse.json({
      success: true,
      upscaledImageUrl: upscaledImage
    })

  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { error: error.message },
        { status: 402 }
      )
    }
    // 기타 에러 핸들링
  }
}
```

---

## 📋 다음 단계 (Phase 4: 사용자 인증 시 초기화)

### NextAuth 콜백 수정

**파일**: `app/api/auth/[...nextauth]/route.ts` (기존 파일 수정)

```typescript
import { initializeCredit, grantSignupBonus } from '@/lib/utils/creditManager'

export const authOptions: NextAuthOptions = {
  // ... 기존 설정
  callbacks: {
    async signIn({ user, account, profile }) {
      // 기존 권한 부여 로직 유지
      // ...

      // 신규 가입자: 크레딧 초기화 및 보너스 지급
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email! },
        include: { credit: true }
      })

      if (existingUser && !existingUser.credit) {
        // Credit 레코드 생성
        await initializeCredit(existingUser.id)

        // 가입 보너스 지급 (일반: 30, 사업자: 150)
        // TODO: 사업자 인증 로직 추가 후 'business' 타입 판단
        await grantSignupBonus(existingUser.id, 'general')
      }

      return true
    },
    // ... 기존 callbacks
  }
}
```

---

## 📋 다음 단계 (Phase 5: 결제 시스템 통합)

### 1. Toss Payments 연동 (한국)

#### 환경 변수 추가 (`.env.local`):

```bash
# Toss Payments
TOSS_CLIENT_KEY="test_ck_..." # 클라이언트 키 (공개)
TOSS_SECRET_KEY="test_sk_..." # 시크릿 키 (서버 전용)
```

#### 결제 요청 페이지 생성

**파일**: `app/credits/purchase/page.tsx` (신규 생성)

```typescript
'use client'

import { useState } from 'react'
import { loadTossPayments } from '@tosspayments/payment-sdk'

const PACKAGES = [
  { id: 'starter', name: '스타터', credits: 100, price: 10000 },
  { id: 'basic', name: '베이직', credits: 300, price: 28000 },
  { id: 'pro', name: '프로', credits: 1000, price: 90000 },
  { id: 'business', name: '비즈니스', credits: 3000, price: 250000 }
]

export default function CreditPurchasePage() {
  const [loading, setLoading] = useState(false)

  const handlePurchase = async (pkg: typeof PACKAGES[0]) => {
    setLoading(true)

    try {
      const tossPayments = await loadTossPayments(
        process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!
      )

      await tossPayments.requestPayment('카드', {
        amount: pkg.price,
        orderId: `order_${Date.now()}`,
        orderName: `${pkg.name} 크레딧 패키지`,
        successUrl: `${window.location.origin}/api/credits/toss/success`,
        failUrl: `${window.location.origin}/api/credits/toss/fail`,
        customerName: '사용자 이름', // 세션에서 가져오기
        customerEmail: '사용자 이메일' // 세션에서 가져오기
      })
    } catch (error) {
      console.error('결제 요청 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8">크레딧 충전</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PACKAGES.map(pkg => (
          <div key={pkg.id} className="border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-2">{pkg.name}</h2>
            <p className="text-3xl font-bold text-blue-600 mb-2">
              {pkg.credits} 크레딧
            </p>
            <p className="text-lg text-gray-600 mb-4">
              ₩{pkg.price.toLocaleString()}
            </p>
            <button
              onClick={() => handlePurchase(pkg)}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              구매하기
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

#### Toss 결제 승인 API

**파일**: `app/api/credits/toss/success/route.ts` (신규 생성)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { addCredits } from '@/lib/utils/creditManager'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.redirect('/login')
    }

    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get('orderId')
    const paymentKey = searchParams.get('paymentKey')
    const amount = searchParams.get('amount')

    // 1. Toss API로 결제 승인
    const response = await fetch(
      'https://api.tosspayments.com/v1/payments/confirm',
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(
            process.env.TOSS_SECRET_KEY! + ':'
          ).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId, paymentKey, amount })
      }
    )

    if (!response.ok) {
      throw new Error('결제 승인 실패')
    }

    const payment = await response.json()

    // 2. 패키지 정보 추출 (orderId 또는 메타데이터에서)
    // TODO: 실제 패키지 매핑 로직

    // 3. 크레딧 추가
    await addCredits(
      session.user.id,
      100, // packageId에서 가져오기
      'PURCHASE',
      '스타터 패키지 충전',
      {
        packageId: 'starter',
        paymentId: payment.paymentKey,
        paymentProvider: 'TOSS'
      }
    )

    // 4. 성공 페이지로 리다이렉트
    return NextResponse.redirect('/credits/success')

  } catch (error) {
    console.error('결제 승인 오류:', error)
    return NextResponse.redirect('/credits/fail')
  }
}
```

### 2. Stripe 연동 (국제 결제)

#### 환경 변수 추가:

```bash
# Stripe
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

#### Stripe Checkout 구현 (생략 - Toss와 유사)

---

## 📋 다음 단계 (Phase 6: 레퍼럴 시스템)

### 1. 레퍼럴 코드 생성

**파일**: `lib/utils/referralCode.ts` (신규 생성)

```typescript
import { customAlphabet } from 'nanoid'
import { prisma } from '@/lib/prisma'

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8)

export async function generateReferralCode(userId: string): Promise<string> {
  const code = nanoid()

  // User 테이블에 referralCode 필드 추가 필요 (마이그레이션)
  await prisma.user.update({
    where: { id: userId },
    data: { referralCode: code }
  })

  return code
}

export async function findUserByReferralCode(code: string) {
  return prisma.user.findFirst({
    where: { referralCode: code }
  })
}
```

### 2. 레퍼럴 보상 처리 API

**파일**: `app/api/credits/referral/route.ts` (신규 생성)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { grantReferralReward } from '@/lib/utils/creditManager'
import { findUserByReferralCode } from '@/lib/utils/referralCode'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new UnauthorizedError()
    }

    const { referralCode, firstPurchaseConfirmed } = await request.json()

    // 첫 유료 충전 확인 후에만 보상 지급
    if (!firstPurchaseConfirmed) {
      return NextResponse.json(
        { error: '첫 결제 후 레퍼럴 보상이 지급됩니다' },
        { status: 400 }
      )
    }

    // 레퍼럴 코드로 추천인 찾기
    const referrer = await findUserByReferralCode(referralCode)

    if (!referrer) {
      return NextResponse.json(
        { error: '유효하지 않은 추천 코드입니다' },
        { status: 404 }
      )
    }

    // 보상 지급 (각 40 크레딧)
    const result = await grantReferralReward(referrer.id, session.user.id)

    return NextResponse.json({
      success: true,
      referrerBalance: result.referrerBalance,
      refereeBalance: result.refereeBalance
    })

  } catch (error) {
    // 에러 핸들링
    return NextResponse.json(
      { error: '레퍼럴 보상 지급 실패' },
      { status: 500 }
    )
  }
}
```

---

## 🚀 우선순위 요약

### 즉시 구현 (High Priority)
1. ✅ **완료**: 데이터베이스 스키마 및 마이그레이션
2. ✅ **완료**: Credit 관리 유틸리티
3. ⏳ **대기**: 마이그레이션 데이터베이스 적용
4. ⏳ **대기**: `/api/generate` 라우트에 크레딧 차감 추가
5. ⏳ **대기**: 프론트엔드 크레딧 잔액 표시

### 단기 구현 (Medium Priority)
6. 크레딧 충전 API 및 UI
7. 업스케일링 API 구현
8. 사용자 가입 시 보너스 크레딧 자동 지급

### 중장기 구현 (Lower Priority)
9. 결제 시스템 통합 (Toss/Stripe)
10. 레퍼럴 시스템 구현
11. 구독 티어 시스템 활성화
12. 관리자 대시보드 (크레딧 관리)

---

## 📊 테스트 시나리오

### 1. 크레딧 시스템 기본 동작

```bash
# Prisma Studio로 직접 테스트 (마이그레이션 적용 후)
npx prisma studio

# 1. Credit 레코드 생성
# User 테이블에서 사용자 ID 확인 → Credit 테이블에서 수동 생성

# 2. CreditTransaction 추가
# amount: 100 (충전), type: 'PURCHASE'

# 3. Credit balance 업데이트
# balance += 100
```

### 2. API 테스트 (cURL)

```bash
# 잔액 조회
curl -X GET http://localhost:3000/api/credits/balance \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# 크레딧 충전 (구현 후)
curl -X POST http://localhost:3000/api/credits/purchase \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "packageId": "starter",
    "paymentId": "test_payment_123",
    "paymentProvider": "TOSS"
  }'
```

### 3. 유틸리티 함수 직접 테스트

`scripts/test-credit-system.ts` 생성:

```typescript
import { prisma } from '@/lib/prisma'
import {
  getCreditBalance,
  addCredits,
  deductForGeneration,
  getCreditStats
} from '@/lib/utils/creditManager'

async function testCreditSystem() {
  const testUserId = 'YOUR_USER_ID' // Prisma Studio에서 확인

  // 1. 초기 잔액 확인
  console.log('초기 잔액:', await getCreditBalance(testUserId))

  // 2. 100 크레딧 추가
  await addCredits(testUserId, 100, 'PURCHASE', '테스트 충전')
  console.log('충전 후 잔액:', await getCreditBalance(testUserId))

  // 3. 이미지 생성으로 20 크레딧 차감
  await deductForGeneration(testUserId, 'test_project_id')
  console.log('생성 후 잔액:', await getCreditBalance(testUserId))

  // 4. 통계 확인
  const stats = await getCreditStats(testUserId)
  console.log('통계:', stats)
}

testCreditSystem()
  .then(() => console.log('테스트 완료'))
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

실행:

```bash
npx ts-node scripts/test-credit-system.ts
```

---

## ⚠️ 중요 체크리스트

### 보안
- [ ] 결제 검증 로직 구현 (중복 결제 방지)
- [ ] 크레딧 조작 방지 (클라이언트에서 직접 수정 불가)
- [ ] API 엔드포인트 인증/권한 확인
- [ ] 민감한 결제 정보 로깅 금지

### 데이터 무결성
- [ ] 트랜잭션 사용 (크레딧 잔액 + 히스토리 원자적 업데이트)
- [ ] 음수 잔액 방지 (`hasEnoughCredits` 선행 확인)
- [ ] 중복 보너스 지급 방지 (가입 보너스 1회만)

### 사용자 경험
- [ ] 크레딧 부족 시 명확한 안내 메시지
- [ ] 실시간 잔액 업데이트 (API 호출 후 갱신)
- [ ] 트랜잭션 히스토리 UI (마이페이지)
- [ ] 충전 패키지별 할인율 명시

---

## 📝 다음 작업 시작 방법

1. **마이그레이션 적용**:
   ```bash
   # Supabase SQL Editor에서 실행
   # prisma/migrations/20251210_add_credit_system/migration.sql 복사하여 실행
   ```

2. **빌드 확인**:
   ```bash
   npm run build
   ```

3. **개발 서버 재시작**:
   ```bash
   npm run dev
   ```

4. **다음 구현 파일 생성**:
   - `app/api/credits/balance/route.ts`
   - `app/api/generate/route.ts` 수정 (크레딧 차감 추가)
   - `components/CreditBalance.tsx`
