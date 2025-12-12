/**
 * 레퍼럴 대시보드 페이지
 * /profile/referral
 *
 * 추천 코드 공유, 추천 통계, 추천 내역 확인
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Copy, Check, Users, UserCheck, Clock, Coins,
  Gift, ChevronRight, AlertCircle, ArrowLeft, ShieldCheck, ExternalLink
} from 'lucide-react'
import { useNavigation } from '@/hooks/useNavigation'

interface ReferralStats {
  myReferralCode: string | null
  myBusinessVerified: boolean
  hasReferrer: boolean
  totalReferrals: number
  completedReferrals: number
  pendingReferrals: number
  totalCreditsEarned: number
  referralsGiven: Array<{
    id: string
    status: string
    creditsAwarded: boolean
    awardedAt: string | null
    createdAt: string
    referred: {
      id: string
      name: string | null
      email: string | null
      businessVerified: boolean
      createdAt: string
    }
  }>
  referredBy: {
    user: {
      id: string
      name: string | null
      email: string | null
    }
    status: string
    creditsAwarded: boolean
    awardedAt: string | null
  } | null
}

export default function ReferralPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { navigateTo } = useNavigation()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  // 추천 코드 생성 상태
  const [generatingCode, setGeneratingCode] = useState(false)

  // 추천 코드 입력 상태
  const [inputCode, setInputCode] = useState('')
  const [applyingCode, setApplyingCode] = useState(false)
  const [applyMessage, setApplyMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 크레딧 청구 상태
  const [claimingCredits, setClaimingCredits] = useState(false)
  const [claimMessage, setClaimMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!session?.user) {
      router.push('/login')
      return
    }

    fetchReferralStats()
  }, [session, router])

  const fetchReferralStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/referral/stats')
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      } else {
        setError(data.error || '통계 조회에 실패했습니다')
      }
    } catch (error) {
      console.error('레퍼럴 통계 조회 실패:', error)
      setError('통계 조회에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const copyReferralCode = async () => {
    if (!stats?.myReferralCode) return

    try {
      await navigator.clipboard.writeText(stats.myReferralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('복사 실패:', error)
    }
  }

  // 내 추천 코드 생성
  const generateMyCode = async () => {
    try {
      setGeneratingCode(true)
      const response = await fetch('/api/referral/code', { method: 'POST' })
      const data = await response.json()

      if (data.success) {
        // 통계 새로고침
        await fetchReferralStats()
      } else {
        setError(data.error || '추천 코드 생성에 실패했습니다')
      }
    } catch (error) {
      console.error('추천 코드 생성 실패:', error)
      setError('추천 코드 생성에 실패했습니다')
    } finally {
      setGeneratingCode(false)
    }
  }

  // 추천 코드 적용
  const applyReferralCode = async () => {
    if (!inputCode.trim()) {
      setApplyMessage({ type: 'error', text: '추천 코드를 입력해주세요' })
      return
    }

    try {
      setApplyingCode(true)
      setApplyMessage(null)

      const response = await fetch('/api/referral/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: inputCode.trim() })
      })

      const data = await response.json()

      if (data.success) {
        setApplyMessage({ type: 'success', text: data.data.message })
        setInputCode('')
        // 통계 새로고침
        await fetchReferralStats()
      } else {
        setApplyMessage({ type: 'error', text: data.error || '추천 코드 적용에 실패했습니다' })
      }
    } catch (error) {
      console.error('추천 코드 적용 실패:', error)
      setApplyMessage({ type: 'error', text: '추천 코드 적용에 실패했습니다' })
    } finally {
      setApplyingCode(false)
    }
  }

  // 레퍼럴 크레딧 수동 청구
  const claimReferralCredits = async () => {
    try {
      setClaimingCredits(true)
      setClaimMessage(null)

      const response = await fetch('/api/referral/claim', { method: 'POST' })
      const data = await response.json()

      if (data.success) {
        if (data.data.alreadyAwarded) {
          setClaimMessage({ type: 'success', text: data.data.message })
        } else if (data.data.awarded) {
          setClaimMessage({ type: 'success', text: data.data.message })
          // 통계 새로고침
          await fetchReferralStats()
        }
      } else {
        setClaimMessage({ type: 'error', text: data.error || '크레딧 청구에 실패했습니다' })
      }
    } catch (error) {
      console.error('크레딧 청구 실패:', error)
      setClaimMessage({ type: 'error', text: '크레딧 청구에 실패했습니다' })
    } finally {
      setClaimingCredits(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-40 bg-white rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-white rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800">{error || '데이터를 불러올 수 없습니다'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 헤더 */}
        <div>
          <button
            onClick={() => navigateTo('/profile')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>프로필로 돌아가기</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">추천 프로그램</h1>
          <p className="text-gray-600">
            친구를 초대하고 함께 크레딧을 받으세요! 추천받은 친구가 사업자 인증을 완료하면 각각 150 크레딧을 받습니다.
          </p>
        </div>

        {/* 사업자 인증 필수 안내 배너 */}
        {!stats.myBusinessVerified && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-1">사업자 인증이 필요합니다</h3>
                <p className="text-sm text-amber-800 mb-3">
                  추천 프로그램의 크레딧을 받으려면 <strong>사업자 인증을 먼저 완료</strong>해야 합니다.
                  추천 코드를 입력하거나 친구를 초대해도 사업자 인증이 완료되지 않으면 크레딧이 지급되지 않습니다.
                </p>
                <button
                  onClick={() => navigateTo('/profile/business')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors text-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  사업자 인증하러 가기
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 내 추천 코드 */}
        {stats.myReferralCode ? (
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-8 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-6 h-6" />
              <h2 className="text-xl font-semibold">내 추천 코드</h2>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between">
              <code className="text-2xl font-mono font-bold tracking-wider">
                {stats.myReferralCode}
              </code>
              <button
                onClick={copyReferralCode}
                className="flex items-center gap-2 bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    복사됨!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    복사하기
                  </>
                )}
              </button>
            </div>
            <p className="mt-4 text-sm text-purple-100">
              이 코드를 친구에게 공유하세요. 친구가 가입 시 입력하고 사업자 인증을 완료하면 각각 150 크레딧을 받습니다.
            </p>
          </div>
        ) : (
          /* 추천 코드 생성 */
          <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-8 shadow-lg border border-gray-300">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-6 h-6 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-800">내 추천 코드</h2>
            </div>
            <p className="text-gray-600 mb-6">
              추천 코드를 생성하고 친구에게 공유하세요. 친구가 가입하고 사업자 인증을 완료하면 각각 150 크레딧을 받습니다.
            </p>
            <button
              onClick={generateMyCode}
              disabled={generatingCode}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generatingCode ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  생성 중...
                </>
              ) : (
                <>
                  <Gift className="w-5 h-5" />
                  내 추천 코드 생성하기
                </>
              )}
            </button>
          </div>
        )}

        {/* 추천 코드 입력 (추천인이 없는 경우만 표시) */}
        {!stats.referredBy && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">추천 코드 입력</h3>
            <p className="text-sm text-gray-600 mb-4">
              친구에게 받은 추천 코드가 있나요? 입력하고 사업자 인증을 완료하면 각각 150 크레딧을 받습니다.
            </p>
            {!stats.myBusinessVerified && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  추천 코드 적용 후 <strong>사업자 인증을 완료</strong>해야 크레딧이 지급됩니다.{' '}
                  <button
                    onClick={() => navigateTo('/profile/business')}
                    className="text-amber-700 underline hover:text-amber-900 font-medium"
                  >
                    인증하러 가기
                  </button>
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="8자리 추천 코드 입력"
                maxLength={8}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-mono text-lg tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={applyReferralCode}
                disabled={applyingCode || !inputCode.trim()}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {applyingCode ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    적용 중...
                  </>
                ) : (
                  '적용하기'
                )}
              </button>
            </div>

            {applyMessage && (
              <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${
                applyMessage.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {applyMessage.type === 'success' ? (
                  <Check className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="text-sm">{applyMessage.text}</span>
              </div>
            )}
          </div>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* 총 추천 수 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">총 추천 수</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalReferrals}</p>
          </div>

          {/* 완료된 추천 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">완료된 추천</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.completedReferrals}</p>
          </div>

          {/* 대기 중 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">대기 중</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.pendingReferrals}</p>
          </div>

          {/* 획득한 크레딧 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Coins className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">획득한 크레딧</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalCreditsEarned}</p>
          </div>
        </div>

        {/* 나를 추천한 사람 */}
        {stats.referredBy && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">나를 추천한 분</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {stats.referredBy.user.name?.[0] || stats.referredBy.user.email?.[0] || '?'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {stats.referredBy.user.name || stats.referredBy.user.email || '알 수 없음'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {stats.referredBy.creditsAwarded ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        크레딧 지급 완료
                      </span>
                    ) : stats.myBusinessVerified ? (
                      <span className="text-orange-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        크레딧 지급 대기 중
                      </span>
                    ) : (
                      <span className="text-yellow-600 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        사업자 인증 대기 중
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {/* 크레딧 지급 받기 버튼: 사업자 인증 완료 + 아직 크레딧 미지급 상태일 때 */}
              {stats.myBusinessVerified && !stats.referredBy.creditsAwarded && (
                <button
                  onClick={claimReferralCredits}
                  disabled={claimingCredits}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {claimingCredits ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      처리 중...
                    </>
                  ) : (
                    <>
                      <Coins className="w-4 h-4" />
                      크레딧 지급 받기
                    </>
                  )}
                </button>
              )}
            </div>
            {/* 크레딧 청구 메시지 */}
            {claimMessage && (
              <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                claimMessage.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {claimMessage.type === 'success' ? (
                  <Check className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="text-sm">{claimMessage.text}</span>
              </div>
            )}
          </div>
        )}

        {/* 추천 내역 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">내가 추천한 사람들</h3>
          </div>

          {stats.referralsGiven.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">아직 추천한 사람이 없습니다</p>
              <p className="text-sm text-gray-500">
                추천 코드를 친구에게 공유하고 크레딧을 받으세요!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사용자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      가입일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사업자 인증
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.referralsGiven.map((referral) => (
                    <tr key={referral.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {referral.referred.name?.[0] || referral.referred.email?.[0] || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {referral.referred.name || '이름 없음'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {referral.referred.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(referral.referred.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {referral.referred.businessVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check className="w-3 h-3" />
                            인증 완료
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <Clock className="w-3 h-3" />
                            미인증
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {referral.creditsAwarded ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <Coins className="w-3 h-3" />
                            크레딧 지급됨
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="w-3 h-3" />
                            대기 중
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 안내 사항 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 mb-3">추천 프로그램 안내</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
              <span className="font-medium text-amber-800">
                <strong>중요:</strong> 크레딧 지급을 받으려면 추천인과 피추천인 모두 <strong>사업자 인증이 필수</strong>입니다.
                {!stats.myBusinessVerified && (
                  <button
                    onClick={() => navigateTo('/profile/business')}
                    className="ml-2 text-amber-700 underline hover:text-amber-900"
                  >
                    지금 인증하기 →
                  </button>
                )}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>추천받은 친구가 가입 시 추천 코드를 입력하고 사업자 인증을 완료하면 크레딧이 지급됩니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>추천인과 가입자 모두 각각 150 크레딧을 받습니다 (총 300 크레딧).</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>추천 횟수에는 제한이 없으며, 추천할수록 더 많은 크레딧을 받을 수 있습니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>크레딧은 사업자 인증 완료 시 자동으로 지급됩니다.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
