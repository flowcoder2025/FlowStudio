/**
 * Privacy Policy Page
 * 개인정보 처리방침 (i18n 지원)
 */

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-700">
        {title}
      </h2>
      <div className="text-zinc-600 dark:text-zinc-300 space-y-3">{children}</div>
    </section>
  );
}

export default async function PrivacyPolicyPage() {
  const t = await getTranslations("legal");
  const locale = await getLocale();
  const isKorean = locale === "ko";

  // Date format based on locale
  const effectiveDate = isKorean ? "2026년 1월 1일" : "January 1, 2026";
  const lastUpdated = isKorean ? "2026년 1월 9일" : "January 9, 2026";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("back")}
      </Link>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8">
        <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">
          {t("privacy.title")}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">
          {t("effectiveDate")}: {effectiveDate} | {t("lastUpdated")}: {lastUpdated}
        </p>

        <div className="space-y-6">
          <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {t("privacy.intro")}
          </p>

          <Section title={t("privacy.article1.title")}>
            <p>{t("privacy.article1.intro")}</p>
            <ol className="list-decimal pl-6 space-y-2 mt-4">
              <li><strong>{isKorean ? "회원 가입 및 관리" : "Member Registration and Management"}</strong>: {t("privacy.article1.item1").split(": ")[1] || t("privacy.article1.item1")}</li>
              <li><strong>{isKorean ? "서비스 제공" : "Service Provision"}</strong>: {t("privacy.article1.item2").split(": ")[1] || t("privacy.article1.item2")}</li>
              <li><strong>{isKorean ? "마케팅 및 광고" : "Marketing and Advertising"}</strong>: {t("privacy.article1.item3").split(": ")[1] || t("privacy.article1.item3")}</li>
              <li><strong>{isKorean ? "고충처리" : "Grievance Handling"}</strong>: {t("privacy.article1.item4").split(": ")[1] || t("privacy.article1.item4")}</li>
            </ol>
          </Section>

          <Section title={t("privacy.article2.title")}>
            <p>{t("privacy.article2.intro")}</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>{isKorean ? "회원 정보" : "Member Information"}</strong>: {t("privacy.article2.item1").split(": ")[1] || t("privacy.article2.item1")}</li>
              <li><strong>{isKorean ? "생성된 이미지 및 콘텐츠" : "Generated Images and Content"}</strong>: {t("privacy.article2.item2").split(": ")[1] || t("privacy.article2.item2")}</li>
              <li><strong>{isKorean ? "서비스 이용 기록" : "Service Usage Records"}</strong>: {t("privacy.article2.item3").split(": ")[1] || t("privacy.article2.item3")}</li>
              <li><strong>{isKorean ? "결제 기록" : "Payment Records"}</strong>: {t("privacy.article2.item4").split(": ")[1] || t("privacy.article2.item4")}</li>
            </ul>
          </Section>

          <Section title={t("privacy.article3.title")}>
            <p><strong>{t("privacy.article3.required")}</strong></p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              {(t.raw("privacy.article3.requiredItems") as string[]).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <p className="mt-4"><strong>{t("privacy.article3.optional")}</strong></p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              {(t.raw("privacy.article3.optionalItems") as string[]).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <p className="mt-4"><strong>{t("privacy.article3.auto")}</strong></p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              {(t.raw("privacy.article3.autoItems") as string[]).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Section>

          <Section title={t("privacy.article4.title")}>
            <p>{t("privacy.article4.intro")}</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>{t("privacy.article4.item1")}</li>
              <li>{t("privacy.article4.item2")}</li>
            </ul>
            <p className="mt-4"><strong>{t("privacy.article4.thirdParty")}</strong></p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Google LLC (Vertex AI)</strong>: {t("privacy.article4.thirdPartyItem").split(": ")[1] || t("privacy.article4.thirdPartyItem")}</li>
            </ul>
          </Section>

          <Section title={t("privacy.article5.title")}>
            <p>{t("privacy.article5.intro")}</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Vercel Inc.</strong>: {t("privacy.article5.item1").split(": ")[1] || t("privacy.article5.item1")}</li>
              <li><strong>Supabase Inc.</strong>: {t("privacy.article5.item2").split(": ")[1] || t("privacy.article5.item2")}</li>
            </ul>
          </Section>

          <Section title={t("privacy.article6.title")}>
            <p>{t("privacy.article6.intro")}</p>
            <ol className="list-decimal pl-6 space-y-2 mt-4">
              <li>{t("privacy.article6.item1")}</li>
              <li>{t("privacy.article6.item2")}</li>
              <li>{t("privacy.article6.item3")}</li>
              <li>{t("privacy.article6.item4")}</li>
            </ol>
            <p className="mt-4">{t("privacy.article6.outro")}</p>
          </Section>

          <Section title={t("privacy.article7.title")}>
            <p className="bg-primary-50 dark:bg-primary-900/30 p-4 rounded-lg border border-primary-200 dark:border-primary-700">
              {t("privacy.article7.notice")}
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>{t("privacy.article7.item1")}</li>
              <li>{t("privacy.article7.item2")}</li>
              <li>{t("privacy.article7.item3")}</li>
            </ul>
            <p className="mt-4">{t("privacy.article7.outro")}</p>
          </Section>

          <Section title={t("privacy.article8.title")}>
            <p>{t("privacy.article8.intro")}</p>
            <ol className="list-decimal pl-6 space-y-2 mt-4">
              <li><strong>{isKorean ? "관리적 조치" : "Administrative Measures"}</strong>: {t("privacy.article8.item1").split(": ")[1] || t("privacy.article8.item1")}</li>
              <li><strong>{isKorean ? "기술적 조치" : "Technical Measures"}</strong>: {t("privacy.article8.item2").split(": ")[1] || t("privacy.article8.item2")}</li>
              <li><strong>{isKorean ? "물리적 조치" : "Physical Measures"}</strong>: {t("privacy.article8.item3").split(": ")[1] || t("privacy.article8.item3")}</li>
            </ol>
          </Section>

          <Section title={t("privacy.article9.title")}>
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mt-4">
              <p><strong>{t("privacy.article9.officer")}</strong></p>
              <ul className="mt-2 space-y-1">
                <li>{t("privacy.article9.name")}: {t("privacy.article9.nameValue")}</li>
                <li>{t("privacy.article9.position")}: {t("privacy.article9.positionValue")}</li>
                <li>{t("privacy.article9.email")}: admin@flow-coder.com</li>
              </ul>
            </div>
          </Section>

          <Section title={t("privacy.article10.title")}>
            <p>{t("privacy.article10.content")}</p>
          </Section>

          <Section title={t("privacy.article11.title")}>
            <p className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg border border-amber-200 dark:border-amber-700">
              {t("privacy.article11.notice")}
            </p>
            <ol className="list-decimal pl-6 space-y-2 mt-4">
              <li><strong>{isKorean ? "AI 처리를 위한 데이터 전송" : "Data Transfer for AI Processing"}</strong>: {t("privacy.article11.item1").split(": ")[1] || t("privacy.article11.item1")}</li>
              <li><strong>{isKorean ? "데이터 활용 범위" : "Scope of Data Use"}</strong>: {t("privacy.article11.item2").split(": ")[1] || t("privacy.article11.item2")}</li>
              <li><strong>{isKorean ? "AI 생성물 표시 정보" : "AI Output Marking Information"}</strong>: {t("privacy.article11.item3").split(": ")[1] || t("privacy.article11.item3")}
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>{t("privacy.article11.item3Sub1")}</li>
                  <li>{t("privacy.article11.item3Sub2")}</li>
                </ul>
              </li>
              <li><strong>{isKorean ? "비식별 정보" : "Non-identifying Information"}</strong>: {t("privacy.article11.item4").split(": ")[1] || t("privacy.article11.item4")}</li>
            </ol>
          </Section>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mt-6">
            <p className="font-medium">{t("privacy.addendum.title")}</p>
            <ol className="list-decimal pl-6 space-y-2 mt-2">
              <li>{t("privacy.addendum.item1")}</li>
              <li>{t("privacy.addendum.item2")}</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
