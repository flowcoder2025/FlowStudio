# FlowStudio Prisma Migration Guide

## 환경 변수 설정 후 실행할 명령어

### 1. Prisma Client 생성
```bash
npx prisma generate
```

### 2. 데이터베이스 마이그레이션 (개발 환경)
```bash
npx prisma migrate dev --name init
```

### 3. Prisma Studio 실행 (데이터베이스 GUI)
```bash
npx prisma studio
```

## Supabase에서 실행할 SQL (ReBAC 초기 데이터)

Supabase Dashboard → SQL Editor에서 실행:

```sql
-- RelationDefinition 초기화 (권한 계층)
INSERT INTO "RelationDefinition" ("id", "namespace", "relation", "inherits", "createdAt")
VALUES
  (gen_random_uuid(), 'image_project', 'owner', ARRAY['editor', 'viewer'], NOW()),
  (gen_random_uuid(), 'image_project', 'editor', ARRAY['viewer'], NOW()),
  (gen_random_uuid(), 'image_project', 'viewer', ARRAY[]::text[], NOW())
ON CONFLICT ("namespace", "relation") DO NOTHING;
```

## 환경 변수 체크리스트

`.env.local` 파일에 다음 값들이 모두 설정되었는지 확인:

- [ ] `DATABASE_URL` - Supabase connection pooling URL (port 6543)
- [ ] `DIRECT_URL` - Supabase direct connection URL (port 5432)
- [ ] `NEXTAUTH_URL` - http://localhost:3000
- [ ] `NEXTAUTH_SECRET` - openssl rand -base64 32
- [ ] `GOOGLE_CLIENT_ID` - Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` - Google Cloud Console
- [ ] `ENCRYPTION_KEY` - node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

## 마이그레이션 순서

1. Supabase 프로젝트 생성
2. `.env.local` 환경 변수 설정
3. `npx prisma generate` 실행
4. `npx prisma migrate dev --name init` 실행
5. Supabase SQL Editor에서 ReBAC 초기 데이터 삽입
6. `npm run dev` 실행하여 개발 서버 시작
