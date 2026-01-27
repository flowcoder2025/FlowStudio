/**
 * Footer Component
 * FlowCoder Brand Kit 기반 푸터
 */

import Link from "next/link";

const BRAND = {
  companyName: "플로우코더(FlowCoder)",
  companyNameEn: "FlowCoder",
  serviceName: "FlowStudio",
  businessNumber: "374-16-02889",
  representatives: "조용현, 박현일",
  address: "경기도 남양주시 홍유릉로248번길 26, 지하1층(금곡동)",
  email: "admin@flow-coder.com",
};

const LEGAL_LINKS = [
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/terms", label: "이용약관" },
  { href: "/refund", label: "환불약관" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

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
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* 구분선 */}
          <div className="border-t border-zinc-200 dark:border-zinc-800" />

          {/* 회사 정보 */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{BRAND.companyName}</span>
              <span className="text-zinc-300 dark:text-zinc-600">|</span>
              <span>사업자등록번호: {BRAND.businessNumber}</span>
              <span className="text-zinc-300 dark:text-zinc-600">|</span>
              <span>대표: {BRAND.representatives}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{BRAND.address}</span>
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
            © {currentYear} {BRAND.companyNameEn}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
