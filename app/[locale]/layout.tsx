/**
 * Locale-specific Layout
 * Wraps all pages with i18n provider and common providers
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import "../globals.css";
import { Providers } from "@/components/providers/Providers";
import { JsonLd } from "@/components/seo/JsonLd";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  const messages = await getMessages();
  const metadata = messages.metadata as Record<string, string>;

  const isKorean = locale === "ko";

  const baseUrl = "https://studio.flow-coder.com";

  return {
    metadataBase: new URL(baseUrl),
    title: metadata.title,
    description: metadata.description,
    icons: {
      icon: "/favicon.ico",
      apple: "/FlowStudio_icon.png",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: locale === "ko" ? baseUrl : `${baseUrl}/en`,
      languages: {
        ko: baseUrl,
        en: `${baseUrl}/en`,
        "x-default": baseUrl,
      },
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: baseUrl,
      siteName: "FlowStudio",
      images: [
        {
          url: "/opengraph-image.png",
          width: 2048,
          height: 2048,
          alt: metadata.title,
        },
      ],
      locale: isKorean ? "ko_KR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      images: ["/opengraph-image.png"],
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as 'ko' | 'en')) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for client components
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <JsonLd />
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
