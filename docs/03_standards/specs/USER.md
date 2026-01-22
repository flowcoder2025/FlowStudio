# USER - 사용자 관리 스펙

> SPEC_KEY: USER
> 버전: 1.0.0
> PRD 참조: §7.2.1 User 모델, §2.1 타겟 사용자

---

## 개요

FlowStudio 사용자 프로필 및 계정 관리. 사업자 인증, 추천 시스템 포함.

---

<!-- FUNCTIONAL:BEGIN -->

## 기능 요소

### Contract: USER_FUNC_PROFILE

- **What**: 사용자 프로필 조회/수정
- **Why**: 개인화된 서비스 제공
- **Acceptance Criteria**:
  - 이름, 이메일, 프로필 이미지 조회
  - 이름 수정 가능
- **Evidence**:
  - code: `app/api/user/profile/route.ts` (예정)
  - type: `prisma/schema.prisma::User` (예정)

### Contract: USER_FUNC_BUSINESS_VERIFY

- **What**: 사업자등록번호 인증
- **Why**: B2B 고객 식별, 추가 혜택 제공
- **Acceptance Criteria**:
  - 사업자번호 형식 검증 (XXX-XX-XXXXX)
  - 인증 완료 시 businessVerified = true
  - 인증 시 90일 만료 보너스 크레딧 지급
- **Evidence**:
  - code: `app/api/user/business-verify/route.ts` (예정)

### Contract: USER_FUNC_REFERRAL

- **What**: 추천 코드 시스템
- **Why**: 바이럴 마케팅, 사용자 확보
- **Acceptance Criteria**:
  - 가입 시 고유 referralCode 자동 생성
  - 피추천인 첫 결제 시 추천인에게 100 크레딧 지급
- **Evidence**:
  - code: `lib/referral/generateCode.ts` (예정)
  - code: `app/api/referral/reward/route.ts` (예정)

<!-- FUNCTIONAL:END -->

---

<!-- DESIGN:BEGIN -->

## 디자인 요소

### Contract: USER_DESIGN_SETTINGS

- **What**: 사용자 설정 페이지
- **Why**: 계정 관리 편의성
- **Acceptance Criteria**:
  - 프로필 편집 섹션
  - 사업자 인증 섹션
  - 추천 코드 복사 기능
- **Evidence**:
  - ui: `app/(main)/settings/page.tsx` (예정)
  - ui: `components/settings/ProfileForm.tsx` (예정)

<!-- DESIGN:END -->

---

## 데이터 모델

```prisma
model User {
  id                   String    @id @default(cuid())
  name                 String?
  email                String?   @unique
  image                String?
  businessNumber       String?   @unique
  businessVerified     Boolean   @default(false)
  referralCode         String?   @unique
  referredBy           String?
  creditBalance        Int       @default(0)
}
```

---

## 참조

- PRD §7.2.1 User 모델
- PRD §2.1 타겟 사용자
