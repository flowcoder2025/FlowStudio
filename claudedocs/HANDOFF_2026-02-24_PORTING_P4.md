# 핸드오프 - 2026-02-24 (Old FlowStudio 기능 포팅 Phase 4: DETAIL_EDIT)

## 빌드 상태
- 타입 체크: ✅
- 빌드: ✅
- 린트: ✅

## 완료된 Phase
- Phase 4: DETAIL_EDIT 페이지 완료 (1/1)

### 구현 내용: `app/[locale]/(main)/detail-edit/page.tsx`

| 기능 | 구현 | 상태 |
|------|------|------|
| 원본 이미지 업로드 (필수) | `ImageDropzone` (required, showGalleryPicker) | ✅ |
| Canvas 마스크 페인팅 | 이중 Canvas (이미지 + 마스크 오버레이) | ✅ |
| 브러시 크기 조절 | range input (5-100px) | ✅ |
| Undo 기능 | ImageData 히스토리 스택 | ✅ |
| 마스크 초기화 | clearRect + 히스토리 리셋 | ✅ |
| 마스크 내보내기 | 흑백 이미지로 변환 (검=비선택, 흰=선택) | ✅ |
| 편집 모드 선택 | AI 편집, 텍스트 교체, 이미지 교체 | ✅ |
| 프롬프트 입력 | `PromptInput` (showTags=false) | ✅ |
| 생성 버튼 | Button (GenerationBar 대신 단일 버튼) | ✅ |
| 결과 그리드 | `ResultGrid` | ✅ |
| 터치 지원 | onTouchStart/Move/End + touchAction: none | ✅ |

### 이전 Phase와의 차이점
- **Canvas 기반 마스킹**: 이중 Canvas (배경 이미지 + 투명 마스크 오버레이)
- 빨간 반투명(rgba 255,0,0,0.4)으로 마스크 시각화
- 마스크를 흑백 PNG로 내보내기 (API용)
- GenerationBar 대신 단일 Generate 버튼 (항상 1장 생성)
- 브러시 크기 슬라이더 + Undo + Clear 도구

### API 연동
- `/api/generate` POST with `mode: 'DETAIL_EDIT'`
- `sourceImage`: 원본 이미지 base64 (필수)
- `maskImage`: 흑백 마스크 PNG base64 (필수)
- `count`: 1 (고정)

### i18n 추가 키
- `tools.detailEdit.brushSize`: 브러시 크기
- `tools.detailEdit.clearMask`: 마스크 초기화
- `tools.detailEdit.paintToSelect`: 편집할 영역을 브러시로 칠해주세요
- `tools.detailEdit.sourceImage`: 원본 이미지

## 다음 작업 (Phase 5: DETAIL_PAGE 페이지)
- 첫 번째 구현 파일: `app/[locale]/(main)/detail-page/page.tsx`
- 주요 기능:
  1. 제품 이미지 업로드 (ImageDropzone, required)
  2. 세그먼트 관리 (추가/삭제/순서변경)
  3. 각 세그먼트별 프롬프트 + 생성
  4. 전체 미리보기
  5. 초안 저장/불러오기
- API: `/api/generate`에 `sourceImage` + `mode: 'DETAIL_PAGE'` 전달
- i18n: `tools.detailPage` 네임스페이스 사용

## 미해결 이슈
- `@next/swc` 버전 미스매치 경고 (15.5.7 vs 15.5.11) - 빌드에 영향 없음
- ESLint 설정 비어있음 - 기존 이슈

## 변경된 파일 목록
### 수정된 파일
- `messages/ko/tools.json` - detailEdit에 brushSize, clearMask, paintToSelect, sourceImage 추가
- `messages/en/tools.json` - detailEdit에 brushSize, clearMask, paintToSelect, sourceImage 추가

### 신규 생성 파일
- `app/[locale]/(main)/detail-edit/page.tsx`
