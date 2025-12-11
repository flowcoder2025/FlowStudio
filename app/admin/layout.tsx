'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Shield, Loader2 } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (status === 'loading') return

      if (!session?.user?.id) {
        router.push('/login')
        return
      }

      // 관리자 권한 확인 (API 호출)
      try {
        const res = await fetch('/api/admin/stats')
        if (res.ok) {
          setIsAdmin(true)
        } else if (res.status === 403) {
          setIsAdmin(false)
        } else {
          router.push('/login')
        }
      } catch {
        router.push('/login')
      }
    }

    checkAdminStatus()
  }, [session, status, router])

  // 로딩 중
  if (status === 'loading' || isAdmin === null) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">권한 확인 중...</p>
        </div>
      </div>
    )
  }

  // 권한 없음
  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            접근 권한 없음
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            관리자 권한이 필요합니다.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {children}
    </div>
  )
}
