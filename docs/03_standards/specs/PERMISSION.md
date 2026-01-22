# PERMISSION - 권한 시스템 스펙

> SPEC_KEY: PERMISSION
> 버전: 1.0.0
> PRD 참조: §7.3 ReBAC 권한 시스템, §10.2 Authorization

---

## 개요

FlowStudio ReBAC (Relationship-Based Access Control) 권한 시스템. 리소스 단위 세밀한 접근 제어.

---

<!-- FUNCTIONAL:BEGIN -->

## 기능 요소

### Contract: PERMISSION_FUNC_CHECK

- **What**: 권한 확인
- **Why**: 리소스별 접근 제어
- **Acceptance Criteria**:
  - check(userId, namespace, objectId, relation) 함수
  - Boolean 반환
  - 계층적 권한 상속 (owner > editor > viewer)
- **Evidence**:
  - code: `lib/permissions/check.ts` (예정)
  - type: `prisma/schema.prisma::RelationTuple` (예정)

### Contract: PERMISSION_FUNC_GRANT

- **What**: 권한 부여
- **Why**: 리소스 공유, 협업
- **Acceptance Criteria**:
  - grant(userId, namespace, objectId, relation) 함수
  - RelationTuple 레코드 생성
  - 중복 방지
- **Evidence**:
  - code: `lib/permissions/grant.ts` (예정)

### Contract: PERMISSION_FUNC_REVOKE

- **What**: 권한 회수
- **Why**: 접근 해제
- **Acceptance Criteria**:
  - revoke(userId, namespace, objectId, relation) 함수
  - RelationTuple 삭제
- **Evidence**:
  - code: `lib/permissions/revoke.ts` (예정)

### Contract: PERMISSION_FUNC_LIST

- **What**: 접근 가능 리소스 목록
- **Why**: 사용자별 리소스 조회
- **Acceptance Criteria**:
  - listAccessible(userId, namespace, relation) 함수
  - objectId 배열 반환
- **Evidence**:
  - code: `lib/permissions/list.ts` (예정)

### Contract: PERMISSION_FUNC_ADMIN

- **What**: 관리자 권한 확인
- **Why**: 시스템 관리 기능
- **Acceptance Criteria**:
  - isAdmin(userId) 함수
  - system:admin 관계 확인
  - Non-throwing 버전 제공
- **Evidence**:
  - code: `lib/permissions/admin.ts` (예정)

### Contract: PERMISSION_FUNC_MIDDLEWARE

- **What**: API 권한 미들웨어
- **Why**: 라우트 보호
- **Acceptance Criteria**:
  - requireImageProjectOwner() 미들웨어
  - requireImageProjectEditor() 미들웨어
  - 권한 없으면 403 반환
- **Evidence**:
  - code: `lib/permissions/middleware.ts` (예정)

### Contract: PERMISSION_FUNC_FALLBACK

- **What**: 후방 호환성 (userId 기반)
- **Why**: 기존 데이터 마이그레이션 지원
- **Acceptance Criteria**:
  - ReBAC 권한 없으면 userId 매칭으로 fallback
  - 점진적 마이그레이션 지원
- **Evidence**:
  - code: `app/api/images/list/route.ts::fallback` (예정)

<!-- FUNCTIONAL:END -->

---

<!-- DESIGN:BEGIN -->

## 디자인 요소

### Contract: PERMISSION_DESIGN_SHARE

- **What**: 공유 모달 (v1.1 예정)
- **Why**: 협업 기능
- **Acceptance Criteria**:
  - 이메일로 사용자 검색
  - viewer/editor 역할 선택
  - 현재 공유 상태 표시
- **Evidence**:
  - ui: `components/share/ShareModal.tsx` (예정)

<!-- DESIGN:END -->

---

## 권한 구조

```
namespace: image_project
  relations:
    - owner (inherits: editor, viewer)
    - editor (inherits: viewer)
    - viewer

namespace: system
  relations:
    - admin (전역 관리자)
```

## 권한 상속 다이어그램

```
owner
  │
  ├── editor
  │     │
  │     └── viewer
  │
  └── (admin: 모든 리소스 접근)
```

---

## 데이터 모델

```prisma
model RelationTuple {
  id         String   @id @default(cuid())
  namespace  String   // "image_project", "system"
  objectId   String   // 리소스 ID
  relation   String   // "owner", "editor", "viewer", "admin"
  subjectId  String   // 사용자 ID

  @@unique([namespace, objectId, relation, subjectId])
  @@index([subjectId, namespace, relation])
}
```

---

## 사용 예시

```typescript
// 권한 확인
const canView = await check(userId, 'image_project', projectId, 'viewer');
const canEdit = await check(userId, 'image_project', projectId, 'editor');

// 권한 부여
await grantImageProjectOwnership(projectId, userId);

// API 라우트 보호
await requireImageProjectEditor(userId, projectId); // throws 403

// 접근 가능 목록
const projectIds = await listAccessible(userId, 'image_project', 'viewer');
```

---

## 참조

- PRD §7.3 ReBAC 권한 시스템
- PRD §10.2 Authorization
- PRD §11.1.3 권한 마이그레이션
