/**
 * 크레딧 충전 페이지
 * /credits/purchase
 *
 * 결제 심사 중으로 계좌이체 방식으로 운영
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Copy, Check, AlertCircle, Loader2, Send } from 'lucide-react'

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

// 계좌 정보
const BANK_INFO = {
  bank: '카카오뱅크',
  account: '3333-36-1632501',
  holder: '플로우코더(FlowCoder)'
}

// 내부 API 엔드포인트 (웹훅 프록시)
const API_ENDPOINT = '/api/credits/request'

export default function CreditPurchasePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [currentBalance, setCurrentBalance] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    depositAmount: ''
  })
  // 세금계산서 발행 상태
  const [needTaxInvoice, setNeedTaxInvoice] = useState(false)
  const [taxInfo, setTaxInfo] = useState({
    businessName: '',
    businessNumber: '',
    representativeName: '',
    businessType: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    // 로그인 확인
    if (session === null) {
      router.push('/login')
      return
    }

    // 현재 잔액 조회
    if (session?.user) {
      fetchBalance()
      // 이메일 자동 입력
      if (session.user.email) {
        setFormData(prev => ({ ...prev, email: session.user?.email || '' }))
      }
      if (session.user.name) {
        setFormData(prev => ({ ...prev, name: session.user?.name || '' }))
      }
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

  const copyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(BANK_INFO.account)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('복사 실패:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleTaxInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setTaxInfo(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.phone || !formData.depositAmount) {
      alert('모든 항목을 입력해주세요.')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          depositAmount: formData.depositAmount,
          needTaxInvoice,
          taxInfo: needTaxInvoice ? taxInfo : null
        })
      })

      const data = await response.json()

      if (data.success) {
        setSubmitSuccess(true)
        setFormData({ name: '', email: session?.user?.email || '', phone: '', depositAmount: '' })
      } else {
        throw new Error(data.error || '신청 실패')
      }
    } catch (error) {
      console.error('신청 실패:', error)
      alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (session === undefined) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-4 lg:py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>뒤로가기</span>
        </button>

        {/* 헤더 */}
        <div className="text-center mb-4 lg:mb-6">
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-2">
            크레딧 충전
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            AI 이미지 생성에 필요한 크레딧을 충전하세요
          </p>
          {currentBalance !== null && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <span className="text-xs font-medium text-blue-900 dark:text-blue-200">
                현재 보유 크레딧:
              </span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {currentBalance.toLocaleString()} 크레딧
              </span>
            </div>
          )}
        </div>

        {/* 결제 심사 안내 */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 lg:p-4 mb-4 lg:mb-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-800 dark:text-amber-300 text-sm mb-1">
                결제 서비스 심사 중
              </h3>
              <p className="text-amber-700 dark:text-amber-400 text-xs leading-relaxed">
                현재 카드 결제 서비스가 심사 단계에 있어 <strong>계좌이체</strong>로 크레딧을 충전할 수 있습니다.
                아래 계좌로 입금 후 신청서를 작성해주시면 <strong>1시간 내로 크레딧을 지급</strong>해 드립니다.
              </p>
            </div>
          </div>
        </div>

        {/* 계좌 정보 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-3 lg:p-4 mb-4 lg:mb-6">
          <h2 className="text-sm lg:text-base font-bold text-slate-900 dark:text-white mb-2">
            입금 계좌 정보
          </h2>
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{BANK_INFO.bank}</p>
                <p className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white tracking-wider">
                  {BANK_INFO.account}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">예금주: {BANK_INFO.holder}</p>
              </div>
              <button
                onClick={copyAccountNumber}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors min-h-[40px]"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline">복사됨</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">복사</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 크레딧 패키지 안내 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-3 lg:p-4 mb-4 lg:mb-6">
          <h2 className="text-sm lg:text-base font-bold text-slate-900 dark:text-white mb-2">
            크레딧 패키지
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
            {CREDIT_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative rounded-lg p-2.5 lg:p-3 border-2 ${
                  pkg.popular
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
                    인기
                  </div>
                )}
                <div className="text-center">
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs mb-0.5">{pkg.name}</h3>
                  <p className="text-lg lg:text-xl font-bold text-blue-600 dark:text-blue-400">
                    {pkg.credits.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">크레딧</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    ₩{pkg.price.toLocaleString()}
                  </p>
                  {pkg.discount > 0 && (
                    <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">
                      {pkg.discount}% 할인
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 크레딧 신청 폼 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-3 lg:p-4 mb-4 lg:mb-6">
          <h2 className="text-sm lg:text-base font-bold text-slate-900 dark:text-white mb-3">
            크레딧 충전 신청
          </h2>

          {submitSuccess ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                신청이 완료되었습니다!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                입금 확인 후 1시간 내로 크레딧이 지급됩니다.
              </p>
              <button
                onClick={() => setSubmitSuccess(false)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                추가 신청하기
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="홍길동"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    이메일 (가입 메일) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@kakao.com"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    연락처 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="010-1234-5678"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    입금액 (원) <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="depositAmount"
                    value={formData.depositAmount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value="">입금액 선택</option>
                    {CREDIT_PACKAGES.map((pkg) => (
                      <option key={pkg.id} value={pkg.price}>
                        ₩{pkg.price.toLocaleString()} ({pkg.name} - {pkg.credits}크레딧)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 세금계산서 발행 */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-600">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needTaxInvoice}
                    onChange={(e) => setNeedTaxInvoice(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    세금계산서 발행 요청
                  </span>
                </label>

                {needTaxInvoice && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        사업자명 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="businessName"
                        value={taxInfo.businessName}
                        onChange={handleTaxInfoChange}
                        placeholder="(주)플로우코더"
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required={needTaxInvoice}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        사업자번호 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="businessNumber"
                        value={taxInfo.businessNumber}
                        onChange={handleTaxInfoChange}
                        placeholder="123-45-67890"
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required={needTaxInvoice}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        대표자명 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="representativeName"
                        value={taxInfo.representativeName}
                        onChange={handleTaxInfoChange}
                        placeholder="홍길동"
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required={needTaxInvoice}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        업종/업태 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="businessType"
                        value={taxInfo.businessType}
                        onChange={handleTaxInfoChange}
                        placeholder="소프트웨어 개발/서비스업"
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required={needTaxInvoice}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors min-h-[44px]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>신청 중...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>크레딧 충전 신청하기</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 안내사항 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-3 lg:p-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
            크레딧 사용 안내
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-1.5">
              <span className="text-blue-500">•</span>
              <span>2K 이미지 생성 1회 (4장): 20 크레딧 (₩2,000)</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-blue-500">•</span>
              <span>업스케일링 1회 (2K→4K, 1장): 10 크레딧 (₩1,000)</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-blue-500">•</span>
              <span>입금 확인 후 1시간 내로 크레딧이 지급됩니다</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-blue-500">•</span>
              <span>크레딧 충전 후 6개월간 사용 가능합니다</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-blue-500">•</span>
              <span>문의: support@flow-coder.com</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
