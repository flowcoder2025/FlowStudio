import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '구독 플랜',
  description: 'FlowStudio의 구독 플랜을 선택하고 더 많은 저장공간과 빠른 처리 속도를 누리세요. FREE, PLUS, PRO, BUSINESS 플랜을 제공합니다. 워터마크 제거, 우선 처리, API 접근 등 다양한 혜택을 받을 수 있습니다.',
  keywords: [
    'FlowStudio 구독',
    '프리미엄 플랜',
    'AI 디자인 구독',
    '비즈니스 플랜',
    '구독 서비스',
  ],
  openGraph: {
    title: '구독 플랜 | FlowStudio',
    description: 'FlowStudio의 구독 플랜을 선택하고 더 많은 저장공간과 빠른 처리 속도를 누리세요.',
    url: 'https://flowstudio.com/subscription',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '구독 플랜 | FlowStudio',
    description: 'FlowStudio의 구독 플랜을 선택하고 프리미엄 혜택을 누리세요.',
  },
}

export default function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
