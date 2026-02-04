# 핸드오프 - 2026-02-04 (모달 버그 수정)

## 빌드 상태
- 타입 체크: ✅ 통과
- 빌드: ✅ 통과
- 린트: ⚠️ (ESLint 설정 호환성 이슈, 작업 범위 외)

## 완료된 작업

### 1. 모달 닫힘 버그 수정
**증상:** 홈에서 업종 선택 → '이 스타일로 시작하기' 클릭 시 모달창이 닫히지 않고 두 개의 모달이 겹침

**원인:**
- `ImmersiveActionSelect`에서 `ImmersiveInputForm`이 열려도 기존 모달이 숨겨지지 않음
- 두 모달의 배경 오버레이가 겹쳐서 더 어둡게 보임

**수정 파일:** `components/workflow/ImmersiveActionSelect.tsx`
- `!showInputForm` 조건 추가하여 입력 폼 열릴 때 액션 선택 모달 숨김
- `ImmersiveInputForm` 렌더링 순서를 DOM 순서상 뒤로 이동 (항상 위에 표시)

```tsx
// 변경 전
{isOpen && currentAction && (

// 변경 후
{isOpen && currentAction && !showInputForm && (
```

### 2. photo-studio Intent 매핑 추가
**문제:** photo-studio 액션에 대한 intent 매핑이 누락되어 ImmersiveInputForm에서 action을 찾지 못함

**수정 파일:**
1. `lib/workflow/intents/index.ts` - `getIntentForAction` 함수에 photo-studio 매핑 추가
2. `lib/workflow/intents/matrix.ts` - `INTENT_ACTION_MAPPINGS`에 portrait intent 매핑 추가

**추가된 매핑:**
| Action ID | Intent |
|-----------|--------|
| photo-studio-id-photo | portrait.id-photo |
| photo-studio-business-profile | portrait.business-profile |
| photo-studio-sns-profile | portrait.sns-profile |
| photo-studio-job-application | portrait.job-application |
| photo-studio-beauty-retouch | portrait.beauty-retouch |
| photo-studio-background-change | portrait.background-change |
| photo-studio-group-composite | portrait.group-composite |
| photo-studio-personal-color | portrait.personal-color |

### 3. photo-studio 액션에 "추가 요청사항" 필드 추가
**수정 파일:** `lib/workflow/actions/photo-studio.ts`

모든 8개 photo-studio 액션에 textarea 입력 필드 추가:
```typescript
{
  id: "requests",
  label: "추가 요청사항",
  type: "textarea",
  placeholder: "원하는 스타일이나 특별한 요청사항을 자유롭게 작성해주세요",
  required: false,
}
```

각 promptTemplate에 조건부 템플릿 추가:
```
{{#requests}}Additional requirements: {{requests}}. {{/requests}}
```

## 다음 세션 작업

### 참조 이미지에서 갤러리 이미지 사용 기능
**목표:** '참조 이미지 (선택)'에서 사용자의 갤러리 이미지를 선택할 수 있도록 적용

**관련 파일 (추정):**
- `components/workflow/ImageUpload.tsx` - 이미지 업로드 컴포넌트
- `components/workflow/ImmersiveInputForm.tsx` - 이미지 업로드 스텝 카드
- 갤러리 관련 API/컴포넌트 확인 필요

**구현 방향:**
1. 기존 갤러리/라이브러리에서 이미지 선택 UI 추가
2. 업로드 외에 갤러리 선택 옵션 제공
3. 선택된 갤러리 이미지를 참조 이미지로 사용

## 수정된 파일 목록
1. `components/workflow/ImmersiveActionSelect.tsx`
2. `lib/workflow/intents/index.ts`
3. `lib/workflow/intents/matrix.ts`
4. `lib/workflow/actions/photo-studio.ts`

## 필요 환경 설정
- 없음 (기존 환경 유지)
