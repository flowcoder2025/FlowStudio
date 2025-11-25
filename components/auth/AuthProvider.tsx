'use client'

/**
 * AuthProvider - NextAuth Session Provider
 * 클라이언트 컴포넌트에서 세션 정보 사용 가능
 */

import { SessionProvider } from 'next-auth/react'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
