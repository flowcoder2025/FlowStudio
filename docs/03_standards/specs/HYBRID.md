# HYBRID - 하이브리드 이미지 처리 스펙

> SPEC_KEY: HYBRID
> 버전: 1.0.0
> PRD 참조: §4.3 하이브리드 이미지 처리, §4.4 이미지 처리 스튜디오

---

## 개요

FlowStudio 브라우저 기반 무료 이미지 처리 시스템. AI + 결정론적 알고리즘 조합으로 비용 최적화.

---

<!-- FUNCTIONAL:BEGIN -->

## 기능 요소

### Contract: HYBRID_FUNC_BG_REMOVE

- **What**: AI 배경 제거
- **Why**: 누끼 이미지 무료 제공
- **Acceptance Criteria**:
  - @imgly/background-removal (ONNX) 사용
  - 브라우저 WebGPU 가속
  - PNG 출력 (투명 배경)
  - 무료 (0 크레딧)
- **Evidence**:
  - code: `lib/imageProcessing/removeBackground.ts` (예정)
  - code: `lib/imageProcessing/worker.ts` (예정)

### Contract: HYBRID_FUNC_COLOR_TRANSFER

- **What**: 색상 전송 (Reinhard 알고리즘)
- **Why**: 색감 통일, 무드 변경
- **Acceptance Criteria**:
  - LAB 색공간 변환
  - 소스 → 타겟 색감 전송
  - 프리셋 제공 (warm, cool, vintage 등)
  - 무료 (0 크레딧)
- **Evidence**:
  - code: `lib/imageProcessing/colorTransfer.ts` (예정)
  - code: `lib/imageProcessing/labConversion.ts` (예정)

### Contract: HYBRID_FUNC_FILTER

- **What**: 필터 보정
- **Why**: 밝기, 대비, 채도 조절
- **Acceptance Criteria**:
  - Canvas 2D filter API 사용
  - 실시간 프리뷰
  - 무료 (0 크레딧)
- **Evidence**:
  - code: `lib/imageProcessing/applyFilter.ts` (예정)

### Contract: HYBRID_FUNC_COLOR_EXTRACT

- **What**: 색상 추출 (스포이드)
- **Why**: 정확한 색상 정보 확인
- **Acceptance Criteria**:
  - Canvas getImageData 사용
  - HEX, RGB, HSL 값 반환
  - 복사 기능
- **Evidence**:
  - code: `lib/imageProcessing/extractColor.ts` (예정)

### Contract: HYBRID_FUNC_SAM

- **What**: SAM 영역 선택
- **Why**: 정밀한 영역 지정
- **Acceptance Criteria**:
  - Transformers.js (SlimSAM) 사용
  - 클릭 기반 영역 선택
  - 마스크 출력
- **Evidence**:
  - code: `lib/imageProcessing/segmentAnything.ts` (예정)

### Contract: HYBRID_FUNC_COLORWAY

- **What**: 컬러웨이 변환
- **Why**: 색상 옵션 자동 생성
- **Acceptance Criteria**:
  - 배경 제거 → 색상 교체 → 합성 파이프라인
  - 텍스처 보존
  - 무료 (0 크레딧)
- **Evidence**:
  - code: `lib/imageProcessing/colorway.ts` (예정)
  - code: `lib/imageProcessing/pipeline.ts` (예정)

<!-- FUNCTIONAL:END -->

---

<!-- DESIGN:BEGIN -->

## 디자인 요소

### Contract: HYBRID_DESIGN_STUDIO

- **What**: 이미지 처리 스튜디오 페이지
- **Why**: 전문가용 무료 도구 제공
- **Acceptance Criteria**:
  - 탭 구성: 필터, 색상 추출, 색상 전송, 배경 제거
  - 실시간 프리뷰
  - 다운로드 버튼
- **Evidence**:
  - ui: `app/(main)/color-correction/page.tsx` (예정)

### Contract: HYBRID_DESIGN_FILTER_TAB

- **What**: 필터 보정 탭
- **Why**: 직관적인 조절 UI
- **Acceptance Criteria**:
  - 슬라이더: 밝기, 대비, 채도, 색조
  - 리셋 버튼
  - Before/After 토글
- **Evidence**:
  - ui: `components/studio/FilterTab.tsx` (예정)

### Contract: HYBRID_DESIGN_TRANSFER_TAB

- **What**: 색상 전송 탭
- **Why**: 프리셋 기반 간편 사용
- **Acceptance Criteria**:
  - 프리셋 버튼 (warm, cool, vintage 등)
  - 커스텀 소스 이미지 업로드
  - 강도 슬라이더
- **Evidence**:
  - ui: `components/studio/ColorTransferTab.tsx` (예정)

### Contract: HYBRID_DESIGN_BG_REMOVE_TAB

- **What**: 배경 제거 탭
- **Why**: 원클릭 누끼
- **Acceptance Criteria**:
  - 이미지 업로드/드래그앤드롭
  - 처리 중 로딩 표시
  - 결과 프리뷰 + 다운로드
- **Evidence**:
  - ui: `components/studio/BackgroundRemovalTab.tsx` (예정)

<!-- DESIGN:END -->

---

## 색상 프리셋

```typescript
const COLOR_PRESETS = {
  warm: { L: 0, a: 8, b: 15 },
  cool: { L: 0, a: -5, b: -10 },
  vintage: { L: -5, a: 5, b: 20 },
  vivid: { L: 10, a: 15, b: 15 },
  golden: { L: 5, a: 10, b: 25 },
  'blue-hour': { L: -10, a: -5, b: -20 },
}
```

---

## 기술 스택

| 기능 | 기술 | 처리 위치 |
|------|------|----------|
| 배경 제거 | @imgly/background-removal | 브라우저 (WebGPU) |
| 색상 전송 | Reinhard (LAB) | 브라우저 |
| 필터 보정 | Canvas 2D API | 브라우저 |
| SAM 영역 | Transformers.js | 브라우저 (WebGPU) |

---

## 참조

- PRD §4.3 하이브리드 이미지 처리 상세
- PRD §4.4 이미지 처리 스튜디오
- docs/HYBRID_IMAGE_PROCESSING_USAGE.md
