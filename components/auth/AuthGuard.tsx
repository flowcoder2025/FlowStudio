'use client'

/**
 * AuthGuard - 인증 보호 컴포넌트
 *
 * 로그인이 필요한 페이지를 감싸서 미인증 사용자를 로그인 페이지로 리다이렉트
 * middleware.ts와 함께 이중 보호를 제공 (클라이언트 측 UX 개선)
 */

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2, Lock } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // 로딩이 완료되고 인증되지 않은 경우 로그인 페이지로 리다이렉트
    if (status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [status, router])

  // 로딩 중
  if (status === 'loading') {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-slate-600">로딩 중...</p>
          </div>
        </div>
      )
    )
  }

  // 미인증 상태 (리다이렉트 대기 중)
  if (status === 'unauthenticated') {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <Lock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">로그인이 필요합니다</h2>
            <p className="text-slate-600 mb-4">이 페이지에 접근하려면 로그인해주세요.</p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              로그인하기
            </button>
          </div>
        </div>
      )
    )
  }

  // 인증된 사용자
  return <>{children}</>
}
