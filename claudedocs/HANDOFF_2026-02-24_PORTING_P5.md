# 핸드오프 - 2026-02-24 (Old FlowStudio 기능 포팅 Phase 5: DETAIL_PAGE)

## 빌드 상태
- 타입 체크: ✅
- 빌드: ✅
- 린트: ✅

## 완료된 Phase
- Phase 5: DETAIL_PAGE 페이지 완료 (1/1)

### 구현 내용: `app/[locale]/(main)/detail-page/page.tsx`

| 기능 | 구현 | 상태 |
|------|------|------|
| 제품 이미지 업로드 (필수) | `ImageDropzone` (required, showGalleryPicker) | ✅ |
| 참조 이미지 업로드 (선택) | `ImageDropzone` (optional, previewAspect=square) | ✅ |
| 카테고리 선택 | `CATEGORIES` 공유 상수, 버튼 UI | ✅ |
| 스타일 선택 | `getStylesForCategory()`, 카테고리별 필터링 | ✅ |
| 세그먼트별 프롬프트 | `PromptInput` (단계별 placeholder 변경) | ✅ |
| 4장 후보 생성 | `generateFromTool` (9:16, count=4) | ✅ |
| 후보 이미지 선택 | 2x2 그리드, 호버 시 선택 오버레이 | ✅ |
| 세그먼트 추가 | 선택 시 segments 배열에 URL 추가 | ✅ |
| 세그먼트 삭제 | confirm 다이얼로그 후 삭제 | ✅ |
| 세그먼트 순서변경 | ChevronUp/Down 버튼 (원본에 없던 기능 추가) | ✅ |
| 세그먼트 교체 | 히스토리 모달에서 이미지 선택으로 교체 | ✅ |
| 전체 미리보기 | 우측 패널, 세그먼트 번호 표시 | ✅ |
| 전체 병합 다운로드 | Canvas API로 수직 병합 → PNG 다운로드 | ✅ |
| 세션 히스토리 | 메모리 기반, Dialog 모달로 조회 | ✅ |
| 갤러리 자동 저장 | 세그먼트 선택 시 갤러리에 best-effort 저장 | ✅ |

### 원본 FlowStudio 대비 변경점
- **순서변경 기능 추가**: 원본은 고정 순서만 지원, 새 구현은 ChevronUp/Down 지원
- **초안 저장 미구현**: DB 스키마(DetailPageDraft)가 없어 Phase 6 이후 별도 구현 필요
- **공통 컴포넌트 재사용**: ImageDropzone, PromptInput 등 Phase 0 인프라 100% 활용
- **GenerationBar 미사용**: 항상 4장 생성이므로 커스텀 Generate 버튼 사용

### API 연동
- `/api/generate` POST with `mode: 'DETAIL_PAGE'`
- `sourceImage`: 제품 이미지 base64 (필수)
- `refImages`: 참조 이미지 base64 배열 (선택)
- `aspectRatio`: '9:16' (고정)
- `count`: 4 (고정)
- `style`: 선택된 스타일 ID (선택)

### i18n 추가 키 (ko/en)
- `tools.detailPage.productImage`: 제품 이미지
- `tools.detailPage.referenceImage`: 참조 이미지
- `tools.detailPage.referenceImageDesc`: 스타일 참조용 설명
- `tools.detailPage.candidateImages`: 후보 이미지
- `tools.detailPage.selectToAdd`: 세그먼트 추가 안내
- `tools.detailPage.mergeDownload`: 전체 다운로드
- `tools.detailPage.introPromptHint`: 인트로 프롬프트 힌트
- `tools.detailPage.sectionPromptHint`: 섹션 프롬프트 힌트
- `tools.detailPage.emptyPreview`: 빈 미리보기 안내
- `tools.detailPage.confirmRemove`: 삭제 확인
- `tools.detailPage.history`: 히스토리
- `tools.detailPage.historyEmpty`: 빈 히스토리
- `tools.detailPage.replaceSegment`: 세그먼트 교체
- `tools.detailPage.segmentCount`: 세그먼트 수

## 다음 작업 (Phase 6: 네비게이션 통합)
- Header 드롭다운에 5개 도구 페이지 링크 추가
- 홈화면 또는 도구 선택 UI에서 각 도구로 진입점 제공
- 모바일 네비게이션(MobileNav) 통합

## 미해결 이슈
- `@next/swc` 버전 미스매치 경고 (15.5.7 vs 15.5.11) - 빌드에 영향 없음
- ESLint 설정 비어있음 - 기존 이슈
- 초안 저장/불러오기 미구현 - DB 스키마 추가 필요 (향후 Phase)

## 변경된 파일 목록
### 수정된 파일
- `messages/ko/tools.json` - detailPage에 14개 i18n 키 추가
- `messages/en/tools.json` - detailPage에 14개 i18n 키 추가

### 신규 생성 파일
- `app/[locale]/(main)/detail-page/page.tsx`
