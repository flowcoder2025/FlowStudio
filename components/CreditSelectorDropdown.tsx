/**
 * 크레딧 선택 드롭다운 컴포넌트
 *
 * 이미지 생성 시 사용할 크레딧 종류를 드롭다운 형식으로 선택합니다.
 * 액션 바 내에서 생성 버튼 옆에 컴팩트하게 배치됩니다.
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { ChevronDown, Check, Coins } from 'lucide-react'
import { useTranslations } from 'next-intl'

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

interface CreditSelectorDropdownProps {
  /** 필요한 크레딧 수량 */
  requiredCredits: number
  /** 선택된 크레딧 타입 변경 콜백 (두 번째 인자: 워터마크 적용 여부) */
  onSelect: (creditType: CreditType, willHaveWatermark: boolean) => void
  /** 현재 선택된 크레딧 타입 */
  selectedType?: CreditType
  /** 추가 클래스명 */
  className?: string
}

// SWR fetcher
const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export function CreditSelectorDropdown({
  requiredCredits,
  onSelect,
  selectedType = 'auto',
  className = '',
}: CreditSelectorDropdownProps) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [localSelected, setLocalSelected] = useState<CreditType>(selectedType)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('common')

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

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [])

  // 로그인 안 됨 또는 로딩 중
  if (!session?.user || isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-9 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
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
      <div className={`flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg ${className}`}>
        <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
          {t('noWatermarkLong')}
        </span>
        <span className="text-[10px] text-blue-500 dark:text-blue-400">
          ({balance.total})
        </span>
      </div>
    )
  }

  // 두 종류 크레딧이 모두 없으면 표시 안 함
  if (balance.free === 0 && balance.purchased === 0) {
    return (
      <div className={`flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/30 rounded-lg ${className}`}>
        <Coins className="w-3.5 h-3.5 text-red-500" />
        <span className="text-xs font-medium text-red-600 dark:text-red-400">
          {t('insufficientCredits')}
        </span>
      </div>
    )
  }

  // 잔액 부족 체크
  const freeInsufficient = balance.free < requiredCredits
  const purchasedInsufficient = balance.purchased < requiredCredits

  const handleSelect = (type: CreditType) => {
    setLocalSelected(type)
    setIsOpen(false)

    // 워터마크 적용 여부 계산
    let willHaveWatermark = false
    if (type === 'free') {
      willHaveWatermark = true
    } else if (type === 'auto') {
      willHaveWatermark = balance!.purchased < requiredCredits
    }
    onSelect(type, willHaveWatermark)
  }

  // 현재 선택된 옵션의 표시 정보
  const getSelectedDisplay = () => {
    switch (localSelected) {
      case 'free':
        return {
          label: t('free'),
          badge: t('hasWatermark'),
          badgeColor: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
          amount: balance.free,
        }
      case 'purchased':
        return {
          label: t('paid'),
          badge: t('noWatermark'),
          badgeColor: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
          amount: balance.purchased,
        }
      case 'auto':
      default:
        return {
          label: t('auto'),
          badge: balance.purchased >= requiredCredits ? t('noWatermark') : t('hasWatermark'),
          badgeColor: balance.purchased >= requiredCredits
            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
            : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
          amount: balance.total,
        }
    }
  }

  const selected = getSelectedDisplay()

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* 트리거 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 min-h-[40px] bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors border border-slate-200 dark:border-slate-600"
      >
        <Coins className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
            {selected.label}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${selected.badgeColor}`}>
            {selected.badge}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            ({selected.amount})
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
          {/* 헤더 */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{t('creditSelect')}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{t('required')}: {requiredCredits}</span>
            </div>
          </div>

          {/* 옵션 목록 */}
          <div className="py-1">
            {/* 유료 크레딧 옵션 */}
            {balance.purchased > 0 && (
              <button
                type="button"
                onClick={() => handleSelect('purchased')}
                disabled={purchasedInsufficient}
                className={`w-full px-3 py-2.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                  purchasedInsufficient ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  localSelected === 'purchased'
                    ? 'border-green-500 bg-green-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {localSelected === 'purchased' && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{t('paidCredits')}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded">
                      {t('noWatermark')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('balance')}: {balance.purchased}
                    </span>
                    {purchasedInsufficient && (
                      <span className="text-[10px] text-red-500">({t('insufficient')})</span>
                    )}
                  </div>
                </div>
              </button>
            )}

            {/* 무료 크레딧 옵션 */}
            {balance.free > 0 && (
              <button
                type="button"
                onClick={() => handleSelect('free')}
                disabled={freeInsufficient}
                className={`w-full px-3 py-2.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                  freeInsufficient ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  localSelected === 'free'
                    ? 'border-amber-500 bg-amber-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {localSelected === 'free' && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{t('freeCredits')}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded">
                      {t('hasWatermark')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('balance')}: {balance.free}
                    </span>
                    {freeInsufficient && (
                      <span className="text-[10px] text-red-500">({t('insufficient')})</span>
                    )}
                  </div>
                </div>
              </button>
            )}

            {/* 자동 선택 옵션 (둘 다 있을 때만) */}
            {balance.free > 0 && balance.purchased > 0 && (
              <button
                type="button"
                onClick={() => handleSelect('auto')}
                className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  localSelected === 'auto'
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {localSelected === 'auto' && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{t('autoSelect')}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded">
                      {t('paidFirst')}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {t('paidFirstDesc')}
                  </span>
                </div>
              </button>
            )}
          </div>

          {/* 워터마크 안내 (무료만 있을 때) */}
          {balance.free > 0 && balance.purchased === 0 && (
            <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border-t border-slate-200 dark:border-slate-600">
              <p className="text-[10px] text-amber-700 dark:text-amber-300">
                💡 {t('buyPaidForNoWatermark')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CreditSelectorDropdown
