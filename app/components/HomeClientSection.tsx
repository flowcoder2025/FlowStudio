/**
 * 홈페이지 클라이언트 섹션
 *
 * [성능 최적화] 서버 컴포넌트에서 분리된 인터랙티브 부분
 * - 모드 카드 클릭 이벤트
 * - 고객센터 모달
 * - Next.js Link로 클라이언트 사이드 네비게이션
 * - 모드 카드 호버 시 비포/애프터 예시 툴팁
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
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
  CreditCard,
} from 'lucide-react'

const ContactModal = dynamic(() => import('@/components/ContactModal').then(mod => mod.ContactModal))

function FloatingOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="floating-orb floating-orb-1 top-[10%] left-[5%]" />
      <div className="floating-orb floating-orb-2 top-[60%] right-[10%]" />
      <div className="floating-orb floating-orb-3 top-[30%] right-[25%]" />
    </div>
  )
}

function useIntersectionObserver(options?: IntersectionObserverInit) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, ...options }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [options])

  return { ref, isVisible }
}

const modeCardConfigs = [
  {
    href: '/create',
    key: 'create',
    icon: Sparkles,
    colors: {
      bg: 'bg-indigo-100 dark:bg-indigo-900/30',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'hover:border-indigo-200 dark:hover:border-indigo-500',
    },
    beforeColor: 'bg-slate-200',
    afterColor: 'bg-indigo-200',
  },
  {
    href: '/edit',
    key: 'edit',
    icon: Wand2,
    colors: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'hover:border-emerald-200 dark:hover:border-emerald-500',
    },
    beforeColor: 'bg-slate-200',
    afterColor: 'bg-emerald-200',
  },
  {
    href: '/detail-page',
    key: 'detailPage',
    icon: Layout,
    colors: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'hover:border-blue-200 dark:hover:border-blue-500',
    },
    beforeColor: 'bg-slate-200',
    afterColor: 'bg-blue-200',
  },
  {
    href: '/detail-edit',
    key: 'detailEdit',
    icon: FilePenLine,
    colors: {
      bg: 'bg-violet-100 dark:bg-violet-900/30',
      text: 'text-violet-600 dark:text-violet-400',
      border: 'hover:border-violet-200 dark:hover:border-violet-500',
    },
    beforeColor: 'bg-slate-200',
    afterColor: 'bg-violet-200',
  },
  {
    href: '/composite',
    key: 'composite',
    icon: Layers,
    colors: {
      bg: 'bg-cyan-100 dark:bg-cyan-900/30',
      text: 'text-cyan-600 dark:text-cyan-400',
      border: 'hover:border-cyan-200 dark:hover:border-cyan-500',
    },
    beforeColor: 'bg-slate-200',
    afterColor: 'bg-cyan-200',
  },
  {
    href: '/poster',
    key: 'poster',
    icon: Megaphone,
    colors: {
      bg: 'bg-rose-100 dark:bg-rose-900/30',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'hover:border-rose-200 dark:hover:border-rose-500',
    },
    beforeColor: 'bg-slate-200',
    afterColor: 'bg-rose-200',
  },
  {
    href: '/color-correction',
    key: 'colorCorrection',
    icon: SlidersHorizontal,
    colors: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'hover:border-amber-200 dark:hover:border-amber-500',
    },
    beforeColor: 'bg-slate-200',
    afterColor: 'bg-amber-200',
  },
]

// 비포/애프터 툴팁 컴포넌트
interface TooltipPosition {
  x: number
  y: number
}

interface BeforeAfterTooltipProps {
  isVisible: boolean
  position: TooltipPosition
  beforeLabel: string
  afterLabel: string
  beforeColor: string
  afterColor: string
  title: string
  promptExample: string
  tooltipLabels: {
    example: string
    prompt: string
    original: string
  }
}

function BeforeAfterTooltip({
  isVisible,
  position,
  beforeLabel,
  afterLabel,
  beforeColor,
  afterColor,
  title,
  promptExample,
  tooltipLabels,
}: BeforeAfterTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)

  useEffect(() => {
    if (!isVisible || !tooltipRef.current) return

    const tooltip = tooltipRef.current

    const rafId = requestAnimationFrame(() => {
      const rect = tooltip.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let newX = position.x + 20
      let newY = position.y + 10

      if (newX + rect.width > viewportWidth - 20) {
        newX = position.x - rect.width - 20
      }

      if (newY + rect.height > viewportHeight - 20) {
        newY = position.y - rect.height - 10
      }

      if (newY < 20) {
        newY = 20
      }

      if (newX < 20) {
        newX = 20
      }

      setAdjustedPosition({ x: newX, y: newY })
    })

    return () => cancelAnimationFrame(rafId)
  }, [position, isVisible])

  if (!isVisible) return null

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 pointer-events-none"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 animate-in fade-in zoom-in-95 duration-200 max-w-xs">
        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-2 text-center">
          {title} {tooltipLabels.example}
        </div>

        <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg px-3 py-2 mb-3">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">{tooltipLabels.prompt}</div>
          <div className="text-[11px] text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
            {promptExample}
          </div>
        </div>

        <div className="flex items-center gap-3 justify-center">
          <div className="flex flex-col items-center">
            <div className={`w-20 h-20 ${beforeColor} dark:opacity-80 rounded-lg flex items-center justify-center relative overflow-hidden`}>
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-2 border-2 border-dashed border-slate-400 rounded" />
              </div>
              <span className="text-slate-500 text-[10px] font-medium z-10">{tooltipLabels.original}</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              {beforeLabel}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex flex-col items-center">
            <div className={`w-20 h-20 ${afterColor} dark:opacity-80 rounded-lg flex items-center justify-center relative overflow-hidden`}>
              <div className="absolute inset-0 opacity-40">
                <div className="absolute inset-1 bg-gradient-to-br from-white/50 to-transparent rounded" />
              </div>
              <Sparkles className="w-5 h-5 text-slate-600/60 z-10" />
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              {afterLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ModeCardsGrid() {
  const t = useTranslations('home')
  const tTooltip = useTranslations('home.tooltip')
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [mousePosition, setMousePosition] = useState<TooltipPosition>({ x: 0, y: 0 })
  const gridRef = useRef<HTMLDivElement>(null)

  const lastMoveTime = useRef(0)
  const handleMouseMove = useCallback((e: React.MouseEvent, index: number) => {
    const now = Date.now()
    if (now - lastMoveTime.current < 16) return
    lastMoveTime.current = now

    setMousePosition({ x: e.clientX, y: e.clientY })
    if (hoveredCard !== index) {
      setHoveredCard(index)
    }
  }, [hoveredCard])

  const handleMouseEnter = useCallback((e: React.MouseEvent, index: number) => {
    setMousePosition({ x: e.clientX, y: e.clientY })
    setHoveredCard(index)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredCard(null)
  }, [])

  const currentCard = hoveredCard !== null ? modeCardConfigs[hoveredCard] : null

  return (
    <>
      <FloatingOrbs />
      <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
        {modeCardConfigs.map((card, index) => {
          const IconComponent = card.icon
          return (
            <Link
              key={card.href}
              href={card.href}
              className={`group bg-white dark:bg-slate-800 p-3 lg:p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg ${card.colors.border} transition-all block card-hover-glow animate-card-entrance animate-delay-${index}`}
              onMouseEnter={(e) => handleMouseEnter(e, index)}
              onMouseMove={(e) => handleMouseMove(e, index)}
              onMouseLeave={handleMouseLeave}
            >
              <div
                className={`${card.colors.bg} w-9 h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center mb-2 lg:mb-3 group-hover:scale-110 transition-transform`}
              >
                <IconComponent className={`w-4 h-4 lg:w-5 lg:h-5 ${card.colors.text}`} />
              </div>
              <h3 className="text-sm lg:text-base font-bold text-slate-900 dark:text-slate-100 mb-0.5">
                {t(`modes.${card.key}.title`)}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-2 text-[11px] lg:text-xs line-clamp-2">
                {t(`modes.${card.key}.description`)}
              </p>
              <div className={`flex items-center ${card.colors.text} font-medium text-[11px] lg:text-xs`}>
                {t(`modes.${card.key}.cta`)} <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </Link>
          )
        })}
      </div>

      {currentCard && (
        <BeforeAfterTooltip
          isVisible={hoveredCard !== null}
          position={mousePosition}
          beforeLabel={t(`modes.${currentCard.key}.beforeLabel`)}
          afterLabel={t(`modes.${currentCard.key}.afterLabel`)}
          beforeColor={currentCard.beforeColor}
          afterColor={currentCard.afterColor}
          title={t(`modes.${currentCard.key}.title`)}
          promptExample={t(`modes.${currentCard.key}.promptExample`)}
          tooltipLabels={{ example: tTooltip('example'), prompt: tTooltip('prompt'), original: tTooltip('original') }}
        />
      )}
    </>
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
        className="w-full flex items-center justify-between gap-3 py-3 px-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-lg -mx-3 sm:mx-0 sm:rounded-none"
      >
        <span className="font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
          {question}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0 transition-transform duration-300 ${
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
        <p className="pb-3 px-3 sm:px-0 text-slate-600 dark:text-slate-300 text-xs lg:text-sm leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  )
}

export function PricingCTASection() {
  const t = useTranslations('home.pricingCta')
  const { ref, isVisible } = useIntersectionObserver()

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`max-w-4xl mx-auto px-4 py-8 lg:py-10 animate-on-scroll ${isVisible ? 'is-visible' : ''}`}
    >
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 lg:p-8 text-center text-white shadow-lg">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 mb-4">
          <CreditCard className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl lg:text-2xl font-bold mb-2">
          {t('title')}
        </h2>
        <p className="text-indigo-100 text-sm lg:text-base mb-5 max-w-xl mx-auto">
          {t('subtitle')}
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all shadow-md hover:shadow-lg"
        >
          {t('button')}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}

export function FAQSection() {
  const t = useTranslations('home.faq')
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const { ref, isVisible } = useIntersectionObserver()

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  const faqItems = t.raw('items') as Array<{ question: string; answer: string }>

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      className={`max-w-3xl mx-auto px-4 py-8 lg:py-10 animate-on-scroll ${isVisible ? 'is-visible' : ''}`}
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 mb-3">
          <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-lg lg:text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
          {t('title')}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs lg:text-sm">
          {t('subtitle')}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 px-3 sm:px-4">
        {faqItems.map((item, index) => (
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
  const t = useTranslations('home.footer')
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  return (
    <>
      <footer className="bg-slate-100 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p className="font-medium text-slate-600 dark:text-slate-300">
              {t('copyright')}
            </p>
            <p>{t('company')}</p>
            <p>{t('representative')}</p>
            <p>
              {t('contact')}:{' '}
              <a
                href="mailto:admin@flow-coder.com"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                admin@flow-coder.com
              </a>
            </p>
            <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
              <Link href="/pricing" className="hover:text-slate-700 dark:hover:text-slate-300 hover:underline">
                {t('pricing')}
              </Link>
              <span>/</span>
              <Link href="/privacy" className="hover:text-slate-700 dark:hover:text-slate-300 hover:underline">
                {t('privacyPolicy')}
              </Link>
              <span>/</span>
              <Link href="/terms" className="hover:text-slate-700 dark:hover:text-slate-300 hover:underline">
                {t('termsOfService')}
              </Link>
              <span>/</span>
              <Link href="/refund" className="hover:text-slate-700 dark:hover:text-slate-300 hover:underline">
                {t('refundPolicy')}
              </Link>
              <span>/</span>
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="hover:text-slate-700 dark:hover:text-slate-300 hover:underline"
              >
                {t('customerService')}
              </button>
            </div>
          </div>
        </div>
      </footer>

      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </>
  )
}
