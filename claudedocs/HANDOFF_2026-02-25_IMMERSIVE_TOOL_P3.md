# 핸드오프 - 2026-02-25 (도구 몰입형 통합 Phase 3: Detail Edit 캔버스 마스크 스텝)

## 빌드 상태
- 타입 체크: ✅
- 빌드: ✅
- 린트: ✅

## 완료된 Phase
- Phase 3: Detail Edit 캔버스 마스크 스텝 완료 (3/3)

### 구현 내용

#### Contract 3.1: CanvasMaskStep 컴포넌트 생성 ✅

- **파일**: `components/workflow/steps/CanvasMaskStep.tsx` (신규)
- **기능**:
  - 이중 Canvas (이미지 렌더링 + 마스크 오버레이)
  - 브러시 페인팅 (마우스 + 터치 지원)
  - 브러시 크기 슬라이더 (5-100px, 기본 30)
  - Undo / Clear mask 버튼
  - 편집 모드 선택 (AI / 텍스트 / 이미지)
  - 스트로크 완료 시 흑백 PNG로 자동 내보내기 → toolInputs['maskImage']에 저장
  - 소스 이미지 없을 때 플레이스홀더 표시
  - 기존 detail-edit/page.tsx의 Canvas 로직 추출 + 몰입형 카드 UI 적용

- **Props**:
  | Prop | 타입 | 설명 |
  |------|------|------|
  | sourceImage | string \| null | toolInputs['sourceImage']에서 가져옴 |
  | value | string \| null | 마스크 데이터 URL |
  | onChange | (maskDataUrl) => void | setToolInput('maskImage', ...) |
  | editMode | 'ai' \| 'text' \| 'image' | toolInputs['editMode']에서 가져옴 |
  | onEditModeChange | (mode) => void | setToolInput('editMode', ...) |
  | onNext, stepIndex, totalSteps, toolTitle | 공통 props | 헤더/푸터 표시용 |

#### Contract 3.2: 배럴 내보내기 업데이트 ✅
- **파일**: `components/workflow/steps/index.ts`
- `CanvasMaskStep` 내보내기 추가

#### Contract 3.3: ImmersiveInputForm 플레이스홀더 교체 ✅
- **파일**: `components/workflow/ImmersiveInputForm.tsx`
- import에 `CanvasMaskStep` 추가
- `case 'canvas-mask'` 플레이스홀더 → 실제 CanvasMaskStep 컴포넌트로 교체
- sourceImage, maskImage, editMode를 toolInputs에서 읽기/쓰기

#### 추가: ConfirmationStep에서 canvas-mask 타입 처리 ✅
- **파일**: `components/workflow/steps/ConfirmationStep.tsx`
- required steps 필터에 `canvas-mask` 추가
- summary items에 `canvas-mask` 라벨(`tools.detailEdit.selectArea`) 추가

## 다음 작업 (Phase 4)
- **목표**: Detail Page 세그먼트 루프 스텝
- **파일**: `components/workflow/steps/SegmentLoopStep.tsx` (신규)
- **구현**: 세그먼트별 프롬프트 → 4장 후보 생성 → 선택 → 세그먼트 추가/삭제/순서변경
- **참고**: `app/[locale]/(main)/detail-page/page.tsx`의 세그먼트 로직

## 미해결 이슈
- `@next/swc` 버전 미스매치 경고 (빌드 영향 없음)
- handleToolGenerate는 Phase 6에서 완성 예정 (현재 임시)
- segment-loop 플레이스홀더 → Phase 4에서 구현

## 변경된 파일 목록
### 신규 파일
- `components/workflow/steps/CanvasMaskStep.tsx`

### 수정된 파일
- `components/workflow/steps/index.ts` — CanvasMaskStep 배럴 내보내기 추가
- `components/workflow/steps/ConfirmationStep.tsx` — canvas-mask required/summary 처리
- `components/workflow/ImmersiveInputForm.tsx` — import + canvas-mask 플레이스홀더 교체
