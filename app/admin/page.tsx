'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Users,
  CreditCard,
  ImageIcon,
  TrendingUp,
  Search,
  Gift,
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
  Crown,
  RefreshCw,
  Home,
  Check,
  AlertCircle,
} from 'lucide-react'
import type { AdminUser, AdminStats } from '@/types/api'

// 탭 타입
type TabType = 'dashboard' | 'users' | 'bonus'

// 보너스 지급 모달 상태
interface BonusModalState {
  isOpen: boolean
  user: AdminUser | null
  amount: string
  description: string
  expiresInDays: string
  isLoading: boolean
}

export default function AdminPage() {
  const router = useRouter()

  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')

  // 통계 상태
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // 사용자 목록 상태
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  // 보너스 모달 상태
  const [bonusModal, setBonusModal] = useState<BonusModalState>({
    isOpen: false,
    user: null,
    amount: '',
    description: '',
    expiresInDays: '30',
    isLoading: false,
  })

  // 알림 상태
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // 통계 로드
  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // 사용자 목록 로드
  const loadUsers = useCallback(async (searchQuery: string, pageNum: number) => {
    setUsersLoading(true)
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        page: String(pageNum),
        limit: '20',
      })
      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setUsersLoading(false)
    }
  }, [])

  // 초기 로드
  useEffect(() => {
    loadStats()
  }, [loadStats])

  // 탭 변경 시 사용자 로드
  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'bonus') {
      loadUsers(search, page)
    }
  }, [activeTab, search, page, loadUsers])

  // 검색 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'users' || activeTab === 'bonus') {
        setPage(1)
        loadUsers(search, 1)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, activeTab, loadUsers])

  // 보너스 지급
  const handleGrantBonus = async () => {
    if (!bonusModal.user) return

    const amount = parseInt(bonusModal.amount, 10)
    if (isNaN(amount) || amount <= 0) {
      setNotification({ type: 'error', message: '유효한 크레딧 금액을 입력해주세요' })
      return
    }

    if (!bonusModal.description.trim()) {
      setNotification({ type: 'error', message: '지급 사유를 입력해주세요' })
      return
    }

    setBonusModal(prev => ({ ...prev, isLoading: true }))

    try {
      const res = await fetch('/api/admin/credits/bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: bonusModal.user.id,
          amount,
          description: bonusModal.description.trim(),
          expiresInDays: bonusModal.expiresInDays === '' ? null : parseInt(bonusModal.expiresInDays, 10),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setNotification({
          type: 'success',
          message: `${bonusModal.user.name || bonusModal.user.email}님에게 ${amount} 크레딧을 지급했습니다`,
        })
        setBonusModal({
          isOpen: false,
          user: null,
          amount: '',
          description: '',
          expiresInDays: '30',
          isLoading: false,
        })
        // 사용자 목록 새로고침
        loadUsers(search, page)
        // 통계 새로고침
        loadStats()
      } else {
        setNotification({ type: 'error', message: data.error || '보너스 지급에 실패했습니다' })
      }
    } catch {
      setNotification({ type: 'error', message: '보너스 지급에 실패했습니다' })
    } finally {
      setBonusModal(prev => ({ ...prev, isLoading: false }))
    }
  }

  // 알림 자동 닫기
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // 숫자 포맷
  const formatNumber = (num: number) => num.toLocaleString('ko-KR')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* 헤더 */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="홈으로"
              >
                <Home className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                관리자 대시보드
              </h1>
            </div>
            <button
              onClick={() => {
                loadStats()
                if (activeTab === 'users' || activeTab === 'bonus') {
                  loadUsers(search, page)
                }
              }}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="새로고침"
            >
              <RefreshCw className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-4">
            {[
              { id: 'dashboard' as TabType, label: '대시보드', icon: TrendingUp },
              { id: 'users' as TabType, label: '사용자 관리', icon: Users },
              { id: 'bonus' as TabType, label: '크레딧 지급', icon: Gift },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 알림 */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
              notification.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/50 text-red-800 dark:text-red-200'
            }`}
          >
            {notification.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {notification.message}
            <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 대시보드 탭 */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* 통계 카드 */}
            {statsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm animate-pulse">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4" />
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : stats && (
              <>
                {/* 사용자 통계 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    icon={Users}
                    label="전체 사용자"
                    value={formatNumber(stats.users.total)}
                    subValue={`오늘 +${stats.users.newToday}`}
                    color="blue"
                  />
                  <StatCard
                    icon={Building2}
                    label="사업자 인증"
                    value={formatNumber(stats.users.businessVerified)}
                    subValue={`${((stats.users.businessVerified / stats.users.total) * 100).toFixed(1)}%`}
                    color="green"
                  />
                  <StatCard
                    icon={CreditCard}
                    label="유통 크레딧"
                    value={formatNumber(stats.credits.totalInCirculation)}
                    subValue={`₩${formatNumber(stats.credits.totalInCirculation * 100)}`}
                    color="indigo"
                  />
                  <StatCard
                    icon={ImageIcon}
                    label="총 생성 이미지"
                    value={formatNumber(stats.generations.total)}
                    subValue={`오늘 ${stats.generations.today}회`}
                    color="purple"
                  />
                </div>

                {/* 상세 통계 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 크레딧 통계 */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                      크레딧 현황
                    </h3>
                    <div className="space-y-3">
                      <StatRow label="유료 충전" value={formatNumber(stats.credits.totalPurchased)} />
                      <StatRow label="보너스 지급" value={formatNumber(stats.credits.totalBonusGranted)} />
                      <StatRow label="사용됨" value={formatNumber(stats.credits.totalUsed)} color="red" />
                      <StatRow label="만료됨" value={formatNumber(stats.credits.totalExpired)} color="gray" />
                    </div>
                  </div>

                  {/* 구독 통계 */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                      구독 현황
                    </h3>
                    <div className="space-y-3">
                      <StatRow label="FREE" value={formatNumber(stats.subscriptions.free)} />
                      <StatRow label="PLUS" value={formatNumber(stats.subscriptions.plus)} color="blue" />
                      <StatRow label="PRO" value={formatNumber(stats.subscriptions.pro)} color="indigo" />
                      <StatRow label="ENTERPRISE" value={formatNumber(stats.subscriptions.enterprise)} color="purple" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 사용자 관리 & 크레딧 지급 탭 */}
        {(activeTab === 'users' || activeTab === 'bonus') && (
          <div className="space-y-6">
            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="이름 또는 이메일로 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* 사용자 테이블 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                        사용자
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                        크레딧
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                        생성 수
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                        구독
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                        가입일
                      </th>
                      {activeTab === 'bonus' && (
                        <th className="px-4 py-3 text-right text-sm font-medium text-slate-600 dark:text-slate-400">
                          액션
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {usersLoading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i}>
                          <td colSpan={6} className="px-4 py-4">
                            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                          </td>
                        </tr>
                      ))
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                          사용자를 찾을 수 없습니다
                        </td>
                      </tr>
                    ) : (
                      users.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              {user.image ? (
                                <Image
                                  src={user.image}
                                  alt={user.name || ''}
                                  width={40}
                                  height={40}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                                  <Users className="w-5 h-5 text-slate-500" />
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-slate-800 dark:text-slate-100">
                                    {user.name || '이름 없음'}
                                  </span>
                                  {user.businessVerified && (
                                    <span title="사업자 인증">
                                      <Building2 className="w-4 h-4 text-green-500" />
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                  {user.email}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-medium text-slate-800 dark:text-slate-100">
                              {formatNumber(user.creditBalance)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                            {formatNumber(user.totalGenerated)}회
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              user.subscriptionTier === 'PRO'
                                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                                : user.subscriptionTier === 'PLUS'
                                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                                : user.subscriptionTier === 'ENTERPRISE'
                                ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                            }`}>
                              {user.subscriptionTier !== 'FREE' && <Crown className="w-3 h-3" />}
                              {user.subscriptionTier || 'FREE'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                            {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                          </td>
                          {activeTab === 'bonus' && (
                            <td className="px-4 py-4 text-right">
                              <button
                                onClick={() => setBonusModal({
                                  ...bonusModal,
                                  isOpen: true,
                                  user,
                                })}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                              >
                                <Gift className="w-4 h-4" />
                                지급
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    총 {formatNumber(pagination.total)}명 중 {(pagination.page - 1) * pagination.limit + 1}-
                    {Math.min(pagination.page * pagination.limit, pagination.total)}명
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {page} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 보너스 지급 모달 */}
      {bonusModal.isOpen && bonusModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                보너스 크레딧 지급
              </h2>
              <button
                onClick={() => setBonusModal({
                  isOpen: false,
                  user: null,
                  amount: '',
                  description: '',
                  expiresInDays: '30',
                  isLoading: false,
                })}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* 대상 사용자 */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                {bonusModal.user.image ? (
                  <Image
                    src={bonusModal.user.image}
                    alt=""
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                    <Users className="w-5 h-5 text-slate-500" />
                  </div>
                )}
                <div>
                  <div className="font-medium text-slate-800 dark:text-slate-100">
                    {bonusModal.user.name || '이름 없음'}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    현재 잔액: {formatNumber(bonusModal.user.creditBalance)} 크레딧
                  </div>
                </div>
              </div>

              {/* 지급 금액 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  지급 크레딧
                </label>
                <input
                  type="number"
                  min="1"
                  value={bonusModal.amount}
                  onChange={(e) => setBonusModal(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="예: 100"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 지급 사유 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  지급 사유
                </label>
                <input
                  type="text"
                  value={bonusModal.description}
                  onChange={(e) => setBonusModal(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="예: 이벤트 당첨 보너스"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 만료 기간 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  만료 기간 (일)
                </label>
                <input
                  type="number"
                  min="1"
                  value={bonusModal.expiresInDays}
                  onChange={(e) => setBonusModal(prev => ({ ...prev, expiresInDays: e.target.value }))}
                  placeholder="비워두면 무기한"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  기본 30일, 비워두면 만료 없음
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setBonusModal({
                  isOpen: false,
                  user: null,
                  amount: '',
                  description: '',
                  expiresInDays: '30',
                  isLoading: false,
                })}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleGrantBonus}
                disabled={bonusModal.isLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {bonusModal.isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4" />
                    지급하기
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 통계 카드 컴포넌트
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  subValue: string
  color: 'blue' | 'green' | 'indigo' | 'purple'
}) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400',
    purple: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400',
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</div>
      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subValue}</div>
    </div>
  )
}

// 통계 행 컴포넌트
function StatRow({
  label,
  value,
  color = 'default',
}: {
  label: string
  value: string
  color?: 'default' | 'red' | 'gray' | 'blue' | 'indigo' | 'purple'
}) {
  const valueColorClasses = {
    default: 'text-slate-800 dark:text-slate-100',
    red: 'text-red-600 dark:text-red-400',
    gray: 'text-slate-500 dark:text-slate-400',
    blue: 'text-blue-600 dark:text-blue-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    purple: 'text-purple-600 dark:text-purple-400',
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
      <span className={`font-medium ${valueColorClasses[color]}`}>{value}</span>
    </div>
  )
}
