# Paddle 결제 시스템 설정 가이드

FlowStudio 글로벌 결제를 위한 Paddle Dashboard 설정 가이드입니다.

## 목차

1. [Paddle 계정 생성](#1-paddle-계정-생성)
2. [인증 키 발급](#2-인증-키-발급)
3. [상품 및 가격 생성](#3-상품-및-가격-생성)
4. [웹훅 설정](#4-웹훅-설정)
5. [환경 변수 설정](#5-환경-변수-설정)
6. [테스트](#6-테스트)
7. [프로덕션 전환](#7-프로덕션-전환)

---

## 1. Paddle 계정 생성

### Sandbox (테스트) 계정
1. https://sandbox-vendors.paddle.com 접속
2. 회원가입 진행
3. 이메일 인증 완료

### Production (실서비스) 계정
1. https://vendors.paddle.com 접속
2. 회원가입 진행
3. 사업자 인증 필요 (KYC)
   - 사업자등록증
   - 신분증
   - 은행 계좌 정보

> **참고**: 테스트 환경에서 모든 기능 검증 후 프로덕션으로 전환하세요.

---

## 2. 인증 키 발급

### 2.1 API Key 발급

1. Paddle Dashboard 로그인
2. **Developer Tools** → **Authentication** 이동
3. **API Key** 섹션에서:
   - `Generate API Key` 클릭
   - 키 이름 입력 (예: `flowstudio-production`)
   - 생성된 키 복사 → `PADDLE_API_KEY`

### 2.2 Client Token 발급

1. 같은 **Authentication** 페이지에서
2. **Client-side tokens** 섹션:
   - `Generate client-side token` 클릭
   - 토큰 복사 → `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`

> **보안 주의**: API Key는 서버에서만 사용하고, Client Token만 클라이언트에 노출됩니다.

---

## 3. 상품 및 가격 생성

### 3.1 구독 상품 생성

1. **Catalog** → **Products** 이동
2. `+ New Product` 클릭

#### Plus 플랜
```
Name: FlowStudio Plus
Description: 100GB storage, 3 concurrent generations, no watermark
Tax Category: Standard digital services
```

#### Pro 플랜
```
Name: FlowStudio Pro
Description: 500GB storage, 5 concurrent generations, API access
Tax Category: Standard digital services
```

#### Business 플랜
```
Name: FlowStudio Business
Description: 1TB storage, 10 concurrent generations, team collaboration
Tax Category: Standard digital services
```

### 3.2 구독 가격 생성

각 상품에서 **Prices** 탭 → `+ Add Price`

#### Plus 가격
| Type | Billing | Amount | Currency | Price ID 용도 |
|------|---------|--------|----------|--------------|
| Recurring | Monthly | $7.00 | USD | `PADDLE_PRICE_PLUS_MONTHLY` |
| Recurring | Yearly | $70.00 | USD | `PADDLE_PRICE_PLUS_YEARLY` |

#### Pro 가격
| Type | Billing | Amount | Currency | Price ID 용도 |
|------|---------|--------|----------|--------------|
| Recurring | Monthly | $21.00 | USD | `PADDLE_PRICE_PRO_MONTHLY` |
| Recurring | Yearly | $210.00 | USD | `PADDLE_PRICE_PRO_YEARLY` |

#### Business 가격
| Type | Billing | Amount | Currency | Price ID 용도 |
|------|---------|--------|----------|--------------|
| Recurring | Monthly | $71.00 | USD | `PADDLE_PRICE_BUSINESS_MONTHLY` |
| Recurring | Yearly | $710.00 | USD | `PADDLE_PRICE_BUSINESS_YEARLY` |

### 3.3 크레딧 패키지 상품 생성

1. **Catalog** → **Products** → `+ New Product`

#### Starter Credits
```
Name: FlowStudio Credits - Starter
Description: 100 credits for AI image generation (5 generations, 20 images)
Tax Category: Standard digital services
```

#### Basic Credits
```
Name: FlowStudio Credits - Basic
Description: 300 credits for AI image generation (15 generations, 60 images)
Tax Category: Standard digital services
```

#### Pro Credits
```
Name: FlowStudio Credits - Pro
Description: 1000 credits for AI image generation (50 generations, 200 images)
Tax Category: Standard digital services
```

#### Business Credits
```
Name: FlowStudio Credits - Business
Description: 3000 credits for AI image generation (150 generations, 600 images)
Tax Category: Standard digital services
```

### 3.4 크레딧 가격 생성

각 크레딧 상품에서 **Prices** 탭 → `+ Add Price`

| 패키지 | Type | Amount | Currency | Price ID 용도 |
|--------|------|--------|----------|--------------|
| Starter | One-time | $7.00 | USD | `PADDLE_PRICE_CREDITS_STARTER` |
| Basic | One-time | $20.00 | USD | `PADDLE_PRICE_CREDITS_BASIC` |
| Pro | One-time | $64.00 | USD | `PADDLE_PRICE_CREDITS_PRO` |
| Business | One-time | $179.00 | USD | `PADDLE_PRICE_CREDITS_BUSINESS` |

### 3.5 Price ID 복사

1. **Catalog** → **Prices** 이동
2. 각 가격 항목 클릭
3. 상단의 **Price ID** 복사 (형식: `pri_xxxxxxxxxxxxx`)

---

## 4. 웹훅 설정

### 4.1 웹훅 엔드포인트 생성

1. **Developer Tools** → **Notifications** 이동
2. `+ New destination` 클릭
3. 설정:
   ```
   Description: FlowStudio Webhook
   URL: https://your-domain.com/api/paddle/webhook
   ```

### 4.2 이벤트 선택

필수 이벤트:
- ✅ `subscription.created` - 구독 생성
- ✅ `subscription.updated` - 구독 변경
- ✅ `subscription.canceled` - 구독 취소
- ✅ `subscription.paused` - 구독 일시정지
- ✅ `subscription.resumed` - 구독 재개
- ✅ `transaction.completed` - 결제 완료 (크레딧 구매)
- ✅ `transaction.payment_failed` - 결제 실패

### 4.3 웹훅 Secret 복사

1. 생성된 웹훅 destination 클릭
2. **Secret key** 복사 → `PADDLE_WEBHOOK_SECRET`

> **중요**: Webhook secret은 웹훅 요청의 서명 검증에 사용됩니다.

---

## 5. 환경 변수 설정

### 5.1 로컬 개발 (.env.local)

```bash
# ========================================
# Paddle 결제 (글로벌 결제)
# ========================================
# sandbox 또는 production
NEXT_PUBLIC_PADDLE_ENV="sandbox"

# Developer Tools → Authentication
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_xxxxxxxxxxxxxxxxxxxxxxxx"
PADDLE_API_KEY="test_xxxxxxxxxxxxxxxxxxxxxxxx"

# Developer Tools → Notifications → Webhook secret
PADDLE_WEBHOOK_SECRET="pdl_ntfset_xxxxxxxxxxxxxxxxxxxxxxxx"

# ========================================
# Paddle Price IDs (구독)
# ========================================
NEXT_PUBLIC_PADDLE_PRICE_PLUS_MONTHLY="pri_01xxxxxxxxxxxxxxxx"
NEXT_PUBLIC_PADDLE_PRICE_PLUS_YEARLY="pri_01xxxxxxxxxxxxxxxx"
NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY="pri_01xxxxxxxxxxxxxxxx"
NEXT_PUBLIC_PADDLE_PRICE_PRO_YEARLY="pri_01xxxxxxxxxxxxxxxx"
NEXT_PUBLIC_PADDLE_PRICE_BUSINESS_MONTHLY="pri_01xxxxxxxxxxxxxxxx"
NEXT_PUBLIC_PADDLE_PRICE_BUSINESS_YEARLY="pri_01xxxxxxxxxxxxxxxx"

# ========================================
# Paddle Price IDs (크레딧 패키지)
# ========================================
NEXT_PUBLIC_PADDLE_PRICE_CREDITS_STARTER="pri_01xxxxxxxxxxxxxxxx"
NEXT_PUBLIC_PADDLE_PRICE_CREDITS_BASIC="pri_01xxxxxxxxxxxxxxxx"
NEXT_PUBLIC_PADDLE_PRICE_CREDITS_PRO="pri_01xxxxxxxxxxxxxxxx"
NEXT_PUBLIC_PADDLE_PRICE_CREDITS_BUSINESS="pri_01xxxxxxxxxxxxxxxx"
```

### 5.2 Vercel 프로덕션

1. Vercel Dashboard → Project → Settings → Environment Variables
2. 위 환경 변수 모두 추가
3. `NEXT_PUBLIC_PADDLE_ENV`를 `production`으로 변경

---

## 6. 테스트

### 6.1 Sandbox 테스트 카드

Paddle Sandbox에서 사용할 수 있는 테스트 카드:

| 시나리오 | 카드 번호 | 만료일 | CVC |
|---------|----------|--------|-----|
| 성공 | 4242 4242 4242 4242 | 미래 날짜 | 아무 3자리 |
| 실패 | 4000 0000 0000 0002 | 미래 날짜 | 아무 3자리 |
| 3D Secure | 4000 0000 0000 3220 | 미래 날짜 | 아무 3자리 |

### 6.2 테스트 시나리오

1. **구독 구매 테스트**
   - `/ko/subscription` 접속
   - Plus 플랜 선택
   - 테스트 카드로 결제
   - 웹훅 수신 확인 (`subscription.created`)

2. **크레딧 구매 테스트**
   - `/ko/credits/purchase` 접속
   - Basic 패키지 선택
   - 테스트 카드로 결제
   - 웹훅 수신 확인 (`transaction.completed`)
   - 크레딧 잔액 증가 확인

3. **구독 취소 테스트**
   - Paddle Customer Portal에서 구독 취소
   - 웹훅 수신 확인 (`subscription.canceled`)

### 6.3 웹훅 디버깅

로컬 개발 시 웹훅 테스트:

```bash
# ngrok으로 로컬 서버 노출
ngrok http 3000

# Paddle Dashboard에서 웹훅 URL 변경
# https://xxxx-xxx-xxx.ngrok.io/api/paddle/webhook
```

---

## 7. 프로덕션 전환

### 7.1 체크리스트

- [ ] Production Paddle 계정 KYC 완료
- [ ] Production 환경에서 상품/가격 재생성
- [ ] Production API Key 및 Client Token 발급
- [ ] Production 웹훅 설정
- [ ] Vercel 환경 변수 업데이트
- [ ] `NEXT_PUBLIC_PADDLE_ENV`를 `production`으로 변경
- [ ] 실제 카드로 소액 테스트 결제

### 7.2 환경 변수 변경

```bash
# Sandbox → Production 변경 사항
NEXT_PUBLIC_PADDLE_ENV="production"
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="live_xxxxxxxxxxxxxxxx"  # test_ → live_
PADDLE_API_KEY="live_xxxxxxxxxxxxxxxx"                    # test_ → live_
# Price ID들도 Production에서 새로 생성한 것으로 교체
```

### 7.3 모니터링

Production 전환 후:
1. **Paddle Dashboard** → **Transactions**에서 실시간 결제 모니터링
2. **Developer Tools** → **Events**에서 웹훅 전송 상태 확인
3. FlowStudio 로그에서 웹훅 처리 결과 확인

---

## 트러블슈팅

### 웹훅이 수신되지 않음
1. URL이 HTTPS인지 확인
2. 방화벽/CORS 설정 확인
3. Paddle Dashboard → Events에서 전송 로그 확인

### 결제 후 크레딧이 지급되지 않음
1. 웹훅 서명 검증 확인 (`PADDLE_WEBHOOK_SECRET`)
2. 서버 로그에서 에러 확인
3. `transaction.completed` 이벤트 처리 로직 확인

### Checkout이 열리지 않음
1. `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` 확인
2. `NEXT_PUBLIC_PADDLE_ENV`가 올바른지 확인
3. Price ID가 현재 환경(sandbox/production)과 일치하는지 확인

---

## 관련 파일

| 파일 | 설명 |
|------|------|
| `/lib/paddle.ts` | Paddle 서버 클라이언트 |
| `/components/PaddleProvider.tsx` | Paddle.js 클라이언트 프로바이더 |
| `/app/api/paddle/webhook/route.ts` | 웹훅 핸들러 |
| `/app/[locale]/subscription/page.tsx` | 구독 페이지 |
| `/app/[locale]/credits/purchase/page.tsx` | 크레딧 구매 페이지 |
| `/app/[locale]/pricing/page.tsx` | 공개 가격 페이지 |

---

## 참고 문서

- [Paddle 공식 문서](https://developer.paddle.com/docs)
- [Paddle.js Integration](https://developer.paddle.com/paddlejs/overview)
- [Webhooks Guide](https://developer.paddle.com/webhooks/overview)
- [Testing Guide](https://developer.paddle.com/concepts/payment-methods#test-payment-methods)
