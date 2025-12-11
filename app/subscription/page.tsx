/**
 * 구독 플랜 페이지
 * /subscription
 *
 * 구독 플랜 선택 및 관리
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Check, Crown, Zap, Building2, Sparkles } from 'lucide-react'

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

export default function SubscriptionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    fetchSubscription()
  }, [session, status, router])

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscription')
      const data = await response.json()
      if (data.success) {
        setCurrentSubscription(data.data)
      }
    } catch (error) {
      console.error('구독 정보 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (tier: string) => {
    if (tier === 'BUSINESS') {
      // Business 플랜은 문의 양식으로 이동
      window.open('mailto:support@flowstudio.com?subject=Business 플랜 문의', '_blank')
      return
    }

    if (tier === currentSubscription?.tier) {
      return
    }

    // TODO: PortOne 정기 결제 연동
    // 현재는 임시로 업그레이드 API 호출
    try {
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, durationMonths: 1 })
      })

      const data = await response.json()
      if (data.success) {
        alert(data.message)
        fetchSubscription()
      } else {
        alert(data.error || '업그레이드에 실패했습니다')
      }
    } catch (error) {
      console.error('업그레이드 실패:', error)
      alert('업그레이드 중 오류가 발생했습니다')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            구독 플랜
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            더 많은 저장공간과 빠른 처리 속도를 원하시나요?
            <br />
            구독 플랜을 업그레이드하고 모든 기능을 활용해보세요.
          </p>
          {currentSubscription && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <span className="text-sm text-blue-800 dark:text-blue-200">
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

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const Icon = plan.icon
            const isCurrentPlan = currentSubscription?.tier === plan.tier
            const isPlanHigher = SUBSCRIPTION_PLANS.findIndex(p => p.tier === plan.tier) >
              SUBSCRIPTION_PLANS.findIndex(p => p.tier === currentSubscription?.tier)

            return (
              <div
                key={plan.tier}
                className={`relative rounded-2xl p-6 ${plan.color} ${plan.borderColor} border-2 ${
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
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${
                    plan.tier === 'FREE' ? 'bg-slate-200 dark:bg-slate-700' :
                    plan.tier === 'PLUS' ? 'bg-blue-200 dark:bg-blue-800' :
                    plan.tier === 'PRO' ? 'bg-purple-200 dark:bg-purple-800' :
                    'bg-amber-200 dark:bg-amber-800'
                  }`}>
                    <Icon className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {plan.name}
                  </h3>
                </div>

                {/* Price */}
                <div className="mb-6">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">무료</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-slate-900 dark:text-white">
                        ₩{plan.price.toLocaleString()}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-sm">/월</span>
                    </>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleUpgrade(plan.tier)}
                  disabled={isCurrentPlan || (plan.tier === 'FREE' && currentSubscription?.tier !== 'FREE')}
                  className={`w-full py-3 rounded-lg font-medium transition-all ${
                    isCurrentPlan
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 cursor-default'
                      : plan.tier === 'FREE'
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                      : isPlanHigher
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {isCurrentPlan ? '현재 플랜' :
                   plan.tier === 'FREE' ? '기본 플랜' :
                   isPlanHigher ? plan.cta : '다운그레이드'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Info Section */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            구독은 언제든지 취소할 수 있습니다. 취소 시 현재 구독 기간이 끝날 때까지 혜택이 유지됩니다.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
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
