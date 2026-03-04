/**
 * JSON-LD Structured Data Component
 * Server Component - Organization, SoftwareApplication, WebSite schemas
 */

const BASE_URL = "https://studio.flow-coder.com";

const organizationSchema = {
  "@type": "Organization",
  name: "FlowCoder",
  alternateName: "플로우코더",
  url: BASE_URL,
  logo: `${BASE_URL}/FlowStudio_icon.png`,
  email: "admin@flow-coder.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "홍유릉로248번길 26, 지하1층(금곡동)",
    addressLocality: "남양주시",
    addressRegion: "경기도",
    postalCode: "12207",
    addressCountry: "KR",
  },
  founders: [
    { "@type": "Person", name: "조용현" },
    { "@type": "Person", name: "박현일" },
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "admin@flow-coder.com",
    contactType: "customer service",
    availableLanguage: ["Korean", "English"],
  },
  sameAs: [
    "https://github.com/flowcoder2025",
    "https://about.flow-coder.com",
  ],
};

const softwareApplicationSchema = {
  "@type": "SoftwareApplication",
  name: "FlowStudio",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  description:
    "업종별 맞춤 AI 이미지 생성 플랫폼. 패션, 식품, 뷰티, 인테리어 등 다양한 업종에 최적화된 상품 이미지를 AI로 간편하게 생성하세요.",
  url: BASE_URL,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "KRW",
  },
  creator: {
    "@type": "Organization",
    name: "FlowCoder",
    url: BASE_URL,
  },
};

const webSiteSchema = {
  "@type": "WebSite",
  name: "FlowStudio",
  url: BASE_URL,
  inLanguage: ["ko", "en"],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [organizationSchema, softwareApplicationSchema, webSiteSchema],
};

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
