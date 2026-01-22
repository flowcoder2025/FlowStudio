# SPEC_SNAPSHOT - 코드 인벤토리

> 코드에서 자동 추출된 "현재 구현된 표면적(Inventory)"

---

## 메타 정보

| 항목 | 값 |
|------|-----|
| **생성 일시** | 2026-01-22 |
| **생성 방식** | 수동 (MVP) |
| **커버리지 범위** | UI 라우트, API 라우트, Immersive 컴포넌트 |

---

## 인벤토리 유형별 상태

| 유형 | 자동화 상태 | 항목 수 |
|------|:-----------:|:-------:|
| UI 라우트 | MVP | 10 |
| API 라우트 | MVP | 24 |
| Immersive 컴포넌트 | MVP | 9 |
| 이벤트 타입 | 미구현 | - |
| 상태 목록 | 미구현 | - |

---

## UI 라우트

> `specctl snapshot --type=ui-routes`로 자동 생성

| 경로 | 컴포넌트 | SPEC_KEY | 상태 |
|------|---------|----------|------|
| `/` | `app/(main)/page.tsx` | WORKFLOW | SYNC |
| `/login` | `app/(auth)/login/page.tsx` | AUTH | SYNC |
| `/settings` | `app/(main)/settings/page.tsx` | USER | SYNC |
| `/gallery` | `app/(main)/gallery/page.tsx` | IMAGE | SYNC |
| `/color-correction` | `app/(main)/color-correction/page.tsx` | HYBRID | SYNC |
| `/pricing` | `app/(main)/pricing/page.tsx` | PAYMENT | SYNC |
| `/payment/success` | `app/(main)/payment/success/page.tsx` | PAYMENT | SYNC |
| `/result` | `app/(main)/result/page.tsx` | IMAGE | SYNC |
| `/workflow/[industry]` | `app/(main)/workflow/[industry]/page.tsx` | WORKFLOW | SYNC |
| `/workflow/[industry]/[action]` | `app/(main)/workflow/[industry]/[action]/page.tsx` | WORKFLOW | SYNC |

---

## API 라우트

> `specctl snapshot --type=api-routes`로 자동 생성

| 경로 | 메서드 | 핸들러 | SPEC_KEY | 상태 |
|------|--------|--------|----------|------|
| `/api/auth/[...nextauth]` | ALL | `route.ts` | AUTH | SYNC |
| `/api/user/profile` | GET/PUT | `route.ts` | USER | SYNC |
| `/api/user/business/verify` | POST | `route.ts` | USER | SYNC |
| `/api/user/referral/apply` | POST | `route.ts` | USER | SYNC |
| `/api/credits/balance` | GET | `route.ts` | CREDIT | SYNC |
| `/api/credits/history` | GET | `route.ts` | CREDIT | SYNC |
| `/api/generate` | POST | `route.ts` | IMAGE | SYNC |
| `/api/upscale` | POST | `route.ts` | IMAGE | SYNC |
| `/api/images/list` | GET | `route.ts` | IMAGE | SYNC |
| `/api/images/search` | GET | `route.ts` | IMAGE | SYNC |
| `/api/images/trash` | POST | `route.ts` | IMAGE | SYNC |
| `/api/images/[id]` | GET/DELETE | `route.ts` | IMAGE | SYNC |
| `/api/images/save` | POST | `route.ts` | IMAGE | SYNC |
| `/api/workflows/industries` | GET | `route.ts` | WORKFLOW | SYNC |
| `/api/workflows/session` | POST/GET/PUT | `route.ts` | WORKFLOW | SYNC |
| `/api/workflows/guide` | GET | `route.ts` | GUIDE | SYNC |
| `/api/workflows/intent` | POST | `route.ts` | GUIDE | SYNC |
| `/api/permissions/grant` | POST | `route.ts` | PERMISSION | SYNC |
| `/api/permissions/revoke` | DELETE | `route.ts` | PERMISSION | SYNC |
| `/api/permissions/list` | GET | `route.ts` | PERMISSION | SYNC |
| `/api/payment/webhook` | POST | `route.ts` | PAYMENT | SYNC |
| `/api/payment/checkout` | POST | `route.ts` | PAYMENT | SYNC |
| `/api/payment/subscription` | GET/PUT/DELETE | `route.ts` | PAYMENT | SYNC |
| `/api/payment/history` | GET | `route.ts` | PAYMENT | SYNC |

---

## Immersive 컴포넌트 (Phase 13+)

> Immersive UX 관련 컴포넌트 및 훅

| 컴포넌트 | 경로 | SPEC_KEY | 상태 |
|---------|------|----------|------|
| `ImmersiveNavigation` | `components/immersive/ImmersiveNavigation.tsx` | IMMERSIVE | SYNC |
| `ImmersiveContainer` | `components/immersive/ImmersiveContainer.tsx` | IMMERSIVE | SYNC |
| `ImmersiveCard` | `components/immersive/ImmersiveCard.tsx` | IMMERSIVE | SYNC |
| `useOnboarding` | `components/immersive/hooks/useOnboarding.ts` | IMMERSIVE | SYNC |
| `useSwipeNavigation` | `components/immersive/hooks/useSwipeNavigation.ts` | IMMERSIVE | SYNC |
| `useImmersiveKeyboard` | `components/immersive/hooks/useImmersiveKeyboard.ts` | IMMERSIVE | SYNC |
| `ImmersiveRecommend` | `components/workflow/ImmersiveRecommend.tsx` | IMMERSIVE | SYNC |
| `ImmersiveActionSelect` | `components/workflow/ImmersiveActionSelect.tsx` | IMMERSIVE | SYNC |
| `index (barrel)` | `components/immersive/index.ts` | IMMERSIVE | SYNC |

---

## 이벤트 타입 (미구현)

> `specctl snapshot --type=events`로 자동 생성 예정

```
(자동화 구현 후 채워짐)
```

---

## 상태 목록 (미구현)

> `specctl snapshot --type=states`로 자동 생성 예정

```
(자동화 구현 후 채워짐)
```

---

## 미분류 항목

> SPEC_KEY가 할당되지 않은 항목들. 분류 후 해당 섹션으로 이동.

| 유형 | 항목 | 제안 SPEC_KEY |
|------|------|--------------|
| - | (미분류 항목 없음) | - |

---

## 갱신 히스토리

| 날짜 | 유형 | 변경 내용 |
|------|------|----------|
| 2026-01-20 | 정리 | 템플릿 제거, 클린 상태 |
| 2026-01-22 | 전체 | UI/API/Immersive 인벤토리 추가 (Phase 1-12 + Immersive UX) |

---

> **자동 생성**: `specctl snapshot` 실행 시 갱신됨
