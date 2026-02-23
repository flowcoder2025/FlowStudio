# Handoff - 2026-02-23 버그픽스

## 빌드 상태
- 타입 체크: ✅ PASS
- 빌드: ✅ PASS
- 린트: ✅ PASS

## 완료된 작업

### 1. 배경제거 WASM 로딩 에러 수정
**문제**: `@imgly/background-removal`이 Turbopack 환경에서 onnxruntime-web의 WASM 파일을 로드하지 못함
- Turbopack이 `new URL("*.wasm", import.meta.url)` 패턴을 정적 분석해서 `_next/static/chunks/ort-wasm-simd.wasm`으로 변환
- 해당 파일이 실제로 복사되지 않아 404 발생
- `@imgly`의 CDN blob URL 방식도 Turbopack이 `/* webpackIgnore: true */`를 무시하여 작동하지 않음

**해결**:
- `public/`에 WASM 파일 복사 (`ort-wasm-simd.wasm`, `ort-wasm-simd-threaded.wasm`, `ort-wasm-simd-threaded.jsep.wasm`)
- `next.config.ts`에 `beforeFiles` rewrite 추가: `/_next/static/chunks/ort-wasm-simd.wasm` → `/ort-wasm-simd.wasm`
- `package.json` postinstall에 WASM 복사 스크립트 추가
- `.gitignore`에 `public/*.wasm` 추가

**변경 파일**:
- `next.config.ts` - rewrites, WASM 헤더
- `lib/imageProcessing/removeBackground.ts` - 불필요한 ort.env.wasm 설정 및 publicPath 제거
- `package.json` - postinstall WASM 복사
- `.gitignore` - WASM 바이너리 제외
- `public/ort-wasm-simd.wasm` (바이너리, gitignore)
- `public/ort-wasm-simd-threaded.wasm` (바이너리, gitignore)
- `public/ort-wasm-simd-threaded.jsep.wasm` (바이너리, gitignore)

### 2. 이미지 생성 Google → OpenRouter Fallback
**문제**: Google 이미지 생성 API에서 rate limit 에러 발생 시 실패로 끝남

**해결**: `lib/imageProvider/generate.ts`의 `executeGeneration` 함수에 fallback 로직 추가
- Google provider에서 `retryable` 에러(rate limit 등) 발생 시 자동으로 OpenRouter fallback
- `OPENROUTER_API_KEY` 환경변수가 있을 때만 fallback 시도
- rate limit 카운터를 실제 사용된 provider 기준으로 증가

**변경 파일**:
- `lib/imageProvider/generate.ts` - `executeGeneration` fallback 로직, `incrementRateLimit` 수정

## 미해결 이슈
- 배경제거: Turbopack의 `/* webpackIgnore: true */` 미지원 문제는 근본적 해결이 아닌 workaround (rewrite)
  - 향후 Turbopack이 이 magic comment를 지원하면 rewrite 제거 가능
  - 또는 webpack 모드(`next dev` without `--turbopack`)에서는 이 문제가 없을 수 있음
- `@next/swc` 버전 미스매치 경고 (15.5.7 vs 15.5.11) - 기능 영향 없음

### 3. WASM 버전 불일치 수정
**문제**: `public/` WASM 파일이 `onnxruntime-web@1.21.0`에서 복사됨, `@imgly/background-removal`은 `onnxruntime-web@1.14.0` 사용 → `LinkError: memory import must be a WebAssembly.Memory object`

**해결**:
- `public/` WASM 파일을 v1.14.0에서 올바르게 복사 (pnpm nested dependency 경로)
- `removeBackground.ts`에서 `ort.env.wasm.numThreads = 1` + `Object.defineProperty` 잠금 (SharedArrayBuffer 불필요)
- `next.config.ts`에 `ort-wasm.wasm`, `ort-wasm-threaded.wasm` rewrite 추가
- `package.json` postinstall을 `@imgly`가 사용하는 v1.14.0 경로에서 복사하도록 수정

**변경 파일**:
- `lib/imageProcessing/removeBackground.ts` - ort.env.wasm.numThreads 잠금
- `next.config.ts` - non-SIMD WASM rewrite 추가
- `package.json` - postinstall 경로 수정

### 4. 네비바에서 color-correction 링크 제거
- Header.tsx 데스크톱/모바일 메뉴에서 `/color-correction` 링크 제거

**변경 파일**:
- `components/layout/Header.tsx`

## 미해결 이슈 / 개선 필요
- `/color-correction` 페이지 개선 필요 (배경제거 WASM 실제 동작 브라우저 검증 필요)
- Turbopack의 `/* webpackIgnore: true */` 미지원 → workaround (근본적 해결 아님)
- `@next/swc` 버전 미스매치 경고 (15.5.7 vs 15.5.11) - 기능 영향 없음
- Google → OpenRouter fallback 실제 테스트 필요
