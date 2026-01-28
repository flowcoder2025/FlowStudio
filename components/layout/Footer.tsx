/**
 * Footer Component
 * FlowCoder Brand Kit 기반 푸터 (i18n 지원)
 */

import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";

const BRAND = {
  companyNameEn: "FlowCoder",
  serviceName: "FlowStudio",
  businessNumber: "374-16-02889",
  representatives: {
    ko: "조용현, 박현일",
    en: "Yonghyun Cho, Hyunil Park",
  },
  address: {
    ko: "경기도 남양주시 홍유릉로248번길 26, 지하1층(금곡동)",
    en: "B1, 26, Hongyureung-ro 248beon-gil, Namyangju-si, Gyeonggi-do, South Korea",
  },
  email: "admin@flow-coder.com",
};

export async function Footer() {
  const t = await getTranslations("footer");
  const locale = await getLocale();
  const currentYear = new Date().getFullYear();

  // Get localized brand info
  const representatives = BRAND.representatives[locale as keyof typeof BRAND.representatives] || BRAND.representatives.en;
  const address = BRAND.address[locale as keyof typeof BRAND.address] || BRAND.address.en;

  const legalLinks = [
    { href: "/privacy", labelKey: "privacyPolicy" as const },
    { href: "/terms", labelKey: "termsOfService" as const },
    { href: "/refund", labelKey: "refundPolicy" as const },
  ];

  return (
    <footer className="py-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="space-y-4">
          {/* 상단: 서비스명 + 법적 링크 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              {BRAND.serviceName}
            </span>

            {/* 법적 링크 */}
            <nav className="flex items-center gap-4">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  {t(link.labelKey)}
                </Link>
              ))}
            </nav>
          </div>

          {/* 구분선 */}
          <div className="border-t border-zinc-200 dark:border-zinc-800" />

          {/* 회사 정보 */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{t("companyName")}</span>
              <span className="text-zinc-300 dark:text-zinc-600">|</span>
              <span>{t("businessNumber")}: {BRAND.businessNumber}</span>
              <span className="text-zinc-300 dark:text-zinc-600">|</span>
              <span>{t("representatives")}: {representatives}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{address}</span>
              <span className="text-zinc-300 dark:text-zinc-600">|</span>
              <Link
                href={`mailto:${BRAND.email}`}
                className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                {BRAND.email}
              </Link>
            </div>
          </div>

          {/* 저작권 */}
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            © {currentYear} {BRAND.companyNameEn}. {t("allRightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  );
}
