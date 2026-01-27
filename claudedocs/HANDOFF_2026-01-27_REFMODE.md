# 핸드오프 - 2026-01-27 참조 이미지 모드 기능

## 빌드 상태
- 타입 체크: ✅
- 빌드: ✅
- 린트: ✅ (경고 12개 - 기존 `<img>` 관련, 기능 영향 없음)

## 완료된 작업

### 1. 참조 이미지 배열 처리 수정
- **문제**: API는 `refImages[]` 배열을 받지만 `googleGenAI.ts`는 `refImage` 단일만 처리
- **해결**: `refImages` 배열 우선 처리, 없으면 `refImage` 사용

### 2. 참조 이미지 지시문 강화
- 프롬프트 최상단에 "CRITICAL INSTRUCTION" 배치
- 중간에 "REMINDER" 추가하여 재강조
- 모드별 차별화된 지시문 생성

### 3. 참조 모드 타입 추가 (`ReferenceMode`)
```typescript
type ReferenceMode = 'style' | 'product' | 'composition' | 'full';
```

| 모드 | 설명 | 사용 사례 |
|------|------|----------|
| `style` | 분위기, 색감, 조명만 참조 | 다른 제품에 같은 무드 적용 |
| `product` | 제품/피사체 그대로 유지 | 배경만 바꾸고 제품 유지 |
| `composition` | 구도/레이아웃만 참조 | 비슷한 배치로 다른 내용 생성 |
| `full` | 전체 충실 재현 (기본값) | 참조 이미지 최대한 따라가기 |

### 4. UI 모드 선택 기능 추가
- `ImageUpload` 컴포넌트에 `ReferenceModeSelector` 추가
- 2x2 그리드 버튼으로 4가지 모드 선택
- 이미지 업로드 시 즉시 base64 변환하여 저장

### 5. Base64 변환 버그 수정
- **문제**: blob URL이 API로 전달되어 Gemini 에러 발생
- **해결**: `UploadedImage`에 `base64Data` 필드 추가, 업로드 시 즉시 변환
- 영향 파일: `ImageUpload.tsx`, `ImmersiveInputForm.tsx`, `workflow/[industry]/[action]/page.tsx`

### 6. 워크플로우 스토어 연동
- `referenceMode` 상태 추가 (기본값: `'full'`)
- `setReferenceMode` 액션 추가

## 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `lib/imageProvider/types.ts` | `ReferenceMode` 타입, `referenceMode` 필드 추가 |
| `lib/imageProvider/googleGenAI.ts` | `refImages` 배열 처리, 모드별 프롬프트 생성 |
| `lib/imageProvider/promptBuilder.ts` | 모드 지원 `buildReferenceImageInstruction` |
| `app/api/generate/route.ts` | `referenceMode` 파라미터 추가 |
| `lib/workflow/store.ts` | `referenceMode` 상태/액션 추가 |
| `components/workflow/ImageUpload.tsx` | `base64Data` 필드, `ReferenceModeSelector` UI |
| `components/workflow/ImmersiveInputForm.tsx` | base64 사용, 스크롤 가능 레이아웃 |
| `app/(main)/workflow/[industry]/[action]/page.tsx` | 참조 모드 연동 |

## API 사용 예시

```typescript
// POST /api/generate
{
  prompt: "커피잔이 있는 테이블",
  refImages: ["data:image/png;base64,..."],  // base64 필수
  referenceMode: "style"
}
```

## 테스트 완료
- ✅ Base64 변환 정상 작동
- ✅ API 호출 정상
- ✅ 참조 모드 UI 표시
- ✅ Gemini API 연동 (API 키 설정 필요)

## 미해결 이슈
없음

## 환경 설정
- `GOOGLE_API_KEY` 또는 `GOOGLE_GENAI_API_KEY` 필요
