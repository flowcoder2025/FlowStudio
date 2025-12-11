'use client';

import React, { useState, useEffect } from 'react';
import { Settings, BarChart3, History, CheckCircle, Coins, Building2, CreditCard, TrendingUp, Calendar, Gift, Users } from 'lucide-react';
import { Header } from '@/components/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppMode } from '@/types';
import { useRouter } from 'next/navigation';

interface CreditBalance {
  balance: number;
  balanceKRW: number;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCreditBalance(),
        fetchBusinessVerification(),
        fetchCreditHistory()
      ]);
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
      const response = await fetch('/api/credits/history?limit=10');
      if (response.ok) {
        const data = await response.json();
        setCreditHistory(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch credit history:', error);
    }
  };

  // 트랜잭션 타입별 아이콘 및 색상
  const getTransactionDisplay = (transaction: CreditTransaction) => {
    const isPositive = transaction.amount > 0;

    let icon = <Coins className="w-4 h-4" />;
    let colorClass = 'text-slate-600 dark:text-slate-400';
    let bgClass = 'bg-slate-100 dark:bg-slate-700';

    switch (transaction.type) {
      case 'PURCHASE':
        icon = <CreditCard className="w-4 h-4" />;
        colorClass = 'text-green-600 dark:text-green-400';
        bgClass = 'bg-green-100 dark:bg-green-900/30';
        break;
      case 'BONUS':
        icon = <TrendingUp className="w-4 h-4" />;
        colorClass = 'text-blue-600 dark:text-blue-400';
        bgClass = 'bg-blue-100 dark:bg-blue-900/30';
        break;
      case 'REFERRAL':
        icon = <TrendingUp className="w-4 h-4" />;
        colorClass = 'text-purple-600 dark:text-purple-400';
        bgClass = 'bg-purple-100 dark:bg-purple-900/30';
        break;
      case 'GENERATION':
      case 'UPSCALE':
        icon = <BarChart3 className="w-4 h-4" />;
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
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">로딩 중...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header currentMode={AppMode.PROFILE} />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="bg-slate-100 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
            <Settings className="w-8 h-8 text-slate-600 dark:text-slate-300" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">프로필 및 설정</h2>
          <p className="text-slate-500 dark:text-slate-400">크레딧 잔액, 사업자 인증, API 설정을 관리하세요</p>
        </div>

        <div className="grid gap-6">
          {/* 크레딧 잔액 카드 */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Coins className="w-5 h-5" /> 크레딧 잔액
                </h3>
                <button
                  onClick={() => router.push('/credits/purchase')}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  충전하기
                </button>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-bold">{creditBalance?.balance ?? 0}</span>
                <span className="text-xl opacity-90">크레딧</span>
              </div>
              <p className="text-white/80 text-sm">
                ≈ ₩{(creditBalance?.balanceKRW ?? 0).toLocaleString()}원
              </p>

              <div className="mt-6 pt-4 border-t border-white/20">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-white/70 mb-1">2K 생성 (4장)</p>
                    <p className="font-semibold">20 크레딧</p>
                  </div>
                  <div>
                    <p className="text-white/70 mb-1">업스케일링 (1장)</p>
                    <p className="font-semibold">10 크레딧</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 사업자 인증 상태 카드 */}
          <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors ${
            businessVerification?.verified
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold text-lg flex items-center gap-2 ${
                  businessVerification?.verified
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-slate-800 dark:text-slate-100'
                }`}>
                  <Building2 className="w-5 h-5" /> 사업자 인증
                </h3>
                {businessVerification?.verified ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <button
                    onClick={() => router.push('/profile/business')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                  >
                    인증하기
                  </button>
                )}
              </div>

              {businessVerification?.verified ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-700 dark:text-green-300">✓ 인증 완료</span>
                    {businessVerification.bonusClaimed && (
                      <span className="text-xs bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                        보너스 150 크레딧 지급완료
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    사업자등록번호: {businessVerification.businessNumber?.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3')}
                  </p>
                  {businessVerification.verifiedAt && (
                    <p className="text-xs text-green-600/70 dark:text-green-400/70">
                      인증일: {new Date(businessVerification.verifiedAt).toLocaleDateString('ko-KR')}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    사업자 인증을 완료하고 <strong className="text-indigo-600 dark:text-indigo-400">150 크레딧 보너스</strong>를 받으세요
                  </p>
                  <ul className="space-y-1 text-xs text-slate-500 dark:text-slate-500">
                    <li>• 국세청 공공데이터를 통한 실시간 진위 확인</li>
                    <li>• 1회 한정 보너스 크레딧 지급</li>
                    <li>• 사업자 전용 혜택 제공 (추후)</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 추천 프로그램 카드 */}
          <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    추천 프로그램
                  </h3>
                  <p className="text-sm text-white/80">친구와 함께 크레딧을 받으세요</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-white/80 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-white/90 leading-relaxed">
                      친구를 초대하고 사업자 인증을 완료하면 <strong className="text-white">추천인과 가입자 모두 각각 150 크레딧</strong>을 받습니다 (총 300 크레딧)
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push('/profile/referral')}
                className="w-full bg-white hover:bg-white/90 text-purple-600 font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 group"
              >
                <Gift className="w-4 h-4 group-hover:scale-110 transition-transform" />
                대시보드 보기
                <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>

          {/* 크레딧 사용 내역 카드 */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> 최근 사용 내역
              </h3>
            </div>

            <div className="p-6">
              {creditHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 dark:text-slate-500">아직 크레딧 사용 내역이 없습니다</p>
                  <button
                    onClick={() => router.push('/credits/purchase')}
                    className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    크레딧 충전하기 →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {creditHistory.slice(0, 10).map((transaction) => {
                    const { icon, colorClass, bgClass, isPositive } = getTransactionDisplay(transaction);
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bgClass}`}>
                            <span className={colorClass}>{icon}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                              {transaction.description || transaction.type}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                              {formatDate(transaction.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span className={`text-sm font-bold ${
                          isPositive
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {isPositive ? '+' : ''}{transaction.amount} 크레딧
                        </span>
                      </div>
                    );
                  })}

                  {creditHistory.length > 10 && (
                    <button
                      className="w-full mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      전체 내역 보기 →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* About */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-3">정보</h3>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <p><strong>버전:</strong> v1.0.0 (Credit System)</p>
              <p><strong>모델:</strong> Gemini 3 Pro Image Preview</p>
              <p><strong>가격:</strong> 2K 생성 (4장) = 20 크레딧, 업스케일링 (1장) = 10 크레딧</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
