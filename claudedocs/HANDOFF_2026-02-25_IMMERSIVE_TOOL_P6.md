# 핸드오프 - 2026-02-25 (도구 몰입형 통합 Phase 6: 생성 연결 + i18n)

## 빌드 상태
- 타입 체크: ✅
- 빌드: ✅
- 린트: ✅

## 완료된 Phase
- Phase 6: 생성 연결 + i18n 완료 (3/3)

### 구현 내용

#### Contract 6.1: handleToolGenerate 함수 완성 ✅

- **파일**: `components/workflow/ImmersiveInputForm.tsx`
- **변경**:
  - `generateFromTool` 및 `ImmersiveResult` import 추가
  - `ToolGenerateRequest` 타입 import 추가
  - `handleToolGenerate` 함수 완전 구현:
    - `toolInputs` → `ToolGenerateRequest` 매핑 로직
    - 도구별 필드 분기 처리:
      - EDIT: sourceImage + refImage (optional) + aspectRatio + prompt
      - POSTER: sourceImage + logoImage (optional) + categoryStyle + aspectRatio + prompt
      - COMPOSITE: refImages (다중) + aspectRatio + prompt
      - DETAIL_EDIT: sourceImage + maskImage + prompt
      - DETAIL_PAGE: sourceImage + refImage + categoryStyle + segment-loop
    - `generateFromTool()` API 호출
    - 결과를 Zustand store `setGenerationResult`에 저장
    - 성공 시 `showToolResult = true` → ImmersiveResult 표시
    - 실패 시 에러 메시지 표시
  - `generationResult` store 구독 추가

#### Contract 6.2: ImmersiveResult 연동 ✅

- **파일**: `components/workflow/ImmersiveInputForm.tsx`
- **변경**:
  - `showToolResult` 상태 추가
  - 도구 모드 렌더링에서 `showToolResult && generationResult` 조건으로 ImmersiveResult 표시
  - `handleToolRegenerate` 콜백: 결과 닫고 confirmation 스텝으로 복귀
  - `handleToolResultClose` 콜백: 결과 닫고 전체 도구 모드 종료
  - ImmersiveResult props 연결: onClose, onRegenerate, onCreateNew

#### Contract 6.3: i18n 키 확인 ✅

- 기존 i18n 키가 충분함 (추가 불필요)
  - `workflow.result.*`: ImmersiveResult에서 사용하는 키 이미 존재
  - `tools.common.*`: 생성 관련 키 이미 존재

### 동작 흐름

```
[도구 모드 입력 완료 → Confirmation 스텝]
  → "생성하기" 버튼 클릭
  → handleToolGenerate 실행
  → toolInputs → ToolGenerateRequest 매핑
  → generateFromTool() API 호출 (/api/generate)
  → 결과 → Zustand store setGenerationResult
  → showToolResult = true
  → ImmersiveResult 렌더링 (이미지 스와이프, 다운로드, 저장, 공유)

[재생성]
  → handleToolRegenerate
  → showToolResult = false
  → confirmation 스텝으로 복귀

[결과 닫기]
  → handleToolResultClose
  → showToolResult = false
  → exitToolMode → 홈으로 복귀
```

## 다음 작업
- 도구 몰입형 통합 Phase 6 완료로 전체 도구 통합 완료
- 추가 개선 가능: DETAIL_PAGE segment-loop 생성 연결 (현재 segment-loop는 별도 흐름)

## 미해결 이슈
- `@next/swc` 버전 미스매치 경고 (빌드 영향 없음)
- DETAIL_PAGE의 segment-loop 스텝은 자체적인 생성 루프를 가지므로 별도 처리 필요할 수 있음

## 변경된 파일 목록
### 수정된 파일
- `components/workflow/ImmersiveInputForm.tsx`:
  - import 추가: `generateFromTool`, `ImmersiveResult`, `ToolGenerateRequest`
  - `generationResult` store 구독 추가
  - `showToolResult` 상태 추가
  - `handleToolGenerate` 함수 완전 구현
  - `handleToolRegenerate`, `handleToolResultClose` 콜백 추가
  - 도구 모드 렌더링에 ImmersiveResult 통합
