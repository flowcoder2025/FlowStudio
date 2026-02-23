'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
  Camera,
  AlertTriangle,
  Eye,
  Clock,
  Filter,
  Copy,
} from 'lucide-react'
import type { AdminUser, AdminStats, AdminGeneration, AdminError } from '@/types/admin'
import { LazyImage } from '@/components/ui/LazyImage'

// 탭 타입
type TabType = 'dashboard' | 'users' | 'bonus' | 'generations' | 'errors'

// 날짜 필터 타입
type DateFilter = 'today' | 'week' | 'month' | 'all'

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

  // 생성 내역 상태
  const [generations, setGenerations] = useState<AdminGeneration[]>([])
  const [generationsLoading, setGenerationsLoading] = useState(false)
  const [generationsPagination, setGenerationsPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [generationsSummary, setGenerationsSummary] = useState({
    totalToday: 0,
    successToday: 0,
    failedToday: 0,
  })
  const [generationsDateFilter, setGenerationsDateFilter] = useState<DateFilter>('today')
  const [generationsStatusFilter, setGenerationsStatusFilter] = useState<'all' | 'success' | 'failed'>('all')
  const [generationsPage, setGenerationsPage] = useState(1)

  // 오류 내역 상태
  const [errors, setErrors] = useState<AdminError[]>([])
  const [errorsLoading, setErrorsLoading] = useState(false)
  const [errorsPagination, setErrorsPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [errorsSummary, setErrorsSummary] = useState({
    totalToday: 0,
    totalThisWeek: 0,
    totalThisMonth: 0,
  })
  const [errorsDateFilter, setErrorsDateFilter] = useState<DateFilter>('week')
  const [errorsPage, setErrorsPage] = useState(1)

  // 이미지 미리보기 모달 상태
  const [imagePreviewModal, setImagePreviewModal] = useState<{
    isOpen: boolean
    images: string[]
    title: string
  }>({
    isOpen: false,
    images: [],
    title: '',
  })

  // 프롬프트 전체보기 모달 상태
  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean
    prompt: string
    userName: string
    mode: string
  }>({
    isOpen: false,
    prompt: '',
    userName: '',
    mode: '',
  })

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

  // 생성 내역 로드
  const loadGenerations = useCallback(async (
    dateFilter: DateFilter,
    statusFilter: 'all' | 'success' | 'failed',
    pageNum: number
  ) => {
    setGenerationsLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: '20',
      })
      if (dateFilter !== 'all') {
        params.set('date', dateFilter)
      }
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }
      const res = await fetch(`/api/admin/generations?${params}`)
      if (res.ok) {
        const data = await res.json()
        setGenerations(data.generations)
        setGenerationsPagination(data.pagination)
        setGenerationsSummary(data.summary)
      }
    } catch (error) {
      console.error('Failed to load generations:', error)
    } finally {
      setGenerationsLoading(false)
    }
  }, [])

  // 오류 내역 로드
  const loadErrors = useCallback(async (dateFilter: DateFilter, pageNum: number) => {
    setErrorsLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: '20',
      })
      if (dateFilter !== 'all') {
        params.set('date', dateFilter)
      }
      const res = await fetch(`/api/admin/errors?${params}`)
      if (res.ok) {
        const data = await res.json()
        setErrors(data.errors)
        setErrorsPagination(data.pagination)
        setErrorsSummary(data.summary)
      }
    } catch (error) {
      console.error('Failed to load errors:', error)
    } finally {
      setErrorsLoading(false)
    }
  }, [])

  // 초기 로드
  useEffect(() => {
    loadStats()
  }, [loadStats])

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'bonus') {
      loadUsers(search, page)
    } else if (activeTab === 'generations') {
      loadGenerations(generationsDateFilter, generationsStatusFilter, generationsPage)
    } else if (activeTab === 'errors') {
      loadErrors(errorsDateFilter, errorsPage)
    }
  }, [activeTab, search, page, loadUsers, generationsDateFilter, generationsStatusFilter, generationsPage, loadGenerations, errorsDateFilter, errorsPage, loadErrors])

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
        loadUsers(search, page)
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* 헤더 */}
      <header className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                title="홈으로"
              >
                <Home className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </button>
              <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
                관리자 대시보드
              </h1>
            </div>
            <button
              onClick={() => {
                loadStats()
                if (activeTab === 'users' || activeTab === 'bonus') {
                  loadUsers(search, page)
                } else if (activeTab === 'generations') {
                  loadGenerations(generationsDateFilter, generationsStatusFilter, generationsPage)
                } else if (activeTab === 'errors') {
                  loadErrors(errorsDateFilter, errorsPage)
                }
              }}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              title="새로고침"
            >
              <RefreshCw className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-4">
            {[
              { id: 'dashboard' as TabType, label: '대시보드', icon: TrendingUp },
              { id: 'generations' as TabType, label: '생성 내역', icon: Camera },
              { id: 'errors' as TabType, label: '오류 내역', icon: AlertTriangle },
              { id: 'users' as TabType, label: '사용자 관리', icon: Users },
              { id: 'bonus' as TabType, label: '크레딧 지급', icon: Gift },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
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
            {statsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm animate-pulse">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 mb-4" />
                    <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : stats && (
              <>
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-4">
                      크레딧 현황
                    </h3>
                    <div className="space-y-3">
                      <StatRow label="유료 충전" value={formatNumber(stats.credits.totalPurchased)} />
                      <StatRow label="보너스 지급" value={formatNumber(stats.credits.totalBonusGranted)} />
                      <StatRow label="사용됨" value={formatNumber(stats.credits.totalUsed)} color="red" />
                      <StatRow label="만료됨" value={formatNumber(stats.credits.totalExpired)} color="gray" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-4">
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

        {/* 생성 내역 탭 */}
        {activeTab === 'generations' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 text-sm mb-1">
                  <Camera className="w-4 h-4" />
                  오늘 총 생성
                </div>
                <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                  {formatNumber(generationsSummary.totalToday)}
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm mb-1">
                  <Check className="w-4 h-4" />
                  성공
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatNumber(generationsSummary.successToday)}
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  실패
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatNumber(generationsSummary.failedToday)}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-zinc-400" />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">기간:</span>
                {(['today', 'week', 'month', 'all'] as DateFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setGenerationsDateFilter(filter)
                      setGenerationsPage(1)
                    }}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      generationsDateFilter === filter
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                    }`}
                  >
                    {filter === 'today' ? '오늘' : filter === 'week' ? '이번 주' : filter === 'month' ? '이번 달' : '전체'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">상태:</span>
                {(['all', 'success', 'failed'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setGenerationsStatusFilter(filter)
                      setGenerationsPage(1)
                    }}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      generationsStatusFilter === filter
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                    }`}
                  >
                    {filter === 'all' ? '전체' : filter === 'success' ? '성공' : '실패'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">사용자</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">모드</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">프롬프트</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">이미지</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">상태</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">시간</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {generationsLoading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i}>
                          <td colSpan={6} className="px-4 py-4">
                            <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                          </td>
                        </tr>
                      ))
                    ) : generations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                          생성 내역이 없습니다
                        </td>
                      </tr>
                    ) : (
                      generations.map((gen) => (
                        <tr key={gen.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              {gen.user.image ? (
                                <img
                                  src={gen.user.image}
                                  alt={gen.user.name || ''}
                                  width={32}
                                  height={32}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center">
                                  <Users className="w-4 h-4 text-zinc-500" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-zinc-800 dark:text-zinc-100 text-sm">
                                  {gen.user.name || '이름 없음'}
                                </div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                  {gen.user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs rounded-lg">
                              {gen.mode}
                            </span>
                          </td>
                          <td className="px-4 py-4 max-w-xs">
                            {gen.prompt ? (
                              <button
                                onClick={() => setPromptModal({
                                  isOpen: true,
                                  prompt: gen.prompt || '',
                                  userName: gen.user.name || '사용자',
                                  mode: gen.mode,
                                })}
                                className="text-sm text-zinc-600 dark:text-zinc-300 truncate block max-w-xs text-left hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                title="클릭하여 전체 프롬프트 보기"
                              >
                                {gen.prompt}
                              </button>
                            ) : (
                              <span className="text-sm text-zinc-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {gen.projectImages.length > 0 ? (
                              <button
                                onClick={() => setImagePreviewModal({
                                  isOpen: true,
                                  images: gen.projectImages,
                                  title: `${gen.user.name || '사용자'}의 생성 이미지`,
                                })}
                                className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm"
                              >
                                <Eye className="w-4 h-4" />
                                {gen.imageCount}장 보기
                              </button>
                            ) : (
                              <span className="text-sm text-zinc-400">{gen.imageCount}장</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              gen.status === 'success'
                                ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                                : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                            }`}>
                              {gen.status === 'success' ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                              {gen.status === 'success' ? '성공' : '실패'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(gen.createdAt).toLocaleString('ko-KR', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {generationsPagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-700">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    총 {formatNumber(generationsPagination.total)}건
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setGenerationsPage(p => Math.max(1, p - 1))}
                      disabled={generationsPage === 1}
                      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-zinc-600 dark:text-zinc-300">
                      {generationsPage} / {generationsPagination.totalPages}
                    </span>
                    <button
                      onClick={() => setGenerationsPage(p => Math.min(generationsPagination.totalPages, p + 1))}
                      disabled={generationsPage === generationsPagination.totalPages}
                      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 오류 내역 탭 */}
        {activeTab === 'errors' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm border-l-4 border-red-500">
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 text-sm mb-1">
                  오늘 오류
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatNumber(errorsSummary.totalToday)}
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm border-l-4 border-orange-500">
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 text-sm mb-1">
                  이번 주 오류
                </div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatNumber(errorsSummary.totalThisWeek)}
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm border-l-4 border-yellow-500">
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 text-sm mb-1">
                  이번 달 오류
                </div>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {formatNumber(errorsSummary.totalThisMonth)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">기간:</span>
              {(['today', 'week', 'month', 'all'] as DateFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setErrorsDateFilter(filter)
                    setErrorsPage(1)
                  }}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    errorsDateFilter === filter
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                  }`}
                >
                  {filter === 'today' ? '오늘' : filter === 'week' ? '이번 주' : filter === 'month' ? '이번 달' : '전체'}
                </button>
              ))}
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">사용자</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">모드</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">프롬프트</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">에러 메시지</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">시간</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {errorsLoading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i}>
                          <td colSpan={5} className="px-4 py-4">
                            <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                          </td>
                        </tr>
                      ))
                    ) : errors.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                          <div className="flex flex-col items-center gap-2">
                            <Check className="w-8 h-8 text-green-500" />
                            <span>오류 내역이 없습니다</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      errors.map((err) => (
                        <tr key={err.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              {err.user.image ? (
                                <img
                                  src={err.user.image}
                                  alt={err.user.name || ''}
                                  width={32}
                                  height={32}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center">
                                  <Users className="w-4 h-4 text-zinc-500" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-zinc-800 dark:text-zinc-100 text-sm">
                                  {err.user.name || '이름 없음'}
                                </div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                  {err.user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs rounded-lg">
                              {err.mode}
                            </span>
                          </td>
                          <td className="px-4 py-4 max-w-xs">
                            <p className="text-sm text-zinc-600 dark:text-zinc-300 truncate" title={err.prompt || ''}>
                              {err.prompt || '-'}
                            </p>
                          </td>
                          <td className="px-4 py-4 max-w-md">
                            <p className="text-sm text-red-600 dark:text-red-400 break-words" title={err.errorMessage || ''}>
                              {err.errorMessage || '알 수 없는 오류'}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(err.createdAt).toLocaleString('ko-KR', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {errorsPagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-700">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    총 {formatNumber(errorsPagination.total)}건
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setErrorsPage(p => Math.max(1, p - 1))}
                      disabled={errorsPage === 1}
                      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-zinc-600 dark:text-zinc-300">
                      {errorsPage} / {errorsPagination.totalPages}
                    </span>
                    <button
                      onClick={() => setErrorsPage(p => Math.min(errorsPagination.totalPages, p + 1))}
                      disabled={errorsPage === errorsPagination.totalPages}
                      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 사용자 관리 & 크레딧 지급 탭 */}
        {(activeTab === 'users' || activeTab === 'bonus') && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                placeholder="이름 또는 이메일로 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">사용자</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">크레딧</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">생성 수</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">구독</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">가입일</th>
                      {activeTab === 'bonus' && (
                        <th className="px-4 py-3 text-right text-sm font-medium text-zinc-600 dark:text-zinc-400">액션</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {usersLoading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i}>
                          <td colSpan={6} className="px-4 py-4">
                            <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                          </td>
                        </tr>
                      ))
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                          사용자를 찾을 수 없습니다
                        </td>
                      </tr>
                    ) : (
                      users.map(user => (
                        <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              {user.image ? (
                                <img
                                  src={user.image}
                                  alt={user.name || ''}
                                  width={40}
                                  height={40}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center">
                                  <Users className="w-5 h-5 text-zinc-500" />
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-zinc-800 dark:text-zinc-100">
                                    {user.name || '이름 없음'}
                                  </span>
                                  {user.businessVerified && (
                                    <span title="사업자 인증">
                                      <Building2 className="w-4 h-4 text-green-500" />
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                  {user.email}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-medium text-zinc-800 dark:text-zinc-100">
                              {formatNumber(user.creditBalance)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-zinc-600 dark:text-zinc-300">
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
                                : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                            }`}>
                              {user.subscriptionTier !== 'FREE' && <Crown className="w-3 h-3" />}
                              {user.subscriptionTier || 'FREE'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-zinc-500 dark:text-zinc-400">
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

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-700">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    총 {formatNumber(pagination.total)}명 중 {(pagination.page - 1) * pagination.limit + 1}-
                    {Math.min(pagination.page * pagination.limit, pagination.total)}명
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-zinc-600 dark:text-zinc-300">
                      {page} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
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
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg">
                {bonusModal.user.image ? (
                  <img
                    src={bonusModal.user.image}
                    alt=""
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center">
                    <Users className="w-5 h-5 text-zinc-500" />
                  </div>
                )}
                <div>
                  <div className="font-medium text-zinc-800 dark:text-zinc-100">
                    {bonusModal.user.name || '이름 없음'}
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    현재 잔액: {formatNumber(bonusModal.user.creditBalance)} 크레딧
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  지급 크레딧
                </label>
                <input
                  type="number"
                  min="1"
                  value={bonusModal.amount}
                  onChange={(e) => setBonusModal(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="예: 100"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  지급 사유
                </label>
                <input
                  type="text"
                  value={bonusModal.description}
                  onChange={(e) => setBonusModal(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="예: 이벤트 당첨 보너스"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  만료 기간 (일)
                </label>
                <input
                  type="number"
                  min="1"
                  value={bonusModal.expiresInDays}
                  onChange={(e) => setBonusModal(prev => ({ ...prev, expiresInDays: e.target.value }))}
                  placeholder="비워두면 무기한"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  기본 30일, 비워두면 만료 없음
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => setBonusModal({
                  isOpen: false,
                  user: null,
                  amount: '',
                  description: '',
                  expiresInDays: '30',
                  isLoading: false,
                })}
                className="flex-1 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
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

      {/* 이미지 미리보기 모달 */}
      {imagePreviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                {imagePreviewModal.title}
              </h2>
              <button
                onClick={() => setImagePreviewModal({ isOpen: false, images: [], title: '' })}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              {imagePreviewModal.images.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                  이미지가 없습니다
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {imagePreviewModal.images.map((imageUrl, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-700"
                    >
                      <LazyImage
                        src={imageUrl}
                        alt={`생성 이미지 ${index + 1}`}
                        fill
                        className="object-cover"
                        priority={index < 4}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 프롬프트 전체보기 모달 */}
      {promptModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
              <div>
                <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                  프롬프트 상세
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {promptModal.userName} · {promptModal.mode}
                </p>
              </div>
              <button
                onClick={() => setPromptModal({ isOpen: false, prompt: '', userName: '', mode: '' })}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(80vh-100px)]">
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {promptModal.prompt}
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(promptModal.prompt)
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  복사하기
                </button>
              </div>
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
    <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{value}</div>
      <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{subValue}</div>
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
    default: 'text-zinc-800 dark:text-zinc-100',
    red: 'text-red-600 dark:text-red-400',
    gray: 'text-zinc-500 dark:text-zinc-400',
    blue: 'text-blue-600 dark:text-blue-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    purple: 'text-purple-600 dark:text-purple-400',
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
      <span className={`font-medium ${valueColorClasses[color]}`}>{value}</span>
    </div>
  )
}
