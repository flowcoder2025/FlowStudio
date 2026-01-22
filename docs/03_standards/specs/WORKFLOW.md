# WORKFLOW - 워크플로우 시스템 스펙

> SPEC_KEY: WORKFLOW
> 버전: 1.0.0
> PRD 참조: §4.2 업종별 워크플로우

---

## 개요

FlowStudio 업종별 맞춤 워크플로우 시스템. 9개 업종 × 10-12개 액션 = 95개+ 워크플로우 제공.

---

<!-- FUNCTIONAL:BEGIN -->

## 기능 요소

### Contract: WORKFLOW_FUNC_INDUSTRIES

- **What**: 업종 목록 제공
- **Why**: 사용자 맥락에 맞는 워크플로우 제안
- **Acceptance Criteria**:
  - 9개 업종: 의류, 음식, 뷰티, 전자제품, 가구, 인테리어, 주얼리, 반려동물, 유아
  - 각 업종별 아이콘, 이름, 설명
- **Evidence**:
  - code: `lib/workflow/industries.ts` (예정)
  - code: `lib/workflow/workflowSchema.json` (예정)

### Contract: WORKFLOW_FUNC_ACTIONS

- **What**: 업종별 액션 목록
- **Why**: 세부 이미지 생성 유형 제공
- **Acceptance Criteria**:
  - 업종당 10-12개 액션
  - 각 액션: ID, 이름, 설명, 출력 모드, 비용
- **Evidence**:
  - code: `lib/workflow/actions/fashion.ts` (예정)
  - code: `lib/workflow/actions/food.ts` (예정)
  - code: `lib/workflow/workflowSchema.json` (예정)

### Contract: WORKFLOW_FUNC_SESSION

- **What**: 워크플로우 세션 관리
- **Why**: 생성 과정 상태 추적
- **Acceptance Criteria**:
  - 세션 생성/조회/업데이트
  - 업종, 액션, 옵션 저장
  - 크레딧 Hold 연동
- **Evidence**:
  - code: `app/api/workflows/session/route.ts` (예정)
  - type: `prisma/schema.prisma::WorkflowSession` (예정)

### Contract: WORKFLOW_FUNC_INTENT

- **What**: 프롬프트 의도 분석
- **Why**: QuickInputBar 자연어 입력 지원
- **Acceptance Criteria**:
  - 자연어 입력 → 업종/액션 자동 매칭
  - 신뢰도 점수 반환
  - 사용자 확인 후 진행
- **Evidence**:
  - code: `app/api/analyze-intent/route.ts` (예정)
  - code: `lib/workflow/intentAnalyzer.ts` (예정)

<!-- FUNCTIONAL:END -->

---

<!-- DESIGN:BEGIN -->

## 디자인 요소

### Contract: WORKFLOW_DESIGN_HOME

- **What**: 통합 홈 화면 (PRD §3.2.1)
- **Why**: 3클릭 내 결과물 (UX 원칙 1)
- **Acceptance Criteria**:
  - 업종 그리드 (5개 아이콘)
  - QuickInputBar (상단 검색창)
  - 인기 워크플로우 섹션
  - 최근 작업 그리드
- **Evidence**:
  - ui: `app/(main)/page.tsx` (예정)
  - ui: `components/home/IndustryGrid.tsx` (예정)
  - ui: `components/home/QuickInputBar.tsx` (예정)

### Contract: WORKFLOW_DESIGN_WIZARD

- **What**: 워크플로우 위자드 (PRD §3.2.2)
- **Why**: 단계별 안내 생성 경험
- **Acceptance Criteria**:
  - 이미지 업로드 영역
  - 배경색 선택
  - 고급 설정 토글
  - 크레딧 비용 표시
  - 생성 버튼
- **Evidence**:
  - ui: `app/(main)/workflow/[industry]/[action]/page.tsx` (예정)
  - ui: `components/workflow/ImageUploader.tsx` (예정)
  - ui: `components/workflow/OptionsPanel.tsx` (예정)

### Contract: WORKFLOW_DESIGN_PREVIEW

- **What**: 의도 분석 프리뷰 카드
- **Why**: 자연어 입력 결과 확인
- **Acceptance Criteria**:
  - 추천 업종/액션 표시
  - 수정 버튼
  - 수락 버튼
- **Evidence**:
  - ui: `components/workflow/PreviewCard.tsx` (예정)

<!-- DESIGN:END -->

---

## 업종 목록

| ID | 이름 | 아이콘 | 액션 수 |
|----|------|--------|---------|
| fashion | 의류/패션 | 👕 | 12 |
| food | 음식 | 🍱 | 11 |
| beauty | 뷰티 | 💄 | 11 |
| electronics | 전자제품 | 📱 | 11 |
| furniture | 가구 | 🛋️ | 10 |
| interior | 인테리어 | 🏠 | 10 |
| jewelry | 주얼리 | 💎 | 10 |
| pet | 반려동물 | 🐕 | 10 |
| kids | 유아/아동 | 👶 | 10 |

---

## 참조

- PRD §4.2 업종별 워크플로우 상세
- PRD §3.2 사용자 인터페이스 설계
- PRD §5.1 신규 사용자 온보딩 플로우
