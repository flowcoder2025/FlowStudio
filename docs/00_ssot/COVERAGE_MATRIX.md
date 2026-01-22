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
| **마지막 검증** | 2026-01-21 |
| **검증 레벨** | soft |
| **총 항목** | 54 |
| **SYNC** | 0 |
| **MISSING_DOC** | 0 |
| **HALLUCINATION** | 0 |
| **BROKEN_EVIDENCE** | 0 |
| **SNAPSHOT_GAP** | 54 |

---

## 전체 매트릭스

| SPEC_KEY | Contract ID | Code (Snapshot) | Doc (Contract) | Evidence | Status |
|----------|-------------|:---------------:|:--------------:|:--------:|--------|
| CREDIT | CREDIT_FUNC_BALANCE | - | O | - | SNAPSHOT_GAP |
| CREDIT | CREDIT_FUNC_HOLD | - | O | - | SNAPSHOT_GAP |
| CREDIT | CREDIT_FUNC_CAPTURE | - | O | - | SNAPSHOT_GAP |
| CREDIT | CREDIT_FUNC_REFUND | - | O | - | SNAPSHOT_GAP |
| CREDIT | CREDIT_FUNC_PURCHASE | - | O | - | SNAPSHOT_GAP |
| CREDIT | CREDIT_FUNC_EXPIRY | - | O | - | SNAPSHOT_GAP |
| CREDIT | CREDIT_DESIGN_HEADER | - | O | - | SNAPSHOT_GAP |
| CREDIT | CREDIT_DESIGN_INSUFFICIENT | - | O | - | SNAPSHOT_GAP |
| CREDIT | CREDIT_DESIGN_PURCHASE | - | O | - | SNAPSHOT_GAP |
| IMAGE | IMAGE_FUNC_GENERATE | - | O | - | SNAPSHOT_GAP |
| IMAGE | IMAGE_FUNC_PROVIDER | - | O | - | SNAPSHOT_GAP |
| IMAGE | IMAGE_FUNC_UPSCALE | - | O | - | SNAPSHOT_GAP |
| IMAGE | IMAGE_FUNC_SAVE | - | O | - | SNAPSHOT_GAP |
| IMAGE | IMAGE_FUNC_LIST | - | O | - | SNAPSHOT_GAP |
| IMAGE | IMAGE_FUNC_DELETE | - | O | - | SNAPSHOT_GAP |
| IMAGE | IMAGE_DESIGN_RESULT | - | O | - | SNAPSHOT_GAP |
| IMAGE | IMAGE_DESIGN_GALLERY | - | O | - | SNAPSHOT_GAP |
| IMAGE | IMAGE_DESIGN_PROGRESS | - | O | - | SNAPSHOT_GAP |
| IMAGE | IMAGE_DESIGN_LAZY | - | O | - | SNAPSHOT_GAP |
| WORKFLOW | WORKFLOW_FUNC_INDUSTRIES | - | O | - | SNAPSHOT_GAP |
| WORKFLOW | WORKFLOW_FUNC_ACTIONS | - | O | - | SNAPSHOT_GAP |
| WORKFLOW | WORKFLOW_FUNC_SESSION | - | O | - | SNAPSHOT_GAP |
| WORKFLOW | WORKFLOW_FUNC_INTENT | - | O | - | SNAPSHOT_GAP |
| WORKFLOW | WORKFLOW_DESIGN_HOME | - | O | - | SNAPSHOT_GAP |
| WORKFLOW | WORKFLOW_DESIGN_WIZARD | - | O | - | SNAPSHOT_GAP |
| WORKFLOW | WORKFLOW_DESIGN_PREVIEW | - | O | - | SNAPSHOT_GAP |
| PERMISSION | PERMISSION_FUNC_CHECK | - | O | - | SNAPSHOT_GAP |
| PERMISSION | PERMISSION_FUNC_GRANT | - | O | - | SNAPSHOT_GAP |
| PERMISSION | PERMISSION_FUNC_REVOKE | - | O | - | SNAPSHOT_GAP |
| PERMISSION | PERMISSION_FUNC_LIST | - | O | - | SNAPSHOT_GAP |
| PERMISSION | PERMISSION_FUNC_ADMIN | - | O | - | SNAPSHOT_GAP |
| PERMISSION | PERMISSION_FUNC_MIDDLEWARE | - | O | - | SNAPSHOT_GAP |
| PERMISSION | PERMISSION_FUNC_FALLBACK | - | O | - | SNAPSHOT_GAP |
| PERMISSION | PERMISSION_DESIGN_SHARE | - | O | - | SNAPSHOT_GAP |
| AUTH | AUTH_FUNC_GOOGLE_OAUTH | - | O | - | SNAPSHOT_GAP |
| AUTH | AUTH_FUNC_KAKAO_OAUTH | - | O | - | SNAPSHOT_GAP |
| AUTH | AUTH_FUNC_SESSION | - | O | - | SNAPSHOT_GAP |
| AUTH | AUTH_FUNC_CALLBACK | - | O | - | SNAPSHOT_GAP |
| AUTH | AUTH_DESIGN_LOGIN_PAGE | - | O | - | SNAPSHOT_GAP |
| AUTH | AUTH_DESIGN_HEADER_STATE | - | O | - | SNAPSHOT_GAP |
| USER | USER_FUNC_PROFILE | - | O | - | SNAPSHOT_GAP |
| USER | USER_FUNC_BUSINESS_VERIFY | - | O | - | SNAPSHOT_GAP |
| USER | USER_FUNC_REFERRAL | - | O | - | SNAPSHOT_GAP |
| USER | USER_DESIGN_SETTINGS | - | O | - | SNAPSHOT_GAP |
| HYBRID | HYBRID_FUNC_BG_REMOVE | - | O | - | SNAPSHOT_GAP |
| HYBRID | HYBRID_FUNC_COLOR_TRANSFER | - | O | - | SNAPSHOT_GAP |
| HYBRID | HYBRID_FUNC_FILTER | - | O | - | SNAPSHOT_GAP |
| HYBRID | HYBRID_FUNC_COLOR_EXTRACT | - | O | - | SNAPSHOT_GAP |
| HYBRID | HYBRID_FUNC_SAM | - | O | - | SNAPSHOT_GAP |
| HYBRID | HYBRID_FUNC_COLORWAY | - | O | - | SNAPSHOT_GAP |
| HYBRID | HYBRID_DESIGN_STUDIO | - | O | - | SNAPSHOT_GAP |
| HYBRID | HYBRID_DESIGN_FILTER_TAB | - | O | - | SNAPSHOT_GAP |
| HYBRID | HYBRID_DESIGN_TRANSFER_TAB | - | O | - | SNAPSHOT_GAP |
| HYBRID | HYBRID_DESIGN_BG_REMOVE_TAB | - | O | - | SNAPSHOT_GAP |

---

## 히스토리

| 날짜 | SYNC | MISSING | HALLU | BROKEN | GAP | 변화 |
|------|:----:|:-------:|:-----:|:------:|:---:|------|
| 2026-01-21 | 0 | 0 | 0 | 0 | 54 | specctl verify |

---

> **자동 생성**: `specctl verify` 실행 시 갱신됨
