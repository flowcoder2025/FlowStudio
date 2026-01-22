# AUTH - 인증 시스템 스펙

> SPEC_KEY: AUTH
> 버전: 1.0.0
> PRD 참조: §10.1 인증, §5.1 온보딩 플로우

---

## 개요

FlowStudio 사용자 인증 시스템. 소셜 로그인(Google, Kakao) 기반 OAuth 2.0 인증 및 NextAuth.js 세션 관리.

---

<!-- FUNCTIONAL:BEGIN -->

## 기능 요소

### Contract: AUTH_FUNC_GOOGLE_OAUTH

- **What**: Google OAuth 2.0 소셜 로그인
- **Why**: 사용자 편의성, 신뢰성 있는 인증
- **Acceptance Criteria**:
  - Google 계정으로 로그인/회원가입 가능
  - 기존 email과 자동 매칭
  - 신규 가입 시 50 무료 크레딧 지급
- **Evidence**:
  - code: `lib/auth/authOptions.ts::GoogleProvider` (예정)
  - code: `app/api/auth/[...nextauth]/route.ts` (예정)

### Contract: AUTH_FUNC_KAKAO_OAUTH

- **What**: Kakao OAuth 소셜 로그인
- **Why**: 한국 사용자 접근성 향상
- **Acceptance Criteria**:
  - Kakao 계정으로 로그인/회원가입 가능
  - 기존 email과 자동 매칭
- **Evidence**:
  - code: `lib/auth/authOptions.ts::KakaoProvider` (예정)

### Contract: AUTH_FUNC_SESSION

- **What**: NextAuth.js 세션 관리
- **Why**: 안전한 인증 상태 유지
- **Acceptance Criteria**:
  - HTTP-only 쿠키 기반 세션
  - CSRF 토큰 자동 검증
  - 세션 만료 시 자동 로그아웃
- **Evidence**:
  - code: `lib/auth/authOptions.ts::session` (예정)
  - code: `middleware.ts` (예정)

### Contract: AUTH_FUNC_CALLBACK

- **What**: 신규 가입 콜백 처리
- **Why**: 가입 보너스 지급, 추천 코드 처리
- **Acceptance Criteria**:
  - 최초 로그인 시 User 레코드 생성
  - 50 무료 크레딧 자동 지급 (30일 만료)
  - referredBy 코드 처리
- **Evidence**:
  - code: `lib/auth/authOptions.ts::callbacks.signIn` (예정)

<!-- FUNCTIONAL:END -->

---

<!-- DESIGN:BEGIN -->

## 디자인 요소

### Contract: AUTH_DESIGN_LOGIN_PAGE

- **What**: 소셜 로그인 페이지 UI
- **Why**: 간편한 로그인 경험
- **Acceptance Criteria**:
  - Google/Kakao 버튼 명확히 구분
  - 로딩 상태 표시
  - 에러 메시지 한글 표시
- **Evidence**:
  - ui: `app/(auth)/login/page.tsx` (예정)
  - ui: `components/auth/SocialLoginButtons.tsx` (예정)

### Contract: AUTH_DESIGN_HEADER_STATE

- **What**: 헤더 인증 상태 표시
- **Why**: 현재 로그인 상태 투명성
- **Acceptance Criteria**:
  - 로그인 시: 프로필 이미지 + 크레딧 잔액
  - 비로그인 시: 로그인 버튼
- **Evidence**:
  - ui: `components/layout/Header.tsx::UserMenu` (예정)

<!-- DESIGN:END -->

---

## 환경 변수

| 변수명 | 용도 | 필수 |
|--------|------|------|
| NEXTAUTH_URL | 콜백 URL | O |
| NEXTAUTH_SECRET | 세션 암호화 | O |
| GOOGLE_CLIENT_ID | Google OAuth | O |
| GOOGLE_CLIENT_SECRET | Google OAuth | O |
| KAKAO_CLIENT_ID | Kakao OAuth | △ |
| KAKAO_CLIENT_SECRET | Kakao OAuth | △ |

---

## 참조

- PRD §10.1 인증
- PRD §5.1 신규 사용자 온보딩 플로우
- NextAuth.js 공식 문서
