# Handoff - 2026-02-23 Settings Credit Fix

## Build Status
- Type check: ✅ PASS
- Build: ✅ PASS
- Lint: ✅ PASS

## Completed Work

### 1. Settings 크레딧 잔액 불일치 수정 (013e1c4)
- **문제**: Settings 페이지가 레거시 `User.creditBalance` 필드를 표시 → 실제 `Credit.balance` 테이블과 불일치
- **수정**: `/api/credits/balance` API 호출로 변경, hold 크레딧 표시 추가
- **파일**: `app/[locale]/(main)/settings/page.tsx`, `messages/en/common.json`, `messages/ko/common.json`

### 2. 크레딧 이력 + 결제 관리 탭 추가 (9300cb4)
- **크레딧 탭**: 잔액 아래 거래 내역 리스트 (타입별 색상, 5건 초과 시 더보기/접기)
- **결제 관리 탭**: 현재 구독 플랜 정보 + 결제 내역 리스트
- 기존 API 활용: `/api/credits/history`, `/api/payment/history`, `/api/payment/subscription`
- **파일**: `app/[locale]/(main)/settings/page.tsx`, `messages/en/common.json`, `messages/ko/common.json`

### 3. 결제 관리 환불 항목 누락 수정 (1aede35)
- **문제**: `getPaymentHistory`가 `type: "purchase"`만 필터링 → refund 누락
- **수정**: `type: { in: ["purchase", "refund"] }`로 변경, 환불 항목 badge + 색상 구분
- **파일**: `lib/payment/history.ts`, `app/[locale]/(main)/settings/page.tsx`, `messages/en/common.json`, `messages/ko/common.json`

### 4. Polar webhook checkout.expired 에러 수정 (2f5cc7c)
- **문제**: Polar SDK `Webhooks()`가 `checkout.expired` 등 알 수 없는 이벤트에서 `SDKValidationError` throw
- **수정**: webhook 핸들러를 래퍼 함수로 감싸서 "Unknown event type" catch → 200 반환
- **문제2**: Settings billing 탭에서 API 실패 시 JSON 파싱 에러 ("Unexpected token" 에러)
- **수정2**: `Promise.all` → `Promise.allSettled`로 변경, 한쪽 API 실패해도 다른 쪽 정상 표시
- **파일**: `app/api/webhooks/polar/route.ts`, `app/[locale]/(main)/settings/page.tsx`

## Commits
- `013e1c4` fix: settings 크레딧 잔액 불일치 수정
- `04299c8` chore: trigger redeploy
- `9300cb4` feat: settings에 크레딧 이력 및 결제 관리 탭 추가
- `1aede35` fix: 결제 관리 탭에 환불(refund) 항목 포함
- `2f5cc7c` fix: Polar webhook checkout.expired 에러 및 billing fetch 방어 처리

## Unresolved Issues
- 없음

## Notes
- `User.creditBalance` 레거시 필드는 여전히 DB 스키마에 존재하지만 settings 페이지에서는 더 이상 사용하지 않음
- 결제 내역의 `amount` (실제 결제 금액)는 CreditTransaction에 저장되지 않아 0으로 표시됨 — 향후 Polar webhook에서 금액 정보 저장 시 개선 가능
- Polar SDK(@polar-sh/nextjs ^0.9.3)가 `checkout.expired` 이벤트를 지원하지 않음 — SDK 업데이트 시 래퍼 제거 가능
