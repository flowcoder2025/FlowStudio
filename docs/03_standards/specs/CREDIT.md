# CREDIT - 크레딧 시스템 스펙

> SPEC_KEY: CREDIT
> 버전: 1.0.0
> PRD 참조: §8 수익화 모델, §7.2.3 Credit 시스템

---

## 개요

FlowStudio 크레딧 기반 과금 시스템. 사용량 기반 결제, FIFO 만료 관리, 2단계 차감(Hold/Capture) 포함.

---

<!-- FUNCTIONAL:BEGIN -->

## 기능 요소

### Contract: CREDIT_FUNC_BALANCE

- **What**: 크레딧 잔액 조회
- **Why**: 실시간 잔액 확인
- **Acceptance Criteria**:
  - 총 잔액 반환
  - 만료 예정 크레딧 별도 표시 (7일 내)
- **Evidence**:
  - code: `app/api/credits/balance/route.ts` (예정)
  - code: `lib/credits/getBalance.ts` (예정)

### Contract: CREDIT_FUNC_HOLD

- **What**: 크레딧 예약 (Hold)
- **Why**: 생성 실패 시 자동 환불 지원
- **Acceptance Criteria**:
  - 작업 시작 전 필요 크레딧 예약
  - CreditLedger에 HELD 상태로 기록
  - requestId로 멱등성 보장
- **Evidence**:
  - code: `lib/credits/holdCredits.ts` (예정)
  - type: `prisma/schema.prisma::CreditLedger` (예정)

### Contract: CREDIT_FUNC_CAPTURE

- **What**: 크레딧 확정 (Capture)
- **Why**: 작업 성공 시 실제 차감
- **Acceptance Criteria**:
  - HELD → CAPTURED 상태 전환
  - FIFO 방식으로 만료 임박 크레딧 우선 차감
  - CreditTransaction 기록
- **Evidence**:
  - code: `lib/credits/captureCredits.ts` (예정)

### Contract: CREDIT_FUNC_REFUND

- **What**: 크레딧 환불
- **Why**: 작업 실패 시 자동 복구
- **Acceptance Criteria**:
  - HELD → REFUNDED 상태 전환
  - 잔액 자동 복구
- **Evidence**:
  - code: `lib/credits/refundCredits.ts` (예정)

### Contract: CREDIT_FUNC_PURCHASE

- **What**: 크레딧 구매
- **Why**: 수익화
- **Acceptance Criteria**:
  - 100/300/1000/3000 크레딧 패키지
  - 구매 크레딧은 무기한 유효
  - PortOne 결제 연동
- **Evidence**:
  - code: `app/api/credits/purchase/route.ts` (예정)
  - code: `app/api/webhooks/portone/route.ts` (예정)

### Contract: CREDIT_FUNC_EXPIRY

- **What**: 크레딧 만료 처리
- **Why**: 무료 크레딧 관리
- **Acceptance Criteria**:
  - 가입 보너스: 30일 만료
  - 추천 보너스: 30일 만료
  - 사업자 보너스: 90일 만료
  - 만료 7일 전 알림
- **Evidence**:
  - code: `lib/credits/checkExpiry.ts` (예정)
  - code: `app/api/cron/expire-credits/route.ts` (예정)

<!-- FUNCTIONAL:END -->

---

<!-- DESIGN:BEGIN -->

## 디자인 요소

### Contract: CREDIT_DESIGN_HEADER

- **What**: 헤더 크레딧 표시
- **Why**: 항상 잔액 확인 가능 (UX 원칙 3)
- **Acceptance Criteria**:
  - 현재 잔액 숫자 표시
  - 클릭 시 상세 페이지 이동
- **Evidence**:
  - ui: `components/layout/Header.tsx::CreditBadge` (예정)

### Contract: CREDIT_DESIGN_INSUFFICIENT

- **What**: 크레딧 부족 모달
- **Why**: 실패 없는 경험 (UX 원칙 2)
- **Acceptance Criteria**:
  - 부족 크레딧 수량 표시
  - 즉시 구매 버튼
  - 취소 시 워크플로우 복귀
- **Evidence**:
  - ui: `components/credits/InsufficientModal.tsx` (예정)

### Contract: CREDIT_DESIGN_PURCHASE

- **What**: 크레딧 구매 페이지
- **Why**: 명확한 가격 정보
- **Acceptance Criteria**:
  - 패키지별 가격/할인율 표시
  - 결제 버튼
- **Evidence**:
  - ui: `app/(main)/credits/page.tsx` (예정)

<!-- DESIGN:END -->

---

## 가격표

| 크레딧 | 가격 | 단가 | 할인율 |
|--------|------|------|--------|
| 100 | ₩10,000 | ₩100 | - |
| 300 | ₩28,000 | ₩93 | 7% |
| 1,000 | ₩90,000 | ₩90 | 10% |
| 3,000 | ₩250,000 | ₩83 | 17% |

## 소비 테이블

| 기능 | 크레딧 |
|------|--------|
| 2K 이미지 생성 | 5 |
| 4K 업스케일 | 10 |
| 배경 제거 | 0 (무료) |
| 색상 전송 | 0 (무료) |

---

## 참조

- PRD §8 수익화 모델
- PRD §7.2.3 Credit 시스템
- PRD §5.3 크레딧 부족 시 플로우
