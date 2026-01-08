'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Settings, BarChart3, History, CheckCircle, Coins, Building2, CreditCard, TrendingUp, Calendar, Gift, Layers } from 'lucide-react';
import { Header } from '@/components/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ProfileSkeleton } from '@/components/ProfileSkeleton';
import { AppMode } from '@/types';

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
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const t = useTranslations('profile');

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
      return t('today');
    } else if (diffInHours < 48) {
      return t('yesterday');
    } else {
      return date.toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    try {
      return t(`transactionTypes.${type}`);
    } catch {
      return type;
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
        <div className="flex items-center gap-3 mb-4 lg:mb-6">
          <div className="bg-slate-100 dark:bg-slate-800 w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 lg:w-6 lg:h-6 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-slate-900 dark:text-slate-100">{t('pageTitle')}</h2>
            <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">{t('pageDescription')}</p>
          </div>
        </div>

        <div className="grid gap-3 lg:gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <Coins className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">{t('credits')}</h3>
                  </div>
                  <button
                    onClick={() => router.push(`/${locale}/credits/purchase`)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-md font-medium transition-colors text-xs cursor-pointer"
                  >
                    {t('recharge')}
                  </button>
                </div>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {(creditBalance?.balance ?? 0).toLocaleString()}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{t('totalCredits')}</span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">
                  {t('approxValue')} ₩{(creditBalance?.balanceKRW ?? 0).toLocaleString()}
                </p>

                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 rounded-md px-2.5 py-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{t('paid')}</span>
                      {!creditBalance?.watermarkFree && creditBalance?.purchased && creditBalance.purchased > 0 && (
                        <span className="text-[8px] bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1 py-0.5 rounded">{t('noWatermark')}</span>
                      )}
                    </div>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200">{creditBalance?.purchased ?? 0}</p>
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 rounded-md px-2.5 py-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{t('free')}</span>
                      {!creditBalance?.watermarkFree && creditBalance?.free && creditBalance.free > 0 && (
                        <span className="text-[8px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1 py-0.5 rounded">{t('watermark')}</span>
                      )}
                    </div>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200">{creditBalance?.free ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getTierBgColor(subscription?.tier || 'FREE')} flex items-center justify-center`}>
                      <Layers className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">{t('subscription')}</h3>
                  </div>
                  {subscription && subscription.tier === 'FREE' ? (
                    <button
                      onClick={() => router.push(`/${locale}/subscription`)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-md font-medium transition-colors text-xs cursor-pointer"
                    >
                      {t('upgrade')}
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push(`/${locale}/subscription`)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs font-medium cursor-pointer"
                    >
                      {t('manage')}
                    </button>
                  )}
                </div>

                {subscription && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {subscription.tierConfig.name}
                    </span>
                    {subscription.tier !== 'FREE' && subscription.endDate && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        ~{new Date(subscription.endDate).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US')}
                      </span>
                    )}
                  </div>
                )}

                {subscription && (
                  <div className="grid grid-cols-4 gap-1.5 mb-3">
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-md px-1.5 py-1.5 text-center">
                      <p className="text-[9px] text-slate-400 dark:text-slate-500">{t('storage')}</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{subscription.storageQuotaGB}GB</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-md px-1.5 py-1.5 text-center">
                      <p className="text-[9px] text-slate-400 dark:text-slate-500">{t('concurrent')}</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{subscription.concurrentLimit}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-md px-1.5 py-1.5 text-center">
                      <p className="text-[9px] text-slate-400 dark:text-slate-500">{t('watermarkLabel')}</p>
                      <p className="text-[10px] font-medium text-slate-700 dark:text-slate-200">
                        {subscription.watermarkFree ? '✓' : '-'}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-md px-1.5 py-1.5 text-center">
                      <p className="text-[9px] text-slate-400 dark:text-slate-500">{t('priority')}</p>
                      <p className="text-[10px] font-medium text-slate-700 dark:text-slate-200">
                        {subscription.priorityQueue ? '✓' : '-'}
                      </p>
                    </div>
                  </div>
                )}

                {storageLoading ? (
                  <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                ) : storageUsage ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          storageUsage.usagePercent > 90 ? 'bg-red-500' :
                          storageUsage.usagePercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(storageUsage.usagePercent, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {storageUsage.usedMB < 1024
                        ? `${storageUsage.usedMB.toFixed(1)}MB`
                        : `${storageUsage.usedGB.toFixed(1)}GB`} / {storageUsage.quotaGB}GB
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className={`rounded-xl border shadow-sm overflow-hidden transition-colors ${
              businessVerification?.verified
                ? 'bg-white dark:bg-slate-800 border-emerald-300 dark:border-emerald-700'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      businessVerification?.verified
                        ? 'bg-emerald-500'
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}>
                      <Building2 className={`w-4 h-4 ${
                        businessVerification?.verified ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                      }`} />
                    </div>
                    <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">{t('businessVerification')}</h3>
                  </div>
                  {businessVerification?.verified ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <button
                      onClick={() => router.push(`/${locale}/profile/business`)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-md font-medium transition-colors text-xs cursor-pointer"
                    >
                      {t('verify')}
                    </button>
                  )}
                </div>

                {businessVerification?.verified ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t('verified')}</span>
                      {businessVerification.bonusClaimed && (
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                          {t('bonusCredits')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-mono text-slate-600 dark:text-slate-400">
                      {businessVerification.businessNumber?.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3')}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                      {t('verifyDescription')} <strong className="text-indigo-600 dark:text-indigo-400">100 {t('credits')}</strong> {t('instantBonus')}
                    </p>
                    <div className="flex gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                      <span>• {t('taxVerification')}</span>
                      <span>• {t('oneTimeOnly')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Gift className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">{t('referralProgram')}</h3>
                  </div>
                  <button
                    onClick={() => router.push(`/${locale}/profile/referral`)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-md font-medium transition-colors text-xs cursor-pointer"
                  >
                    {t('getCredits')}
                  </button>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                  {t('referralDescription')} <strong className="text-purple-600 dark:text-purple-400">{t('eachCredits')}</strong>
                </p>

                <div className="flex gap-2">
                  <div className="flex-1 bg-purple-50 dark:bg-purple-900/20 rounded-md px-2.5 py-2 text-center">
                    <p className="text-[10px] text-purple-500 dark:text-purple-400 mb-0.5">{t('referrer')}</p>
                    <p className="text-sm font-bold text-purple-600 dark:text-purple-300">+50</p>
                  </div>
                  <div className="flex-1 bg-pink-50 dark:bg-pink-900/20 rounded-md px-2.5 py-2 text-center">
                    <p className="text-[10px] text-pink-500 dark:text-pink-400 mb-0.5">{t('referee')}</p>
                    <p className="text-sm font-bold text-pink-600 dark:text-pink-300">+50</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-3 lg:p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-sm lg:text-base text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> {t('recentHistory')}
              </h3>
            </div>

            <div className="p-3 lg:p-4">
              {creditHistory.length === 0 ? (
                <div className="text-center py-6">
                  <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 dark:text-slate-500">{t('noHistory')}</p>
                  <button
                    onClick={() => router.push(`/${locale}/credits/purchase`)}
                    className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {t('rechargeCredits')}
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
                              {transaction.description || getTransactionTypeLabel(transaction.type)}
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
                      onClick={() => router.push(`/${locale}/credits/history`)}
                      className="w-full mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {t('viewAllHistory')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-3 lg:p-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-2">{t('info')}</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
              <p><strong>{t('version')}:</strong> v1.0.0</p>
              <p><strong>{t('model')}:</strong> Gemini 3 Pro</p>
              <p><strong>{t('generation')}:</strong> {t('creditsPerGeneration')}</p>
              <p><strong>{t('upscale')}:</strong> {t('creditsPerUpscale')}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
