# 핸드오프 - 2026-01-22 몰입형 추천 UX

## 빌드 상태
- 타입 체크: ✅
- 빌드: ✅
- 린트: ✅ (기존 경고만 존재)

---

## 완료된 작업

### 검색 추천 몰입형 UX 구현

**신규 파일**:
| 파일 | 설명 |
|------|------|
| `components/workflow/ImmersiveRecommend.tsx` | 풀스크린 오버레이 메인 컴포넌트 |
| `components/workflow/RecommendHero.tsx` | 대형 추천 카드 (매칭률, 도트 인디케이터) |

**수정 파일**:
| 파일 | 변경 사항 |
|------|-----------|
| `app/(main)/page.tsx` | ImmersiveRecommend 통합, 검색 시 오버레이 트리거 |
| `package.json` | framer-motion 의존성 추가 |

**추가 의존성**:
- `framer-motion` - 애니메이션 및 제스처 지원

### 구현된 기능
1. **풀스크린 오버레이**: 배경 블러 + 대형 카드 중앙 배치
2. **키보드 네비게이션**: `←` `→` 이동, `Enter` 선택, `ESC` 닫기
3. **스와이프 제스처**: 모바일에서 좌/우 드래그로 전환
4. **순환 로직**: 마지막 추천 → 첫 번째로 자동 순환
5. **매칭률 프로그레스 바**: 시각적 점수 표시 (80%+ 초록, 60%+ 노랑)
6. **도트 인디케이터**: 현재 위치 시각화 (최대 7개)

### 인터랙션 플로우
```
검색 입력 → 엔터/버튼 클릭
    ↓
풀스크린 오버레이 열림 (배경 블러)
    ↓
Primary 추천 대형 표시
    ↓
[이 워크플로우로 시작] → 워크플로우 페이지 이동
    또는
[다른 추천 보기] / 스와이프 → 다음 추천 슬라이드 전환
    또는
[X 닫기] / ESC → 오버레이 닫기
```

---

## 다음 작업 (Phase A~C)

### 사용자 피드백
> "스와이프 동작 방법이 한눈에 들어오지 않아. 좌우에 < > 버튼이나 온보딩 안내 필요"
> "워크플로우 전체 진행에 몰입감이 계속되면 좋겠어"

### Phase A: 스와이프 안내 개선 (즉시)
- [ ] `ImmersiveNavigation` 컴포넌트 생성
  - 좌우 `<` `>` 버튼 (화면 양쪽, 반투명)
  - 온보딩 메시지 ("스와이프해서 다른 추천 보기")
  - localStorage로 첫 방문 감지
- [ ] `useOnboarding` 훅 생성
- [ ] ImmersiveRecommend에 네비게이션 통합

### Phase B: 공통 인프라 구축
- [ ] `components/immersive/` 디렉토리 생성
  - `ImmersiveContainer.tsx` - 풀스크린 오버레이 래퍼
  - `ImmersiveCard.tsx` - 재사용 대형 카드
  - `ImmersiveNavigation.tsx` - 네비게이션 (버튼 + 도트 + 힌트)
  - `hooks/useSwipeNavigation.ts` - 스와이프 로직
  - `hooks/useImmersiveKeyboard.ts` - 키보드 로직
  - `hooks/useOnboarding.ts` - 온보딩 상태

### Phase C: 액션 선택 몰입형 전환
- [ ] `ImmersiveActionSelect.tsx` 생성
- [ ] `/workflow/[industry]/page.tsx` 수정
- [ ] 기존 리스트 → 카드 스와이프 방식 전환

---

## Git 상태
- 초기 커밋 완료: `ace0c62`
- 브랜치: `main`

---

## 테스트 방법
```bash
npm run dev
# http://localhost:3003 접속
# 검색창에 "티셔츠 모델" 등 입력 후 엔터
# 풀스크린 오버레이 확인
```

---

## 핵심 파일 (다음 작업 시 참조)

1. `/components/workflow/ImmersiveRecommend.tsx` - 기존 몰입형 패턴
2. `/components/workflow/RecommendHero.tsx` - 대형 카드 UI
3. `/lib/workflow/store.ts` - 상태 관리 (몰입 모드 확장 필요)
4. `/app/(main)/workflow/[industry]/page.tsx` - 액션 선택 페이지
5. `/components/a11y/FocusTrap.tsx` - 접근성 컴포넌트 재사용

---

## 계획 문서
- `~/.claude/plans/floofy-mixing-starlight.md` - 전체 몰입형 UX 계획
