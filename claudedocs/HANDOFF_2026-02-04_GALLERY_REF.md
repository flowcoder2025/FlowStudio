# 핸드오프 - 2026-02-04 (갤러리 이미지 참조 기능)

## 빌드 상태
- 타입 체크: ✅ 통과
- 빌드: ✅ 통과
- 린트: ⚠️ (ESLint 설정 호환성 이슈, 작업 범위 외)

## 완료된 작업

### 갤러리 이미지 참조 기능 구현
**목표**: 참조 이미지 업로드 시 기존 갤러리에서 이미지를 선택할 수 있는 기능 추가

**수정된 파일:**
1. `components/workflow/ImageUpload.tsx`
   - 갤러리 선택 모달 컴포넌트 (`GalleryPickerModal`) 추가
   - 갤러리 버튼 UI 추가
   - SWR을 사용한 갤러리 이미지 목록 조회
   - 선택된 이미지를 `UploadedImage` 형식으로 변환
   - 다국어 지원 (useTranslations 적용)

2. `messages/ko/common.json` - 한국어 번역 키 추가
3. `messages/en/common.json` - 영어 번역 키 추가

**추가된 번역 키:**
```json
{
  "selectFromGallery": "갤러리에서 선택",
  "galleryPickerTitle": "갤러리에서 선택",
  "galleryPickerDesc": "이전에 생성한 이미지를 참조 이미지로 사용할 수 있습니다",
  "galleryPickerSelected": "{count}개 선택됨",
  "galleryPickerMaxSelect": "최대 {count}개까지 선택 가능",
  "galleryPickerConfirm": "{count}개 이미지 선택",
  "galleryPickerEmpty": "갤러리에 이미지가 없습니다",
  "galleryPickerEmptyDesc": "먼저 이미지를 생성해주세요",
  "galleryPickerError": "이미지를 불러오지 못했습니다"
}
```

**기능 상세:**
- 참조 이미지 업로드 영역 아래에 "갤러리에서 선택" 버튼 표시
- 버튼 클릭 시 갤러리 이미지 목록을 보여주는 모달 열림
- 최대 선택 가능한 개수까지 다중 선택 지원
- 선택된 이미지는 기존 업로드된 이미지와 동일하게 처리
- SWR을 사용하여 갤러리 API (`/api/images/list`) 호출

## 기술적 결정

### 갤러리 이미지 URL 처리
- 갤러리에서 선택한 이미지는 `uploadedUrl`에 이미지 URL 저장
- `base64Data`는 undefined로 설정 (이미 서버에 있는 이미지이므로)
- 이미지 생성 시 API에서 URL 또는 base64 모두 처리 가능

### 다국어 지원
- `useTranslations` hook을 사용하여 컴포넌트 내에서 번역 처리
- 기존 하드코딩된 한국어 텍스트를 번역 키로 대체

## 테스트 방법
1. 워크플로우에서 참조 이미지 업로드 단계로 이동
2. "갤러리에서 선택" 버튼 클릭
3. 이전에 생성한 이미지 목록이 표시되는지 확인
4. 이미지 선택 후 참조 이미지로 추가되는지 확인

## 필요 환경 설정
- 없음 (기존 환경 유지)

## 미해결 이슈
- ESLint 설정 호환성 문제 (eslint-config-next@15.5.11 + ESLint 9.x) - 별도 이슈로 관리 필요
