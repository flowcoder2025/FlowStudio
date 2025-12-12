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
} from 'lucide-react'
import { ContactModal } from '@/components/ContactModal'

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
