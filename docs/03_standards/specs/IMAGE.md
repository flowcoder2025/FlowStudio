# IMAGE - 이미지 생성/관리 스펙

> SPEC_KEY: IMAGE
> 버전: 1.0.0
> PRD 참조: §4.1 기능 매트릭스, §6 기술 아키텍처

---

## 개요

FlowStudio AI 이미지 생성, 업스케일, 갤러리 관리 시스템. Gemini 3 Pro 기반 생성 + 다중 프로바이더 전략.

---

<!-- FUNCTIONAL:BEGIN -->

## 기능 요소

### Contract: IMAGE_FUNC_GENERATE

- **What**: AI 이미지 생성
- **Why**: 핵심 가치 - 전문가급 제품 사진 생성
- **Acceptance Criteria**:
  - 프롬프트 기반 이미지 생성
  - 1-4장 동시 생성 지원
  - 비율: 1:1, 4:5, 9:16, 16:9
  - 5크레딧/장 차감
- **Evidence**:
  - code: `app/api/generate/route.ts` (예정)
  - code: `lib/imageProvider/generate.ts` (예정)

### Contract: IMAGE_FUNC_PROVIDER

- **What**: 다중 프로바이더 전략
- **Why**: Rate limit 대응, 비용 최적화
- **Acceptance Criteria**:
  - Primary: Google GenAI (Gemini 3 Pro)
  - Fallback: OpenRouter
  - Hybrid 모드: 배치 크기 기준 자동 선택
- **Evidence**:
  - code: `lib/imageProvider/selectProvider.ts` (예정)
  - code: `lib/imageProvider/fallback.ts` (예정)

### Contract: IMAGE_FUNC_UPSCALE

- **What**: 4K 업스케일
- **Why**: 고해상도 출력 요구
- **Acceptance Criteria**:
  - 2K → 4K 변환
  - 10크레딧/장 차감
  - 품질 손실 최소화
- **Evidence**:
  - code: `app/api/upscale/route.ts` (예정)

### Contract: IMAGE_FUNC_SAVE

- **What**: 이미지 저장
- **Why**: 작업물 보관
- **Acceptance Criteria**:
  - Supabase Storage 업로드
  - ImageProject 레코드 생성
  - 메타데이터 저장 (프롬프트, 옵션)
- **Evidence**:
  - code: `app/api/images/save/route.ts` (예정)
  - code: `lib/storage/uploadImage.ts` (예정)

### Contract: IMAGE_FUNC_LIST

- **What**: 갤러리 목록 조회
- **Why**: 작업물 관리
- **Acceptance Criteria**:
  - 사용자 소유 이미지 목록
  - 페이지네이션 지원
  - 정렬 옵션 (최신순, 이름순)
  - 소프트 삭제 항목 제외
- **Evidence**:
  - code: `app/api/images/list/route.ts` (예정)

### Contract: IMAGE_FUNC_DELETE

- **What**: 이미지 삭제
- **Why**: 작업물 정리
- **Acceptance Criteria**:
  - 소프트 삭제 (deletedAt 설정)
  - 30일 후 하드 삭제 (Storage 파일 포함)
- **Evidence**:
  - code: `app/api/images/[id]/route.ts::DELETE` (예정)

<!-- FUNCTIONAL:END -->

---

<!-- DESIGN:BEGIN -->

## 디자인 요소

### Contract: IMAGE_DESIGN_RESULT

- **What**: 생성 결과 화면 (PRD §3.2.3)
- **Why**: 명확한 결과 확인 및 후속 액션
- **Acceptance Criteria**:
  - 생성 이미지 그리드
  - 선택 체크박스
  - 다운로드/저장/컬러웨이/4K업 버튼
- **Evidence**:
  - ui: `app/(main)/result/page.tsx` (예정)
  - ui: `components/result/ImageGrid.tsx` (예정)

### Contract: IMAGE_DESIGN_GALLERY

- **What**: 갤러리 페이지
- **Why**: 작업물 일괄 관리
- **Acceptance Criteria**:
  - 이미지 그리드 (반응형)
  - 필터/정렬 옵션
  - 벌크 선택/삭제
- **Evidence**:
  - ui: `app/(main)/gallery/page.tsx` (예정)
  - ui: `components/gallery/ImageCard.tsx` (예정)

### Contract: IMAGE_DESIGN_PROGRESS

- **What**: 생성 진행률 표시
- **Why**: 진행 상황 투명성 (UX 원칙 3)
- **Acceptance Criteria**:
  - 실시간 진행률 바
  - 예상 완료 시간
  - 취소 버튼
- **Evidence**:
  - ui: `components/generate/ProgressOverlay.tsx` (예정)

### Contract: IMAGE_DESIGN_LAZY

- **What**: 이미지 지연 로딩
- **Why**: 성능 최적화
- **Acceptance Criteria**:
  - Intersection Observer 기반
  - 스켈레톤 UI 표시
  - 점진적 로딩
- **Evidence**:
  - ui: `components/ui/LazyImage.tsx` (예정)

<!-- DESIGN:END -->

---

## API 엔드포인트

| 엔드포인트 | 메소드 | 설명 |
|-----------|-------|------|
| `/api/generate` | POST | AI 이미지 생성 |
| `/api/upscale` | POST | 4K 업스케일 |
| `/api/images/save` | POST | 이미지 저장 |
| `/api/images/list` | GET | 갤러리 목록 |
| `/api/images/[id]` | GET/DELETE | 이미지 상세/삭제 |

---

## 참조

- PRD §4.1 기능 매트릭스
- PRD §6.3 다중 프로바이더 전략
- PRD §9 성능 요구사항
