/**
 * 사업자 인증 페이지
 * /profile/business
 *
 * 사업자등록번호, 담당자 이름, 전화번호를 입력받아 국세청 API로 인증
 * 인증 성공 시 150 크레딧 지급
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Building2, User, Phone, AlertCircle } from 'lucide-react'

interface VerificationStatus {
  verified: boolean
  verifiedAt: string | null
  bonusClaimed: boolean
  businessNumber: string | null
  ownerName: string | null
  phone: string | null
}

export default function BusinessVerificationPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null)

  // 폼 상태
  const [businessNumber, setBusinessNumber] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!session?.user) {
      router.push('/login')
      return
    }

    // 인증 상태 조회
    fetchVerificationStatus()
  }, [session, router])

  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch('/api/profile/business-verification')
      const data = await response.json()

      if (data.success) {
        setVerificationStatus(data.data)

        // 이미 인증된 경우 입력 필드에 정보 표시
        if (data.data.verified) {
          setBusinessNumber(formatBusinessNumber(data.data.businessNumber || ''))
          setOwnerName(data.data.ownerName || '')
          setPhone(data.data.phone || '')
        }
      }
    } catch (error) {
      console.error('인증 상태 조회 실패:', error)
    }
  }

  const formatBusinessNumber = (value: string) => {
    // 하이픈 제거 후 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '')

    // 10자리 제한
    const limited = numbers.slice(0, 10)

    // 3-2-5 형식으로 포맷팅
    if (limited.length <= 3) {
      return limited
    } else if (limited.length <= 5) {
      return `${limited.slice(0, 3)}-${limited.slice(3)}`
    } else {
      return `${limited.slice(0, 3)}-${limited.slice(3, 5)}-${limited.slice(5)}`
    }
  }

  const handleBusinessNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBusinessNumber(e.target.value)
    setBusinessNumber(formatted)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // 입력 검증
      const cleanedNumber = businessNumber.replace(/-/g, '')
      if (cleanedNumber.length !== 10) {
        setError('사업자등록번호를 정확히 입력해주세요 (10자리)')
        setLoading(false)
        return
      }

      if (!ownerName.trim()) {
        setError('담당자 이름을 입력해주세요')
        setLoading(false)
        return
      }

      if (!phone.trim()) {
        setError('전화번호를 입력해주세요')
        setLoading(false)
        return
      }

      const response = await fetch('/api/profile/business-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessNumber: cleanedNumber,
          ownerName,
          phone
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`인증이 완료되었습니다! ${data.data.bonusCredits}크레딧이 지급되었습니다.`)
        setVerificationStatus({
          verified: true,
          verifiedAt: data.data.verifiedAt,
          bonusClaimed: true,
          businessNumber: cleanedNumber,
          ownerName,
          phone
        })

        // 3초 후 프로필 페이지로 이동
        setTimeout(() => {
          router.push('/profile')
        }, 3000)
      } else {
        setError(data.error || '인증에 실패했습니다')
      }
    } catch (error: unknown) {
      console.error('인증 요청 실패:', error)
      setError('인증 요청 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            사업자 인증
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            사업자등록번호를 인증하고 <strong className="text-blue-600 dark:text-blue-400">150 크레딧</strong>을 받으세요
          </p>
        </div>

        {/* 인증 완료 상태 */}
        {verificationStatus?.verified ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border-2 border-green-500">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                사업자 인증 완료
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  사업자등록번호
                </label>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {formatBusinessNumber(verificationStatus.businessNumber || '')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  담당자 이름
                </label>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {verificationStatus.ownerName}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  전화번호
                </label>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {verificationStatus.phone}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  인증 완료 시각
                </label>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {verificationStatus.verifiedAt ? new Date(verificationStatus.verifiedAt).toLocaleString('ko-KR') : '-'}
                </p>
              </div>

              {verificationStatus.bonusClaimed && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-6">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✅ 사업자 인증 보너스 150 크레딧이 지급되었습니다
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => router.push('/profile')}
              className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              프로필로 돌아가기
            </button>
          </div>
        ) : (
          /* 인증 폼 */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 사업자등록번호 */}
              <div>
                <label htmlFor="businessNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Building2 className="inline w-4 h-4 mr-1" />
                  사업자등록번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="businessNumber"
                  value={businessNumber}
                  onChange={handleBusinessNumberChange}
                  placeholder="000-00-00000"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  maxLength={12} // 10자리 + 2개 하이픈
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  하이픈(-)은 자동으로 입력됩니다
                </p>
              </div>

              {/* 담당자 이름 */}
              <div>
                <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="inline w-4 h-4 mr-1" />
                  담당자 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="ownerName"
                  value={ownerName}
                  onChange={(e) => {
                    setOwnerName(e.target.value)
                    setError('')
                  }}
                  placeholder="홍길동"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* 전화번호 */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Phone className="inline w-4 h-4 mr-1" />
                  전화번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    setError('')
                  }}
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                </div>
              )}

              {/* 성공 메시지 */}
              {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
                  </div>
                </div>
              )}

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    인증 중...
                  </>
                ) : (
                  '사업자 인증 및 150 크레딧 받기'
                )}
              </button>

              {/* 안내사항 */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  📋 사업자 인증 안내
                </h3>
                <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-300">
                  <li>• 국세청 공공데이터를 통해 실시간으로 사업자등록정보를 확인합니다</li>
                  <li>• 인증 완료 시 150 크레딧이 즉시 지급됩니다 (1회 한정)</li>
                  <li>• 계속사업자 상태의 사업자만 인증 가능합니다 (휴업/폐업 제외)</li>
                  <li>• 이미 등록된 사업자등록번호는 재사용할 수 없습니다</li>
                </ul>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
