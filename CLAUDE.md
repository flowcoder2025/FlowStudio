# Project Instructions

## 🚨 Phase 기반 작업 규칙 (최우선 - 반드시 준수)

> **핵심 목표**: 컨텍스트 제한에 걸리기 전 핸드오프 문서로 안전한 작업 전달

### ⛔ 절대 규칙

```
1. 한 세션에서 한 Phase만 진행한다
2. Phase 완료 시 즉시 STOP - 절대 다음 Phase로 넘어가지 않는다
3. Phase 완료 후 반드시 핸드오프 문서 작성 후 작업 종료
4. 사용자가 명시적으로 "Phase N 시작" 요청 시에만 해당 Phase 진행
```

### 세션 시작 시 (필수 - 작업 전 반드시 실행)

```
[필수 읽기]
1. claudedocs/TASK_FLOWSTUDIO.md     ← 현재 Phase 확인
2. claudedocs/HANDOFF_*.md 최신 파일  ← 이전 작업 컨텍스트

[확인 사항]
- 현재 진행 중인 Phase 번호 확인
- 해당 Phase의 남은 Contract 목록 확인
- 이전 세션의 미완료 작업 확인
```

**⚠️ 위 문서를 읽지 않고 작업을 시작하면 안 됨**

### Phase 진행 규칙

```
[허용]
✅ 사용자: "Phase 4 시작해줘" → Phase 4만 진행
✅ 사용자: "계속 진행해줘" → 현재 Phase의 남은 작업만 진행

[금지]
❌ Phase 4 완료 후 자동으로 Phase 5 시작
❌ "다음 Phase도 할까요?" 질문 후 바로 진행
❌ 핸드오프 문서 없이 다음 Phase 시작
```

### Phase 종료 시 (필수 절차 - 순서대로)

```
# Step 1: 품질 체크 + 자동 수정 (서브에이전트 위임)
→ 컨텍스트 절감율 ~90% (메인 컨텍스트에서 수정 작업 제거)

[실행 방법 - 반드시 서브에이전트 사용]

방법 A: 단일 통합 에이전트 (권장)
Task 에이전트 1개 실행:
  - subagent_type: "quality-engineer" 또는 "Bash"
  - prompt: "Phase N 품질 체크 및 에러 수정 수행:
    1. npm run build, npx tsc --noEmit, npm run lint 실행
    2. 에러 발견 시 해당 파일 수정
    3. 수정 후 재검증 (최대 3회 반복)
    4. 최종 결과 보고 (✅/❌ 상태)"

방법 B: 병렬 체크 후 수정 위임
1단계 - 병렬 품질 체크 (Bash 에이전트 3개):
  - Task 1: npm run build 2>&1 | tail -30
  - Task 2: npx tsc --noEmit 2>&1 | tail -30
  - Task 3: npm run lint 2>&1 | tail -30

2단계 - 에러 수정 위임 (에러 발견 시):
  - Task 에이전트 생성 (subagent_type: "quality-engineer")
  - prompt: "다음 에러들을 수정하고 재검증:
    [에러 목록 전달]
    수정 완료 후 build/tsc/lint 모두 통과 확인"

⚠️ 메인 컨텍스트에서 직접 수정 금지 - 반드시 서브에이전트 위임

# Step 2: 문서 업데이트
- claudedocs/HANDOFF_YYYY-MM-DD.md 작성/업데이트
- claudedocs/TASK_FLOWSTUDIO.md 체크박스 업데이트

# Step 3: 작업 종료 선언
"Phase N 완료. 핸드오프 문서 작성 완료.
다음 세션에서 Phase N+1 진행하려면 /clear 후 'Phase N+1 시작' 요청하세요."
```

**⚠️ Step 3 이후 추가 작업 금지 - 사용자가 /clear 하도록 유도**
**⚠️ 에러 수정은 절대 메인 컨텍스트에서 하지 말 것 - 서브에이전트 필수**

> 📋 상세 절차: `~/.claude/skills/quality-check.md` 참조

### 핸드오프 문서 필수 섹션

```markdown
# 핸드오프 - YYYY-MM-DD

## 빌드 상태
- 타입 체크: ✅/❌
- 빌드: ✅/❌
- 린트: ✅/❌

## 완료된 Phase
- Phase N: 완료 (X/X Contracts)

## 다음 작업 (Phase N+1)
- 첫 번째 구현 파일: path/to/file.ts
- 주요 Contract 목록

## 미해결 이슈
- 에러/경고 목록
- 미구현 API 목록

## 필요 환경 설정
- 환경 변수
- 추가 의존성
```

### 컨텍스트 관리

| 상황 | 조치 |
|------|------|
| Phase 완료 | 핸드오프 작성 → STOP → 클리어 유도 |
| 컨텍스트 70% | "곧 Phase 종료점 도달" 안내 |
| 컨텍스트 85% | 즉시 핸드오프 작성 → STOP |
| Phase 중간에 클리어 필요 | 현재까지 작업 핸드오프 작성 |

### 작업 재개 예시

```
[사용자]
Phase 4 시작해줘

[Claude - 올바른 응답]
1. TASK_FLOWSTUDIO.md 읽음
2. HANDOFF_2026-01-21.md 읽음
3. Phase 4 Contract 목록 확인
4. Phase 4 구현 시작

[Claude - 잘못된 응답]
바로 구현 시작 (문서 읽지 않음)
```

---

## DocOps

> 문서 기반 SSOT 관리 시스템 - 할루시네이션/드리프트 0% 목표

### 핵심 원칙

1. **Evidence 없는 Contract는 존재할 수 없다**
2. **Snapshot(코드) ↔ Contract(문서) 매핑**으로 드리프트 탐지

### DocOps Skills

| Skill | 용도 | 시점 |
|-------|------|------|
| `/docops-init` | 프로젝트에 DocOps 적용 | 최초 1회 |
| `/docops-verify` | 드리프트 검증 | **세션 시작 시 필수** |
| `/docops-finish` | 작업 완료 워크플로우 | 작업 완료 시 |
| `/docops-status` | 현재 상태 확인 | 수시 |

### 세션 워크플로우

```
1. /docops-verify      ← 세션 시작 (드리프트 확인)
2. 작업 수행...
3. /docops-finish      ← 작업 완료 (검증 + 커밋 + 푸시)
```

### 상세 문서

- [docs/00_ssot/ANCHOR.md](docs/00_ssot/ANCHOR.md) - DocOps 진입점
- [docs/00_ssot/DOC_POLICY.md](docs/00_ssot/DOC_POLICY.md) - 규칙 정의
- [docs/00_ssot/DOCOPS_SPEC_V3.2.md](docs/00_ssot/DOCOPS_SPEC_V3.2.md) - 전체 스펙
