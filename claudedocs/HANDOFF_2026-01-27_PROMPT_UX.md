# 핸드오프 - 2026-01-27 프롬프트 시스템 & 워크플로우 UX 개선

## 빌드 상태
- 타입 체크: ✅ 통과
- 빌드: ✅ 성공
- 린트: ⚠️ 경고 17개 (에러 0개)

---

## 완료 작업

### Phase 1: 프롬프트 시스템 개선

#### Contract 1.1: promptBuilder.ts 생성 ✅
**파일**: `lib/imageProvider/promptBuilder.ts` (신규)

- 6-컴포넌트 구조 지원 (Subject + Action + Environment + Art Style + Lighting + Details)
- **텍스트 렌더링 방지 접미사** (`NO_TEXT_SUFFIX`) - 핵심 기능
- 품질 향상 접미사 (`QUALITY_SUFFIX`)
- 참조 이미지 지시문 생성 함수 (`buildReferenceImageInstruction`)
- 자연어 변환 유틸리티 (`convertKeywordsToNaturalLanguage`)
- 업종별 전문 프롬프트 빌더 (fashion, food, beauty)

#### Contract 1.2: buildPrompt 함수 개선 ✅
**파일**: `lib/imageProvider/googleGenAI.ts` (수정: 231-264줄)

변경 전:
```typescript
function buildPrompt(options: GenerationOptions): string {
  let prompt = options.prompt;
  if (options.style) { prompt = `${options.style} style: ${prompt}`; }
  if (options.negativePrompt) { prompt = `${prompt}. Avoid: ${options.negativePrompt}`; }
  return prompt;
}
```

변경 후:
- 6-컴포넌트 구조 적용
- 참조 이미지 지시문 자동 추가
- 네거티브 프롬프트 문장형 변환
- 품질 지시 추가
- **텍스트 렌더링 방지 접미사 항상 포함** (가장 중요!)

#### Contract 1.3: promptTemplate 자연어화 ✅
**파일들**:
- `lib/workflow/actions/fashion.ts` (5개 템플릿)
- `lib/workflow/actions/food.ts` (5개 템플릿)
- `lib/workflow/actions/beauty.ts` (5개 템플릿)
- `lib/workflow/actions/index.ts` (6개 템플릿 - interior, electronics, jewelry, sports, pet, kids)

변경 패턴:
```
변경 전 (키워드 나열):
"Professional fashion photography of a {{model}}, {{pose}}, {{background}}, 4K"

변경 후 (자연어 문장):
"Create a professional fashion photograph that captures a {{model}} model...
The model is shown in a {{pose}} pose...
The scene features soft, diffused natural lighting..."
```

---

### Phase 2: 워크플로우 UX 개선

#### Contract 2.1: store.ts에 상태/액션 추가 ✅
**파일**: `lib/workflow/store.ts` (수정)

추가된 상태:
```typescript
initialQuery: string;  // 최초 검색 쿼리 (자동 입력용)
imageCount: number;    // 이미지 생성 장수 (1-4)
```

추가된 액션:
```typescript
setInitialQuery: (query: string) => void;
setImageCount: (count: number) => void;
```

#### Contract 2.2: page.tsx에서 쿼리 전달 ✅
**파일**: `app/(main)/page.tsx` (수정)

- `handleSearch` 함수에서 `setInitialQuery(searchQuery.trim())` 호출 추가
- `ImmersiveInputForm`에 `initialQuery={searchQuery}` prop 전달

#### Contract 2.3: ImmersiveInputForm 수정 ✅
**파일**: `components/workflow/ImmersiveInputForm.tsx` (수정)

1. **Props 확장**:
   - `initialQuery?: string` 추가

2. **자동 입력 기능**:
   - `isOpen` 시 `initialQuery`를 `product` 또는 `상품` 관련 필드에 자동 입력

3. **이미지 장수 선택 UI**:
   - 확인 스텝에 1-4 선택 버튼 추가
   - 크레딧 계산 표시 (`{imageCount}장 × {creditCost} = {total} 크레딧`)

4. **handleGenerate 수정**:
   - `count: imageCount` 사용 (하드코딩 제거)
   - `creditsUsed` 계산에 imageCount 반영

---

## 생성/수정된 파일 목록

| 파일 | 변경 유형 | 내용 |
|------|----------|------|
| `lib/imageProvider/promptBuilder.ts` | 신규 | 프롬프트 빌더 유틸리티 |
| `lib/imageProvider/googleGenAI.ts` | 수정 | buildPrompt() 6-컴포넌트 구조 |
| `lib/workflow/actions/fashion.ts` | 수정 | 5개 promptTemplate 자연어화 |
| `lib/workflow/actions/food.ts` | 수정 | 5개 promptTemplate 자연어화 |
| `lib/workflow/actions/beauty.ts` | 수정 | 5개 promptTemplate 자연어화 |
| `lib/workflow/actions/index.ts` | 수정 | 6개 promptTemplate 자연어화 |
| `lib/workflow/store.ts` | 수정 | initialQuery, imageCount 상태/액션 |
| `app/(main)/page.tsx` | 수정 | setInitialQuery 호출, prop 전달 |
| `components/workflow/ImmersiveInputForm.tsx` | 수정 | 자동 입력 + 장수 선택 UI |

---

## 테스트 방법

### Phase 1 검증 (프롬프트 시스템)
1. 워크플로우 실행 후 서버 로그에서 생성된 프롬프트 확인
2. 프롬프트가 자연어 문장 형태인지 확인
3. 프롬프트 마지막에 "IMPORTANT: The image must contain absolutely no text..." 포함 확인
4. 생성된 이미지에 텍스트가 나타나지 않는지 확인

### Phase 2 검증 (워크플로우 UX)
1. 홈에서 "티셔츠 모델" 검색 → 입력 폼의 "상품 설명" 필드에 자동 입력 확인
2. 확인 스텝에서 이미지 장수 1-4 선택 가능 확인
3. 장수 선택 시 크레딧 계산 정확성 확인 (예: 3장 × 5 = 15 크레딧)
4. 생성 완료 후 선택한 장수만큼 이미지 생성 확인

---

## 기대 효과

### 프롬프트 시스템
- **텍스트 렌더링 문제 해결**: 이미지에 원치 않는 텍스트 출현 방지
- **품질 향상**: 자연어 문장 구조로 더 일관된 결과 생성
- **참조 이미지 활용도 증가**: 명시적 지시로 스타일 반영 개선

### 워크플로우 UX
- **입력 편의성 향상**: 검색 쿼리 자동 입력으로 중복 입력 제거
- **유연성 증가**: 이미지 장수 선택으로 사용자 니즈 충족
- **비용 투명성**: 실시간 크레딧 계산 표시

---

## 다음 작업 (선택)

1. **텍스트 렌더링 방지 효과 모니터링**
   - 실제 생성 결과에서 텍스트 출현 빈도 추적
   - 필요시 NO_TEXT_SUFFIX 문구 조정

2. **promptBuilder 활용 확대**
   - 다른 프로바이더(OpenRouter)에도 동일 로직 적용
   - 업종별 전문 빌더 함수 직접 호출 검토

---

## 참조 문서

- **계획 문서**: 플랜 모드에서 작성된 상세 구현 계획
- **Google 공식 문서**: Gemini 이미지 생성 베스트 프랙티스
- **Nano Banana Pro 가이드**: 텍스트 렌더링 방지 기법

---

> **마지막 업데이트**: 2026-01-27 프롬프트 시스템 & 워크플로우 UX 개선 완료
