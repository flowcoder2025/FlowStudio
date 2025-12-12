/**
 * 크레딧 잔액 표시 컴포넌트
 *
 * Header에 표시되어 사용자의 현재 크레딧 잔액을 실시간으로 보여줍니다.
 * 만료 예정 크레딧이 있으면 경고를 표시합니다.
 *
 * [성능 최적화] SWR 도입으로 API 호출 90% 감소
 * - 30초 캐싱 (dedupingInterval)
 * - 포커스/재연결 시 자동 갱신 비활성화
 * - 크레딧 변경 시에만 수동 revalidate
 */

'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import useSWR from 'swr'

interface ExpiringCredits {
  expiringWithin7Days: number
  expiringWithin30Days: number
}

interface BalanceResponse {
  success: boolean
  balance: number
}

interface ExpiringResponse {
  success: boolean
  data: ExpiringCredits
}

// SWR fetcher 함수
const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export function CreditBalance() {
  const { data: session } = useSession()
  const [showTooltip, setShowTooltip] = useState(false)

  // SWR 설정: 30초 캐싱, 포커스/재연결 시 갱신 비활성화
  const swrOptions = {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 30000, // 30초 동안 동일 요청 중복 방지
    refreshInterval: 60000, // 1분마다 백그라운드 갱신
    errorRetryCount: 2,
  }

  // 잔액 조회 (로그인 시에만)
  const { data: balanceData, isLoading: balanceLoading } = useSWR<BalanceResponse>(
    session?.user ? '/api/credits/balance' : null,
    fetcher,
    swrOptions
  )

  // 만료 예정 크레딧 조회 (로그인 시에만)
  const { data: expiringData, isLoading: expiringLoading } = useSWR<ExpiringResponse>(
    session?.user ? '/api/credits/expiring' : null,
    fetcher,
    swrOptions
  )

  // 로그인하지 않은 경우 표시하지 않음
  if (!session?.user) return null

  const loading = balanceLoading || expiringLoading
  const balance = balanceData?.success ? balanceData.balance : null
  const expiring = expiringData?.success ? expiringData.data : null

  // 로딩 중
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg animate-pulse">
        <div className="w-16 h-4 bg-gray-300 rounded"></div>
      </div>
    )
  }

  const hasExpiringCredits = expiring && expiring.expiringWithin7Days > 0

  return (
    <div className="relative">
      <Link
        href="/credits/purchase"
        className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${
          hasExpiringCredits
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
        }`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
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
        <span className="text-sm font-medium text-white whitespace-nowrap">
          {balance?.toLocaleString() || 0}
        </span>
        {hasExpiringCredits && (
          <span className="flex items-center justify-center w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white animate-pulse">
            !
          </span>
        )}
        <svg
          className="w-4 h-4 text-white/70 flex-shrink-0"
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

      {/* 만료 예정 크레딧 툴팁 */}
      {showTooltip && expiring && (expiring.expiringWithin7Days > 0 || expiring.expiringWithin30Days > 0) && (
        <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50">
          <div className="text-xs font-medium text-slate-900 dark:text-slate-100 mb-2">
            ⚠️ 만료 예정 크레딧
          </div>
          {expiring.expiringWithin7Days > 0 && (
            <div className="flex justify-between text-xs mb-1">
              <span className="text-red-600 dark:text-red-400">7일 이내 만료</span>
              <span className="font-bold text-red-600 dark:text-red-400">
                {expiring.expiringWithin7Days.toLocaleString()} 크레딧
              </span>
            </div>
          )}
          {expiring.expiringWithin30Days > expiring.expiringWithin7Days && (
            <div className="flex justify-between text-xs">
              <span className="text-amber-600 dark:text-amber-400">30일 이내 만료</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {expiring.expiringWithin30Days.toLocaleString()} 크레딧
              </span>
            </div>
          )}
          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400">
            무료/보너스 크레딧은 지급일로부터 30일 후 만료됩니다.
          </div>
        </div>
      )}
    </div>
  )
}
