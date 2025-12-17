/**
 * 구독 플랜 페이지
 * /subscription
 *
 * 구독 플랜 선택 및 관리
 * 포트원 V2 정기 결제 연동
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Check, Crown, Zap, Building2, Sparkles, Loader2, ArrowLeft } from 'lucide-react'
import * as PortOne from '@portone/browser-sdk/v2'

// 구독 플랜 정의
const SUBSCRIPTION_PLANS = [
  {
    tier: 'FREE',
    name: '무료',
    price: 0,
    icon: Sparkles,
    color: 'bg-slate-100 dark:bg-slate-800',
    borderColor: 'border-slate-200 dark:border-slate-700',
    features: ['1GB 저장공간', '동시 1건 생성', '워터마크 포함', '7일 히스토리'],
    cta: '현재 플랜',
    popular: false
  },
  {
    tier: 'PLUS',
    name: 'Plus',
    price: 9900,
    icon: Zap,
    color: 'bg-blue-50 dark:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-700',
    features: ['100GB 저장공간', '동시 3건 생성', '워터마크 제거', '우선 처리', '30일 히스토리'],
    cta: '업그레이드',
    popular: true
  },
  {
    tier: 'PRO',
    name: 'Pro',
    price: 29900,
    icon: Crown,
    color: 'bg-purple-50 dark:bg-purple-900/30',
    borderColor: 'border-purple-200 dark:border-purple-700',
    features: ['500GB 저장공간', '동시 5건 생성', '워터마크 제거', '우선 처리', '90일 히스토리', 'API 접근'],
    cta: '업그레이드',
    popular: false
  },
  {
    tier: 'BUSINESS',
    name: 'Business',
    price: 99000,
    icon: Building2,
    color: 'bg-amber-50 dark:bg-amber-900/30',
    borderColor: 'border-amber-200 dark:border-amber-700',
    features: ['1TB 저장공간', '동시 10건 생성', '워터마크 제거', '최우선 처리', '무제한 히스토리', 'API 접근', '팀 협업 (5명)'],
    cta: '문의하기',
    popular: false
  }
] as const

interface CurrentSubscription {
  tier: string
  status: string
  endDate: string | null
  tierConfig: {
    name: string
    price: number
  }
}

interface CreditBalance {
  balance: number
  free: number
  purchased: number
  watermarkFree: boolean
}

export default function SubscriptionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null)
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingTier, setProcessingTier] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'polling'>('idle')

  const fetchSubscription = useCallback(async () => {
    try {
      const [subResponse, creditResponse] = await Promise.all([
        fetch('/api/subscription'),
        fetch('/api/credits/balance')
      ])

      const subData = await subResponse.json()
      if (subData.success) {
        setCurrentSubscription(subData.data)
      }

      if (creditResponse.ok) {
        const creditData = await creditResponse.json()
        setCreditBalance(creditData)
      }
    } catch (error) {
      console.error('데이터 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    fetchSubscription()
  }, [session, status, router, fetchSubscription])

  // 결제 후 구독 상태 폴링
  const pollSubscriptionStatus = useCallback(async (targetTier: string, maxAttempts = 10) => {
    setPaymentStatus('polling')

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000)) // 3초 대기

      const response = await fetch('/api/subscription')
      const data = await response.json()

      if (data.success && data.data.tier === targetTier) {
        setCurrentSubscription(data.data)
        setPaymentStatus('idle')
        alert(`${SUBSCRIPTION_PLANS.find(p => p.tier === targetTier)?.name} 플랜으로 업그레이드되었습니다!`)
        return true
      }
    }

    setPaymentStatus('idle')
    alert('결제가 완료되었습니다. 구독 상태가 곧 업데이트됩니다.')
    fetchSubscription()
    return false
  }, [fetchSubscription])

  const handleUpgrade = async (tier: string) => {
    if (!session?.user?.id || !session?.user?.email) {
      alert('로그인이 필요합니다.')
      return
    }

    if (tier === 'BUSINESS') {
      // Business 플랜은 문의 양식으로 이동
      window.open('mailto:support@flowstudio.com?subject=Business 플랜 문의', '_blank')
      return
    }

    if (tier === currentSubscription?.tier) {
      return
    }

    const plan = SUBSCRIPTION_PLANS.find(p => p.tier === tier)
    if (!plan || plan.price === 0) {
      return
    }

    // 환경 변수 확인
    const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID
    const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY

    if (!storeId || !channelKey) {
      alert('결제 시스템이 설정되지 않았습니다. 관리자에게 문의해주세요.')
      return
    }

    try {
      setProcessingTier(tier)
      setPaymentStatus('processing')

      // 고유한 결제 ID 생성
      const paymentId = `sub_${tier}_${session.user.id}_${Date.now()}`

      // PortOne V2 결제 요청
      const response = await PortOne.requestPayment({
        storeId,
        channelKey,
        paymentId,
        orderName: `FlowStudio ${plan.name} 구독 (1개월)`,
        totalAmount: plan.price,
        currency: 'CURRENCY_KRW',
        payMethod: 'EASY_PAY',
        customer: {
          customerId: session.user.id,
          email: session.user.email,
          fullName: session.user.name || undefined,
        },
        customData: {
          type: 'subscription',
          tier: tier,
          userId: session.user.id,
          durationMonths: 1,
        },
        redirectUrl: `${window.location.origin}/subscription?payment=success&tier=${tier}`,
      })

      // 결제 응답 처리
      if (response?.code) {
        // 결제 실패 또는 취소
        if (response.code === 'FAILURE_TYPE_PG') {
          alert('결제가 실패했습니다. 다시 시도해주세요.')
        } else {
          console.log('결제 취소 또는 오류:', response.message)
        }
        setPaymentStatus('idle')
        return
      }

      // 결제 성공 - 웹훅에서 처리되므로 폴링으로 상태 확인
      await pollSubscriptionStatus(tier)

    } catch (error) {
      console.error('결제 오류:', error)
      alert('결제 중 오류가 발생했습니다. 다시 시도해주세요.')
      setPaymentStatus('idle')
    } finally {
      setProcessingTier(null)
    }
  }

  // URL 파라미터로 결제 성공 시 폴링
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const payment = params.get('payment')
    const tier = params.get('tier')

    if (payment === 'success' && tier) {
      // URL 정리
      window.history.replaceState({}, '', '/subscription')
      // 폴링 시작
      pollSubscriptionStatus(tier)
    }
  }, [pollSubscriptionStatus])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-4 lg:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>뒤로가기</span>
        </button>

        {/* Header */}
        <div className="text-center mb-6 lg:mb-8">
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-2">
            구독 플랜
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            더 많은 저장공간과 빠른 처리 속도를 원하시나요?
            <br />
            구독 플랜을 업그레이드하고 모든 기능을 활용해보세요.
          </p>
          {currentSubscription && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <span className="text-xs text-blue-800 dark:text-blue-200">
                현재 플랜: <strong>{currentSubscription.tierConfig.name}</strong>
              </span>
              {currentSubscription.endDate && (
                <span className="text-xs text-blue-600 dark:text-blue-300">
                  ({new Date(currentSubscription.endDate).toLocaleDateString('ko-KR')}까지)
                </span>
              )}
            </div>
          )}
        </div>

        {/* 크레딧 잔액 표시 */}
        {creditBalance && (
          <div className="mb-6 lg:mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-white/80 text-xs mb-1">보유 크레딧</p>
                <p className="text-2xl font-bold">{creditBalance.balance} <span className="text-base font-normal opacity-80">크레딧</span></p>
              </div>
              <div className="flex gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-center min-w-[80px]">
                  <p className="text-[10px] text-white/70 mb-0.5">유료</p>
                  <p className="font-bold">{creditBalance.purchased}</p>
                  {!creditBalance.watermarkFree && creditBalance.purchased > 0 && (
                    <span className="text-[8px] text-green-300">워터마크 X</span>
                  )}
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-center min-w-[80px]">
                  <p className="text-[10px] text-white/70 mb-0.5">무료</p>
                  <p className="font-bold">{creditBalance.free}</p>
                  {!creditBalance.watermarkFree && creditBalance.free > 0 && (
                    <span className="text-[8px] text-orange-300">워터마크 O</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => router.push('/credits/purchase')}
                className="bg-white text-indigo-600 hover:bg-white/90 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                크레딧 충전
              </button>
            </div>
            {!creditBalance.watermarkFree && (
              <p className="mt-3 text-[11px] text-white/70 border-t border-white/20 pt-2">
                💡 무료 크레딧 사용 시 워터마크가 적용됩니다. 유료 크레딧을 사용하거나 구독을 업그레이드하면 워터마크 없이 이용할 수 있습니다.
              </p>
            )}
            {creditBalance.watermarkFree && (
              <p className="mt-3 text-[11px] text-green-300 border-t border-white/20 pt-2">
                ✓ 구독 플랜 혜택으로 모든 생성물에 워터마크가 적용되지 않습니다.
              </p>
            )}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const Icon = plan.icon
            const isCurrentPlan = currentSubscription?.tier === plan.tier
            const isPlanHigher = SUBSCRIPTION_PLANS.findIndex(p => p.tier === plan.tier) >
              SUBSCRIPTION_PLANS.findIndex(p => p.tier === currentSubscription?.tier)

            return (
              <div
                key={plan.tier}
                className={`relative rounded-xl p-3 lg:p-4 ${plan.color} ${plan.borderColor} border-2 flex flex-col ${
                  plan.popular ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : ''
                } ${isCurrentPlan ? 'ring-2 ring-green-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
              >
                {/* Popular Badge */}
                {plan.popular && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      인기
                    </span>
                  </div>
                )}

                {/* Current Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      현재 플랜
                    </span>
                  </div>
                )}

                {/* Icon & Name */}
                <div className="flex items-center gap-2 mb-2 lg:mb-3">
                  <div className={`p-1.5 rounded-lg ${
                    plan.tier === 'FREE' ? 'bg-slate-200 dark:bg-slate-700' :
                    plan.tier === 'PLUS' ? 'bg-blue-200 dark:bg-blue-800' :
                    plan.tier === 'PRO' ? 'bg-purple-200 dark:bg-purple-800' :
                    'bg-amber-200 dark:bg-amber-800'
                  }`}>
                    <Icon className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                  </div>
                  <h3 className="text-base lg:text-lg font-bold text-slate-900 dark:text-white">
                    {plan.name}
                  </h3>
                </div>

                {/* Price */}
                <div className="mb-3 lg:mb-4">
                  {plan.price === 0 ? (
                    <span className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">무료</span>
                  ) : (
                    <>
                      <span className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
                        ₩{plan.price.toLocaleString()}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-xs">/월</span>
                    </>
                  )}
                </div>

                {/* Features - flex-1로 남은 공간 채우기 */}
                <ul className="space-y-1.5 lg:space-y-2 mb-3 lg:mb-4 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-700 dark:text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button - mt-auto로 하단 고정 */}
                <button
                  onClick={() => handleUpgrade(plan.tier)}
                  disabled={isCurrentPlan || (plan.tier === 'FREE' && currentSubscription?.tier !== 'FREE') || processingTier !== null || paymentStatus !== 'idle'}
                  className={`w-full py-2 lg:py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 min-h-[40px] mt-auto ${
                    isCurrentPlan
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 cursor-default'
                      : processingTier === plan.tier
                      ? 'bg-blue-400 text-white cursor-wait'
                      : plan.tier === 'FREE'
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                      : isPlanHigher && processingTier === null
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {processingTier === plan.tier ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {paymentStatus === 'polling' ? '확인 중...' : '결제 중...'}
                    </>
                  ) : isCurrentPlan ? '현재 플랜' :
                   plan.tier === 'FREE' ? '기본 플랜' :
                   isPlanHigher ? plan.cta : '다운그레이드'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Info Section */}
        <div className="mt-6 lg:mt-8 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            구독은 언제든지 취소할 수 있습니다. 취소 시 현재 구독 기간이 끝날 때까지 혜택이 유지됩니다.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            크레딧은 구독과 별도로 충전하여 사용할 수 있습니다.{' '}
            <a href="/credits/purchase" className="text-blue-600 hover:underline">
              크레딧 충전하기 →
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
