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

  return {
    title: metadata.title,
    description: metadata.description,
    icons: {
      icon: "/favicon.ico",
      apple: "/FlowStudio_icon.png",
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: "https://flowstudio.co.kr",
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
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
