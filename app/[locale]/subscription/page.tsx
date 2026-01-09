'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Check, Crown, Zap, Building2, Sparkles, Loader2 } from 'lucide-react';
import { PaddleProvider, openPaddleCheckout } from '@/components/PaddleProvider';
import { Header } from '@/components/Header';
import { AppMode } from '@/types';
import { SUBSCRIPTION_TIERS, type SubscriptionTier, type BillingInterval } from '@/lib/constants';

type Locale = 'ko' | 'en';

const PLAN_ICONS = {
  FREE: Sparkles,
  PLUS: Zap,
  PRO: Crown,
  BUSINESS: Building2,
} as const;

const PLAN_COLORS = {
  FREE: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    border: 'border-slate-200 dark:border-slate-700',
    icon: 'bg-slate-200 dark:bg-slate-700',
  },
  PLUS: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-700',
    icon: 'bg-blue-200 dark:bg-blue-800',
  },
  PRO: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/30',
    border: 'border-cyan-200 dark:border-cyan-700',
    icon: 'bg-cyan-200 dark:bg-cyan-800',
  },
  BUSINESS: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    border: 'border-amber-200 dark:border-amber-700',
    icon: 'bg-amber-200 dark:bg-amber-800',
  },
} as const;

const PADDLE_PRICE_IDS: Record<SubscriptionTier, { monthly?: string; yearly?: string }> = {
  FREE: {},
  PLUS: {
    monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_PLUS_MONTHLY,
    yearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_PLUS_YEARLY,
  },
  PRO: {
    monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY,
    yearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_YEARLY,
  },
  BUSINESS: {
    monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_BUSINESS_MONTHLY,
    yearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_BUSINESS_YEARLY,
  },
};

interface CurrentSubscription {
  tier: string;
  status: string;
  endDate: string | null;
  tierConfig: {
    name: { ko: string; en: string };
    priceKRW: { monthly: number; yearly: number };
    priceUSD: { monthly: number; yearly: number };
  };
}

interface CreditBalance {
  balance: number;
  free: number;
  purchased: number;
  watermarkFree: boolean;
}

function formatPrice(amount: number, currency: 'KRW' | 'USD'): string {
  if (amount === 0) return currency === 'KRW' ? '무료' : 'Free';
  if (currency === 'KRW') {
    return `₩${amount.toLocaleString()}`;
  }
  return `$${amount}`;
}

export default function SubscriptionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as Locale) || 'ko';
  
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingTier, setProcessingTier] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  const currency = locale === 'ko' ? 'KRW' : 'USD';

  const t = {
    title: locale === 'ko' ? '구독 플랜' : 'Subscription Plans',
    subtitle: locale === 'ko'
      ? '더 많은 저장공간과 빠른 처리 속도를 원하시나요?'
      : 'Need more storage and faster processing?',
    currentPlan: locale === 'ko' ? '현재 플랜' : 'Current Plan',
    until: locale === 'ko' ? '까지' : 'until',
    credits: locale === 'ko' ? '보유 크레딧' : 'Credits Balance',
    creditsUnit: locale === 'ko' ? '크레딧' : 'credits',
    purchased: locale === 'ko' ? '유료' : 'Paid',
    free: locale === 'ko' ? '무료' : 'Free',
    noWatermark: locale === 'ko' ? '워터마크 X' : 'No Watermark',
    hasWatermark: locale === 'ko' ? '워터마크 O' : 'Has Watermark',
    buyCredits: locale === 'ko' ? '크레딧 충전' : 'Buy Credits',
    watermarkNote: locale === 'ko' 
      ? '무료 크레딧 사용 시 워터마크가 적용됩니다. 유료 크레딧을 사용하거나 구독을 업그레이드하면 워터마크 없이 이용할 수 있습니다.'
      : 'Watermark is applied when using free credits. Use paid credits or upgrade your subscription to remove watermarks.',
    noWatermarkNote: locale === 'ko' 
      ? '구독 플랜 혜택으로 모든 생성물에 워터마크가 적용되지 않습니다.'
      : 'Your subscription plan removes watermarks from all generated images.',
    monthly: locale === 'ko' ? '월간' : 'Monthly',
    yearly: locale === 'ko' ? '연간' : 'Yearly',
    yearlyDiscount: locale === 'ko' ? '2개월 무료' : '2 months free',
    popular: locale === 'ko' ? '인기' : 'Popular',
    perMonth: locale === 'ko' ? '/월' : '/mo',
    perYear: locale === 'ko' ? '/연' : '/yr',
    upgrade: locale === 'ko' ? '업그레이드' : 'Upgrade',
    contact: locale === 'ko' ? '문의하기' : 'Contact Us',
    basePlan: locale === 'ko' ? '기본 플랜' : 'Base Plan',
    downgrade: locale === 'ko' ? '다운그레이드' : 'Downgrade',
    processing: locale === 'ko' ? '결제 중...' : 'Processing...',
    cancelNote: locale === 'ko' 
      ? '구독은 언제든지 취소할 수 있습니다. 취소 시 현재 구독 기간이 끝날 때까지 혜택이 유지됩니다.'
      : 'You can cancel anytime. Your benefits continue until the end of the current billing period.',
    creditNote: locale === 'ko' 
      ? '크레딧은 구독과 별도로 충전하여 사용할 수 있습니다.'
      : 'Credits can be purchased and used separately from your subscription.',
    buyCreditsLink: locale === 'ko' ? '크레딧 충전하기 →' : 'Buy Credits →',
    loginRequired: locale === 'ko' ? '로그인이 필요합니다.' : 'Login required.',
    paymentNotConfigured: locale === 'ko' 
      ? '결제 시스템이 설정되지 않았습니다. 관리자에게 문의해주세요.'
      : 'Payment system not configured. Please contact support.',
  };

  const fetchSubscription = useCallback(async () => {
    try {
      const [subResponse, creditResponse] = await Promise.all([
        fetch('/api/subscription'),
        fetch('/api/credits/balance'),
      ]);

      const subData = await subResponse.json();
      if (subData.success) {
        setCurrentSubscription(subData.data);
      }

      if (creditResponse.ok) {
        const creditData = await creditResponse.json();
        setCreditBalance(creditData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push(`/${locale}/login`);
      return;
    }

    fetchSubscription();
  }, [session, status, router, locale, fetchSubscription]);

  const handleCheckoutComplete = useCallback(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (!session?.user?.id || !session?.user?.email) {
      alert(t.loginRequired);
      return;
    }

    if (tier === 'BUSINESS') {
      window.open('mailto:support@flowstudio.com?subject=Business Plan Inquiry', '_blank');
      return;
    }

    if (tier === currentSubscription?.tier || tier === 'FREE') {
      return;
    }

    const priceId = PADDLE_PRICE_IDS[tier]?.[billingInterval];
    if (!priceId) {
      alert(t.paymentNotConfigured);
      return;
    }

    try {
      setProcessingTier(tier);
      
      openPaddleCheckout({
        priceId,
        email: session.user.email,
        userId: session.user.id,
        locale: locale === 'ko' ? 'ko' : 'en',
        successUrl: `${window.location.origin}/${locale}/subscription?success=true`,
      });
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setProcessingTier(null);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      window.history.replaceState({}, '', `/${locale}/subscription`);
      fetchSubscription();
    }
  }, [locale, fetchSubscription]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tiers = Object.entries(SUBSCRIPTION_TIERS) as [SubscriptionTier, typeof SUBSCRIPTION_TIERS[SubscriptionTier]][];
  const currentTierIndex = tiers.findIndex(([tier]) => tier === currentSubscription?.tier);

  return (
    <>
      <Header currentMode={AppMode.HOME} />
      <PaddleProvider onCheckoutComplete={handleCheckoutComplete} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
          <div className="max-w-6xl mx-auto px-4 py-10 lg:py-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 mb-4">
              <Crown className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              {t.title}
            </h1>
            <p className="text-indigo-100 text-sm lg:text-base max-w-xl mx-auto">
              {t.subtitle}
            </p>
            {currentSubscription && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-sm text-white">
                  {t.currentPlan}: <strong>{currentSubscription.tierConfig.name[locale]}</strong>
                </span>
                {currentSubscription.endDate && (
                  <span className="text-sm text-indigo-200">
                    ({new Date(currentSubscription.endDate).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US')} {t.until})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6 lg:py-8">

          {creditBalance && (
            <div className="mb-6 lg:mb-8 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-white/80 text-xs mb-1">{t.credits}</p>
                  <p className="text-2xl font-bold">
                    {creditBalance.balance} <span className="text-base font-normal opacity-80">{t.creditsUnit}</span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-center min-w-[80px]">
                    <p className="text-[10px] text-white/70 mb-0.5">{t.purchased}</p>
                    <p className="font-bold">{creditBalance.purchased}</p>
                    {!creditBalance.watermarkFree && creditBalance.purchased > 0 && (
                      <span className="text-[8px] text-green-300">{t.noWatermark}</span>
                    )}
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-center min-w-[80px]">
                    <p className="text-[10px] text-white/70 mb-0.5">{t.free}</p>
                    <p className="font-bold">{creditBalance.free}</p>
                    {!creditBalance.watermarkFree && creditBalance.free > 0 && (
                      <span className="text-[8px] text-orange-300">{t.hasWatermark}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/${locale}/credits/purchase`)}
                  className="bg-white text-indigo-600 hover:bg-white/90 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                >
                  {t.buyCredits}
                </button>
              </div>
              {!creditBalance.watermarkFree && (
                <p className="mt-3 text-[11px] text-white/70 border-t border-white/20 pt-2">
                  💡 {t.watermarkNote}
                </p>
              )}
              {creditBalance.watermarkFree && (
                <p className="mt-3 text-[11px] text-green-300 border-t border-white/20 pt-2">
                  ✓ {t.noWatermarkNote}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center bg-slate-200 dark:bg-slate-800 rounded-full p-1">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  billingInterval === 'monthly'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.monthly}
              </button>
              <button
                onClick={() => setBillingInterval('yearly')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  billingInterval === 'yearly'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.yearly}
                <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                  {t.yearlyDiscount}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {tiers.map(([tier, config], tierIndex) => {
              const Icon = PLAN_ICONS[tier];
              const colors = PLAN_COLORS[tier];
              const isCurrentPlan = currentSubscription?.tier === tier;
              const isPlanHigher = tierIndex > currentTierIndex;
              const isPopular = tier === 'PLUS';
              const price = currency === 'KRW'
                ? config.priceKRW[billingInterval]
                : config.priceUSD[billingInterval];

              return (
                <div
                  key={tier}
                  className={`relative rounded-xl p-3 lg:p-4 ${colors.bg} ${colors.border} border-2 flex flex-col ${
                    isPopular ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : ''
                  } ${isCurrentPlan ? 'ring-2 ring-green-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
                >
                  {isPopular && !isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        {t.popular}
                      </span>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        {t.currentPlan}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-2 lg:mb-3">
                    <div className={`p-1.5 rounded-lg ${colors.icon}`}>
                      <Icon className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                    </div>
                    <h3 className="text-base lg:text-lg font-bold text-slate-900 dark:text-white">
                      {config.name[locale]}
                    </h3>
                  </div>

                  <div className="mb-3 lg:mb-4">
                    <span className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
                      {formatPrice(price, currency)}
                    </span>
                    {price > 0 && (
                      <span className="text-slate-500 dark:text-slate-400 text-xs">
                        {billingInterval === 'monthly' ? t.perMonth : t.perYear}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-1.5 lg:space-y-2 mb-3 lg:mb-4 flex-1">
                    {config.features[locale].map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-700 dark:text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgrade(tier)}
                    disabled={isCurrentPlan || tier === 'FREE' || processingTier !== null}
                    className={`w-full py-2 lg:py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 min-h-[40px] mt-auto ${
                      isCurrentPlan
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 cursor-default'
                        : processingTier === tier
                        ? 'bg-blue-400 text-white cursor-wait'
                        : tier === 'FREE'
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                        : isPlanHigher
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {processingTier === tier ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t.processing}
                      </>
                    ) : isCurrentPlan ? (
                      t.currentPlan
                    ) : tier === 'FREE' ? (
                      t.basePlan
                    ) : tier === 'BUSINESS' ? (
                      t.contact
                    ) : isPlanHigher ? (
                      t.upgrade
                    ) : (
                      t.downgrade
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-6 lg:mt-8 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.cancelNote}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              {t.creditNote}{' '}
              <a href={`/${locale}/credits/purchase`} className="text-blue-600 hover:underline">
                {t.buyCreditsLink}
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
