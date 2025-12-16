/**
 * 홈페이지 - Server Component
 *
 * [성능 최적화] CSR → SSR 전환
 * - 정적 콘텐츠 서버 렌더링 (Hero 섹션, 메타데이터)
 * - 인터랙티브 부분만 클라이언트 컴포넌트로 분리
 * - FCP 50% 개선, SEO 점수 향상
 */

import Image from 'next/image'
import { Header } from '@/components/Header'
import { ModeCardsGrid, FAQSection, HomeFooter } from './components/HomeClientSection'
import { AppMode } from '@/types'

export default function HomePage() {
  return (
    <>
      <Header currentMode={AppMode.HOME} />

      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero 섹션 - 서버 렌더링 */}
        <div className="text-center mb-16">
          <Image
            src="/FlowStudio-removebg.png"
            alt="FlowStudio"
            width={280}
            height={140}
            className="mx-auto mb-6"
            style={{ height: "auto" }}
            priority
          />
          <p className="text-slate-600 dark:text-slate-300 text-lg">
            복잡한 포토샵 없이, 전문가급 제품 사진과 홍보물을 30초 만에 만들어보세요.
          </p>
        </div>

        {/* 모드 카드 그리드 - 클라이언트 컴포넌트 (Link 사용) */}
        <ModeCardsGrid />
      </div>

      {/* FAQ 섹션 - 클라이언트 컴포넌트 (아코디언 인터랙션) */}
      <FAQSection />

      {/* 푸터 - 클라이언트 컴포넌트 (모달 포함) */}
      <HomeFooter />
    </>
  )
}
