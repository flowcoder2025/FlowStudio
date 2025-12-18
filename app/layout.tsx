import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CookieConsent } from "@/components/CookieConsent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FlowStudio - AI 이미지 생성",
    template: "%s | FlowStudio",
  },
  description: "소상공인을 위한 AI 디자인 파트너. 복잡한 포토샵 없이 전문가급 제품 사진, 상세페이지, 포스터를 30초 만에 만들어보세요.",
  keywords: [
    "AI 이미지 생성",
    "AI 디자인",
    "상세페이지 제작",
    "포스터 제작",
    "소상공인 디자인",
    "온라인 쇼핑몰 이미지",
    "제품 사진 편집",
    "이커머스 디자인",
    "AI 마케팅 자료",
  ],
  authors: [{ name: "FlowStudio Team" }],
  creator: "FlowStudio",
  publisher: "FlowStudio",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://studio.flow-coder.com",
    siteName: "FlowStudio",
    title: "FlowStudio - AI 이미지 생성",
    description: "소상공인을 위한 AI 디자인 파트너. 복잡한 포토샵 없이 전문가급 제품 사진, 상세페이지, 포스터를 30초 만에 만들어보세요.",
    images: [
      {
        url: "https://studio.flow-coder.com/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "FlowStudio - AI 이미지 생성",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FlowStudio - AI 이미지 생성",
    description: "소상공인을 위한 AI 디자인 파트너. 복잡한 포토샵 없이 전문가급 제품 사진, 상세페이지, 포스터를 30초 만에 만들어보세요.",
    images: ["https://studio.flow-coder.com/twitter-image.png"],
  },
  verification: {
    google: "YOUR_GOOGLE_VERIFICATION_CODE",
    other: {
      "naver-site-verification": "YOUR_NAVER_VERIFICATION_CODE",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FlowStudio',
    description: '소상공인을 위한 AI 디자인 파트너',
    url: 'https://studio.flow-coder.com',
    logo: 'https://studio.flow-coder.com/FlowStudio_icon-removebg.png',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'flowcoder25@gmail.com',
      contactType: 'Customer Service',
      availableLanguage: 'Korean'
    }
  };

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            {children}
            <CookieConsent />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
