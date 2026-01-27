import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

export const metadata: Metadata = {
  title: "FlowStudio - AI 상품 이미지 생성",
  description: "업종별 맞춤 AI 이미지 생성 플랫폼. 패션, 식품, 뷰티, 인테리어 등 다양한 업종에 최적화된 상품 이미지를 AI로 간편하게 생성하세요.",
  icons: {
    icon: "/favicon.ico",
    apple: "/FlowStudio_icon.png",
  },
  openGraph: {
    title: "FlowStudio - AI 상품 이미지 생성",
    description: "업종별 맞춤 AI 이미지 생성 플랫폼. 패션, 식품, 뷰티, 인테리어 등 다양한 업종에 최적화된 상품 이미지를 AI로 간편하게 생성하세요.",
    url: "https://flowstudio.co.kr",
    siteName: "FlowStudio",
    images: [
      {
        url: "/opengraph-image.png",
        width: 2048,
        height: 2048,
        alt: "FlowStudio - AI 상품 이미지 생성",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlowStudio - AI 상품 이미지 생성",
    description: "업종별 맞춤 AI 이미지 생성 플랫폼",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
