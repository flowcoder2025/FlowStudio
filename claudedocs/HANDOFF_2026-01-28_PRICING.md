# 핸드오프 - 2026-01-28 (가격 정책 업데이트)

## 빌드 상태
- 타입 체크: ✅ 통과
- 빌드: ✅ 통과
- 린트: ✅ 통과 (기존 img 경고만 존재)

---

## 완료된 작업

### 1. 가격 정책 업데이트 (웹사이트 기준 동기화)

#### 크레딧 패키지
| 패키지 | 크레딧 | KRW | USD | 할인 |
|--------|--------|-----|-----|------|
| 스타터 | 100 | ₩10,000 | $7 | - |
| 베이직 | 300 | ₩28,000 | $20 | 7% |
| 프로 | 1,000 | ₩90,000 | $64 | 10% |
| 비즈니스 | 3,000 | ₩250,000 | $179 | 17% |

#### 구독 플랜 (기능 기반)
| 플랜 | KRW | USD | 저장공간 | 동시생성 | 워터마크 | 월 크레딧 |
|------|-----|-----|---------|---------|---------|----------|
| Free | 무료 | Free | 1GB | 1 | 포함 | 0 |
| Plus | ₩9,900 | $7 | 100GB | 3 | 제거 | 100 |
| Pro | ₩29,900 | $21 | 500GB | 5 | 제거 | 300 |
| Business | ₩99,000 | $71 | 1TB | 10 | 제거 | 1,000 |

### 2. 크레딧 유효기간 정책

| 구분 | 유효기간 | 이월 | 타입 |
|------|---------|------|------|
| 구독 크레딧 | **30일 한정** | ❌ 불가 | `subscription` |
| 구매 크레딧 | **영구 보존** | - | `purchase` |

**구현 위치:**
- `lib/payment/config.ts`: `CREDIT_VALIDITY` 설정
- `lib/payment/webhook.ts`: `grantCredits()` 함수에 `expiresInDays` 옵션 추가

### 3. 다국어 가격 표시

- locale에 따라 KRW/USD 자동 전환
- `priceFormatted` (KRW) / `priceFormattedUSD` (USD) 필드 추가
- pricing 페이지에서 `useLocale()` 사용

### 4. LemonSqueezy 연동 가이드

**문서:** `claudedocs/LEMONSQUEEZY_SETUP_GUIDE.md`

내용:
- 계정/스토어 설정
- 상품 7종 등록 가이드 (패키지 4 + 구독 3)
- 환경 변수 설정 (10개)
- Webhook 이벤트 설정
- 테스트 방법
- 문제 해결 가이드

---

## 변경된 파일

### 핵심 파일
| 파일 | 변경 내용 |
|------|----------|
| `lib/payment/config.ts` | 가격 데이터, 구독 크레딧, CREDIT_VALIDITY |
| `lib/payment/types.ts` | priceUSD, priceFormattedUSD 필드 추가 |
| `lib/payment/webhook.ts` | grantCredits에 만료일 옵션 추가 |
| `lib/payment/checkout.ts` | monthlyCredits 옵셔널 처리 |
| `app/[locale]/(main)/pricing/page.tsx` | locale 기반 가격 표시 |

### 다국어 파일
| 파일 | 변경 내용 |
|------|----------|
| `messages/ko/common.json` | 기능 번역, FAQ 업데이트 |
| `messages/en/common.json` | 기능 번역, FAQ 업데이트 |

### 문서
| 파일 | 내용 |
|------|------|
| `claudedocs/LEMONSQUEEZY_SETUP_GUIDE.md` | 연동 가이드 (신규) |

---

## 커밋 내역

```
26fdaeb feat: 다국어 지원 개선 및 LemonSqueezy 가이드 추가
48d4edb feat(payment): 가격 정책 업데이트 및 구독 크레딧 시스템 추가
```

---

## 환경 변수 (LemonSqueezy)

```env
# 필수 설정
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_WEBHOOK_SECRET=

# 크레딧 패키지 Variant IDs
LEMONSQUEEZY_VARIANT_STARTER=
LEMONSQUEEZY_VARIANT_BASIC=
LEMONSQUEEZY_VARIANT_PRO=
LEMONSQUEEZY_VARIANT_BUSINESS=

# 구독 플랜 Variant IDs
LEMONSQUEEZY_VARIANT_SUB_PLUS=
LEMONSQUEEZY_VARIANT_SUB_PRO=
LEMONSQUEEZY_VARIANT_SUB_BUSINESS=
```

---

## 다음 작업 (권장)

### 즉시 필요
1. **LemonSqueezy 상품 등록**
   - 가이드 문서 참고하여 7개 상품 등록
   - Variant ID 환경 변수에 설정

2. **Webhook URL 등록**
   - 프로덕션: `https://studio.flow-coder.com/api/payment/webhook`
   - 테스트: ngrok 등 터널링 사용

### 추후 개선
1. **만료 크레딧 처리 로직**
   - 30일 지난 구독 크레딧 자동 차감
   - 크론 작업 또는 사용 시점 체크

2. **크레딧 우선 사용 순서**
   - 만료 임박 크레딧 우선 사용
   - `expiresAt` 기준 정렬 후 차감

3. **설정 페이지 크레딧 표시**
   - 구독 크레딧 / 구매 크레딧 분리 표시
   - 만료일 표시

---

## 참고 사항

### 크레딧 사용 기준
- 2K 이미지 생성 1회(4장): **20 크레딧**
- 4K 업스케일링 1회(1장): **10 크레딧**

### DB 스키마 (기존 활용)
- `CreditTransaction.expiresAt`: 만료일 (null = 영구)
- `CreditTransaction.remainingAmount`: 남은 크레딧
- `CreditTransaction.type`: "subscription" | "purchase"

### 플랜 ID 변경
- `starter` → `plus` (구독 플랜)
- 기존 `starter` 구독 사용자 마이그레이션 필요 시 확인

---

## 테스트 체크리스트

- [ ] 크레딧 패키지 구매 → 영구 크레딧 지급 확인
- [ ] 구독 시작 → 30일 한정 크레딧 지급 확인
- [ ] 구독 갱신 → 새 30일 크레딧 지급 확인
- [ ] pricing 페이지 한국어/영어 가격 전환 확인
- [ ] FAQ 내용 확인
