'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { CreditCard, Loader2, Check, Sparkles } from 'lucide-react';
import { PaddleProvider, openPaddleCheckout } from '@/components/PaddleProvider';
import { Header } from '@/components/Header';
import { AppMode } from '@/types';
import { CREDIT_PACKAGES, type CreditPackageId } from '@/lib/constants';

type Locale = 'ko' | 'en';

const PADDLE_CREDIT_PRICE_IDS: Record<CreditPackageId, string | undefined> = {
  starter: process.env.NEXT_PUBLIC_PADDLE_PRICE_CREDITS_STARTER,
  basic: process.env.NEXT_PUBLIC_PADDLE_PRICE_CREDITS_BASIC,
  pro: process.env.NEXT_PUBLIC_PADDLE_PRICE_CREDITS_PRO,
  business: process.env.NEXT_PUBLIC_PADDLE_PRICE_CREDITS_BUSINESS,
};

interface CreditBalance {
  balance: number;
  free: number;
  purchased: number;
  watermarkFree: boolean;
}

function formatPrice(amount: number, currency: 'KRW' | 'USD'): string {
  if (currency === 'KRW') {
    return `₩${amount.toLocaleString()}`;
  }
  return `$${amount}`;
}

export default function CreditPurchasePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as Locale) || 'ko';
  
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPackage, setProcessingPackage] = useState<string | null>(null);

  const currency = locale === 'ko' ? 'KRW' : 'USD';

  const t = {
    title: locale === 'ko' ? '크레딧 충전' : 'Buy Credits',
    subtitle: locale === 'ko'
      ? 'AI 이미지 생성에 필요한 크레딧을 충전하세요'
      : 'Purchase credits for AI image generation',
    currentBalance: locale === 'ko' ? '현재 보유 크레딧' : 'Current Balance',
    creditsUnit: locale === 'ko' ? '크레딧' : 'credits',
    purchased: locale === 'ko' ? '유료' : 'Paid',
    free: locale === 'ko' ? '무료' : 'Free',
    noWatermark: locale === 'ko' ? '워터마크 X' : 'No Watermark',
    hasWatermark: locale === 'ko' ? '워터마크 O' : 'Has Watermark',
    popular: locale === 'ko' ? '인기' : 'Popular',
    discount: locale === 'ko' ? '할인' : 'off',
    buyNow: locale === 'ko' ? '구매하기' : 'Buy Now',
    processing: locale === 'ko' ? '결제 중...' : 'Processing...',
    usageGuide: {
      title: locale === 'ko' ? '크레딧 사용 안내' : 'Credit Usage Guide',
      generation: locale === 'ko' 
        ? '2K 이미지 생성 1회 (4장): 20 크레딧' 
        : '2K Image Generation (4 images): 20 credits',
      upscale: locale === 'ko' 
        ? '업스케일링 1회 (2K→4K, 1장): 10 크레딧' 
        : 'Upscaling (2K→4K, 1 image): 10 credits',
      validity: locale === 'ko' 
        ? '크레딧 충전 후 6개월간 사용 가능' 
        : 'Credits valid for 6 months after purchase',
      support: locale === 'ko' 
        ? '문의: support@flowstudio.com' 
        : 'Support: support@flowstudio.com',
    },
    loginRequired: locale === 'ko' ? '로그인이 필요합니다.' : 'Login required.',
    paymentNotConfigured: locale === 'ko' 
      ? '결제 시스템이 설정되지 않았습니다.'
      : 'Payment system not configured.',
    subscriptionNote: locale === 'ko'
      ? '구독 플랜을 업그레이드하면 더 많은 혜택을 받을 수 있습니다.'
      : 'Upgrade your subscription for more benefits.',
    viewPlans: locale === 'ko' ? '구독 플랜 보기 →' : 'View Plans →',
  };

  const fetchBalance = useCallback(async () => {
    try {
      const response = await fetch('/api/credits/balance');
      if (response.ok) {
        const data = await response.json();
        setCreditBalance(data);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
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

    fetchBalance();
  }, [session, status, router, locale, fetchBalance]);

  const handleCheckoutComplete = useCallback(() => {
    fetchBalance();
  }, [fetchBalance]);

  const handlePurchase = async (packageId: CreditPackageId) => {
    if (!session?.user?.id || !session?.user?.email) {
      alert(t.loginRequired);
      return;
    }

    const priceId = PADDLE_CREDIT_PRICE_IDS[packageId];
    if (!priceId) {
      alert(t.paymentNotConfigured);
      return;
    }

    try {
      setProcessingPackage(packageId);
      
      openPaddleCheckout({
        priceId,
        email: session.user.email,
        userId: session.user.id,
        locale: locale === 'ko' ? 'ko' : 'en',
        successUrl: `${window.location.origin}/${locale}/credits/purchase?success=true`,
      });
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setProcessingPackage(null);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      window.history.replaceState({}, '', `/${locale}/credits/purchase`);
      fetchBalance();
    }
  }, [locale, fetchBalance]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const packages = Object.entries(CREDIT_PACKAGES) as [CreditPackageId, typeof CREDIT_PACKAGES[CreditPackageId]][];

  return (
    <>
      <Header currentMode={AppMode.HOME} />
      <PaddleProvider onCheckoutComplete={handleCheckoutComplete} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
          <div className="max-w-4xl mx-auto px-4 py-10 lg:py-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 mb-4">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              {t.title}
            </h1>
            <p className="text-indigo-100 text-sm lg:text-base max-w-xl mx-auto">
              {t.subtitle}
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6 lg:py-8">

          {creditBalance && (
            <div className="mb-6 lg:mb-8 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-white/80 text-xs mb-1">{t.currentBalance}</p>
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
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 lg:p-6 mb-6">
            <h2 className="text-base lg:text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              {locale === 'ko' ? '크레딧 패키지' : 'Credit Packages'}
            </h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              {packages.map(([id, pkg]) => {
                const price = currency === 'KRW' ? pkg.priceKRW : pkg.priceUSD;
                const isPopular = id === 'basic';
                const isProcessing = processingPackage === id;

                return (
                  <div
                    key={id}
                    className={`relative rounded-xl p-4 border-2 flex flex-col ${
                      isPopular
                        ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                        <span className="bg-blue-500 text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {t.popular}
                        </span>
                      </div>
                    )}

                    <div className="text-center flex-1">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                        {pkg.name[locale]}
                      </h3>
                      <p className="text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {pkg.credits.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        {t.creditsUnit}
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {formatPrice(price, currency)}
                      </p>
                      {pkg.discount > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                          {pkg.discount}% {t.discount}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        {pkg.description[locale]}
                      </p>
                    </div>

                    <button
                      onClick={() => handlePurchase(id)}
                      disabled={isProcessing || processingPackage !== null}
                      className={`w-full mt-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 min-h-[40px] ${
                        isProcessing
                          ? 'bg-blue-400 text-white cursor-wait'
                          : isPopular
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                          : 'bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900'
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t.processing}
                        </>
                      ) : (
                        t.buyNow
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 lg:p-6 mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-3">
              {t.usageGuide.title}
            </h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{t.usageGuide.generation}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{t.usageGuide.upscale}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{t.usageGuide.validity}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>{t.usageGuide.support}</span>
              </li>
            </ul>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              {t.subscriptionNote}
            </p>
            <a
              href={`/${locale}/subscription`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {t.viewPlans}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
