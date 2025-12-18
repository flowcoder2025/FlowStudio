import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI 이미지 생성',
  description: '프롬프트와 참조 이미지로 전문가급 제품 사진을 30초 만에 생성하세요. 복잡한 포토샵 없이 AI가 자동으로 디자인합니다. 4장의 고품질 이미지를 한 번에 만들 수 있습니다.',
  keywords: [
    'AI 이미지 생성',
    '제품 사진 생성',
    'AI 제품 촬영',
    '이커머스 이미지',
    '온라인 쇼핑몰 사진',
    'AI 디자인',
  ],
  openGraph: {
    title: 'AI 이미지 생성 | FlowStudio',
    description: '프롬프트와 참조 이미지로 전문가급 제품 사진을 30초 만에 생성하세요. 4장의 고품질 이미지 제작.',
    url: 'https://studio.flow-coder.com/create',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI 이미지 생성 | FlowStudio',
    description: '프롬프트와 참조 이미지로 전문가급 제품 사진을 생성하세요.',
  },
}

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
