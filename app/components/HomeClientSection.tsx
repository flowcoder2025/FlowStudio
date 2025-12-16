/**
 * 홈페이지 클라이언트 섹션
 *
 * [성능 최적화] 서버 컴포넌트에서 분리된 인터랙티브 부분
 * - 모드 카드 클릭 이벤트
 * - 고객센터 모달
 * - Next.js Link로 클라이언트 사이드 네비게이션
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Layout,
  FilePenLine,
  Wand2,
  ArrowRight,
  Layers,
  Megaphone,
  SlidersHorizontal,
  ChevronDown,
  HelpCircle,
} from 'lucide-react'
import { ContactModal } from '@/components/ContactModal'

// FAQ 데이터 정의
const faqData = [
  {
    question: 'FlowStudio는 어떤 서비스인가요?',
    answer: 'FlowStudio는 AI 기반 이미지 생성 플랫폼입니다. 전문가급 제품 사진, SNS 홍보물, 상세페이지 등을 텍스트 설명만으로 30초 만에 만들 수 있습니다. 포토샵이나 디자인 기술 없이도 누구나 쉽게 사용할 수 있습니다.',
  },
  {
    question: '이미지 생성은 어떻게 하나요?',
    answer: '원하는 이미지를 텍스트로 설명하거나, 참조 이미지를 업로드하면 AI가 자동으로 4장의 이미지를 생성합니다. 생성된 이미지 중 마음에 드는 것을 선택하여 저장하거나, 추가 편집을 진행할 수 있습니다.',
  },
  {
    question: '크레딧은 어떻게 사용되나요?',
    answer: '이미지 생성 시 20크레딧, 4K 업스케일 시 10크레딧이 차감됩니다. 신규 가입 시 무료 크레딧이 제공되며, 크레딧 구매 페이지에서 추가 구매가 가능합니다. 친구 초대 시 추가 크레딧을 받을 수 있습니다.',
  },
  {
    question: '생성된 이미지의 해상도는 얼마인가요?',
    answer: '기본적으로 2K(2048px) 해상도로 생성됩니다. 더 높은 품질이 필요한 경우 4K(4096px) 업스케일 기능을 이용하실 수 있습니다. 상업용 인쇄물에도 충분한 품질을 제공합니다.',
  },
  {
    question: '생성된 이미지의 저작권은 누구에게 있나요?',
    answer: '생성된 이미지의 저작권은 사용자에게 귀속됩니다. 상업적 용도(쇼핑몰, 광고, SNS 등)로 자유롭게 사용하실 수 있습니다. 단, AI 생성 이미지 관련 법률은 국가별로 다를 수 있으니 해외 사용 시 확인을 권장합니다.',
  },
  {
    question: '환불은 어떻게 받을 수 있나요?',
    answer: '미사용 크레딧에 대해 환불이 가능합니다. 결제일로부터 7일 이내에 고객센터로 문의해 주세요. 자세한 내용은 하단의 환불약관을 참조해 주세요.',
  },
]

// 모드 카드 데이터 정의
const modeCards = [
  {
    href: '/create',
    title: '이미지 생성',
    description: '제품 사진이나 컨셉만으로 SNS 홍보물, 메뉴판, 포스터용 이미지를 생성합니다.',
    icon: Sparkles,
    colors: {
      bg: 'bg-indigo-100 dark:bg-indigo-900/30',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'hover:border-indigo-200 dark:hover:border-indigo-500',
    },
    cta: '시작하기',
  },
  {
    href: '/edit',
    title: '이미지 편집',
    description: '"레트로 필터 씌워줘", "배경에 사람 지워줘" 등 말 한마디로 사진을 전체 수정합니다.',
    icon: Wand2,
    colors: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'hover:border-emerald-200 dark:hover:border-emerald-500',
    },
    cta: '편집하기',
  },
  {
    href: '/detail-page',
    title: '상세페이지 제작',
    description: '모바일 최적화된 긴 상세페이지를 섹션별로 나누어 생성하고 연결합니다.',
    icon: Layout,
    colors: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'hover:border-blue-200 dark:hover:border-blue-500',
    },
    cta: '제작하기',
  },
  {
    href: '/detail-edit',
    title: '상세페이지 편집',
    description: '기존 상세페이지의 특정 부분을 선택하여 텍스트를 수정하거나 이미지를 교체합니다.',
    icon: FilePenLine,
    colors: {
      bg: 'bg-violet-100 dark:bg-violet-900/30',
      text: 'text-violet-600 dark:text-violet-400',
      border: 'hover:border-violet-200 dark:hover:border-violet-500',
    },
    cta: '편집하기',
  },
  {
    href: '/composite',
    title: '연출',
    description: '여러 제품 이미지를 합성하여 자연스러운 연출샷을 만들어냅니다.',
    icon: Layers,
    colors: {
      bg: 'bg-cyan-100 dark:bg-cyan-900/30',
      text: 'text-cyan-600 dark:text-cyan-400',
      border: 'hover:border-cyan-200 dark:hover:border-cyan-500',
    },
    cta: '연출하기',
  },
  {
    href: '/poster',
    title: '포스터',
    description: '로고와 제품 이미지로 SNS 홍보물, 이벤트 배너를 제작합니다.',
    icon: Megaphone,
    colors: {
      bg: 'bg-rose-100 dark:bg-rose-900/30',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'hover:border-rose-200 dark:hover:border-rose-500',
    },
    cta: '제작하기',
  },
  {
    href: '/color-correction',
    title: '색감 보정',
    description: '필터와 색상 조절로 사진의 분위기를 바꿔보세요. AI 없이 실시간 편집.',
    icon: SlidersHorizontal,
    colors: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'hover:border-amber-200 dark:hover:border-amber-500',
    },
    cta: '보정하기',
  },
]

export function ModeCardsGrid() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {modeCards.map((card) => {
        const IconComponent = card.icon
        return (
          <Link
            key={card.href}
            href={card.href}
            className={`group bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-xl ${card.colors.border} transition-all min-h-[200px] block`}
          >
            <div
              className={`${card.colors.bg} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
            >
              <IconComponent className={`w-6 h-6 ${card.colors.text}`} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              {card.title}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-3 text-xs h-10">
              {card.description}
            </p>
            <div className={`flex items-center ${card.colors.text} font-medium text-xs`}>
              {card.cta} <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// 아코디언 아이템 컴포넌트
function AccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
  index,
}: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
  index: number
}) {
  const contentId = `faq-content-${index}`
  const buttonId = `faq-button-${index}`

  return (
    <div className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
      <button
        id={buttonId}
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 px-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-lg -mx-4 sm:mx-0 sm:rounded-none"
      >
        <span className="font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-base">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        id={contentId}
        role="region"
        aria-labelledby={buttonId}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="pb-5 px-4 sm:px-0 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  )
}

// FAQ 섹션 컴포넌트
export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="max-w-3xl mx-auto px-4 py-16">
      {/* 섹션 헤더 */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 mb-4">
          <HelpCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          자주 묻는 질문
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          FlowStudio 이용에 궁금한 점이 있으신가요?
        </p>
      </div>

      {/* 아코디언 리스트 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 px-4 sm:px-6">
        {faqData.map((item, index) => (
          <AccordionItem
            key={index}
            question={item.question}
            answer={item.answer}
            isOpen={openIndex === index}
            onToggle={() => handleToggle(index)}
            index={index}
          />
        ))}
      </div>
    </section>
  )
}

export function HomeFooter() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  return (
    <>
      <footer className="bg-slate-100 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-sm text-slate-500 dark:text-slate-400 space-y-2">
            <p className="font-medium text-slate-600 dark:text-slate-300">
              © 2025 FlowCoder. All rights reserved.
            </p>
            <p>주식회사 테크트리아이엔씨 (636-81-00865) | 통신판매번호: 2021-대구중구-0666</p>
            <p>박현일 | 대구광역시 중구 동덕로 115, 9층 902호 내 512(삼덕동2가)</p>
            <p>
              문의 사항이 있으신가요?{' '}
              <a
                href="mailto:flowcoder25@gmail.com"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                flowcoder25@gmail.com
              </a>
              로 연락해주세요
            </p>
            <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
              <Link href="/privacy" className="hover:text-slate-700 dark:hover:text-slate-300 hover:underline">
                개인정보 처리방침
              </Link>
              <span>/</span>
              <Link href="/terms" className="hover:text-slate-700 dark:hover:text-slate-300 hover:underline">
                서비스 이용약관
              </Link>
              <span>/</span>
              <Link href="/refund" className="hover:text-slate-700 dark:hover:text-slate-300 hover:underline">
                환불약관
              </Link>
              <span>/</span>
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="hover:text-slate-700 dark:hover:text-slate-300 hover:underline"
              >
                고객센터
              </button>
            </div>
          </div>
        </div>
      </footer>

      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </>
  )
}
