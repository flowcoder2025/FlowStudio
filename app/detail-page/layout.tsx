import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '상세페이지 빌더',
  description: '모바일 최적화된 상세페이지를 AI로 자동 생성하세요. 제품 사진만 있으면 전문가급 상세페이지를 섹션별로 제작할 수 있습니다. 인트로, 설명, 후기 섹션을 순서대로 생성하여 완성도 높은 상세페이지를 만드세요.',
  keywords: [
    '상세페이지 제작',
    'AI 상세페이지',
    '모바일 상세페이지',
    '이커머스 상세페이지',
    '제품 상세페이지',
    '온라인 쇼핑몰',
  ],
  openGraph: {
    title: '상세페이지 빌더 | FlowStudio',
    description: '모바일 최적화된 상세페이지를 AI로 자동 생성하세요. 섹션별 제작으로 완성도 UP.',
    url: 'https://studio.flow-coder.com/detail-page',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '상세페이지 빌더 | FlowStudio',
    description: '모바일 최적화된 상세페이지를 AI로 자동 생성하세요.',
  },
}

export default function DetailPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
