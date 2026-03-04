# 핸드오프 - 2026-02-24 (Old FlowStudio 기능 포팅 Phase 3: COMPOSITE)

## 빌드 상태
- 타입 체크: ✅
- 빌드: ✅
- 린트: ✅

## 완료된 Phase
- Phase 3: COMPOSITE 페이지 완료 (1/1)

### 구현 내용: `app/[locale]/(main)/composite/page.tsx`

| 기능 | 컴포넌트/구현 | 상태 |
|------|----------|------|
| 다중 이미지 업로드 (최대 10개) | 커스텀 드래그&드롭 + file input (multiple) | ✅ |
| 업로드된 이미지 그리드 (썸네일 + 삭제) | 커스텀 그리드 (3-5 cols 반응형) | ✅ |
| 갤러리에서 다중 선택 | `GalleryPicker` (onMultiSelect, maxSelectable) | ✅ |
| 비율 선택 | `AspectRatioSelector` | ✅ |
| 프롬프트 입력 + 추천 태그 | `PromptInput` (showTags) | ✅ |
| 이미지 수 선택 + 생성 | `GenerationBar` | ✅ |
| 결과 그리드 (저장/업스케일/다운로드) | `ResultGrid` | ✅ |

### Edit/Poster와의 차이점
- 단일 이미지 → **다중 이미지** 업로드 (최대 10개)
- ImageDropzone 대신 커스텀 다중 업로드 UI
- GalleryPicker `onMultiSelect` + 동적 `maxSelectable` (남은 슬롯 수)
- 최소 2개 이상 이미지 필요 (`canGenerate` 조건)
- `refImages`로 다중 이미지 전달 (sourceImage 사용 안 함)
- `mode: 'COMPOSITE'`

### API 연동
- `/api/generate` POST with `mode: 'COMPOSITE'`
- `refImages`: 다중 이미지 base64 data URL 배열 (최소 2개)
- `aspectRatio`, `count`, `prompt`

## 다음 작업 (Phase 4: DETAIL_EDIT 페이지)
- 첫 번째 구현 파일: `app/[locale]/(main)/detail-edit/page.tsx`
- 주요 기능:
  1. 원본 이미지 업로드 (ImageDropzone, required)
  2. 마스크 영역 선택 (Canvas 기반 - 복잡도 높음)
  3. 편집 모드 선택 (AI 편집, 텍스트 교체, 이미지 교체)
  4. 프롬프트 입력 (PromptInput)
  5. 생성 + 결과 (ResultGrid)
- API: `/api/generate`에 `sourceImage` + `maskImage` + `mode: 'DETAIL_EDIT'` 전달
- i18n: `tools.detailEdit` 네임스페이스 사용
- 주의: Canvas 마스킹 UI가 핵심 복잡 기능

## 미해결 이슈
- `@next/swc` 버전 미스매치 경고 (15.5.7 vs 15.5.11) - 빌드에 영향 없음
- ESLint 설정 비어있음 - 기존 이슈

## 변경된 파일 목록
### 신규 생성 파일
- `app/[locale]/(main)/composite/page.tsx`
