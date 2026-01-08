'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Check, Sparkles, Zap, Crown, Building2, CreditCard, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { AppMode } from '@/types';
import { SUBSCRIPTION_TIERS, CREDIT_PACKAGES, type SubscriptionTier, type BillingInterval } from '@/lib/constants';

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
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    border: 'border-purple-200 dark:border-purple-700',
    icon: 'bg-purple-200 dark:bg-purple-800',
  },
  BUSINESS: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    border: 'border-amber-200 dark:border-amber-700',
    icon: 'bg-amber-200 dark:bg-amber-800',
  },
} as const;

function formatPrice(amount: number, currency: 'KRW' | 'USD'): string {
  if (amount === 0) return currency === 'KRW' ? '무료' : 'Free';
  if (currency === 'KRW') {
    return `₩${amount.toLocaleString()}`;
  }
  return `$${amount}`;
}

export default function PricingPage() {
  const params = useParams();
  const locale = (params.locale as Locale) || 'ko';
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  
  const currency = locale === 'ko' ? 'KRW' : 'USD';
  const tiers = Object.entries(SUBSCRIPTION_TIERS) as [SubscriptionTier, typeof SUBSCRIPTION_TIERS[SubscriptionTier]][];
  const creditPackages = Object.entries(CREDIT_PACKAGES);

  const t = {
    title: locale === 'ko' ? '가격 정책' : 'Pricing',
    subtitle: locale === 'ko' 
      ? '당신의 비즈니스에 맞는 플랜을 선택하세요' 
      : 'Choose the plan that fits your business',
    monthly: locale === 'ko' ? '월간' : 'Monthly',
    yearly: locale === 'ko' ? '연간' : 'Yearly',
    yearlyDiscount: locale === 'ko' ? '2개월 무료' : '2 months free',
    subscriptionTitle: locale === 'ko' ? '구독 플랜' : 'Subscription Plans',
    subscriptionSubtitle: locale === 'ko' 
      ? '더 많은 저장공간과 빠른 처리 속도를 원하시나요?' 
      : 'Need more storage and faster processing?',
    creditsTitle: locale === 'ko' ? '크레딧 패키지' : 'Credit Packages',
    creditsSubtitle: locale === 'ko' 
      ? '필요한 만큼 크레딧을 구매하세요' 
      : 'Buy credits as you need them',
    getStarted: locale === 'ko' ? '시작하기' : 'Get Started',
    currentPlan: locale === 'ko' ? '현재 플랜' : 'Current Plan',
    popular: locale === 'ko' ? '인기' : 'Popular',
    perMonth: locale === 'ko' ? '/월' : '/mo',
    perYear: locale === 'ko' ? '/연' : '/yr',
    credits: locale === 'ko' ? '크레딧' : 'Credits',
    discount: locale === 'ko' ? '할인' : 'off',
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
    },
    faq: {
      title: locale === 'ko' ? '자주 묻는 질문' : 'FAQ',
      items: [
        {
          q: locale === 'ko' ? '구독과 크레딧의 차이점은 무엇인가요?' : 'What\'s the difference between subscription and credits?',
          a: locale === 'ko' 
            ? '구독은 저장공간, 동시 생성 수, 워터마크 제거 등의 혜택을 제공합니다. 크레딧은 실제 이미지 생성에 사용되며, 구독과 별도로 구매할 수 있습니다.' 
            : 'Subscription provides storage, concurrent generation limits, and watermark removal. Credits are used for actual image generation and can be purchased separately.',
        },
        {
          q: locale === 'ko' ? '언제든지 취소할 수 있나요?' : 'Can I cancel anytime?',
          a: locale === 'ko' 
            ? '네, 구독은 언제든지 취소할 수 있습니다. 취소 시 현재 구독 기간이 끝날 때까지 혜택이 유지됩니다.' 
            : 'Yes, you can cancel anytime. Your benefits continue until the end of the current billing period.',
        },
      ],
    },
  };

  return (
    <>
      <Header currentMode={AppMode.HOME} />
      
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 lg:py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 lg:mb-12">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {t.title}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {t.subtitle}
            </p>
          </div>

          <section className="mb-12 lg:mb-16">
            <div className="text-center mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {t.subscriptionTitle}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                {t.subscriptionSubtitle}
              </p>
              
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {tiers.map(([tier, config]) => {
                const Icon = PLAN_ICONS[tier];
                const colors = PLAN_COLORS[tier];
                const price = currency === 'KRW' 
                  ? config.priceKRW[billingInterval] 
                  : config.priceUSD[billingInterval];
                const isPopular = tier === 'PLUS';

                return (
                  <div
                    key={tier}
                    className={`relative rounded-xl p-4 lg:p-6 ${colors.bg} ${colors.border} border-2 flex flex-col ${
                      isPopular ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : ''
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          {t.popular}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${colors.icon}`}>
                        <Icon className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {config.name[locale]}
                      </h3>
                    </div>

                    <div className="mb-4">
                      <span className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                        {formatPrice(price, currency)}
                      </span>
                      {price > 0 && (
                        <span className="text-slate-500 dark:text-slate-400 text-sm">
                          {billingInterval === 'monthly' ? t.perMonth : t.perYear}
                        </span>
                      )}
                    </div>

                    <ul className="space-y-2 mb-6 flex-1">
                      {config.features[locale].map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={tier === 'BUSINESS' ? '/contact' : '/subscription'}
                      className={`w-full py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        tier === 'FREE'
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          : isPopular
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                          : 'bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900'
                      }`}
                    >
                      {t.getStarted}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mb-12 lg:mb-16">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 mb-3">
                <CreditCard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {t.creditsTitle}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {t.creditsSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
              {creditPackages.map(([id, pkg]) => {
                const price = currency === 'KRW' ? pkg.priceKRW : pkg.priceUSD;
                const isPopular = id === 'basic';

                return (
                  <div
                    key={id}
                    className={`relative rounded-xl p-4 border-2 bg-white dark:bg-slate-800 ${
                      isPopular
                        ? 'border-blue-500 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                        <span className="bg-blue-500 text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {t.popular}
                        </span>
                      </div>
                    )}

                    <div className="text-center">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                        {pkg.name[locale]}
                      </h3>
                      <p className="text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {pkg.credits.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        {t.credits}
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
                  </div>
                );
              })}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 lg:p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white mb-3">
                {t.usageGuide.title}
              </h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>{t.usageGuide.generation}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>{t.usageGuide.upscale}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>{t.usageGuide.validity}</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-6">
              {t.faq.title}
            </h2>
            <div className="space-y-4">
              {t.faq.items.map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <h3 className="font-medium text-slate-900 dark:text-white mb-2">{item.q}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
