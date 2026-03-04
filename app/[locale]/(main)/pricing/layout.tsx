/**
 * Pricing Layout
 * generateMetadata + FAQ JSON-LD for pricing page
 */

import type { Metadata } from "next";
import { getMessages } from "next-intl/server";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

const BASE_URL = "https://studio.flow-coder.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages();
  const pricing = (messages as Record<string, Record<string, Record<string, string>>>).pages?.pricing;

  const title =
    locale === "ko"
      ? "요금제 - FlowStudio AI 이미지 생성"
      : "Pricing - FlowStudio AI Image Generation";
  const description =
    locale === "ko"
      ? "FlowStudio 크레딧 패키지와 구독 플랜을 확인하세요. 무료 체험부터 비즈니스 플랜까지 필요에 맞는 요금제를 선택할 수 있습니다."
      : "Check FlowStudio credit packages and subscription plans. Choose from free trial to business plans that fit your needs.";

  return {
    title,
    description,
    alternates: {
      canonical: locale === "ko" ? `${BASE_URL}/pricing` : `${BASE_URL}/en/pricing`,
      languages: {
        ko: `${BASE_URL}/pricing`,
        en: `${BASE_URL}/en/pricing`,
        "x-default": `${BASE_URL}/pricing`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/pricing`,
    },
  };
}

function FaqJsonLd({ locale }: { locale: string }) {
  const faqItems =
    locale === "ko"
      ? [
          {
            q: "크레딧은 어떻게 사용되나요?",
            a: "이미지 생성 1회(4장)에 20 크레딧, 4K 업스케일링 1장에 10 크레딧이 사용됩니다.",
          },
          {
            q: "크레딧 유효기간은 어떻게 되나요?",
            a: "구독 크레딧은 매월 지급되며 30일간 유효합니다 (이월 불가). 패키지로 구매한 크레딧은 영구 보존됩니다.",
          },
          {
            q: "구독을 취소하면 어떻게 되나요?",
            a: "구독 취소 시 남은 결제 기간까지 서비스를 이용할 수 있습니다. 구독 크레딧은 30일 후 소멸되며, 구매한 크레딧은 영구 보존됩니다.",
          },
          {
            q: "환불 정책은 어떻게 되나요?",
            a: "구매 후 7일 이내, 크레딧을 사용하지 않은 경우 전액 환불이 가능합니다. 자세한 내용은 환불 정책을 확인해 주세요.",
          },
        ]
      : [
          {
            q: "How are credits used?",
            a: "20 credits per image generation (4 images), 10 credits per 4K upscaling.",
          },
          {
            q: "What is the credit expiration policy?",
            a: "Subscription credits are issued monthly and valid for 30 days (non-rollover). Purchased credits never expire.",
          },
          {
            q: "What happens if I cancel my subscription?",
            a: "You can continue using the service until the end of the billing period. Subscription credits expire after 30 days, but purchased credits are preserved.",
          },
          {
            q: "What is the refund policy?",
            a: "Full refund is available within 7 days of purchase if credits have not been used. Please check our refund policy for details.",
          },
        ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function PricingLayout({ children, params }: Props) {
  const { locale } = await params;

  return (
    <>
      <FaqJsonLd locale={locale} />
      {children}
    </>
  );
}
