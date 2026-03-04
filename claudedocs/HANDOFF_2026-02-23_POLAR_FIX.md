# 핸드오프 - 2026-02-23 Polar 결제 수정

## 빌드 상태
- 타입 체크: ✅
- 빌드: ✅ (Vercel 프로덕션 배포 완료)
- 린트: ✅

## 완료된 작업

### 1. Polar Checkout 401 에러 수정
- **엔드포인트**: `/v1/checkouts/custom` → `/v1/checkouts` (deprecated 제거)
- **요청 바디**: `product_id: string` → `products: [string]` (배열 형식)
- **파일**: `lib/payment/checkout.ts`

### 2. Vercel 환경변수 개행문자(\n) 오염 수정
- **근본 원인**: `echo` 명령으로 환경변수 설정 시 trailing newline 포함
- **영향 범위**: 14개 POLAR_* 환경변수 전부 오염
- **핵심 증상**: `POLAR_ENVIRONMENT="production\n"` → sandbox 서버 폴백 → production 토큰으로 sandbox 호출 → 401
- **수정**: `printf '%s'`로 전체 환경변수 재설정
- **교훈**: Vercel env 설정 시 반드시 `printf '%s' "value" | vercel env add` 사용

### 3. Polar 웹훅 엔드포인트 활성화
- FlowStudio 웹훅이 `enabled: false` 상태 → `enabled: true`로 변경
- Polar API: `PATCH /v1/webhooks/endpoints/{id}/`
- Endpoint ID: `8555f7ae-e95c-4b4b-8340-01855582b127`
- Webhook secret 일치 확인 완료

### 4. Pricing 페이지 USD 표시 통일
- Polar가 USD 결제이므로 locale 무관하게 항상 달러 가격 표시
- `getPackagePrice()`, `getPlanPrice()`, 연간 월환산, CheckoutModal 전부 USD
- **파일**: `app/[locale]/(main)/pricing/page.tsx`

### 5. 크레딧 카드 정렬 수정
- CardDescription `min-h-[2.5rem]` + flex 정렬로 줄바꿈 시에도 높이 일관
- CardContent `flex-col flex-1 justify-end`로 버튼 하단 고정

### 6. Refund 시 크레딧 자동 회수 핸들러 추가
- `onOrderRefunded` 핸들러 추가 (`app/api/webhooks/polar/route.ts`)
- 원래 purchase 트랜잭션 조회 → 동일 크레딧 차감 → refund 기록 생성

## 커밋 내역
- `e7b59b9` fix: Polar checkout 401 에러 수정 (엔드포인트 + 요청 바디)
- `5b9f833` fix: pricing 페이지 USD 표시로 통일
- `222233c` fix: 크레딧 패키지 카드 정렬 통일 (버튼 하단 고정)
- `57ca036` feat: refund 시 크레딧 자동 회수 (onOrderRefunded 핸들러 추가)

## 다음 작업: Settings 크레딧 탭 불일치 수정

### 증상
- **헤더 CreditBadge**: 195 (정상)
- **Settings 크레딧 탭**: -45 (비정상)

### 분석 현황
- Settings 크레딧 탭 → `GET /api/user/profile` → `User.creditBalance` 필드 직접 조회
- 헤더 CreditBadge → `components/layout/CreditBadge.tsx` (다른 소스 사용 추정)
- **`User.creditBalance`가 DB에서 -45**: 웹훅 비활성 상태에서 refund webhook만 처리되어 크레딧 차감만 발생한 것으로 추정

### 조사 필요 파일
- `components/layout/CreditBadge.tsx` — 헤더 크레딧 195의 데이터 소스 확인
- `lib/user/profile.ts:32` — `User.creditBalance` 조회
- DB 직접 확인: `User.creditBalance` vs `Credit.balance` 값 비교
- 두 값을 일치시키거나, settings 페이지가 올바른 소스를 읽도록 수정

## 미해결 이슈
- `app/api/checkout/route.ts` — 미사용 라우트 (`@polar-sh/nextjs` Checkout 핸들러). 프론트엔드에서 호출하지 않음. 정리 검토 필요
- `lib/payment/webhook.ts` — 수동 웹훅 핸들러. 실제 라우트에서 미사용. 정리 검토 필요

## 환경 설정 참고
- Vercel env 설정 시: `printf '%s' "value" | vercel env add KEY production` (echo 사용 금지)
- Polar 웹훅 endpoint ID: `8555f7ae-e95c-4b4b-8340-01855582b127`
- Polar org ID: `e6accd82-e19e-4dd7-8444-ff6ef5925ff6`
