'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

export default function RefundPolicyPage() {
  const router = useRouter()
  const locale = useLocale()
  const isKorean = locale === 'ko'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {isKorean ? '뒤로가기' : 'Back'}
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            {isKorean ? 'FlowStudio 환불 약관' : 'FlowStudio Refund Policy'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            {isKorean
              ? '시행일: 2026년 1월 1일 | 최종 업데이트: 2026년 1월 9일'
              : 'Effective: January 1, 2026 | Last Updated: January 9, 2026'}
          </p>

          <div className="space-y-6">
            {isKorean ? <KoreanContent /> : <EnglishContent />}
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
        {title}
      </h2>
      <div className="text-slate-600 dark:text-slate-300 space-y-3">
        {children}
      </div>
    </section>
  )
}

function KoreanContent() {
  return (
    <>
      <Section title="제1조 (목적)">
        <p>
          본 약관은 플로우코더(FlowCoder)(이하 &quot;회사&quot;)가 제공하는 FlowStudio 서비스(이하 &quot;서비스&quot;)의
          크레딧 구매에 대한 청약철회, 환불 및 제반 절차와 기준을 규정함을 목적으로 합니다.
        </p>
      </Section>

      <Section title="제2조 (용어의 정의)">
        <ol className="list-decimal pl-6 space-y-2">
          <li><strong>&quot;디지털 콘텐츠&quot;</strong>란 서비스를 통해 생성된 이미지 등 디지털 형태의 저작물을 말합니다.</li>
          <li><strong>&quot;크레딧&quot;</strong>이란 서비스 내에서 이미지 생성에 사용되는 가상의 재화를 말합니다.</li>
          <li><strong>&quot;청약철회&quot;</strong>란 구매 의사표시를 철회하여 계약을 해제하는 것을 말합니다.</li>
        </ol>
      </Section>

      <Section title="제3조 (청약철회의 기본원칙)">
        <ol className="list-decimal pl-6 space-y-2">
          <li>이용자는 크레딧을 구매한 날로부터 <strong>7일 이내</strong>에 청약을 철회할 수 있습니다.</li>
          <li>단, 구매한 크레딧을 일부라도 사용한 경우에는 청약철회가 제한됩니다.</li>
          <li>회사의 귀책사유로 서비스 이용이 불가능한 경우에는 전액 환불이 가능합니다.</li>
        </ol>
      </Section>

      <Section title="제4조 (청약철회의 제한)">
        <p>다음 각 호에 해당하는 경우에는 청약철회가 제한됩니다:</p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li>구매한 크레딧을 일부라도 사용한 경우</li>
          <li>보너스로 지급받은 무료 크레딧의 경우</li>
          <li>이벤트나 프로모션으로 할인 구매한 크레딧을 사용한 경우</li>
          <li>제3자에게 크레딧을 양도하거나 선물한 경우</li>
          <li>이용약관 위반으로 계정이 제한된 경우</li>
        </ul>
      </Section>

      <Section title="제5조 (청약철회의 효과)">
        <ol className="list-decimal pl-6 space-y-2">
          <li>회사는 이용자로부터 환불 요청을 받은 날로부터 <strong>3영업일 이내</strong>에 대금의 환급을 처리합니다.</li>
          <li>회사가 환급을 지연한 경우에는 그 지연기간에 대하여 연 15%의 지연이자를 지급합니다.</li>
          <li>환급은 원칙적으로 이용자가 결제 시 사용한 동일한 결제 수단으로 진행됩니다.</li>
        </ol>
      </Section>

      <Section title="제6조 (환불 절차)">
        <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
          <p className="font-medium mb-2">환불 신청 방법</p>
          <p>이메일: flowcoder25@gmail.com</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">운영시간: 평일 10:00 - 18:00 (주말 및 공휴일 제외)</p>
        </div>
        <p className="mt-4">환불 신청 시 다음 정보가 필요합니다:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>회원 이메일 주소</li>
          <li>결제일시 및 결제금액</li>
          <li>환불 사유</li>
          <li>환불받을 계좌 정보 (계좌이체의 경우)</li>
        </ul>
        <p className="mt-4">환불 처리 기간:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>신용카드: 3~7영업일 (카드사에 따라 상이)</li>
          <li>계좌이체: 3영업일 이내</li>
          <li>간편결제: 결제 수단에 따라 상이</li>
        </ul>
      </Section>

      <Section title="제7조 (환불 불가 사유)">
        <p>다음 각 호에 해당하는 경우에는 환불이 불가능합니다:</p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li>구매한 크레딧을 이미 사용한 경우</li>
          <li>무료로 지급받은 보너스 크레딧</li>
          <li>이벤트, 프로모션 등으로 지급받은 특별 크레딧</li>
          <li>제3자에게 양도 또는 선물한 크레딧</li>
          <li>서비스 이용약관 위반으로 계정이 정지된 경우</li>
          <li>청약철회 기간(7일)이 경과한 경우</li>
          <li>AI 생성물의 기술적 특성상 결과물이 이용자의 기대와 상이한 경우 (AI 기술의 고유한 한계로 인한 차이는 환불 사유가 되지 않습니다)</li>
        </ul>
      </Section>

      <Section title="제8조 (부분 환불)">
        <ol className="list-decimal pl-6 space-y-2">
          <li>구독 서비스의 경우, 이용 기간에 따라 일할 계산하여 부분 환불이 가능합니다.</li>
          <li>부분 환불 금액 = 결제금액 × (잔여일수 / 전체 이용일수)</li>
          <li>단, 이용 기간 중 받은 보너스 크레딧은 환불 금액에서 차감됩니다.</li>
        </ol>
      </Section>

      <Section title="제9조 (과오금의 환급)">
        <ol className="list-decimal pl-6 space-y-2">
          <li>회사의 착오로 과오금이 발생한 경우 회사는 즉시 환급합니다.</li>
          <li>이용자의 착오로 과오금이 발생한 경우 환급에 소요되는 비용은 이용자가 부담할 수 있습니다.</li>
        </ol>
      </Section>

      <Section title="제10조 (서비스 장애 시 구제)">
        <ol className="list-decimal pl-6 space-y-2">
          <li>회사의 귀책사유로 24시간 이상 서비스가 중단된 경우, 해당 기간만큼 이용 기간을 연장하거나 그에 상응하는 크레딧을 보상합니다.</li>
          <li>서비스 장애로 인해 이용자가 입은 손해에 대해서는 회사의 고의 또는 중과실이 있는 경우에 한하여 배상합니다.</li>
        </ol>
      </Section>

      <Section title="제11조 (분쟁 해결)">
        <ol className="list-decimal pl-6 space-y-2">
          <li>회사와 이용자 간에 발생한 환불 관련 분쟁은 상호 협의하여 원만하게 해결하는 것을 원칙으로 합니다.</li>
          <li>분쟁이 해결되지 않을 경우 한국소비자원에 조정을 신청할 수 있습니다.</li>
          <li>소송이 필요한 경우 대한민국 의정부지방법원을 전속 관할법원으로 합니다.</li>
        </ol>
      </Section>

      <Section title="제12조 (준거법)">
        <p>본 약관의 해석 및 적용에 관하여는 대한민국 법령이 적용됩니다.</p>
      </Section>

      <Section title="제13조 (약관의 개정)">
        <ol className="list-decimal pl-6 space-y-2">
          <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</li>
          <li>약관이 변경되는 경우 회사는 변경 약관의 적용일자 및 변경사유를 명시하여 적용일 7일 전부터 공지합니다.</li>
          <li>이용자에게 불리한 약관의 변경인 경우에는 30일 전부터 공지합니다.</li>
        </ol>
      </Section>

      <Section title="제14조 (AI 생성물의 특성에 대한 이해)">
        <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg border border-amber-200 dark:border-amber-700">
          <p className="font-medium text-amber-800 dark:text-amber-200">AI 서비스 이용에 관한 중요 안내</p>
          <p className="mt-2 text-amber-700 dark:text-amber-300 text-sm">
            본 서비스는 인공지능 기술을 기반으로 하며, 「인공지능 발전과 신뢰 기반 조성 등에 관한 기본법」의 적용을 받습니다.
          </p>
        </div>
        <ol className="list-decimal pl-6 space-y-2 mt-4">
          <li>이용자는 본 서비스가 인공지능 기술을 기반으로 한다는 점을 이해하고 다음 사항에 동의합니다:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>AI 생성물의 품질, 정확성, 적합성은 기술적 한계로 인해 보장되지 않습니다</li>
              <li>동일한 프롬프트라도 생성 결과가 매번 다를 수 있습니다</li>
              <li>AI 모델의 특성상 의도치 않은 결과물이 생성될 수 있습니다</li>
            </ul>
          </li>
          <li>위 1항의 사유로 인한 결과물 불만족은 청약철회 또는 환불 사유에 해당하지 않습니다.</li>
          <li>단, 서비스의 기술적 오류로 인해 이미지가 전혀 생성되지 않는 경우에는 해당 크레딧을 환불 또는 복구해 드립니다.</li>
        </ol>
      </Section>

      <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg border border-indigo-200 dark:border-indigo-700 mt-8">
        <p className="font-medium text-indigo-800 dark:text-indigo-200">문의처</p>
        <p className="mt-2 text-indigo-700 dark:text-indigo-300">
          환불 관련 문의: <a href="mailto:flowcoder25@gmail.com" className="underline">flowcoder25@gmail.com</a>
        </p>
        <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
          운영시간: 평일 10:00 - 18:00 (주말 및 공휴일 제외)
        </p>
      </div>

      <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg mt-6">
        <p className="font-medium">부칙</p>
        <ol className="list-decimal pl-6 space-y-2 mt-2">
          <li>본 약관은 2026년 1월 1일부터 시행됩니다.</li>
          <li>제14조(AI 생성물의 특성에 대한 이해)의 규정 중 「인공지능 발전과 신뢰 기반 조성 등에 관한 기본법」에 따른 사항은 해당 법률 시행일인 2026년 1월 22일부터 효력이 발생합니다.</li>
        </ol>
      </div>
    </>
  )
}

function EnglishContent() {
  return (
    <>
      <Section title="Article 1 (Purpose)">
        <p>
          This policy establishes the procedures and standards for withdrawal, refund, and related processes
          for credit purchases in the FlowStudio service (&quot;Service&quot;) provided by FlowCoder (&quot;Company&quot;).
        </p>
      </Section>

      <Section title="Article 2 (Definitions)">
        <ol className="list-decimal pl-6 space-y-2">
          <li><strong>&quot;Digital Content&quot;</strong> means digital works such as images generated through the Service.</li>
          <li><strong>&quot;Credits&quot;</strong> means virtual currency used for image generation within the Service.</li>
          <li><strong>&quot;Withdrawal&quot;</strong> means canceling a purchase intention to terminate the contract.</li>
        </ol>
      </Section>

      <Section title="Article 3 (Basic Principles of Withdrawal)">
        <ol className="list-decimal pl-6 space-y-2">
          <li>Users may withdraw from a purchase within <strong>7 days</strong> of purchasing credits.</li>
          <li>However, withdrawal is restricted if any purchased credits have been used.</li>
          <li>Full refund is available if service use is impossible due to Company fault.</li>
        </ol>
      </Section>

      <Section title="Article 4 (Withdrawal Restrictions)">
        <p>Withdrawal is restricted in the following cases:</p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li>If any purchased credits have been used</li>
          <li>For free bonus credits</li>
          <li>If credits purchased at a discount through events or promotions have been used</li>
          <li>If credits have been transferred or gifted to third parties</li>
          <li>If the account has been restricted for Terms of Service violations</li>
        </ul>
      </Section>

      <Section title="Article 5 (Effect of Withdrawal)">
        <ol className="list-decimal pl-6 space-y-2">
          <li>The Company will process refunds within <strong>3 business days</strong> from receiving the refund request.</li>
          <li>If the Company delays the refund, it will pay interest at an annual rate of 15% for the delay period.</li>
          <li>Refunds will, in principle, be processed using the same payment method used at purchase.</li>
        </ol>
      </Section>

      <Section title="Article 6 (Refund Procedure)">
        <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
          <p className="font-medium mb-2">How to Request a Refund</p>
          <p>Email: flowcoder25@gmail.com</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Business Hours: Weekdays 10:00 - 18:00 KST (Excluding weekends and holidays)</p>
        </div>
        <p className="mt-4">The following information is required for refund requests:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Member email address</li>
          <li>Payment date and amount</li>
          <li>Reason for refund</li>
          <li>Bank account information (for bank transfers)</li>
        </ul>
        <p className="mt-4">Refund Processing Time:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Credit Card: 3-7 business days (varies by card issuer)</li>
          <li>Bank Transfer: Within 3 business days</li>
          <li>Digital Payment: Varies by payment method</li>
        </ul>
      </Section>

      <Section title="Article 7 (Non-Refundable Cases)">
        <p>Refunds are not available in the following cases:</p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li>If purchased credits have already been used</li>
          <li>Free bonus credits</li>
          <li>Special credits received through events or promotions</li>
          <li>Credits transferred or gifted to third parties</li>
          <li>If the account has been suspended for Terms of Service violations</li>
          <li>If the withdrawal period (7 days) has passed</li>
          <li>If AI output differs from user expectations due to technical characteristics (differences due to inherent limitations of AI technology are not grounds for refund)</li>
        </ul>
      </Section>

      <Section title="Article 8 (Partial Refunds)">
        <ol className="list-decimal pl-6 space-y-2">
          <li>For subscription services, partial refunds are available on a pro-rata basis based on the usage period.</li>
          <li>Partial refund amount = Payment amount × (Remaining days / Total usage days)</li>
          <li>However, bonus credits received during the usage period will be deducted from the refund amount.</li>
        </ol>
      </Section>

      <Section title="Article 9 (Refund of Overcharges)">
        <ol className="list-decimal pl-6 space-y-2">
          <li>If overcharges occur due to Company error, the Company will refund immediately.</li>
          <li>If overcharges occur due to user error, the user may bear the cost of processing the refund.</li>
        </ol>
      </Section>

      <Section title="Article 10 (Service Disruption Remedies)">
        <ol className="list-decimal pl-6 space-y-2">
          <li>If service is disrupted for 24 hours or more due to Company fault, the usage period will be extended or equivalent credits will be compensated.</li>
          <li>Damages caused by service disruption will only be compensated in cases of Company intent or gross negligence.</li>
        </ol>
      </Section>

      <Section title="Article 11 (Dispute Resolution)">
        <ol className="list-decimal pl-6 space-y-2">
          <li>Refund-related disputes between the Company and users shall be resolved amicably through mutual consultation.</li>
          <li>If disputes cannot be resolved, users may apply for mediation with the Korea Consumer Agency.</li>
          <li>If litigation is necessary, the Uijeongbu District Court, Republic of Korea, shall have exclusive jurisdiction.</li>
        </ol>
      </Section>

      <Section title="Article 12 (Governing Law)">
        <p>Korean law shall apply to the interpretation and application of this policy.</p>
      </Section>

      <Section title="Article 13 (Amendment of Policy)">
        <ol className="list-decimal pl-6 space-y-2">
          <li>The Company may amend this policy as necessary within the scope that does not violate relevant laws.</li>
          <li>Changes will be announced at least 7 days before the effective date, specifying the effective date and reason for the change.</li>
          <li>Changes unfavorable to users will be announced at least 30 days in advance.</li>
        </ol>
      </Section>

      <Section title="Article 14 (Understanding AI Output Characteristics)">
        <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg border border-amber-200 dark:border-amber-700">
          <p className="font-medium text-amber-800 dark:text-amber-200">Important Notice Regarding AI Service</p>
          <p className="mt-2 text-amber-700 dark:text-amber-300 text-sm">
            This service is based on artificial intelligence technology and is subject to the Framework Act on AI Development and Trust Foundation.
          </p>
        </div>
        <ol className="list-decimal pl-6 space-y-2 mt-4">
          <li>Users understand that this Service is based on AI technology and agree to the following:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>The quality, accuracy, and suitability of AI outputs are not guaranteed due to technical limitations</li>
              <li>Generation results may vary each time, even with the same prompt</li>
              <li>Due to the nature of AI models, unintended results may be generated</li>
            </ul>
          </li>
          <li>Dissatisfaction with outputs due to the reasons in paragraph 1 does not constitute grounds for withdrawal or refund.</li>
          <li>However, if images fail to generate due to technical service errors, the credits will be refunded or restored.</li>
        </ol>
      </Section>

      <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg border border-indigo-200 dark:border-indigo-700 mt-8">
        <p className="font-medium text-indigo-800 dark:text-indigo-200">Contact</p>
        <p className="mt-2 text-indigo-700 dark:text-indigo-300">
          Refund inquiries: <a href="mailto:flowcoder25@gmail.com" className="underline">flowcoder25@gmail.com</a>
        </p>
        <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
          Business Hours: Weekdays 10:00 - 18:00 KST (Excluding weekends and holidays)
        </p>
      </div>

      <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg mt-6">
        <p className="font-medium">Supplementary Provisions</p>
        <ol className="list-decimal pl-6 space-y-2 mt-2">
          <li>This policy takes effect on January 1, 2026.</li>
          <li>Provisions in Article 14 (Understanding AI Output Characteristics) pursuant to the Framework Act on AI Development and Trust Foundation take effect on January 22, 2026, the effective date of that law.</li>
        </ol>
      </div>
    </>
  )
}
