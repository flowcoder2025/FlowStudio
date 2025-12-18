import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '홍보 포스터 제작',
  description: '제품 사진을 활용하여 홍보용 포스터를 AI로 자동 생성하세요. 전문 디자이너 없이 마케팅 자료를 빠르게 만들 수 있습니다. 할인 이벤트, 신상품 출시, SNS 광고용 포스터를 30초 만에 제작하세요.',
  keywords: [
    '홍보 포스터 제작',
    'AI 포스터 디자인',
    '이벤트 포스터',
    '상품 광고 포스터',
    'SNS 광고 이미지',
    '마케팅 자료',
  ],
  openGraph: {
    title: '홍보 포스터 제작 | FlowStudio',
    description: '제품 사진을 활용하여 홍보용 포스터를 AI로 자동 생성하세요. 30초 만에 마케팅 자료 완성.',
    url: 'https://flowstudio.com/poster',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '홍보 포스터 제작 | FlowStudio',
    description: '제품 사진을 활용하여 홍보용 포스터를 AI로 자동 생성하세요.',
  },
}

export default function PosterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
