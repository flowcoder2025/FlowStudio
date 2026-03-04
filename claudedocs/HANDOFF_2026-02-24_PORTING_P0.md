# 핸드오프 - 2026-02-24 (Old FlowStudio 기능 포팅 Phase 0)

## 빌드 상태
- 타입 체크: ✅
- 빌드: ✅
- 린트: ✅

## 완료된 Phase
- Phase 0: 공통 인프라 완료 (4/4 영역)

### 1. API 확장 (`app/api/generate/route.ts`)
- `GenerateRequestBody`에 `sourceImage`, `maskImage`, `logoImage`, `mode` 필드 추가
- `GenerationRequest`로 전달하도록 수정
- `lib/imageProvider/types.ts`의 `GenerationOptions`에 이미 해당 필드 존재 → 변경 불필요

### 2. 공통 컴포넌트 (`components/tools/`)
| 컴포넌트 | 파일 | 용도 |
|----------|------|------|
| `ImageDropzone` | `ImageDropzone.tsx` | 단일 이미지 업로드 + 갤러리 선택 |
| `GalleryPicker` | `GalleryPicker.tsx` | 갤러리에서 이미지 선택 다이얼로그 |
| `AspectRatioSelector` | `AspectRatioSelector.tsx` | 비율 선택 그리드 (시각적) |
| `PromptInput` | `PromptInput.tsx` | 프롬프트 textarea + 추천 태그 |
| `GenerationBar` | `GenerationBar.tsx` | 하단 고정 바 (이미지 수 + 생성) |
| `ResultGrid` | `ResultGrid.tsx` | 생성 결과 그리드 (저장/업스케일/다운로드) |
| `UpscaleModal` | `UpscaleModal.tsx` | 업스케일 결과 다이얼로그 |
| `index.ts` | `index.ts` | 배럴 내보내기 |

### 3. 유틸리티 (`lib/tools/`)
| 파일 | 내용 |
|------|------|
| `types.ts` | `ToolMode`, `ToolGenerateRequest`, `ToolGenerateResponse`, `ToolGeneratedImage` 등 |
| `constants.ts` | `ASPECT_RATIOS`, `CATEGORIES`, `STYLES`, `SUGGESTED_TAGS`, `IMAGE_COUNT_OPTIONS`, `UPLOAD_LIMITS` |
| `generateClient.ts` | `generateFromTool()`, `saveImageToGallery()`, `upscaleImage()`, `downloadImage()` |
| `index.ts` | 배럴 내보내기 |

### 4. i18n
| 파일 | 내용 |
|------|------|
| `messages/ko/tools.json` | 한국어 번역 (tools 네임스페이스) |
| `messages/en/tools.json` | 영어 번역 (tools 네임스페이스) |
| `i18n/request.ts` | 다중 JSON 파일 머지 (`common.json` + `tools.json`) |

## 다음 작업 (Phase 1: EDIT 페이지)
- 첫 번째 구현 파일: `app/[locale]/(main)/edit/page.tsx`
- 주요 기능:
  1. 메인 이미지 업로드 (ImageDropzone)
  2. 참조 이미지 업로드 (선택, ImageDropzone)
  3. 비율 선택 (AspectRatioSelector)
  4. 프롬프트 입력 + 추천 태그 (PromptInput)
  5. 이미지 수 선택 → 생성 (GenerationBar)
  6. ResultGrid → 업스케일 → 저장/다운로드
- API: `/api/generate`에 `sourceImage` + `refImages` + `mode: 'EDIT'` 전달
- 참고 패턴: color-correction 페이지 (탭 기반 스튜디오 레이아웃)

## 미해결 이슈
- `@next/swc` 버전 미스매치 경고 (15.5.7 vs 15.5.11) - 빌드에 영향 없음
- ESLint 설정 비어있음 - 실질적 린트 규칙 미적용 상태 (기존 이슈)

## 변경된 파일 목록
### 수정된 파일
- `app/api/generate/route.ts` - sourceImage/maskImage/logoImage/mode 추가
- `i18n/request.ts` - 다중 JSON 파일 머지

### 신규 생성 파일
- `lib/tools/types.ts`
- `lib/tools/constants.ts`
- `lib/tools/generateClient.ts`
- `lib/tools/index.ts`
- `components/tools/ImageDropzone.tsx`
- `components/tools/GalleryPicker.tsx`
- `components/tools/AspectRatioSelector.tsx`
- `components/tools/PromptInput.tsx`
- `components/tools/GenerationBar.tsx`
- `components/tools/ResultGrid.tsx`
- `components/tools/UpscaleModal.tsx`
- `components/tools/index.ts`
- `messages/ko/tools.json`
- `messages/en/tools.json`
