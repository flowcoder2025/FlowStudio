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
  })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export { prisma }

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
