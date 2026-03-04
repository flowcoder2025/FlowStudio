# 핸드오프 - 2026-02-25 (도구 몰입형 통합 Phase 1: Store 확장 + 도구 액션 정의)

## 빌드 상태
- 타입 체크: ✅
- 빌드: ✅
- 린트: ✅

## 완료된 Phase
- Phase 1: Store 확장 + 도구 액션 정의 완료 (2/2)

### 구현 내용

#### Contract 1.1: Store 확장 ✅
- **파일**: `lib/workflow/store.ts`
- 상태 추가:
  - `toolMode: ToolMode | null` — 현재 활성화된 도구 모드
  - `toolInputs: Record<string, unknown>` — 도구별 입력값 (sourceImage, maskImage 등)
  - `toolStepIndex: number` — 현재 도구 스텝 인덱스
- 액션 추가:
  - `enterToolMode(mode)` — immersiveStep='input' 설정, toolMode 활성화, 기존 생성 상태 초기화
  - `exitToolMode()` — toolMode=null, toolInputs 초기화, immersiveStep='recommend'으로 복귀
  - `setToolInput(key, value)` — 개별 입력값 설정 (함수형 업데이트)
  - `setToolInputs(inputs)` — 전체 입력값 교체
  - `clearToolInputs()` — 입력값 + 스텝 인덱스 초기화
  - `setToolStepIndex(index)` — 스텝 인덱스 직접 설정
- Selector/Hook: `selectToolState`, `useToolState()` 추가
- `resetWorkflow()`에 toolMode/toolInputs/toolStepIndex 초기화 포함
- `import type { ToolMode } from "@/lib/tools/types"` 추가

#### Contract 1.2: 도구 스텝 정의 ✅
- **파일**: `lib/workflow/actions/tools.ts` (신규)
- `ToolStepType` 유니온: 'image-upload' | 'aspect-ratio' | 'category-style' | 'canvas-mask' | 'multi-image' | 'prompt' | 'confirmation' | 'segment-loop'
- `ToolStep` 디스크리미네이티드 유니온 (8개 타입)
- `TOOL_STEP_DEFINITIONS: Record<ToolMode, ToolStep[]>` — 5개 도구의 스텝 배열
  - EDIT: sourceImage → refImage → aspectRatio → prompt → confirmation
  - POSTER: sourceImage → logoImage → categoryStyle → aspectRatio → prompt → confirmation
  - COMPOSITE: refImages(multi) → aspectRatio → prompt → confirmation
  - DETAIL_EDIT: sourceImage → canvasMask → prompt → confirmation
  - DETAIL_PAGE: sourceImage → refImage → categoryStyle → segmentLoop
- 유틸리티: `getToolSteps()`, `getRequiredStepCount()`
- UI 정보: `TOOL_INFO` (titleKey, descriptionKey)

## 다음 작업 (Phase 2)
- **목표**: ImmersiveInputForm 확장 — 새 스텝 타입 렌더링
- **파일**:
  - `components/workflow/ImmersiveInputForm.tsx` — 도구 모드 감지 + 스텝 타입별 렌더링
  - `components/workflow/steps/ImageUploadStep.tsx` — 신규
  - `components/workflow/steps/AspectRatioStep.tsx` — 신규
  - `components/workflow/steps/CategoryStyleStep.tsx` — 신규
  - `components/workflow/steps/MultiImageStep.tsx` — 신규
  - `components/workflow/steps/PromptStep.tsx` — 신규
  - `components/workflow/steps/ConfirmationStep.tsx` — 신규
  - `components/workflow/steps/index.ts` — 배럴 내보내기
- **핵심**: if (toolMode) → TOOL_STEP_DEFINITIONS[toolMode] 기반 스텝 생성
- **재사용 컴포넌트**: ImageDropzone, AspectRatioSelector, PromptInput, GalleryPicker

## 미해결 이슈
- `@next/swc` 버전 미스매치 경고 (빌드 영향 없음)
- `next lint` deprecated 경고 (Next.js 16 대비, 향후 마이그레이션)

## 변경된 파일 목록
### 수정된 파일
- `lib/workflow/store.ts` — toolMode/toolInputs/toolStepIndex 상태 + 6개 액션 + selector/hook

### 신규 파일
- `lib/workflow/actions/tools.ts` — TOOL_STEP_DEFINITIONS, ToolStep 타입, 유틸리티
