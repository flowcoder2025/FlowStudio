# 핸드오프 - 2026-02-24 (Old FlowStudio 기능 포팅 Phase 2: POSTER)

## 빌드 상태
- 타입 체크: ✅
- 빌드: ✅
- 린트: ✅

## 완료된 Phase
- Phase 2: POSTER 페이지 완료 (1/1)

### 구현 내용: `app/[locale]/(main)/poster/page.tsx`

| 기능 | 컴포넌트 | 상태 |
|------|----------|------|
| 제품 이미지 업로드 (필수) | `ImageDropzone` (required, showGalleryPicker) | ✅ |
| 로고 이미지 업로드 (선택) | `ImageDropzone` (optional, previewAspect=square) | ✅ |
| 카테고리 선택 | `CATEGORIES` 기반 토글 버튼 | ✅ |
| 스타일 선택 (카테고리 연동) | `getStylesForCategory()` 기반 토글 버튼 | ✅ |
| 비율 선택 | `AspectRatioSelector` (기본값 3:4) | ✅ |
| 프롬프트 입력 + 추천 태그 | `PromptInput` (showTags) | ✅ |
| 이미지 수 선택 + 생성 | `GenerationBar` | ✅ |
| 결과 그리드 (저장/업스케일/다운로드) | `ResultGrid` | ✅ |

### Edit와의 차이점
- 참조 이미지 → 로고 이미지 (`logoImage`)
- 카테고리/스타일 선택 UI 추가
- 카테고리 변경 시 스타일 초기화
- 기본 비율 3:4 (포스터 세로 비율)
- `mode: 'POSTER'`

### API 연동
- `/api/generate` POST with `mode: 'POSTER'`
- `sourceImage`: 제품 이미지 base64 (필수)
- `logoImage`: 로고 이미지 base64 (선택)
- `style`: 선택된 스타일 ID (선택)

## 다음 작업 (Phase 3: COMPOSITE 페이지)
- 첫 번째 구현 파일: `app/[locale]/(main)/composite/page.tsx`
- 주요 기능:
  1. 다중 이미지 업로드 (최대 10개)
  2. 비율 선택 (AspectRatioSelector)
  3. 프롬프트 입력 (PromptInput)
  4. 이미지 수 + 생성 (GenerationBar)
  5. ResultGrid
- API: `/api/generate`에 `refImages` (다중) + `mode: 'COMPOSITE'` 전달
- i18n: `tools.composite` 네임스페이스 사용
- 주의: ImageDropzone은 단일 이미지용이므로, 다중 이미지 UI 커스텀 필요

## 미해결 이슈
- `@next/swc` 버전 미스매치 경고 (15.5.7 vs 15.5.11) - 빌드에 영향 없음
- ESLint 설정 비어있음 - 기존 이슈

## 변경된 파일 목록
### 신규 생성 파일
- `app/[locale]/(main)/poster/page.tsx`
