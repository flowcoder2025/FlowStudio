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
  Gift, ChevronRight, AlertCircle
} from 'lucide-react'

interface ReferralStats {
  myReferralCode: string | null
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

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">추천 프로그램</h1>
          <p className="text-gray-600">
            친구를 초대하고 함께 크레딧을 받으세요! 추천받은 친구가 사업자 인증을 완료하면 각각 150 크레딧을 받습니다.
          </p>
        </div>

        {/* 내 추천 코드 */}
        {stats.myReferralCode && (
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
                    ) : (
                      <span className="text-yellow-600 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        사업자 인증 대기 중
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
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
