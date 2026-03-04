# 핸드오프 - 2026-02-24 (Old FlowStudio 기능 포팅 Phase 1: EDIT)

## 빌드 상태
- 타입 체크: ✅
- 빌드: ✅
- 린트: ✅

## 완료된 Phase
- Phase 1: EDIT 페이지 완료 (1/1)

### 구현 내용: `app/[locale]/(main)/edit/page.tsx`

| 기능 | 컴포넌트 | 상태 |
|------|----------|------|
| 원본 이미지 업로드 (필수) | `ImageDropzone` (required, showGalleryPicker) | ✅ |
| 참조 이미지 업로드 (선택) | `ImageDropzone` (optional, showGalleryPicker) | ✅ |
| 비율 선택 | `AspectRatioSelector` | ✅ |
| 프롬프트 입력 + 추천 태그 | `PromptInput` (showTags) | ✅ |
| 이미지 수 선택 + 생성 | `GenerationBar` | ✅ |
| 결과 그리드 (저장/업스케일/다운로드) | `ResultGrid` | ✅ |

### 레이아웃 구조
- 헤더: 뒤로가기 + 제목/부제목
- 3-column 그리드 (lg): 좌측 2/3 (이미지 업로드), 우측 1/3 (옵션)
- 하단 고정 바: GenerationBar
- 결과 섹션: 생성 후 자동 스크롤

### API 연동
- `/api/generate` POST with `mode: 'EDIT'`
- `sourceImage`: base64 data URL (필수)
- `refImages`: 참조 이미지 배열 (선택)
- `referenceMode`: 'style' (참조 이미지 있을 때)

### 사용된 공통 인프라 (Phase 0)
- `components/tools/`: ImageDropzone, AspectRatioSelector, PromptInput, GenerationBar, ResultGrid
- `lib/tools/generateClient`: generateFromTool()
- `lib/tools/types`: ToolGenerateResponse, ImageCount
- `messages/{ko,en}/tools.json`: tools.edit 네임스페이스

## 다음 작업 (Phase 2: POSTER 페이지)
- 첫 번째 구현 파일: `app/[locale]/(main)/poster/page.tsx`
- 주요 기능:
  1. 제품 이미지 업로드 (ImageDropzone, required)
  2. 로고 이미지 업로드 (ImageDropzone, optional)
  3. 비율 선택 (AspectRatioSelector)
  4. 카테고리/스타일 선택 (CATEGORIES, STYLES)
  5. 프롬프트 입력 (PromptInput)
  6. 이미지 수 + 생성 (GenerationBar)
  7. ResultGrid
- API: `/api/generate`에 `sourceImage` + `logoImage` + `mode: 'POSTER'` 전달
- i18n: `tools.poster` 네임스페이스 사용

## 미해결 이슈
- `@next/swc` 버전 미스매치 경고 (15.5.7 vs 15.5.11) - 빌드에 영향 없음
- ESLint 설정 비어있음 - 기존 이슈

## 변경된 파일 목록
### 신규 생성 파일
- `app/[locale]/(main)/edit/page.tsx`
