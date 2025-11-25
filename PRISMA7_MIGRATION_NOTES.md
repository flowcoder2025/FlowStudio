# Prisma 버전 관리 노트

## ⚠️ Prisma 7 호환성 문제 발견

**최종 결정: Prisma 5.22.0 사용**

Prisma 7.0.0으로 초기 설치 후 다음 문제들이 발견되어 Prisma 5.22.0으로 다운그레이드했습니다.

### Prisma 7의 Breaking Changes 문제

1. **datasourceUrl 옵션 제거**
   - Prisma 7에서 `datasourceUrl` 옵션이 제거됨
   - 대신 `adapter` 또는 `accelerateUrl` 필수 요구

2. **Driver Adapter 필수화**
   - Traditional connection 방식 deprecated
   - `@prisma/adapter-pg` 등 추가 패키지 필요
   - 설정 복잡도 증가

3. **prisma.config.ts 도입**
   - 새로운 설정 파일 형식
   - 환경 변수 로딩 이슈
   - 마이그레이션 툴 호환성 문제

### 다운그레이드 이유

- Prisma 7은 아직 안정화되지 않음 (2024년 11월 릴리스)
- Breaking changes가 많아 기존 프로젝트 호환성 낮음
- Supabase + Next.js 조합에서 검증된 Prisma 5 사용이 안전
- Driver adapter 없이도 정상 작동하는 Prisma 5가 현재 최적

---

## Prisma 5 설정 (현재 사용 중)

### 버전
- `@prisma/client`: 5.22.0
- `prisma`: 5.22.0

## 주요 설정 방법

### 1. Prisma 스키마 구조 (Prisma 5)
표준적인 datasource 설정을 사용합니다.

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

### 2. PrismaClient 초기화 (lib/prisma.ts)
간단한 싱글톤 패턴으로 초기화합니다.

```typescript
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()
export { prisma }

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
```

### 3. 환경 변수 관리
- Next.js는 자동으로 `.env.local`을 로드
- Prisma CLI는 `.env` 파일을 찾음
- 해결책: `.env.local`을 `.env`로 복사 (git ignore에 포함)

```bash
cp .env.local .env
```

### 4. 마이그레이션 실행
```bash
# Prisma Client 생성
npx prisma generate

# 마이그레이션 실행 (직접 연결 필요)
# DATABASE_URL을 임시로 DIRECT_URL로 변경 후 실행
npx prisma migrate dev --name init

# ReBAC 초기 데이터 삽입
npx prisma db execute --file prisma/seed.sql

# 실행 후 DATABASE_URL을 pooling URL로 복원
```

## 설치 완료 체크리스트

- ✅ Prisma 5.22.0으로 다운그레이드
- ✅ `prisma/schema.prisma` - datasource에 url/directUrl 포함
- ✅ `lib/prisma.ts` - 간단한 PrismaClient 초기화
- ✅ `.env` 파일 생성 (`.env.local` 복사)
- ✅ `npx prisma generate` - Prisma Client 생성
- ✅ `npx prisma migrate dev --name init` - 마이그레이션 실행
- ✅ `npx prisma db execute --file prisma/seed.sql` - ReBAC 초기 데이터 삽입
- ✅ 개발 서버 정상 작동 확인

## 주의 사항

### Connection Pooling vs Direct Connection
- **Runtime (Next.js 앱)**: port 6543 (pgbouncer=true) - 성능 최적화
- **Migrations**: port 5432 - Prisma 마이그레이션 요구 사항

### 환경 변수 우선순위
1. `.env.local` - Next.js 앱이 자동 로드
2. `.env` - Prisma CLI가 자동 로드
3. 두 파일 모두 동기화 유지 필요

## 참고 자료
- [Prisma 5 공식 문서](https://www.prisma.io/docs/orm/prisma-schema/overview/datasources)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pool)
- [Prisma 7 Breaking Changes](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-to-prisma-7)

## 향후 계획

Prisma 7이 안정화되고 Supabase 환경에서 충분히 검증된 후에 업그레이드를 고려할 수 있습니다. 현재는 Prisma 5.x가 프로덕션 환경에 가장 적합합니다.
