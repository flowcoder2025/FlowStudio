import Image from 'next/image';
import { setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/Header';
import { ModeCardsGrid, FAQSection, HomeFooter } from '../components/HomeClientSection';
import { AppMode } from '@/types';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header currentMode={AppMode.HOME} />

      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-10">
        <div className="text-center mb-8 lg:mb-10">
          <Image
            src="/FlowStudio-removebg.png"
            alt="FlowStudio"
            width={200}
            height={100}
            className="mx-auto mb-4 animate-hero-logo"
            style={{ height: "auto" }}
            priority
          />
          <p className="text-slate-600 dark:text-slate-300 text-sm lg:text-base animate-hero-text">
            {locale === 'ko' 
              ? '복잡한 포토샵 없이, 전문가급 제품 사진과 홍보물을 30초 만에 만들어보세요.'
              : 'Create professional product photos and marketing materials in 30 seconds—no Photoshop needed.'}
          </p>
        </div>

        <ModeCardsGrid />
      </div>

      <FAQSection />
      <HomeFooter />
    </>
  );
}
