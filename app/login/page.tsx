'use client'

/**
 * 로그인 페이지 - Google OAuth
 * 이미 로그인한 사용자는 홈으로 리다이렉트
 */

import { useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // 이미 로그인한 사용자는 홈으로 리다이렉트
    if (status === 'authenticated') {
      router.replace('/')
    }
  }, [status, router])

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/' })
  }

  // 로딩 중이거나 이미 로그인된 경우 로딩 표시
  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-slate-300">잠시만 기다려주세요...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="bg-white dark:bg-slate-800 p-10 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 max-w-md w-full transition-colors">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100 mb-2">FlowStudio</h1>
          <p className="text-gray-600 dark:text-slate-300 text-lg">AI 이미지 생성 플랫폼</p>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-2">소상공인을 위한 AI 디자인 파트너</p>
        </div>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 min-h-[56px] bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600 hover:border-gray-400 dark:hover:border-slate-500 transition-all duration-200 font-medium text-gray-700 dark:text-slate-200 shadow-sm hover:shadow-md"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google로 계속하기
        </button>

        {/* Info */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-slate-400">
          <p>로그인하면 FlowStudio의</p>
          <p className="mt-1">서비스 약관 및 개인정보 처리방침에 동의하게 됩니다.</p>
        </div>
      </div>
    </div>
  )
}
