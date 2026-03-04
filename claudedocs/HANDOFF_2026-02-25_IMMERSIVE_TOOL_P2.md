# 핸드오프 - 2026-02-25 (도구 몰입형 통합 Phase 2: ImmersiveInputForm 확장)

## 빌드 상태
- 타입 체크: ✅
- 빌드: ✅
- 린트: ✅

## 완료된 Phase
- Phase 2: ImmersiveInputForm 확장 — 새 스텝 타입 렌더링 완료 (8/8)

### 구현 내용

#### Contract 2.1: 스텝 컴포넌트 6개 생성 ✅

| 파일 | 역할 | 재사용 컴포넌트 |
|------|------|-----------------|
| `components/workflow/steps/ImageUploadStep.tsx` | 단일 이미지 업로드 카드 | ImageDropzone |
| `components/workflow/steps/AspectRatioStep.tsx` | 비율 선택 카드 | AspectRatioSelector |
| `components/workflow/steps/CategoryStyleStep.tsx` | 카테고리→스타일 2단 선택 | CATEGORIES, getStylesForCategory |
| `components/workflow/steps/MultiImageStep.tsx` | 다중 이미지 업로드 + 갤러리 | GalleryPicker |
| `components/workflow/steps/PromptStep.tsx` | 프롬프트 입력 + 추천 태그 | PromptInput |
| `components/workflow/steps/ConfirmationStep.tsx` | 요약 + 이미지 수 + 생성 버튼 | TOOL_INFO |

#### Contract 2.2: 배럴 내보내기 ✅
- `components/workflow/steps/index.ts` — 6개 컴포넌트 배럴 내보내기

#### Contract 2.3: ImmersiveInputForm 도구 모드 확장 ✅
- **파일**: `components/workflow/ImmersiveInputForm.tsx`
- **추가된 것**:
  - `ToolStepCard` 내부 컴포넌트 — step.type에 따라 적절한 스텝 컴포넌트 렌더링
  - Store에서 toolMode/toolInputs/toolStepIndex/setToolInput/setToolStepIndex/exitToolMode 가져오기
  - 도구 모드 전용 변수: toolSteps, currentToolStep
  - 도구 모드 전용 핸들러: handleToolNext, handleToolPrev, handleToolGoTo, handleToolClose, handleToolDragEnd
  - 도구 모드 전용 키보드 네비게이션 (ArrowLeft/Right, Escape)
  - 도구 모드 전용 렌더링 블록 (`if (toolMode && isOpen)` → 독립 AnimatePresence)
  - canvas-mask / segment-loop은 Phase 3/4 플레이스홀더로 구현
- **기존 워크플로우 모드**: 변경 없음 (도구 모드가 아닐 때 기존 로직 그대로)

#### Contract 2.4: i18n 키 추가 ✅
- `messages/ko/common.json` — `workflow.ui.swipeToNext` 추가
- `messages/en/common.json` — `workflow.ui.swipeToNext` 추가

### 스텝 컴포넌트 공통 패턴
```
- 각 카드는 동일한 레이아웃: Header(도구명 + 스텝번호) → Main(콘텐츠) → Footer(버튼/힌트)
- 도구명은 TOOL_INFO[toolMode].titleKey로 i18n
- ImmersiveCard 직접 사용하지 않고, 동일한 스타일의 div 구조 사용 (스텝별 커스텀 필요)
- 모든 컴포넌트는 'use client' + useTranslations()
```

## 다음 작업 (Phase 3)
- **목표**: Detail Edit 캔버스 마스크 스텝
- **파일**: `components/workflow/steps/CanvasMaskStep.tsx` (신규)
- **구현**: 풀스크린 Canvas 마스크 페인팅 (기존 detail-edit/page.tsx의 캔버스 로직 추출)
- **하단**: 브러시 크기 슬라이더 + 편집 모드 선택 + Undo/Clear
- **참고**: `app/[locale]/(main)/detail-edit/page.tsx`의 Canvas 구현

## 미해결 이슈
- `@next/swc` 버전 미스매치 경고 (빌드 영향 없음)
- handleToolGenerate는 Phase 6에서 완성 예정 (현재 임시)
- canvas-mask / segment-loop 플레이스홀더 → Phase 3/4에서 구현

## 변경된 파일 목록
### 수정된 파일
- `components/workflow/ImmersiveInputForm.tsx` — 도구 모드 분기 + ToolStepCard + 핸들러
- `messages/ko/common.json` — swipeToNext 키 추가
- `messages/en/common.json` — swipeToNext 키 추가

### 신규 파일
- `components/workflow/steps/ImageUploadStep.tsx`
- `components/workflow/steps/AspectRatioStep.tsx`
- `components/workflow/steps/CategoryStyleStep.tsx`
- `components/workflow/steps/MultiImageStep.tsx`
- `components/workflow/steps/PromptStep.tsx`
- `components/workflow/steps/ConfirmationStep.tsx`
- `components/workflow/steps/index.ts`
