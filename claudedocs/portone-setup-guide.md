# 포트원 V2 + 카카오페이 결제 시스템 설정 가이드

## ✅ 구현 완료 내역

### 백엔드 API
1. ✅ **크레딧 잔액 조회 API** (`/api/credits/balance`)
2. ✅ **포트원 웹훅 처리 API** (`/api/credits/portone/webhook`)
3. ✅ **이미지 생성 API 크레딧 차감** (`/api/generate`)

### 프론트엔드 컴포넌트
4. ✅ **크레딧 잔액 표시** (`components/CreditBalance.tsx`)
5. ✅ **크레딧 충전 페이지** (`app/credits/purchase/page.tsx`)
6. ✅ **Header 통합** (CreditBalance 컴포넌트 추가)

### 유틸리티
7. ✅ **크레딧 관리 시스템** (`lib/utils/creditManager.ts`)
8. ✅ **포트원 웹훅 검증** (`lib/utils/portoneWebhook.ts`)
9. ✅ **에러 처리** (`InsufficientCreditsError` 추가)

---

## 🔧 환경 변수 설정

포트원 V2 결제 시스템을 사용하려면 다음 환경 변수를 `.env.local`에 추가해야 합니다:

```bash
# ============================================
# 포트원 V2 (PortOne Payment Gateway)
# ============================================

# 서버 사이드 (비공개)
PORTONE_API_SECRET="포트원_API_시크릿_키"
PORTONE_STORE_ID="store-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
PORTONE_WEBHOOK_SECRET="포트원_웹훅_시크릿_키"

# 클라이언트 사이드 (공개 가능)
NEXT_PUBLIC_PORTONE_STORE_ID="store-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
NEXT_PUBLIC_PORTONE_CHANNEL_KEY="channel-key-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 환경 변수 발급 방법

#### 1. 포트원 계정 생성 및 로그인
- 포트원 콘솔: https://console.portone.io/
- 회원가입 또는 기존 계정으로 로그인

#### 2. 상점(Store) 생성
1. 콘솔 → **상점 관리** → **신규 상점 생성**
2. 상점 정보 입력 (사업자 정보 필요)
3. 생성된 **Store ID** 복사 → `PORTONE_STORE_ID` 및 `NEXT_PUBLIC_PORTONE_STORE_ID`

#### 3. API 시크릿 키 발급
1. 콘솔 → **개발자 센터** → **API 키 관리**
2. **API Secret** 생성 → `PORTONE_API_SECRET`
3. ⚠️ **중요**: 이 키는 서버에서만 사용하며 절대 공개하지 마세요

#### 4. 카카오페이 채널 등록
1. 콘솔 → **결제 연동** → **채널 관리**
2. **카카오페이** 선택 → 채널 추가
3. 카카오페이 CID (상점 ID) 입력 (카카오페이 가맹 계약 필요)
4. 생성된 **Channel Key** 복사 → `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`

#### 5. 웹훅(Webhook) 설정
1. 콘솔 → **개발자 센터** → **웹훅 설정**
2. **웹훅 URL** 등록:
   - 개발: `http://localhost:3000/api/credits/portone/webhook`
   - 프로덕션: `https://your-domain.com/api/credits/portone/webhook`
3. **웹훅 이벤트** 선택:
   - ✅ `Transaction.Paid` (결제 완료)
   - ✅ `Transaction.Failed` (결제 실패)
   - ✅ `Transaction.Cancelled` (결제 취소)
4. **웹훅 시크릿** 생성 → `PORTONE_WEBHOOK_SECRET`

---

## 🚀 테스트 환경 설정

### 1. 포트원 테스트 모드

포트원은 테스트 환경과 실제 운영 환경을 분리하여 제공합니다:

**테스트 환경**:
- Store ID가 `store-test-` 로 시작
- 실제 결제 없이 결제 플로우 테스트 가능
- 카카오페이 테스트 결제 지원

**운영 환경**:
- Store ID가 `store-` 로 시작
- 실제 결제 진행
- 사업자 등록 및 카카오페이 가맹 계약 필요

### 2. 로컬 개발 환경 설정

```bash
# .env.local (테스트 환경)
PORTONE_API_SECRET="test_secret_..."
PORTONE_STORE_ID="store-test-..."
PORTONE_WEBHOOK_SECRET="test_webhook_secret"
NEXT_PUBLIC_PORTONE_STORE_ID="store-test-..."
NEXT_PUBLIC_PORTONE_CHANNEL_KEY="channel-key-test-..."
```

### 3. 로컬 웹훅 테스트 (ngrok 사용)

포트원 웹훅은 공개 URL이 필요합니다. 로컬 개발 시 ngrok를 사용:

```bash
# ngrok 설치 (macOS)
brew install ngrok

# ngrok 실행 (포트 3000 터널링)
ngrok http 3000

# ngrok이 제공하는 HTTPS URL을 포트원 콘솔에 등록
# 예: https://abc123.ngrok.io/api/credits/portone/webhook
```

---

## 📊 데이터베이스 마이그레이션

크레딧 시스템이 작동하려면 데이터베이스 마이그레이션이 필요합니다:

### 1. 마이그레이션 파일 확인

```bash
ls prisma/migrations/20251210_add_credit_system/
```

`migration.sql` 파일이 있어야 합니다.

### 2. Supabase SQL Editor에서 마이그레이션 실행

1. Supabase Dashboard → **SQL Editor** → **New Query**
2. `prisma/migrations/20251210_add_credit_system/migration.sql` 내용 전체 복사
3. SQL Editor에 붙여넣기 후 **Run** 실행

### 3. 마이그레이션 확인

```sql
-- Supabase SQL Editor에서 실행
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('Credit', 'CreditTransaction', 'Subscription');
```

3개 테이블이 모두 나타나면 성공입니다.

---

## 🎨 프론트엔드 사용법

### 1. 크레딧 잔액 확인

Header에 자동으로 표시됩니다:
- 로그인 후 우측 상단에 크레딧 잔액 표시
- 클릭 시 `/credits/purchase` 페이지로 이동

### 2. 크레딧 충전

`/credits/purchase` 페이지에서:
1. 원하는 패키지 선택 (스타터, 베이직, 프로, 비즈니스)
2. **카카오페이로 구매** 버튼 클릭
3. 포트원 SDK가 카카오페이 결제창 열기
4. 카카오페이 앱 또는 웹에서 결제 진행
5. 결제 완료 후 자동으로 크레딧 지급 (최대 30초)

### 3. 이미지 생성 (크레딧 차감)

`/create`, `/edit` 등에서 이미지 생성 시:
- 2K 생성 (4장): 자동으로 20 크레딧 차감
- 크레딧 부족 시: 402 에러와 함께 충전 안내 메시지

---

## 🔒 보안 체크리스트

### 필수 보안 조치

- [x] ✅ API 시크릿은 서버 환경 변수에만 저장 (클라이언트 노출 금지)
- [x] ✅ 웹훅 서명 검증 (`verifyPortoneWebhookSignature`)
- [x] ✅ 중복 결제 방지 (`CreditTransaction` 중복 체크)
- [x] ✅ 금액 검증 (웹훅 금액 vs 패키지 가격)
- [x] ✅ 크레딧 차감 전 잔액 확인
- [ ] ⚠️ HTTPS 사용 (프로덕션 필수)
- [ ] ⚠️ Rate Limiting (DDoS 방지)

### 프로덕션 배포 전 확인사항

1. **환경 변수 검증**:
   ```bash
   # 모든 필수 환경 변수가 설정되었는지 확인
   - PORTONE_API_SECRET
   - PORTONE_STORE_ID
   - PORTONE_WEBHOOK_SECRET
   - NEXT_PUBLIC_PORTONE_STORE_ID
   - NEXT_PUBLIC_PORTONE_CHANNEL_KEY
   ```

2. **웹훅 URL 업데이트**:
   - 포트원 콘솔에서 프로덕션 URL로 변경
   - 예: `https://flowstudio.com/api/credits/portone/webhook`

3. **실제 카카오페이 계약**:
   - 카카오페이 가맹점 계약 필요
   - CID (카카오페이 상점 ID) 발급
   - 포트원 콘솔에서 실제 CID로 변경

4. **테스트 결제**:
   - 최소 금액으로 실제 결제 테스트
   - 웹훅 수신 및 크레딧 지급 확인
   - 환불 프로세스 테스트

---

## 🐛 트러블슈팅

### 문제 1: 웹훅이 수신되지 않음

**증상**: 결제 완료 후 크레딧이 지급되지 않음

**해결방법**:
1. 포트원 콘솔 → **웹훅 로그** 확인
2. 웹훅 URL이 올바른지 확인 (HTTPS, 공개 접근 가능)
3. Next.js 서버 로그 확인:
   ```bash
   # 서버 로그에서 웹훅 수신 여부 확인
   [Webhook] 수신: { type: 'Transaction.Paid', paymentId: '...' }
   ```
4. ngrok 사용 시 터널이 활성화되어 있는지 확인

### 문제 2: 서명 검증 실패

**증상**: 웹훅 수신되지만 "Invalid signature" 에러

**해결방법**:
1. `PORTONE_WEBHOOK_SECRET` 환경 변수 확인
2. 포트원 콘솔에서 웹훅 시크릿 재생성
3. 서버 재시작 (환경 변수 반영)

### 문제 3: 크레딧 부족 에러

**증상**: 이미지 생성 시 402 에러

**해결방법**:
1. `/api/credits/balance` 호출하여 실제 잔액 확인
2. Prisma Studio로 `Credit` 테이블 확인:
   ```bash
   npx prisma studio
   ```
3. 테스트용 크레딧 수동 지급 (Prisma Studio에서):
   - `Credit` 테이블에서 사용자 찾기
   - `balance` 필드에 원하는 크레딧 입력 (예: 1000)

### 문제 4: 중복 결제 처리

**증상**: 같은 결제가 여러 번 웹훅으로 수신됨

**해결방법**:
- 이미 구현됨: `CreditTransaction`에서 `paymentId` 중복 체크
- 로그 확인: `[Webhook] 이미 처리된 결제: payment_xxx`

---

## 📈 모니터링 및 로그

### 웹훅 로그 확인

서버 로그에서 다음 메시지 확인:

```bash
# 정상 처리
[Webhook] 수신: { type: 'Transaction.Paid', paymentId: 'payment_xxx', status: 'PAID' }
[Webhook] 크레딧 지급 완료: { userId: 'xxx', credits: 100, newBalance: 150 }

# 중복 처리
[Webhook] 이미 처리된 결제: payment_xxx

# 서명 검증 실패
[Webhook] 서명 검증 실패

# 금액 불일치
[Webhook] 금액 불일치: { expected: 10000, actual: 9000 }
```

### 데이터베이스 모니터링

```sql
-- 최근 크레딧 거래 내역 (Supabase SQL Editor)
SELECT
  u.email,
  ct.amount,
  ct.type,
  ct.description,
  ct."createdAt"
FROM "CreditTransaction" ct
JOIN "User" u ON ct."userId" = u.id
ORDER BY ct."createdAt" DESC
LIMIT 20;

-- 크레딧 잔액 현황
SELECT
  u.email,
  c.balance,
  c."updatedAt"
FROM "Credit" c
JOIN "User" u ON c."userId" = u.id
ORDER BY c.balance DESC;
```

---

## 🎯 다음 단계

### 추가 기능 구현 (선택)

1. **업스케일링 API** (`/api/upscale`):
   - 2K → 4K 업스케일링 (10 크레딧 차감)
   - 구현 가이드: `claudedocs/credit-system-implementation.md` 참조

2. **구독 플랜 활성화**:
   - FREE, PLUS, PRO, ENTERPRISE 티어
   - 구독자 혜택: 워터마크 제거, 우선 처리, 저장 공간 확대

3. **레퍼럴 시스템**:
   - 친구 초대 시 양쪽 모두 40 크레딧 지급
   - 구현 가이드: `claudedocs/credit-system-implementation.md` 참조

4. **관리자 대시보드**:
   - 크레딧 수동 지급/차감
   - 결제 내역 조회
   - 사용자 통계

---

## 📚 참고 문서

- **포트원 V2 공식 문서**: https://developers.portone.io/
- **카카오페이 개발 가이드**: https://developers.kakao.com/docs/latest/ko/kakaopay/common
- **구현 가이드**: `claudedocs/credit-system-implementation.md`
- **가격 전략**: `claudedocs/pricing-strategy.md`

---

## ❓ 자주 묻는 질문 (FAQ)

### Q1. 테스트 결제 시 실제 돈이 빠져나가나요?
**A**: 포트원 테스트 환경(`store-test-`)을 사용하면 실제 결제 없이 테스트 가능합니다. 테스트 환경에서는 가상 카드로 결제 플로우를 테스트할 수 있습니다.

### Q2. 크레딧 유효기간이 있나요?
**A**: 없습니다. 한 번 충전한 크레딧은 영구적으로 사용 가능합니다.

### Q3. 환불은 어떻게 하나요?
**A**: 포트원 콘솔 또는 API를 통해 환불 가능합니다. 환불 시 크레딧도 자동으로 차감되도록 별도 구현이 필요합니다 (현재 미구현).

### Q4. 카카오페이 외 다른 결제 수단도 지원하나요?
**A**: 포트원은 다양한 결제 수단(토스페이, 네이버페이, 신용카드 등)을 지원합니다. `channelKey`만 변경하면 다른 결제 수단 추가 가능합니다.

### Q5. 이미지 생성 실패 시 크레딧이 차감되나요?
**A**: 아니요. 크레딧은 이미지 생성 성공 후에만 차감됩니다.
