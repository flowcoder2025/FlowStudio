# 핸드오프 - 2026-02-25 (도구 몰입형 통합 Phase 5: 진입점 연결 + 기존 페이지 리다이렉트)

## 빌드 상태
- 타입 체크: ✅
- 빌드: ✅
- 린트: ✅

## 완료된 Phase
- Phase 5: 진입점 연결 + 기존 페이지 리다이렉트 완료 (4/4)

### 구현 내용

#### Contract 5.1: HomeClient 도구 모드 자동 열기 ✅

- **파일**: `components/home/HomeClient.tsx`
- **변경**:
  - Zustand store에서 `toolMode`, `exitToolMode` 구독 추가
  - `isToolImmersiveOpen` 상태 추가
  - `useEffect`로 `toolMode` 감지 → 자동으로 ImmersiveInputForm 열기
  - `handleToolImmersiveClose` 콜백 추가 (모달 닫기 + exitToolMode 호출)
  - return JSX에 도구 모드용 `ImmersiveInputForm` 인스턴스 추가
    - `toolMode`가 설정된 경우에만 렌더링
    - industry/intent는 더미값 전달 (도구 모드에서는 사용하지 않음)

#### Contract 5.2: Header 도구 링크 → enterToolMode 호출 ✅

- **파일**: `components/layout/Header.tsx`
- **변경**:
  - `useRouter`, `usePathname`, `useWorkflowStore`, `ToolMode` import 추가
  - `TOOL_NAV_ITEMS`: `href` 속성 → `toolMode` 속성으로 변경
  - `handleToolClick` 함수 추가:
    - 미인증 시 로그인 페이지로 리다이렉트
    - `enterToolMode(mode)` 호출
    - 홈이 아닌 페이지에서는 `router.push("/")` 실행
  - 데스크톱 드롭다운: `<Link>` → `<button>` + `handleToolClick` 호출
  - 모바일 햄버거 메뉴: `<Link>` → `<button>` + `handleToolClick` 호출

#### Contract 5.3: MobileNav 도구 링크 → enterToolMode 호출 ✅

- **파일**: `components/layout/MobileNav.tsx`
- **변경**:
  - `useRouter`, `useCallback`, `ToolMode` import 추가
  - `enterToolMode` Zustand store 구독 추가
  - `handleToolClick` 함수 추가 (Header와 동일 로직)
  - 슬라이드아웃 도구 섹션: `<Link>` → `<button>` + `handleToolClick` 호출

#### Contract 5.4: 기존 도구 페이지 리다이렉트 ✅

- **신규 파일**: `components/tools/ToolRedirect.tsx`
  - 공통 리다이렉트 컴포넌트
  - `enterToolMode(toolMode)` 호출 후 `router.replace("/")` 실행
  - 리다이렉트 중 로딩 스피너 표시

- **교체된 페이지** (5개):
  - `app/[locale]/(main)/edit/page.tsx` → `<ToolRedirect toolMode="EDIT" />`
  - `app/[locale]/(main)/poster/page.tsx` → `<ToolRedirect toolMode="POSTER" />`
  - `app/[locale]/(main)/composite/page.tsx` → `<ToolRedirect toolMode="COMPOSITE" />`
  - `app/[locale]/(main)/detail-edit/page.tsx` → `<ToolRedirect toolMode="DETAIL_EDIT" />`
  - `app/[locale]/(main)/detail-page/page.tsx` → `<ToolRedirect toolMode="DETAIL_PAGE" />`

### 동작 흐름

```
[Header/MobileNav 도구 클릭]
  → enterToolMode('EDIT') 호출 (Zustand store)
  → router.push('/') (홈이 아닌 페이지일 때)
  → HomeClient에서 toolMode 감지
  → ImmersiveInputForm 자동 열기 (도구 모드)

[직접 URL 접근 (/edit, /poster 등)]
  → ToolRedirect 컴포넌트 렌더링
  → enterToolMode('EDIT') 호출
  → router.replace('/') → 홈으로 리다이렉트
  → HomeClient에서 toolMode 감지
  → ImmersiveInputForm 자동 열기
```

## 다음 작업 (Phase 6)
- **목표**: 생성 연결 + i18n
- **구현**:
  - `handleToolGenerate` 함수 완성 (현재 임시 - `setIsGenerating(true)`)
  - `generateFromTool` API 연결
  - toolInputs → API 요청 매핑
  - 생성 결과 → 결과 페이지 또는 갤러리 연동
  - 도구 관련 i18n 키 보완

## 미해결 이슈
- `@next/swc` 버전 미스매치 경고 (빌드 영향 없음)
- `handleToolGenerate`는 Phase 6에서 완성 예정 (현재 임시)

## 변경된 파일 목록
### 신규 파일
- `components/tools/ToolRedirect.tsx`

### 수정된 파일
- `components/home/HomeClient.tsx` — toolMode 감지 + 도구 모드 ImmersiveInputForm 렌더링
- `components/layout/Header.tsx` — 도구 링크를 enterToolMode 버튼으로 변경
- `components/layout/MobileNav.tsx` — 도구 링크를 enterToolMode 버튼으로 변경

### 교체된 파일 (리다이렉트)
- `app/[locale]/(main)/edit/page.tsx`
- `app/[locale]/(main)/poster/page.tsx`
- `app/[locale]/(main)/composite/page.tsx`
- `app/[locale]/(main)/detail-edit/page.tsx`
- `app/[locale]/(main)/detail-page/page.tsx`
