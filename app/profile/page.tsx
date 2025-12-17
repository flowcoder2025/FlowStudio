'use client';

import React, { useState, useEffect } from 'react';
import { Settings, BarChart3, History, CheckCircle, Coins, Building2, CreditCard, TrendingUp, Calendar, Gift, Users, Crown, Zap, Sparkles, ChevronRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ProfileSkeleton } from '@/components/ProfileSkeleton';
import { StorageUsageBar, StorageUsageBarSkeleton } from '@/components/StorageUsageBar';
import { AppMode } from '@/types';
import { useRouter } from 'next/navigation';

interface CreditBalance {
  balance: number;
  balanceKRW: number;
  free: number;
  purchased: number;
  tier: string;
  watermarkFree: boolean;
}

interface BusinessVerification {
  verified: boolean;
  verifiedAt: string | null;
  bonusClaimed: boolean;
  businessNumber: string | null;
  ownerName: string | null;
  phone: string | null;
}

interface CreditTransaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
}

interface SubscriptionInfo {
  tier: string;
  status: string;
  endDate: string | null;
  storageQuotaGB: number;
  concurrentLimit: number;
  watermarkFree: boolean;
  priorityQueue: boolean;
  tierConfig: {
    name: string;
    price: number;
    features: string[];
  };
}

interface StorageUsage {
  usedBytes: number;
  usedMB: number;
  usedGB: number;
  quotaGB: number;
  usagePercent: number;
  fileCount: number;
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfilePageContent />
    </AuthGuard>
  );
}

function ProfilePageContent() {
  const router = useRouter();

  // 상태 관리
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [businessVerification, setBusinessVerification] = useState<BusinessVerification | null>(null);
  const [creditHistory, setCreditHistory] = useState<CreditTransaction[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [storageLoading, setStorageLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setStorageLoading(true);
    try {
      await Promise.all([
        fetchCreditBalance(),
        fetchBusinessVerification(),
        fetchCreditHistory(),
        fetchSubscription()
      ]);
      fetchStorageUsage();
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreditBalance = async () => {
    try {
      const response = await fetch('/api/credits/balance');
      if (response.ok) {
        const data = await response.json();
        setCreditBalance(data);
      }
    } catch (error) {
      console.error('Failed to fetch credit balance:', error);
    }
  };

  const fetchBusinessVerification = async () => {
    try {
      const response = await fetch('/api/profile/business-verification');
      if (response.ok) {
        const data = await response.json();
        setBusinessVerification(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch business verification:', error);
    }
  };

  const fetchCreditHistory = async () => {
    try {
      const response = await fetch('/api/credits/history?limit=5');
      if (response.ok) {
        const data = await response.json();
        setCreditHistory(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch credit history:', error);
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscription');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSubscription(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  };

  const fetchStorageUsage = async () => {
    setStorageLoading(true);
    try {
      const response = await fetch('/api/storage/usage');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStorageUsage(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch storage usage:', error);
    } finally {
      setStorageLoading(false);
    }
  };

  // 구독 티어 아이콘 선택
  const getTierIcon = (tier: string, size: 'sm' | 'md' = 'sm') => {
    const cls = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    switch (tier) {
      case 'BUSINESS':
        return <Crown className={`${cls} text-amber-500`} />;
      case 'PRO':
        return <Crown className={`${cls} text-purple-500`} />;
      case 'PLUS':
        return <Zap className={`${cls} text-blue-500`} />;
      default:
        return <Sparkles className={`${cls} text-slate-500`} />;
    }
  };

  // 구독 티어 배경색 선택
  const getTierBgColor = (tier: string) => {
    switch (tier) {
      case 'BUSINESS':
        return 'from-amber-500 to-orange-600';
      case 'PRO':
        return 'from-purple-500 to-indigo-600';
      case 'PLUS':
        return 'from-blue-500 to-cyan-600';
      default:
        return 'from-slate-400 to-slate-600';
    }
  };

  // 트랜잭션 타입별 아이콘 및 색상
  const getTransactionDisplay = (transaction: CreditTransaction) => {
    const isPositive = transaction.amount > 0;

    let icon = <Coins className="w-3.5 h-3.5" />;
    let colorClass = 'text-slate-600 dark:text-slate-400';
    let bgClass = 'bg-slate-100 dark:bg-slate-700';

    switch (transaction.type) {
      case 'PURCHASE':
        icon = <CreditCard className="w-3.5 h-3.5" />;
        colorClass = 'text-green-600 dark:text-green-400';
        bgClass = 'bg-green-100 dark:bg-green-900/30';
        break;
      case 'BONUS':
        icon = <TrendingUp className="w-3.5 h-3.5" />;
        colorClass = 'text-blue-600 dark:text-blue-400';
        bgClass = 'bg-blue-100 dark:bg-blue-900/30';
        break;
      case 'REFERRAL':
        icon = <TrendingUp className="w-3.5 h-3.5" />;
        colorClass = 'text-purple-600 dark:text-purple-400';
        bgClass = 'bg-purple-100 dark:bg-purple-900/30';
        break;
      case 'GENERATION':
      case 'UPSCALE':
        icon = <BarChart3 className="w-3.5 h-3.5" />;
        colorClass = 'text-orange-600 dark:text-orange-400';
        bgClass = 'bg-orange-100 dark:bg-orange-900/30';
        break;
    }

    return { icon, colorClass, bgClass, isPositive };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return '오늘';
    } else if (diffInHours < 48) {
      return '어제';
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <>
        <Header currentMode={AppMode.PROFILE} />
        <ProfileSkeleton />
      </>
    );
  }

  return (
    <>
      <Header currentMode={AppMode.PROFILE} />

      <div className="max-w-4xl mx-auto px-3 lg:px-4 py-4 lg:py-6">
        {/* 헤더 - 컴팩트 */}
        <div className="flex items-center gap-3 mb-4 lg:mb-6">
          <div className="bg-slate-100 dark:bg-slate-800 w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 lg:w-6 lg:h-6 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-slate-900 dark:text-slate-100">프로필 및 설정</h2>
            <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">크레딧, 구독, 사업자 인증 관리</p>
          </div>
        </div>

        <div className="grid gap-3 lg:gap-4">
          {/* 크레딧 잔액 카드 */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl lg:rounded-2xl shadow-lg overflow-hidden">
            <div className="p-4 lg:p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm lg:text-base flex items-center gap-1.5">
                  <Coins className="w-4 h-4" /> 크레딧 잔액
                </h3>
                <button
                  onClick={() => router.push('/credits/purchase')}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-lg font-medium transition-colors text-xs lg:text-sm"
                >
                  충전하기
                </button>
              </div>

              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-3xl lg:text-4xl font-bold">{creditBalance?.balance ?? 0}</span>
                <span className="text-base lg:text-lg opacity-90">크레딧</span>
              </div>
              <p className="text-white/80 text-xs lg:text-sm">
                ≈ ₩{(creditBalance?.balanceKRW ?? 0).toLocaleString()}원
              </p>

              {/* 무료/유료 크레딧 분리 표시 */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] text-white/70">유료 크레딧</span>
                    {!creditBalance?.watermarkFree && creditBalance?.purchased && creditBalance.purchased > 0 && (
                      <span className="text-[9px] bg-green-400/30 text-green-200 px-1.5 py-0.5 rounded">워터마크 X</span>
                    )}
                  </div>
                  <p className="text-lg font-bold">{creditBalance?.purchased ?? 0}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] text-white/70">무료 크레딧</span>
                    {!creditBalance?.watermarkFree && creditBalance?.free && creditBalance.free > 0 && (
                      <span className="text-[9px] bg-orange-400/30 text-orange-200 px-1.5 py-0.5 rounded">워터마크 O</span>
                    )}
                  </div>
                  <p className="text-lg font-bold">{creditBalance?.free ?? 0}</p>
                </div>
              </div>

              {/* 워터마크 정책 안내 (FREE 플랜만) */}
              {creditBalance && !creditBalance.watermarkFree && (
                <p className="mt-2 text-[10px] text-white/60 leading-relaxed">
                  💡 무료 크레딧 사용 시 워터마크가 적용됩니다. 유료 크레딧 또는 구독 업그레이드로 워터마크 없이 이용하세요.
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-white/20">
                <div className="grid grid-cols-2 gap-3 text-xs lg:text-sm">
                  <div>
                    <p className="text-white/70 mb-0.5">2K 생성 (4장)</p>
                    <p className="font-semibold">20 크레딧</p>
                  </div>
                  <div>
                    <p className="text-white/70 mb-0.5">업스케일링 (1장)</p>
                    <p className="font-semibold">10 크레딧</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 구독 정보 + 저장 공간 카드 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 lg:p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm lg:text-base text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  {subscription && getTierIcon(subscription.tier)}
                  구독 플랜
                </h3>
                {subscription && subscription.tier === 'FREE' ? (
                  <button
                    onClick={() => router.push('/subscription')}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-3 py-1.5 rounded-lg font-medium transition-all text-xs flex items-center gap-0.5"
                  >
                    업그레이드
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => router.push('/subscription')}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs flex items-center gap-0.5"
                  >
                    플랜 관리
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 현재 플랜 배지 */}
              {subscription && (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r ${getTierBgColor(subscription.tier)} text-white mb-3`}>
                  {getTierIcon(subscription.tier)}
                  <span className="font-bold text-sm">{subscription.tierConfig.name}</span>
                  {subscription.tier !== 'FREE' && subscription.endDate && (
                    <span className="text-[10px] opacity-90">
                      (~{new Date(subscription.endDate).toLocaleDateString('ko-KR')})
                    </span>
                  )}
                </div>
              )}

              {/* 플랜 혜택 요약 - 2x2 그리드 */}
              {subscription && (
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">저장공간</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{subscription.storageQuotaGB}GB</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">동시생성</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{subscription.concurrentLimit}건</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">워터마크</p>
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-100">
                      {subscription.watermarkFree ? '제거 ✓' : '포함'}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">우선처리</p>
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-100">
                      {subscription.priorityQueue ? '활성 ✓' : '-'}
                    </p>
                  </div>
                </div>
              )}

              {/* 저장 공간 사용량 */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">저장 공간 사용량</h4>
                {storageLoading ? (
                  <StorageUsageBarSkeleton />
                ) : storageUsage ? (
                  <StorageUsageBar
                    usedMB={storageUsage.usedMB}
                    usedGB={storageUsage.usedGB}
                    quotaGB={storageUsage.quotaGB}
                    usagePercent={storageUsage.usagePercent}
                    fileCount={storageUsage.fileCount}
                    showWarning={true}
                  />
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    사용량 정보를 불러올 수 없습니다.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 사업자 인증 + 추천 프로그램 - 2열 그리드 (모바일: 1열) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
            {/* 사업자 인증 상태 카드 */}
            <div className={`rounded-xl lg:rounded-2xl shadow-sm border overflow-hidden transition-colors ${
              businessVerification?.verified
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}>
              <div className="p-4 lg:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-bold text-sm lg:text-base flex items-center gap-1.5 ${
                    businessVerification?.verified
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-slate-800 dark:text-slate-100'
                  }`}>
                    <Building2 className="w-4 h-4" /> 사업자 인증
                  </h3>
                  {businessVerification?.verified ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <button
                      onClick={() => router.push('/profile/business')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors text-xs"
                    >
                      인증하기
                    </button>
                  )}
                </div>

                {businessVerification?.verified ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-700 dark:text-green-300">✓ 인증 완료</span>
                      {businessVerification.bonusClaimed && (
                        <span className="text-[10px] bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-1.5 py-0.5 rounded">
                          150 크레딧 지급완료
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {businessVerification.businessNumber?.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3')}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                      사업자 인증 시 <strong className="text-indigo-600 dark:text-indigo-400">150 크레딧</strong> 보너스
                    </p>
                    <ul className="space-y-0.5 text-[10px] text-slate-500">
                      <li>• 국세청 실시간 진위 확인</li>
                      <li>• 1회 한정 보너스 지급</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* 추천 프로그램 카드 */}
            <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl lg:rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4 lg:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <Gift className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-white">추천 프로그램</h3>
                    <p className="text-[10px] text-white/80">친구와 함께 크레딧 받기</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 mb-3">
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-white/80 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-white/90 leading-relaxed">
                      친구 초대 + 사업자 인증 완료 시 <strong className="text-white">각각 150 크레딧</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => router.push('/profile/referral')}
                  className="w-full bg-white hover:bg-white/90 text-purple-600 font-medium py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs"
                >
                  <Gift className="w-3.5 h-3.5" />
                  대시보드 보기
                  <span className="text-sm">→</span>
                </button>
              </div>
            </div>
          </div>

          {/* 크레딧 사용 내역 카드 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-3 lg:p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-sm lg:text-base text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> 최근 사용 내역
              </h3>
            </div>

            <div className="p-3 lg:p-4">
              {creditHistory.length === 0 ? (
                <div className="text-center py-6">
                  <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 dark:text-slate-500">아직 크레딧 사용 내역이 없습니다</p>
                  <button
                    onClick={() => router.push('/credits/purchase')}
                    className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    크레딧 충전하기 →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {creditHistory.map((transaction) => {
                    const { icon, colorClass, bgClass, isPositive } = getTransactionDisplay(transaction);
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bgClass}`}>
                            <span className={colorClass}>{icon}</span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                              {transaction.description || transaction.type}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {formatDate(transaction.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold ${
                          isPositive
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {isPositive ? '+' : ''}{transaction.amount}
                        </span>
                      </div>
                    );
                  })}

                  {creditHistory.length >= 5 && (
                    <button
                      onClick={() => router.push('/credits/history')}
                      className="w-full mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      전체 내역 보기 →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* About - 간소화 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-3 lg:p-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-2">정보</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
              <p><strong>버전:</strong> v1.0.0</p>
              <p><strong>모델:</strong> Gemini 3 Pro</p>
              <p><strong>생성:</strong> 20 크레딧/4장</p>
              <p><strong>업스케일:</strong> 10 크레딧/1장</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
