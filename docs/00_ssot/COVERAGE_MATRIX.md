# COVERAGE_MATRIX - 문서 커버리지 현황

> 코드(Snapshot) ↔ 문서(Contract) 매핑 상태를 한 눈에 확인

---

## 상태 범례

| 상태 | 의미 | 조치 |
|------|------|------|
| SYNC | 코드O 문서O 증거O | 없음 |
| MISSING_DOC | 코드O 문서X | Contract 추가 필요 |
| HALLUCINATION | 코드X 문서O | Contract 삭제 또는 코드 추가 |
| BROKEN_EVIDENCE | 증거 링크 깨짐 | Evidence 수정 |
| SNAPSHOT_GAP | 자동화 범위 밖 | 점진적 확장 |

---

## 요약

| 항목 | 값 |
|------|-----|
| **마지막 검증** | 2026-01-22 |
| **검증 레벨** | soft |
| **총 항목** | 119 |
| **SYNC** | 43 |
| **MISSING_DOC** | 2 |
| **HALLUCINATION** | 0 |
| **BROKEN_EVIDENCE** | 0 |
| **SNAPSHOT_GAP** | 76 |

---

## 전체 매트릭스

### Phase 1-12 Core Contracts

| SPEC_KEY | Contract ID | Code (Snapshot) | Doc (Contract) | Evidence | Status |
|----------|-------------|:---------------:|:--------------:|:--------:|--------|
| AUTH | AUTH_FUNC_GOOGLE_OAUTH | O | O | O | SYNC |
| AUTH | AUTH_FUNC_KAKAO_OAUTH | O | O | O | SYNC |
| AUTH | AUTH_FUNC_SESSION | O | O | O | SYNC |
| AUTH | AUTH_FUNC_CALLBACK | O | O | O | SYNC |
| AUTH | AUTH_DESIGN_LOGIN_PAGE | O | O | O | SYNC |
| AUTH | AUTH_DESIGN_HEADER_STATE | O | O | O | SYNC |
| USER | USER_FUNC_PROFILE | O | O | O | SYNC |
| USER | USER_FUNC_BUSINESS_VERIFY | O | O | O | SYNC |
| USER | USER_FUNC_REFERRAL | O | O | O | SYNC |
| USER | USER_DESIGN_SETTINGS | O | O | O | SYNC |
| CREDIT | CREDIT_FUNC_BALANCE | O | O | - | SNAPSHOT_GAP |
| CREDIT | CREDIT_FUNC_HOLD | - | O | - | SNAPSHOT_GAP |
| CREDIT | CREDIT_FUNC_CAPTURE | - | O | - | SNAPSHOT_GAP |
| CREDIT | CREDIT_FUNC_REFUND | - | O | - | SNAPSHOT_GAP |
| CREDIT | CREDIT_FUNC_PURCHASE | - | O | - | SNAPSHOT_GAP |
| CREDIT | CREDIT_FUNC_EXPIRY | - | O | - | SNAPSHOT_GAP |
| CREDIT | CREDIT_DESIGN_HEADER | - | O | - | SNAPSHOT_GAP |
| CREDIT | CREDIT_DESIGN_INSUFFICIENT | - | O | - | SNAPSHOT_GAP |
| CREDIT | CREDIT_DESIGN_PURCHASE | - | O | - | SNAPSHOT_GAP |
| WORKFLOW | WORKFLOW_FUNC_INDUSTRIES | O | O | O | SYNC |
| WORKFLOW | WORKFLOW_FUNC_ACTIONS | O | O | O | SYNC |
| WORKFLOW | WORKFLOW_FUNC_SESSION | O | O | O | SYNC |
| WORKFLOW | WORKFLOW_FUNC_INTENT | O | O | O | SYNC |
| WORKFLOW | WORKFLOW_DESIGN_HOME | O | O | O | SYNC |
| WORKFLOW | WORKFLOW_DESIGN_WIZARD | O | O | O | SYNC |
| WORKFLOW | WORKFLOW_DESIGN_PREVIEW | O | O | O | SYNC |
| IMAGE | IMAGE_FUNC_GENERATE | O | O | O | SYNC |
| IMAGE | IMAGE_FUNC_PROVIDER | O | O | - | SNAPSHOT_GAP |
| IMAGE | IMAGE_FUNC_UPSCALE | O | O | O | SYNC |
| IMAGE | IMAGE_FUNC_SAVE | O | O | - | SNAPSHOT_GAP |
| IMAGE | IMAGE_FUNC_LIST | O | O | O | SYNC |
| IMAGE | IMAGE_FUNC_DELETE | O | O | - | SNAPSHOT_GAP |
| IMAGE | IMAGE_DESIGN_RESULT | O | O | O | SYNC |
| IMAGE | IMAGE_DESIGN_GALLERY | O | O | O | SYNC |
| IMAGE | IMAGE_DESIGN_PROGRESS | - | O | - | SNAPSHOT_GAP |
| IMAGE | IMAGE_DESIGN_LAZY | - | O | - | SNAPSHOT_GAP |
| HYBRID | HYBRID_FUNC_BG_REMOVE | - | O | - | SNAPSHOT_GAP |
| HYBRID | HYBRID_FUNC_COLOR_TRANSFER | - | O | - | SNAPSHOT_GAP |
| HYBRID | HYBRID_FUNC_FILTER | - | O | - | SNAPSHOT_GAP |
| HYBRID | HYBRID_FUNC_COLOR_EXTRACT | - | O | - | SNAPSHOT_GAP |
| HYBRID | HYBRID_FUNC_SAM | - | O | - | SNAPSHOT_GAP |
| HYBRID | HYBRID_FUNC_COLORWAY | - | O | - | SNAPSHOT_GAP |
| HYBRID | HYBRID_DESIGN_STUDIO | O | O | O | SYNC |
| HYBRID | HYBRID_DESIGN_FILTER_TAB | - | O | - | SNAPSHOT_GAP |
| HYBRID | HYBRID_DESIGN_TRANSFER_TAB | - | O | - | SNAPSHOT_GAP |
| HYBRID | HYBRID_DESIGN_BG_REMOVE_TAB | - | O | - | SNAPSHOT_GAP |
| PERMISSION | PERMISSION_FUNC_CHECK | - | O | - | SNAPSHOT_GAP |
| PERMISSION | PERMISSION_FUNC_GRANT | O | O | O | SYNC |
| PERMISSION | PERMISSION_FUNC_REVOKE | O | O | O | SYNC |
| PERMISSION | PERMISSION_FUNC_LIST | O | O | O | SYNC |
| PERMISSION | PERMISSION_FUNC_ADMIN | - | O | - | SNAPSHOT_GAP |
| PERMISSION | PERMISSION_FUNC_MIDDLEWARE | - | O | - | SNAPSHOT_GAP |
| PERMISSION | PERMISSION_FUNC_FALLBACK | - | O | - | SNAPSHOT_GAP |
| PERMISSION | PERMISSION_DESIGN_SHARE | - | O | - | SNAPSHOT_GAP |

### Phase 7: Guide System

| SPEC_KEY | Contract ID | Code (Snapshot) | Doc (Contract) | Evidence | Status |
|----------|-------------|:---------------:|:--------------:|:--------:|--------|
| GUIDE | INTENT_TAXONOMY | - | O | - | SNAPSHOT_GAP |
| GUIDE | INTENT_MATRIX | - | O | - | SNAPSHOT_GAP |
| GUIDE | INTENT_MATCHER | - | O | - | SNAPSHOT_GAP |
| GUIDE | API_INTENT_ANALYZE | O | O | O | SYNC |
| GUIDE | RECOMMEND_SCORING | - | O | - | SNAPSHOT_GAP |
| GUIDE | RECOMMEND_ENGINE | - | O | - | SNAPSHOT_GAP |
| GUIDE | RECOMMEND_INDEX | - | O | - | SNAPSHOT_GAP |
| GUIDE | GUIDE_DYNAMIC | - | O | - | SNAPSHOT_GAP |
| GUIDE | GUIDE_BRANCHING | - | O | - | SNAPSHOT_GAP |
| GUIDE | GUIDE_INDEX | - | O | - | SNAPSHOT_GAP |
| GUIDE | API_GUIDE_STEPS | O | O | O | SYNC |

### Phase 8: UI Components

| SPEC_KEY | Contract ID | Code (Snapshot) | Doc (Contract) | Evidence | Status |
|----------|-------------|:---------------:|:--------------:|:--------:|--------|
| UI | UI_COMP_GUIDE_CHAT | - | O | - | SNAPSHOT_GAP |
| UI | UI_COMP_RECOMMEND_CARD | - | O | - | SNAPSHOT_GAP |
| UI | UI_COMP_STEP_FLOW | - | O | - | SNAPSHOT_GAP |
| UI | UI_COMP_IMAGE_UPLOAD | - | O | - | SNAPSHOT_GAP |
| UI | UI_COMP_SIMILAR_WORKFLOWS | - | O | - | SNAPSHOT_GAP |

### Phase 9: Payment System

| SPEC_KEY | Contract ID | Code (Snapshot) | Doc (Contract) | Evidence | Status |
|----------|-------------|:---------------:|:--------------:|:--------:|--------|
| PAYMENT | PAYMENT_FUNC_WEBHOOK | O | O | O | SYNC |
| PAYMENT | PAYMENT_FUNC_CHECKOUT | O | O | O | SYNC |
| PAYMENT | PAYMENT_FUNC_SUBSCRIPTION | O | O | O | SYNC |
| PAYMENT | PAYMENT_FUNC_HISTORY | O | O | O | SYNC |
| PAYMENT | PAYMENT_DESIGN_PRICING | O | O | O | SYNC |
| PAYMENT | PAYMENT_DESIGN_CHECKOUT | - | O | - | SNAPSHOT_GAP |
| PAYMENT | PAYMENT_DESIGN_SUCCESS | O | O | O | SYNC |
| PAYMENT | PAYMENT_DESIGN_INSUFFICIENT | - | O | - | SNAPSHOT_GAP |

### Phase 10: Page Integration

| SPEC_KEY | Contract ID | Code (Snapshot) | Doc (Contract) | Evidence | Status |
|----------|-------------|:---------------:|:--------------:|:--------:|--------|
| INTEGRATION | INTEGRATION_DESIGN_WORKFLOW_HOME | O | O | O | SYNC |
| INTEGRATION | INTEGRATION_DESIGN_WORKFLOW_WIZARD | O | O | O | SYNC |
| INTEGRATION | INTEGRATION_DESIGN_WORKFLOW_RESULT | O | O | O | SYNC |
| INTEGRATION | INTEGRATION_FUNC_WORKFLOW_STATE | - | O | - | SNAPSHOT_GAP |
| INTEGRATION | INTEGRATION_FUNC_GUIDE_CONTEXT | - | O | - | SNAPSHOT_GAP |
| INTEGRATION | INTEGRATION_DESIGN_MOBILE_NAV | - | O | - | SNAPSHOT_GAP |

### Phase 11: Testing

| SPEC_KEY | Contract ID | Code (Snapshot) | Doc (Contract) | Evidence | Status |
|----------|-------------|:---------------:|:--------------:|:--------:|--------|
| TEST | TEST_FUNC_WORKFLOW | - | O | - | SNAPSHOT_GAP |
| TEST | TEST_FUNC_CREDITS | - | O | - | SNAPSHOT_GAP |
| TEST | TEST_FUNC_PAYMENT | - | O | - | SNAPSHOT_GAP |
| TEST | TEST_E2E_AUTH_FLOW | - | O | - | SNAPSHOT_GAP |
| TEST | TEST_E2E_WORKFLOW_FLOW | - | O | - | SNAPSHOT_GAP |
| TEST | TEST_E2E_PAYMENT_FLOW | - | O | - | SNAPSHOT_GAP |

### Phase 12: Polish & Optimization

| SPEC_KEY | Contract ID | Code (Snapshot) | Doc (Contract) | Evidence | Status |
|----------|-------------|:---------------:|:--------------:|:--------:|--------|
| PERF | PERF_FUNC_IMAGE_LAZY | - | O | - | SNAPSHOT_GAP |
| PERF | PERF_FUNC_BUNDLE_SPLIT | - | O | - | SNAPSHOT_GAP |
| PERF | PERF_FUNC_CACHE_STRATEGY | - | O | - | SNAPSHOT_GAP |
| A11Y | A11Y_DESIGN_KEYBOARD_NAV | - | O | - | SNAPSHOT_GAP |
| A11Y | A11Y_DESIGN_SCREEN_READER | - | O | - | SNAPSHOT_GAP |
| A11Y | A11Y_DESIGN_FOCUS_TRAP | - | O | - | SNAPSHOT_GAP |

### Phase 13+: Immersive UX (신규)

| SPEC_KEY | Contract ID | Code (Snapshot) | Doc (Contract) | Evidence | Status |
|----------|-------------|:---------------:|:--------------:|:--------:|--------|
| IMMERSIVE | IMMERSIVE_COMP_NAVIGATION | O | O | O | SYNC |
| IMMERSIVE | IMMERSIVE_COMP_CONTAINER | O | O | O | SYNC |
| IMMERSIVE | IMMERSIVE_COMP_CARD | O | O | O | SYNC |
| IMMERSIVE | IMMERSIVE_HOOK_ONBOARDING | O | O | O | SYNC |
| IMMERSIVE | IMMERSIVE_HOOK_SWIPE | O | O | O | SYNC |
| IMMERSIVE | IMMERSIVE_HOOK_KEYBOARD | O | O | O | SYNC |
| IMMERSIVE | IMMERSIVE_DESIGN_RECOMMEND | O | O | O | SYNC |
| IMMERSIVE | IMMERSIVE_DESIGN_ACTION_SELECT | O | O | O | SYNC |
| IMMERSIVE | IMMERSIVE_DESIGN_INPUT_FORM | - | - | - | MISSING_DOC |
| IMMERSIVE | IMMERSIVE_DESIGN_RESULT | - | - | - | MISSING_DOC |

---

## 히스토리

| 날짜 | SYNC | MISSING | HALLU | BROKEN | GAP | 변화 |
|------|:----:|:-------:|:-----:|:------:|:---:|------|
| 2026-01-21 | 0 | 0 | 0 | 0 | 54 | specctl verify |
| 2026-01-22 | 43 | 2 | 0 | 0 | 76 | Phase 7-12 + Immersive UX 추가 |

---

> **자동 생성**: `specctl verify` 실행 시 갱신됨
