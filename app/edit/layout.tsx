import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI 이미지 편집',
  description: '기존 이미지를 AI로 수정하고 배경을 바꾸거나 요소를 제거하세요. 텍스트 프롬프트만으로 전문가급 편집이 가능합니다. 배경 제거, 배경 변경, 필터 적용 등 다양한 편집 기능을 제공합니다.',
  keywords: [
    'AI 이미지 편집',
    '제품 사진 편집',
    '배경 제거',
    '배경 변경',
    'AI 사진 보정',
    '이미지 수정',
  ],
  openGraph: {
    title: 'AI 이미지 편집 | FlowStudio',
    description: '기존 이미지를 AI로 수정하고 배경을 바꾸거나 요소를 제거하세요. 프롬프트로 쉬운 편집.',
    url: 'https://studio.flow-coder.com/edit',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI 이미지 편집 | FlowStudio',
    description: '기존 이미지를 AI로 수정하고 배경을 바꾸거나 요소를 제거하세요.',
  },
}

export default function EditLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
