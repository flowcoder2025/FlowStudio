/**
 * 크레딧 충전 페이지
 * /credits/purchase
 *
 * 포트원 V2 + 카카오페이로 크레딧을 충전합니다.
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import * as PortOne from '@portone/browser-sdk/v2'

// 크레딧 패키지 정의 (pricing-strategy.md)
const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: '스타터',
    credits: 100,
    price: 10000,
    discount: 0,
    description: '이미지 생성 5회 (20장)',
    popular: false
  },
  {
    id: 'basic',
    name: '베이직',
    credits: 300,
    price: 28000,
    discount: 6.7,
    description: '이미지 생성 15회 (60장)',
    popular: true
  },
  {
    id: 'pro',
    name: '프로',
    credits: 1000,
    price: 90000,
    discount: 10,
    description: '이미지 생성 50회 (200장)',
    popular: false
  },
  {
    id: 'business',
    name: '비즈니스',
    credits: 3000,
    price: 250000,
    discount: 16.7,
    description: '이미지 생성 150회 (600장)',
    popular: false
  }
] as const

export default function CreditPurchasePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [processingPackageId, setProcessingPackageId] = useState<string | null>(null)
  const [currentBalance, setCurrentBalance] = useState<number | null>(null)

  useEffect(() => {
    // 로그인 확인
    if (session === null) {
      router.push('/login')
      return
    }

    // 현재 잔액 조회
    if (session?.user) {
      fetchBalance()
    }
  }, [session, router])

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/credits/balance')
      const data = await response.json()
      if (data.success) {
        setCurrentBalance(data.balance)
      }
    } catch (error) {
      console.error('잔액 조회 실패:', error)
    }
  }

  const handlePurchase = async (pkg: typeof CREDIT_PACKAGES[number]) => {
    if (!session?.user?.id) {
      alert('로그인이 필요합니다')
      return
    }

    setLoading(true)
    setProcessingPackageId(pkg.id)

    try {
      const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID
      const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY

      if (!storeId || !channelKey) {
        throw new Error('포트원 설정이 누락되었습니다')
      }

      // 포트원 결제 요청
      const paymentId = `payment_${Date.now()}_${session.user.id}`

      const response = await PortOne.requestPayment({
        storeId,
        channelKey, // 카카오페이 채널
        paymentId,
        orderName: `${pkg.name} 크레딧 패키지`,
        totalAmount: pkg.price,
        currency: 'CURRENCY_KRW',
        payMethod: 'EASY_PAY',
        customer: {
          fullName: session.user.name || '사용자',
          email: session.user.email || undefined
        },
        customData: {
          packageId: pkg.id,
          userId: session.user.id
        },
        redirectUrl: `${window.location.origin}/credits/purchase/success`
      })

      // 결제 결과 처리
      if (response?.code != null) {
        // 오류 발생
        console.error('결제 오류:', response)
        alert(`결제 실패: ${response.message || '알 수 없는 오류'}`)
      } else {
        // 결제 성공 (웹훅에서 크레딧 지급)
        console.log('결제 요청 성공:', response)
        alert('결제가 완료되었습니다! 크레딧을 지급 중입니다...')

        // 폴링으로 잔액 확인 (최대 30초)
        await pollBalanceUpdate(10, 3000) // 10회, 3초 간격
      }

    } catch (error: unknown) {
      console.error('결제 요청 실패:', error)
      const message = error instanceof Error ? error.message : '알 수 없는 오류'
      alert(`결제 요청 실패: ${message}`)
    } finally {
      setLoading(false)
      setProcessingPackageId(null)
    }
  }

  // 잔액 업데이트 폴링
  const pollBalanceUpdate = async (maxAttempts: number, interval: number) => {
    const initialBalance = currentBalance

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, interval))

      const response = await fetch('/api/credits/balance')
      const data = await response.json()

      if (data.success && data.balance > (initialBalance || 0)) {
        setCurrentBalance(data.balance)
        alert(`크레딧이 지급되었습니다! 현재 잔액: ${data.balance} 크레딧`)
        return
      }
    }

    // 타임아웃
    alert('크레딧 지급이 지연되고 있습니다. 잠시 후 다시 확인해주세요.')
  }

  if (session === undefined) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            크레딧 충전
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            AI 이미지 생성에 필요한 크레딧을 충전하세요
          </p>
          {currentBalance !== null && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full">
              <span className="text-sm font-medium text-blue-900">
                현재 보유 크레딧:
              </span>
              <span className="text-lg font-bold text-blue-600">
                {currentBalance.toLocaleString()} 크레딧
              </span>
              <span className="text-sm text-blue-700">
                (₩{(currentBalance * 100).toLocaleString()})
              </span>
            </div>
          )}
        </div>

        {/* 패키지 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {CREDIT_PACKAGES.map((pkg) => {
            const isProcessing = processingPackageId === pkg.id

            return (
              <div
                key={pkg.id}
                className={`relative bg-white rounded-2xl shadow-lg p-6 transition-all duration-200 ${
                  pkg.popular
                    ? 'border-2 border-blue-500 scale-105'
                    : 'border border-gray-200 hover:shadow-xl'
                }`}
              >
                {/* 인기 배지 */}
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    인기
                  </div>
                )}

                {/* 패키지 정보 */}
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {pkg.name}
                  </h3>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {pkg.credits.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 mb-2">크레딧</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ₩{pkg.price.toLocaleString()}
                  </div>
                  {pkg.discount > 0 && (
                    <div className="text-sm text-green-600 font-medium mt-1">
                      {pkg.discount}% 할인
                    </div>
                  )}
                </div>

                {/* 설명 */}
                <p className="text-sm text-gray-600 text-center mb-6">
                  {pkg.description}
                </p>

                {/* 구매 버튼 */}
                <button
                  onClick={() => handlePurchase(pkg)}
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    pkg.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      처리 중...
                    </span>
                  ) : (
                    '카카오페이로 구매'
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* 안내사항 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            크레딧 사용 안내
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>2K 이미지 생성 1회 (4장): 20 크레딧 (₩2,000)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>업스케일링 1회 (2K→4K, 1장): 10 크레딧 (₩1,000)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>크레딧은 충전 후 즉시 사용 가능합니다</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>크레딧에는 유효기간이 없습니다</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>결제는 카카오페이 간편결제로 안전하게 처리됩니다</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
