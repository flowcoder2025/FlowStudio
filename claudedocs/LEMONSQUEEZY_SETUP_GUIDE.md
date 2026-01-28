# LemonSqueezy 상품 등록 및 연결 가이드

FlowStudio 결제 시스템을 LemonSqueezy와 연동하기 위한 설정 가이드입니다.

## 목차

1. [LemonSqueezy 계정 설정](#1-lemonsqueezy-계정-설정)
2. [스토어 생성](#2-스토어-생성)
3. [상품 등록](#3-상품-등록)
4. [환경 변수 설정](#4-환경-변수-설정)
5. [Webhook 설정](#5-webhook-설정)
6. [테스트](#6-테스트)

---

## 1. LemonSqueezy 계정 설정

### 1.1 계정 생성
1. [LemonSqueezy](https://www.lemonsqueezy.com/) 접속
2. **Get Started** 클릭하여 계정 생성
3. 이메일 인증 완료

### 1.2 사업자 정보 입력
1. **Settings** → **Business** 이동
2. 사업자 정보 입력:
   - Business name: `FlowCoder` (또는 사업자명)
   - Country: `South Korea`
   - 세금 정보 입력

### 1.3 결제 수단 연결
1. **Settings** → **Payouts** 이동
2. 정산 받을 계좌 정보 입력 (Stripe Connect 또는 PayPal)

---

## 2. 스토어 생성

### 2.1 스토어 설정
1. **Stores** 메뉴 클릭
2. **Create Store** 클릭
3. 스토어 정보 입력:
   - Name: `FlowStudio`
   - URL slug: `flowstudio`
   - Currency: `KRW` (한국 원화) 또는 `USD`

### 2.2 Store ID 확인
1. 스토어 생성 후 **Settings** → **General** 이동
2. **Store ID** 복사 (숫자 형식, 예: `12345`)
3. 이 값을 환경 변수 `LEMONSQUEEZY_STORE_ID`에 설정

---

## 3. 상품 등록

### 3.1 크레딧 패키지 상품 (일회성 결제)

#### 스타터 패키지
| 항목 | 값 |
|------|-----|
| Product Name | `스타터 크레딧 패키지` |
| Description | `100 크레딧 - 이미지 5회 생성 (20장)` |
| Pricing | One-time payment |
| Price (KRW) | ₩10,000 |
| Price (USD) | $7 |

**Variant 생성 후 → Variant ID 복사 → `LEMONSQUEEZY_VARIANT_STARTER`**

#### 베이직 패키지
| 항목 | 값 |
|------|-----|
| Product Name | `베이직 크레딧 패키지` |
| Description | `300 크레딧 (+7% 보너스) - 이미지 15회 생성 (60장)` |
| Pricing | One-time payment |
| Price (KRW) | ₩28,000 |
| Price (USD) | $20 |

**Variant ID → `LEMONSQUEEZY_VARIANT_BASIC`**

#### 프로 패키지
| 항목 | 값 |
|------|-----|
| Product Name | `프로 크레딧 패키지` |
| Description | `1,000 크레딧 (+10% 보너스) - 이미지 50회 생성 (200장)` |
| Pricing | One-time payment |
| Price (KRW) | ₩90,000 |
| Price (USD) | $64 |

**Variant ID → `LEMONSQUEEZY_VARIANT_PRO`**

#### 비즈니스 패키지
| 항목 | 값 |
|------|-----|
| Product Name | `비즈니스 크레딧 패키지` |
| Description | `3,000 크레딧 (+17% 보너스) - 이미지 150회 생성 (600장)` |
| Pricing | One-time payment |
| Price (KRW) | ₩250,000 |
| Price (USD) | $179 |

**Variant ID → `LEMONSQUEEZY_VARIANT_BUSINESS`**

---

### 3.2 구독 상품 (월간 결제)

#### Plus 구독
| 항목 | 값 |
|------|-----|
| Product Name | `FlowStudio Plus` |
| Description | `월 100 크레딧 + 100GB 저장공간 + 워터마크 제거` |
| Pricing | Subscription (Monthly) |
| Price (KRW) | ₩9,900/월 |
| Price (USD) | $7/월 |

**Variant ID → `LEMONSQUEEZY_VARIANT_SUB_PLUS`**

#### Pro 구독
| 항목 | 값 |
|------|-----|
| Product Name | `FlowStudio Pro` |
| Description | `월 300 크레딧 + 500GB 저장공간 + API 접근` |
| Pricing | Subscription (Monthly) |
| Price (KRW) | ₩29,900/월 |
| Price (USD) | $21/월 |

**Variant ID → `LEMONSQUEEZY_VARIANT_SUB_PRO`**

#### Business 구독
| 항목 | 값 |
|------|-----|
| Product Name | `FlowStudio Business` |
| Description | `월 1,000 크레딧 + 1TB 저장공간 + 팀 협업 (5명)` |
| Pricing | Subscription (Monthly) |
| Price (KRW) | ₩99,000/월 |
| Price (USD) | $71/월 |

**Variant ID → `LEMONSQUEEZY_VARIANT_SUB_BUSINESS`**

---

### 3.3 Variant ID 찾기

1. **Products** 메뉴에서 상품 클릭
2. **Variants** 탭 클릭
3. 각 Variant의 ID 확인 (URL에서 확인 가능)
   - 예: `https://app.lemonsqueezy.com/products/12345/variants/67890`
   - Variant ID = `67890`

---

## 4. 환경 변수 설정

### 4.1 API Key 발급

1. **Settings** → **API** 이동
2. **Create API Key** 클릭
3. 키 이름 입력 (예: `FlowStudio Production`)
4. 생성된 API Key 복사 (한 번만 표시됨!)

### 4.2 .env 파일 설정

```env
# =====================================================
# LemonSqueezy 설정
# =====================================================

# API 설정
LEMONSQUEEZY_API_KEY=your_api_key_here
LEMONSQUEEZY_STORE_ID=your_store_id_here
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret_here

# 크레딧 패키지 Variant IDs
LEMONSQUEEZY_VARIANT_STARTER=123456
LEMONSQUEEZY_VARIANT_BASIC=123457
LEMONSQUEEZY_VARIANT_PRO=123458
LEMONSQUEEZY_VARIANT_BUSINESS=123459

# 구독 플랜 Variant IDs
LEMONSQUEEZY_VARIANT_SUB_PLUS=123460
LEMONSQUEEZY_VARIANT_SUB_PRO=123461
LEMONSQUEEZY_VARIANT_SUB_BUSINESS=123462
```

---

## 5. Webhook 설정

### 5.1 Webhook URL 등록

1. **Settings** → **Webhooks** 이동
2. **Add Endpoint** 클릭
3. 설정:
   - **URL**: `https://your-domain.com/api/payment/webhook`
   - **Secret**: 자동 생성 또는 직접 입력 → `LEMONSQUEEZY_WEBHOOK_SECRET`에 저장

### 5.2 이벤트 선택

다음 이벤트를 선택하여 활성화:

#### 주문 관련
- [x] `order_created` - 일회성 결제 완료
- [x] `order_refunded` - 환불 처리

#### 구독 관련
- [x] `subscription_created` - 신규 구독
- [x] `subscription_updated` - 구독 정보 변경
- [x] `subscription_cancelled` - 구독 취소
- [x] `subscription_resumed` - 구독 재개
- [x] `subscription_expired` - 구독 만료
- [x] `subscription_paused` - 구독 일시정지
- [x] `subscription_unpaused` - 구독 재시작
- [x] `subscription_payment_success` - 구독 결제 성공 (갱신)
- [x] `subscription_payment_failed` - 구독 결제 실패
- [x] `subscription_payment_recovered` - 결제 복구

### 5.3 Webhook 서명 검증

FlowStudio는 자동으로 Webhook 서명을 검증합니다:

```typescript
// lib/payment/webhook.ts 에서 자동 처리
const signature = request.headers.get("x-signature");
// HMAC-SHA256으로 검증
```

---

## 6. 테스트

### 6.1 테스트 모드 활성화

1. LemonSqueezy 대시보드에서 **Test Mode** 토글 활성화
2. 테스트용 상품/Variant 생성 (프로덕션과 별도)
3. 테스트용 환경 변수 설정

### 6.2 테스트 결제

1. 테스트 카드 정보:
   - 카드 번호: `4242 4242 4242 4242`
   - 만료일: 미래 날짜
   - CVC: 아무 숫자 3자리

2. 결제 플로우 테스트:
   - 크레딧 패키지 구매 → 크레딧 즉시 지급 확인
   - 구독 시작 → 월 크레딧 지급 확인
   - 구독 갱신 → 크레딧 재지급 확인
   - 구독 취소 → 상태 변경 확인

### 6.3 Webhook 테스트

1. **Settings** → **Webhooks** → **Send Test Event**
2. 각 이벤트 타입별로 테스트
3. 서버 로그에서 처리 결과 확인

### 6.4 로컬 개발 환경 테스트

로컬에서 Webhook 테스트 시 ngrok 등 터널링 도구 사용:

```bash
# ngrok 설치 후
ngrok http 3000

# 생성된 URL을 Webhook URL로 등록
# 예: https://abc123.ngrok.io/api/payment/webhook
```

---

## 7. 프로덕션 체크리스트

### 배포 전 확인사항

- [ ] 테스트 모드 비활성화
- [ ] 프로덕션 API Key 발급 및 설정
- [ ] 프로덕션 Webhook URL 등록
- [ ] 모든 Variant ID 프로덕션 값으로 교체
- [ ] HTTPS 활성화 확인
- [ ] Webhook Secret 설정 확인

### 모니터링

- LemonSqueezy 대시보드에서 결제/구독 현황 확인
- 서버 로그에서 Webhook 처리 결과 모니터링
- 크레딧 지급 내역 DB 확인

---

## 8. 환경 변수 요약

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `LEMONSQUEEZY_API_KEY` | API 인증 키 | `eyJ...` |
| `LEMONSQUEEZY_STORE_ID` | 스토어 ID | `12345` |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Webhook 서명 검증 키 | `whsec_...` |
| `LEMONSQUEEZY_VARIANT_STARTER` | 스타터 패키지 Variant ID | `67890` |
| `LEMONSQUEEZY_VARIANT_BASIC` | 베이직 패키지 Variant ID | `67891` |
| `LEMONSQUEEZY_VARIANT_PRO` | 프로 패키지 Variant ID | `67892` |
| `LEMONSQUEEZY_VARIANT_BUSINESS` | 비즈니스 패키지 Variant ID | `67893` |
| `LEMONSQUEEZY_VARIANT_SUB_PLUS` | Plus 구독 Variant ID | `67894` |
| `LEMONSQUEEZY_VARIANT_SUB_PRO` | Pro 구독 Variant ID | `67895` |
| `LEMONSQUEEZY_VARIANT_SUB_BUSINESS` | Business 구독 Variant ID | `67896` |

---

## 9. 문제 해결

### Webhook이 작동하지 않는 경우

1. Webhook URL이 HTTPS인지 확인
2. `LEMONSQUEEZY_WEBHOOK_SECRET` 값 확인
3. 서버 로그에서 에러 메시지 확인
4. LemonSqueezy 대시보드에서 Webhook 전송 기록 확인

### 크레딧이 지급되지 않는 경우

1. Variant ID가 올바른지 확인
2. Webhook 이벤트가 정상 수신되는지 확인
3. DB에서 CreditTransaction 레코드 확인
4. 결제 상태가 `paid`인지 확인

### 구독 상태가 업데이트되지 않는 경우

1. `subscription_*` 이벤트가 활성화되어 있는지 확인
2. Subscription 테이블에서 `externalId` 매핑 확인
3. Webhook 처리 로그 확인

---

## 10. 참고 문서

- [LemonSqueezy API 문서](https://docs.lemonsqueezy.com/api)
- [LemonSqueezy Webhook 문서](https://docs.lemonsqueezy.com/help/webhooks)
- [LemonSqueezy 한국 결제 지원](https://docs.lemonsqueezy.com/help/payments/payment-methods)
