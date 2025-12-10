/**
 * 크레딧 잔액 표시 컴포넌트
 *
 * Header에 표시되어 사용자의 현재 크레딧 잔액을 실시간으로 보여줍니다.
 */

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

export function CreditBalance() {
  const { data: session } = useSession()
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) {
      setLoading(false)
      return
    }

    fetchBalance()
  }, [session])

  const fetchBalance = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/credits/balance')
      const data = await response.json()

      if (data.success) {
        setBalance(data.balance)
      }
    } catch (error) {
      console.error('크레딧 잔액 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 로그인하지 않은 경우 표시하지 않음
  if (!session?.user) return null

  // 로딩 중
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg animate-pulse">
        <div className="w-16 h-4 bg-gray-300 rounded"></div>
      </div>
    )
  }

  const balanceKRW = (balance || 0) * 100 // 1 크레딧 = ₩100

  return (
    <Link
      href="/credits/purchase"
      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <div className="flex items-center gap-1">
        <svg
          className="w-4 h-4 text-white flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {/* 모바일: 숫자만, PC: 숫자 + "크레딧" */}
        <span className="text-sm font-medium text-white whitespace-nowrap">
          {balance?.toLocaleString() || 0}
          <span className="hidden sm:inline"> 크레딧</span>
        </span>
      </div>
      {/* PC에서만 원화 표시 */}
      <span className="hidden md:inline text-xs text-blue-100 whitespace-nowrap">
        (₩{balanceKRW.toLocaleString()})
      </span>
      {/* PC에서만 + 아이콘 */}
      <svg
        className="hidden md:block w-4 h-4 text-blue-100 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
    </Link>
  )
}
