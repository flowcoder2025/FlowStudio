# 핸드오프 - 2026-02-25 (도구 몰입형 통합 Phase 4: Detail Page 세그먼트 루프 스텝)

## 빌드 상태
- 타입 체크: ✅
- 빌드: ✅
- 린트: ✅

## 완료된 Phase
- Phase 4: Detail Page 세그먼트 루프 스텝 완료 (3/3)

### 구현 내용

#### Contract 4.1: SegmentLoopStep 컴포넌트 생성 ✅

- **파일**: `components/workflow/steps/SegmentLoopStep.tsx` (신규, ~400줄)
- **기능**:
  - 3개 뷰 모드 (`compose` / `candidates` / `history`) AnimatePresence 전환
  - **compose**: 세그먼트 미리보기 (가로 스크롤 썸네일) + 프롬프트 입력 + 생성 버튼
  - **candidates**: 4장 후보 이미지 그리드 (9:16) → 선택하여 세그먼트 추가
  - **history**: 세션 히스토리에서 이미지 선택 (교체용)
  - 세그먼트 관리: 순서 이동 (위/아래), 삭제, 교체
  - 전체 병합 다운로드 (Canvas API → PNG)
  - generateFromTool API 호출 (mode='DETAIL_PAGE', aspectRatio='9:16', count=4)
  - saveImageToGallery로 선택된 이미지 저장
  - 프롬프트 힌트 동적 변경 (첫 세그먼트 vs 추가 세그먼트)

- **Props**:
  | Prop | 타입 | 설명 |
  |------|------|------|
  | segments | string[] | toolInputs['segments']에서 가져옴 |
  | onSegmentsChange | (segs) => void | setToolInput('segments', ...) |
  | sourceImage | string \| null | toolInputs['sourceImage'] |
  | refImage | string \| null | toolInputs['refImage'] |
  | style | string | toolInputs['categoryStyle']?.style |
  | stepIndex, totalSteps, toolTitle | 공통 | 헤더 표시용 |

- **로컬 상태** (세션 내 임시):
  - prompt: 현재 입력 중인 프롬프트
  - candidates: 생성된 4장 후보
  - sessionHistory: 생성 이력 (세션 내)
  - replaceIndex: 교체 대상 세그먼트 인덱스
  - view: 현재 뷰 모드

#### Contract 4.2: 배럴 내보내기 업데이트 ✅
- **파일**: `components/workflow/steps/index.ts`
- `SegmentLoopStep` 내보내기 추가

#### Contract 4.3: ImmersiveInputForm 플레이스홀더 교체 ✅
- **파일**: `components/workflow/ImmersiveInputForm.tsx`
- import에 `SegmentLoopStep` 추가
- `case 'segment-loop'` 플레이스홀더 → 실제 SegmentLoopStep 컴포넌트로 교체
- sourceImage, refImage, categoryStyle, segments를 toolInputs에서 읽기/쓰기

## 다음 작업 (Phase 5)
- **목표**: 진입점 연결 + 기존 페이지 리다이렉트
- **구현**:
  - 홈/헤더/MobileNav에서 도구 선택 시 enterToolMode() 호출
  - 기존 독립 도구 페이지 (/edit, /poster 등)에서 몰입형 모드로 리다이렉트
  - 또는 독립 페이지 유지하면서 몰입형 진입점 추가

## 미해결 이슈
- `@next/swc` 버전 미스매치 경고 (빌드 영향 없음)
- handleToolGenerate는 Phase 6에서 완성 예정 (현재 임시)
- 모든 플레이스홀더 제거 완료 (canvas-mask, segment-loop 둘 다 구현됨)

## 변경된 파일 목록
### 신규 파일
- `components/workflow/steps/SegmentLoopStep.tsx`

### 수정된 파일
- `components/workflow/steps/index.ts` — SegmentLoopStep 배럴 내보내기 추가
- `components/workflow/ImmersiveInputForm.tsx` — import + segment-loop 플레이스홀더 교체
