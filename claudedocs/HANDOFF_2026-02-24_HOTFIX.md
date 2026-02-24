# 핸드오프 - 2026-02-24 (Hotfix & UI)

## 빌드 상태
- 타입 체크: ✅
- 빌드: ✅
- 린트: ✅

## 완료된 작업

### 1. 워크플로우 버그 수정 (히어로 샷 작동 불가)
- **원인**: `INTENT_ACTION_MAPPINGS`에서 action ID 불일치
  - `food-hero` → `food-hero-shot` (실제 존재하는 ID)
  - `beauty-hero` → `beauty-product-hero`
  - `beauty-flat-lay` → `beauty-flatlay`
  - `food-detail`, `food-lifestyle` → 존재하지 않는 ID였음
- **파일**: `lib/workflow/intents/matrix.ts`
- **결과**: `getActionsForIntent()`가 빈 배열 반환 → `action = null` → 입력 폼 미렌더링 문제 해결

### 2. 결과 페이지 query param 불일치 수정
- **원인**: `ImmersiveActionSelect`에서 `/result?sessionId=...`으로 이동하지만, result 페이지는 `searchParams.get('session')` 사용
- **파일**: `components/workflow/ImmersiveActionSelect.tsx`
- **수정**: `sessionId` → `session`으로 통일

### 3. 기본 이미지 프로바이더를 OpenRouter로 변경
- **원인**: Google API 429 rate limit → OpenRouter fallback → Vercel 60초 타임아웃 초과
- **수정 파일**:
  - `lib/imageProvider/selectProvider.ts` - 기본 선택 Google → OpenRouter Gemini
  - `lib/imageProvider/generate.ts` - fallback 순서 변경 (OpenRouter → Google)
  - `lib/imageProvider/openRouter.ts` - 타임아웃 90s → 55s (Vercel 한도 내)

### 4. 네비바 Previous 버튼 추가 및 UI 개선
- `https://flow-studio-old.vercel.app` 새 탭 링크
- 아이콘 전용 버튼 (`ExternalLink` w-5 h-5) + 커스텀 CSS 즉시 툴팁
- ThemeToggle/LanguageToggle과 동일한 스타일 (`p-2.5 rounded-lg bg-zinc-100`)
- 데스크톱: 토글 그룹 옆 배치 / 모바일: 햄버거 메뉴 내
- **파일**:
  - `components/layout/Header.tsx`
  - `messages/ko/common.json`, `messages/en/common.json`

### 5. 데스크톱 네비게이션 정중앙 배치
- `absolute left-1/2 -translate-x-1/2`로 좌우 콘텐츠 너비에 무관하게 화면 중앙 고정
- **파일**: `components/layout/Header.tsx`

## 커밋 이력
```
8a5d636 style: Previous 버튼 커스텀 툴팁 (즉시 표시, 큰 글씨)
245ef9d style: Previous 버튼을 아이콘 전용으로 변경하여 높이 통일
f5ee0fd style: 네비 중앙 정렬 및 Previous 버튼 높이 통일
34c67e6 style: Previous 버튼을 다크모드/언어 토글 옆으로 이동 및 스타일 통일
e4c2b20 feat: 네비바에 Previous 버튼 추가 (구버전 링크)
572ba7c fix: 기본 이미지 프로바이더를 OpenRouter로 변경 및 워크플로우 버그 수정
```

## 미해결 이슈
- `@next/swc` 버전 미스매치 경고 (15.5.7 vs 15.5.11) - 빌드에 영향 없음
- ESLint 설정(`eslint.config.mjs`)이 비어있어 실질적 린트 규칙 미적용 상태

## 변경된 파일 목록
- `components/layout/Header.tsx`
- `components/workflow/ImmersiveActionSelect.tsx`
- `lib/imageProvider/generate.ts`
- `lib/imageProvider/openRouter.ts`
- `lib/imageProvider/selectProvider.ts`
- `lib/workflow/intents/matrix.ts`
- `messages/ko/common.json`
- `messages/en/common.json`
