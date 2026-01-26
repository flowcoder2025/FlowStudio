# SPEC_SNAPSHOT - 코드 인벤토리

> 자동 생성: specctl snapshot (2026-01-27 08:39:14)

---

## 스캔 정보

| 항목 | 값 |
|------|-----|
| **생성일** | 2026-01-27 |
| **도구** | specctl v0.2.0 |
| **프로젝트** | FlowStudio_re |

---

## UI 라우트

| Route | File | SPEC_KEY |
|-------|------|----------|

---

## API 라우트

| Route | File | SPEC_KEY | Method |
|-------|------|----------|--------|
| /api/ | app/api/auth/[...nextauth]/route.ts | API | ALL |
| /api/ | app/api/images/trash/route.ts | API | GET,DELETE |
| /api/ | app/api/images/search/route.ts | API | GET |
| /api/ | app/api/images/list/route.ts | API | GET |
| /api/ | app/api/images/[id]/route.ts | API | GET,DELETE |
| /api/ | app/api/images/save/route.ts | API | POST |
| /api/ | app/api/payment/webhook/route.ts | API | POST |
| /api/ | app/api/payment/checkout/route.ts | API | GET,POST |
| /api/ | app/api/payment/subscription/route.ts | API | GET,PUT |
| /api/ | app/api/payment/history/route.ts | API | GET |
| /api/ | app/api/upscale/route.ts | API | GET,POST |
| /api/ | app/api/workflows/guide/route.ts | API | GET,POST |
| /api/ | app/api/workflows/industries/route.ts | API | GET |
| /api/ | app/api/workflows/intent/route.ts | API | GET,POST |
| /api/ | app/api/workflows/session/route.ts | API | GET,POST,PUT,DELETE |
| /api/ | app/api/user/referral/apply/route.ts | API | GET,POST |
| /api/ | app/api/user/business/verify/route.ts | API | GET,POST |
| /api/ | app/api/user/profile/route.ts | API | GET |
| /api/ | app/api/permissions/revoke/route.ts | API | POST,DELETE |
| /api/ | app/api/permissions/list/route.ts | API | GET |
| /api/ | app/api/permissions/grant/route.ts | API | POST |
| /api/ | app/api/generate/route.ts | API | GET,POST |
| /api/ | app/api/credits/balance/route.ts | API | GET |
| /api/ | app/api/credits/history/route.ts | API | GET |

---

## 이벤트 타입

> 자동화 미구현 - 수동 관리

| Event | File | SPEC_KEY |
|-------|------|----------|
| (수동 추가 필요) | - | - |

---

## 상태 목록

> 자동화 미구현 - 수동 관리

| State | File | SPEC_KEY |
|-------|------|----------|
| (수동 추가 필요) | - | - |

---

> **참고**: UI/API 라우트는 자동 스캔됨. 이벤트/상태는 수동 관리 필요.
