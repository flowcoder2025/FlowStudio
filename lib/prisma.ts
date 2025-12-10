/**
 * Prisma Client Singleton
 * Next.js 환경에서 Prisma Client 인스턴스를 전역으로 관리
 *
 * Development 환경에서 Hot Reload 시 여러 인스턴스 생성을 방지
 */

import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    // Prisma 7: Database URL is loaded from prisma.config.js automatically
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    // Supabase Connection Pooling 최적화
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  }).$extends({
    // Serverless 환경 최적화: 자동으로 연결 정리
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }) {
          const start = Date.now()
          const result = await query(args)
          const end = Date.now()

          // 프로덕션에서 느린 쿼리 로깅 (3초 이상)
          if (process.env.NODE_ENV === 'production' && end - start > 3000) {
            console.warn(`Slow query detected: ${model}.${operation} took ${end - start}ms`)
          }

          return result
        },
      },
    },
  })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export { prisma }

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
