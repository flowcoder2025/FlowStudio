'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Check, Sparkles, Zap, Crown, Building2, CreditCard, ArrowRight, ChevronDown, HelpCircle } from 'lucide-react';
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
    bg: 'bg-white dark:bg-slate-800',
    border: 'border-slate-200 dark:border-slate-700',
    icon: 'bg-slate-100 dark:bg-slate-700',
    iconText: 'text-slate-600 dark:text-slate-300',
  },
  PLUS: {
    bg: 'bg-white dark:bg-slate-800',
    border: 'border-blue-200 dark:border-blue-700',
    icon: 'bg-blue-100 dark:bg-blue-900/50',
    iconText: 'text-blue-600 dark:text-blue-400',
  },
  PRO: {
    bg: 'bg-white dark:bg-slate-800',
    border: 'border-cyan-200 dark:border-cyan-700',
    icon: 'bg-cyan-100 dark:bg-cyan-900/50',
    iconText: 'text-cyan-600 dark:text-cyan-400',
  },
  BUSINESS: {
    bg: 'bg-white dark:bg-slate-800',
    border: 'border-amber-200 dark:border-amber-700',
    icon: 'bg-amber-100 dark:bg-amber-900/50',
    iconText: 'text-amber-600 dark:text-amber-400',
  },
} as const;

function formatPrice(amount: number, currency: 'KRW' | 'USD'): string {
  if (amount === 0) return currency === 'KRW' ? '무료' : 'Free';
  if (currency === 'KRW') {
    return `₩${amount.toLocaleString()}`;
  }
  return `$${amount}`;
}

function AccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">
          {question}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="pb-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const params = useParams();
  const locale = (params.locale as Locale) || 'ko';
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

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
    buyCredits: locale === 'ko' ? '크레딧 구매' : 'Buy Credits',
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
      subtitle: locale === 'ko' ? '가격 및 결제에 관한 궁금증을 해결하세요' : 'Get answers about pricing and payments',
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
        {
          q: locale === 'ko' ? '크레딧은 만료되나요?' : 'Do credits expire?',
          a: locale === 'ko'
            ? '충전된 크레딧은 6개월간 유효합니다. 만료 전 알림을 드리며, 만료 전에 사용하시기 바랍니다.'
            : 'Purchased credits are valid for 6 months. You will receive a reminder before expiration.',
        },
        {
          q: locale === 'ko' ? '환불은 어떻게 받나요?' : 'How do refunds work?',
          a: locale === 'ko'
            ? '미사용 크레딧에 대해 구매 후 7일 이내에 환불 요청이 가능합니다. 자세한 내용은 환불 정책을 참조해주세요.'
            : 'Unused credits can be refunded within 7 days of purchase. Please refer to our refund policy for details.',
        },
      ],
    },
  };

  return (
    <>
      <Header currentMode={AppMode.HOME} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
          <div className="max-w-6xl mx-auto px-4 py-12 lg:py-16 text-center">
            <h1 className="text-3xl lg:text-4xl font-bold mb-3">
              {t.title}
            </h1>
            <p className="text-indigo-100 text-lg max-w-2xl mx-auto">
              {t.subtitle}
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
          {/* Subscription Plans Section */}
          <section className="mb-12 lg:mb-16">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 mb-4">
                <Crown className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {t.subscriptionTitle}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                {t.subscriptionSubtitle}
              </p>

              {/* Billing Toggle */}
              <div className="inline-flex items-center bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setBillingInterval('monthly')}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                    billingInterval === 'monthly'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t.monthly}
                </button>
                <button
                  onClick={() => setBillingInterval('yearly')}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    billingInterval === 'yearly'
                      ? 'bg-indigo-600 text-white shadow-sm'
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

            {/* Subscription Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
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
                    className={`relative rounded-2xl p-5 lg:p-6 ${colors.bg} ${colors.border} border-2 flex flex-col shadow-sm hover:shadow-lg transition-shadow ${
                      isPopular ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : ''
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold px-4 py-1 rounded-full shadow-md">
                          {t.popular}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2.5 rounded-xl ${colors.icon}`}>
                        <Icon className={`w-5 h-5 ${colors.iconText}`} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {config.name[locale]}
                      </h3>
                    </div>

                    <div className="mb-5">
                      <span className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
                        {formatPrice(price, currency)}
                      </span>
                      {price > 0 && (
                        <span className="text-slate-500 dark:text-slate-400 text-sm ml-1">
                          {billingInterval === 'monthly' ? t.perMonth : t.perYear}
                        </span>
                      )}
                    </div>

                    <ul className="space-y-2.5 mb-6 flex-1">
                      {config.features[locale].map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={tier === 'BUSINESS' ? '/contact' : '/subscription'}
                      className={`w-full py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        tier === 'FREE'
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-default'
                          : isPopular
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg'
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

          {/* Credit Packages Section */}
          <section className="mb-12 lg:mb-16">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                <CreditCard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {t.creditsTitle}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {t.creditsSubtitle}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 lg:p-6 mb-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {creditPackages.map(([id, pkg]) => {
                  const price = currency === 'KRW' ? pkg.priceKRW : pkg.priceUSD;
                  const isPopular = id === 'basic';

                  return (
                    <div
                      key={id}
                      className={`relative rounded-xl p-4 border-2 transition-all hover:shadow-md ${
                        isPopular
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50'
                      }`}
                    >
                      {isPopular && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                          <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-medium px-3 py-0.5 rounded-full shadow-sm">
                            {t.popular}
                          </span>
                        </div>
                      )}

                      <div className="text-center">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                          {pkg.name[locale]}
                        </h3>
                        <p className="text-2xl lg:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
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
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                          {pkg.description[locale]}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Buy Credits CTA */}
              <div className="mt-6 text-center">
                <Link
                  href="/credits/purchase"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  {t.buyCredits}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Usage Guide */}
            <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-5 lg:p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                {t.usageGuide.title}
              </h3>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{t.usageGuide.generation}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{t.usageGuide.upscale}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{t.usageGuide.validity}</span>
                </li>
              </ul>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="max-w-3xl mx-auto mb-12">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 mb-4">
                <HelpCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {t.faq.title}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {t.faq.subtitle}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 px-5 lg:px-6">
              {t.faq.items.map((item, idx) => (
                <AccordionItem
                  key={idx}
                  question={item.q}
                  answer={item.a}
                  isOpen={openFaqIndex === idx}
                  onToggle={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
