/**
 * 크레딧 선택 컴포넌트
 *
 * 이미지 생성 시 사용할 크레딧 종류를 선택합니다.
 * - 무료 크레딧 (BONUS, REFERRAL): 워터마크 적용
 * - 유료 크레딧 (PURCHASE): 워터마크 미적용
 *
 * FREE 플랜 사용자만 선택 UI를 표시합니다.
 * 구독자(PLUS/PRO/BUSINESS)는 항상 워터마크 없이 사용 가능합니다.
 */

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'

export type CreditType = 'free' | 'purchased' | 'auto'

interface CreditBalanceDetail {
  total: number
  free: number
  purchased: number
  tier: string
  watermarkFree: boolean
  watermarkPolicy: {
    isSubscriber: boolean
    canUsePurchasedWithoutWatermark: boolean
    freeCreditsHaveWatermark: boolean
  }
}

interface CreditSelectorProps {
  /** 필요한 크레딧 수량 */
  requiredCredits: number
  /** 선택된 크레딧 타입 변경 콜백 */
  onSelect: (creditType: CreditType) => void
  /** 현재 선택된 크레딧 타입 */
  selectedType?: CreditType
  /** 컴팩트 모드 (작은 화면용) */
  compact?: boolean
  /** 추가 클래스명 */
  className?: string
}

// SWR fetcher
const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export function CreditSelector({
  requiredCredits,
  onSelect,
  selectedType = 'auto',
  compact = false,
  className = '',
}: CreditSelectorProps) {
  const { data: session } = useSession()
  const [localSelected, setLocalSelected] = useState<CreditType>(selectedType)

  // 크레딧 잔액 상세 조회
  const { data: balance, isLoading } = useSWR<CreditBalanceDetail>(
    session?.user ? '/api/credits/balance' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )

  // 외부 selectedType 변경 시 동기화
  useEffect(() => {
    setLocalSelected(selectedType)
  }, [selectedType])

  // 로그인 안 됨 또는 로딩 중
  if (!session?.user || isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
      </div>
    )
  }

  // 데이터 없음
  if (!balance) {
    return null
  }

  // 구독자는 선택 UI 불필요 (항상 워터마크 없음)
  if (balance.watermarkFree) {
    return (
      <div className={`p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 ${className}`}>
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">
            {balance.tier} 구독 중 - 워터마크 없이 생성됩니다
          </span>
        </div>
        <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
          보유 크레딧: {balance.total.toLocaleString()}
        </div>
      </div>
    )
  }

  // 두 종류 크레딧이 모두 없으면 표시 안 함
  if (balance.free === 0 && balance.purchased === 0) {
    return null
  }

  // 한 종류만 있으면 자동 선택 (선택 UI 간소화)
  const hasFreeOnly = balance.free > 0 && balance.purchased === 0
  const hasPurchasedOnly = balance.purchased > 0 && balance.free === 0

  const handleSelect = (type: CreditType) => {
    setLocalSelected(type)
    onSelect(type)
  }

  // 잔액 부족 체크
  const freeInsufficient = balance.free < requiredCredits
  const purchasedInsufficient = balance.purchased < requiredCredits

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span>크레딧 선택</span>
          <span className="text-slate-400">|</span>
          <span>필요: {requiredCredits}</span>
        </div>
        <div className="flex gap-2">
          {/* 무료 크레딧 버튼 */}
          {balance.free > 0 && (
            <button
              type="button"
              onClick={() => handleSelect('free')}
              disabled={freeInsufficient}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                localSelected === 'free'
                  ? 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-500 text-amber-700 dark:text-amber-300'
                  : 'bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              } ${freeInsufficient ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div>무료 ({balance.free})</div>
              <div className="text-[10px] text-amber-600 dark:text-amber-400">워터마크 O</div>
            </button>
          )}
          {/* 유료 크레딧 버튼 */}
          {balance.purchased > 0 && (
            <button
              type="button"
              onClick={() => handleSelect('purchased')}
              disabled={purchasedInsufficient}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                localSelected === 'purchased'
                  ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 text-green-700 dark:text-green-300'
                  : 'bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              } ${purchasedInsufficient ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div>유료 ({balance.purchased})</div>
              <div className="text-[10px] text-green-600 dark:text-green-400">워터마크 X</div>
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          사용할 크레딧 선택
        </h4>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          필요: {requiredCredits} 크레딧
        </span>
      </div>

      <div className="space-y-2">
        {/* 무료 크레딧 옵션 */}
        {balance.free > 0 && (
          <label
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
              localSelected === 'free'
                ? 'bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 dark:border-amber-600'
                : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-amber-300 dark:hover:border-amber-700'
            } ${freeInsufficient ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name="creditType"
              value="free"
              checked={localSelected === 'free'}
              onChange={() => handleSelect('free')}
              disabled={freeInsufficient}
              className="w-4 h-4 text-amber-500 focus:ring-amber-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  무료 크레딧
                </span>
                <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full">
                  워터마크 적용
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  잔액: {balance.free.toLocaleString()} 크레딧
                </span>
                {freeInsufficient && (
                  <span className="text-xs text-red-500">
                    (부족)
                  </span>
                )}
              </div>
            </div>
            {/* 워터마크 아이콘 */}
            <div className="flex items-center justify-center w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          </label>
        )}

        {/* 유료 크레딧 옵션 */}
        {balance.purchased > 0 && (
          <label
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
              localSelected === 'purchased'
                ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-400 dark:border-green-600'
                : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-green-300 dark:hover:border-green-700'
            } ${purchasedInsufficient ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name="creditType"
              value="purchased"
              checked={localSelected === 'purchased'}
              onChange={() => handleSelect('purchased')}
              disabled={purchasedInsufficient}
              className="w-4 h-4 text-green-500 focus:ring-green-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  유료 크레딧
                </span>
                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full">
                  워터마크 없음
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  잔액: {balance.purchased.toLocaleString()} 크레딧
                </span>
                {purchasedInsufficient && (
                  <span className="text-xs text-red-500">
                    (부족)
                  </span>
                )}
              </div>
            </div>
            {/* 체크 아이콘 */}
            <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </label>
        )}

        {/* 자동 선택 옵션 (둘 다 있을 때만) */}
        {balance.free > 0 && balance.purchased > 0 && (
          <label
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
              localSelected === 'auto'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-600'
                : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700'
            }`}
          >
            <input
              type="radio"
              name="creditType"
              value="auto"
              checked={localSelected === 'auto'}
              onChange={() => handleSelect('auto')}
              className="w-4 h-4 text-blue-500 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  자동 선택
                </span>
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                  유료 우선
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                유료 크레딧을 먼저 사용하고, 부족하면 무료 크레딧 사용
              </div>
            </div>
            {/* 자동 아이콘 */}
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </label>
        )}
      </div>

      {/* 워터마크 안내 */}
      {localSelected === 'free' && (
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-xs text-amber-700 dark:text-amber-300">
              <span className="font-medium">무료 크레딧 사용 시 워터마크가 적용됩니다.</span>
              <br />
              <span className="text-amber-600 dark:text-amber-400">
                워터마크 없이 사용하려면 유료 크레딧을 구매하거나 구독하세요.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 한 종류만 있을 때 안내 */}
      {hasFreeOnly && (
        <div className="mt-3 p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            💡 유료 크레딧을 구매하면 워터마크 없이 이미지를 생성할 수 있습니다.
          </div>
        </div>
      )}

      {hasPurchasedOnly && localSelected !== 'purchased' && (
        <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-xs text-green-600 dark:text-green-400">
            ✨ 유료 크레딧만 보유 중이므로 워터마크 없이 생성됩니다.
          </div>
        </div>
      )}
    </div>
  )
}

export default CreditSelector
