/**
 * NextAuth.js Route Handler - FlowStudio
 * Google OAuth + Prisma Adapter
 *
 * Auth configuration moved to lib/auth.ts for Next.js 16 compatibility
 */

import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
