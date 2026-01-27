# 핸드오프 - 2026-01-27 버그 수정 & UX 개선

## 빌드 상태
- 타입 체크: ✅ 통과
- 빌드: ✅ 성공
- 린트: ✅ 에러 0개 (경고만 존재)

---

## 완료 작업

### Phase 16.1: 버그 수정

#### Contract 16.1.1: 상품 설명 자동 입력 수정 ✅
**문제**: 검색 쿼리가 상품 설명 필드에 자동 입력되지 않음
**원인**: `useEffect`에서 `action` 의존성으로 인해 추천 변경 시 inputs가 리셋됨
**해결**: useEffect를 두 개로 분리
- 모달 열릴 때만 초기화 (isOpen 변경 시)
- 자동 입력은 별도 useEffect에서 기존 inputs 유지하면서 처리

**파일**: `components/workflow/ImmersiveInputForm.tsx`

변경 전:
```typescript
useEffect(() => {
  if (isOpen && action) {
    setPage([0, 0]);
    // ...모든 상태 리셋
    setInputs({ [productInput.id]: queryToUse }); // 기존 inputs 덮어씀
  }
}, [isOpen, initialRecommendationIndex, initialQuery, storeInitialQuery, storeImageCount, action]);
```

변경 후:
```typescript
// 모달 열릴 때만 초기화
useEffect(() => {
  if (isOpen) {
    setPage([0, 0]);
    // ...UI 상태만 리셋
  }
}, [isOpen]);

// 자동 입력 (기존 inputs 유지)
useEffect(() => {
  if (isOpen && action) {
    setInputs((prev) => ({ ...prev, [productInput.id]: queryToUse }));
  }
}, [isOpen, action, initialQuery, storeInitialQuery]);
```

#### Contract 16.1.2: 이미지 장수 선택 ✅
**상태**: UI 및 로직 확인 완료 - 정상 작동
- 확인 스텝에 1-4 선택 버튼 존재
- `imageCount` 상태 업데이트 정상
- API 호출 시 `count: imageCount` 전달 확인

#### Contract 16.1.3: 전자제품 참조 이미지 반영 ✅
**문제**: 참조 이미지가 이미지 생성에 반영되지 않음
**원인**: `/api/generate` 라우트에서 `refImages`를 전달하지 않음
**해결**: API 라우트와 프론트엔드에 참조 이미지 전달 추가

**파일 1**: `app/api/generate/route.ts`
- `GenerateRequestBody`에 `refImages?: string[]` 필드 추가
- `generationRequest`에 `refImages: body.refImages` 전달

**파일 2**: `components/workflow/ImmersiveInputForm.tsx`
- API 호출 시 `referenceImages` URL 배열을 `refImages`로 전달

```typescript
const refImageUrls = referenceImages
  .map((img) => img.uploadedUrl || img.previewUrl)
  .filter(Boolean);

const generateRes = await fetch("/api/generate", {
  body: JSON.stringify({
    prompt,
    workflowSessionId: session.id,
    count: imageCount,
    refImages: refImageUrls.length > 0 ? refImageUrls : undefined,
  }),
});
```

---

### Phase 16.2: UX 개선 (불필요 UI 제거)

#### Contract 16.2.1: 홈화면 검색 결과 추천 섹션 제거 ✅
**문제**: 미리보기 클릭 시 '검색 결과 추천' 섹션이 불필요하게 표시
**해결**: `RecommendList` 렌더링 코드 제거

**파일**: `app/(main)/page.tsx`
- 241-249줄의 `searchRecommendations` 렌더링 섹션 제거
- `RecommendList` import 주석 처리
- `searchRecommendations` 상태는 유지 (잠재적 fallback용)

#### Contract 16.2.2: 워크플로우 프롬프트 미리보기 제거 ✅
**문제**: 마지막 입력 페이지의 프롬프트 미리보기가 수정 불가하여 불필요
**해결**: `PromptPreview` 컴포넌트 제거, 참조 이미지 미리보기만 유지

**파일**: `app/(main)/workflow/[industry]/[action]/page.tsx`
- `PromptPreview` import 제거
- Right Panel에서 `PromptPreview` 렌더링 제거
- 참조 이미지가 있을 때만 Right Panel 표시

---

## 수정된 파일 목록

| 파일 | 변경 유형 | 내용 |
|------|----------|------|
| `components/workflow/ImmersiveInputForm.tsx` | 수정 | 자동 입력 로직 분리, 참조 이미지 API 전달 |
| `app/api/generate/route.ts` | 수정 | refImages 필드 추가 |
| `app/(main)/page.tsx` | 수정 | 검색 결과 추천 섹션 제거 |
| `app/(main)/workflow/[industry]/[action]/page.tsx` | 수정 | 프롬프트 미리보기 제거 |

---

## 테스트 방법

### Phase 16.1 검증 (버그 수정)
1. **자동 입력 테스트**:
   - 홈에서 "전동 드라이버로 작업하는 모습" 검색
   - 몰입형 모달에서 상품 설명 필드에 검색어 자동 입력 확인
   - 다른 추천 선택 시 자동 입력 값 유지 확인

2. **이미지 장수 선택 테스트**:
   - 확인 스텝에서 1-4 선택 가능 확인
   - 크레딧 계산 정확성 확인
   - 선택한 장수만큼 이미지 생성 확인

3. **참조 이미지 반영 테스트**:
   - 전자제품 워크플로우 진행
   - 참조 이미지 업로드
   - 생성된 이미지가 참조 이미지 스타일 반영 확인

### Phase 16.2 검증 (UX 개선)
1. 홈에서 검색 후 '검색 결과 추천' 섹션 미표시 확인
2. 워크플로우 입력 페이지에서 프롬프트 미리보기 미표시 확인

---

## 참조 이미지 처리 흐름

```
1. ImmersiveInputForm
   └─ referenceImages (UploadedImage[])
   └─ handleGenerate()
      └─ refImageUrls = referenceImages.map(img => img.uploadedUrl || img.previewUrl)

2. POST /api/generate
   └─ body.refImages (string[])
   └─ generationRequest.refImages

3. generateImages (lib/imageProvider/generate.ts)
   └─ GenerationOptions.refImages

4. generateWithGoogle (lib/imageProvider/googleGenAI.ts)
   └─ buildPrompt()
      └─ options.refImages?.length > 0
         └─ "Use the provided reference images to guide..."
```

---

## 다음 작업 (선택)

1. **참조 이미지 처리 개선**
   - 현재: URL만 프롬프트에 설명으로 전달
   - 개선: Gemini API의 실제 이미지 입력 기능 활용 검토

2. **업종별 참조 이미지 가중치**
   - 패션/의류: 높은 가중치 (스타일, 색상, 디테일)
   - 전자제품: 중간 가중치 (형태, 배경 분위기)

---

> **마지막 업데이트**: 2026-01-27 버그 수정 & UX 개선 완료
