/**
 * Refund Policy Page
 * 환불 약관 - 원본 FlowStudio에서 가져옴
 */

"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

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

export default function RefundPolicyPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        뒤로가기
      </button>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8">
        <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">
          FlowStudio 환불 약관
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">
          시행일: 2026년 1월 1일 | 최종 업데이트: 2026년 1월 9일
        </p>

        <div className="space-y-6">
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
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <p className="font-medium mb-2">환불 신청 방법</p>
              <p>이메일: admin@flow-coder.com</p>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">운영시간: 평일 10:00 - 18:00 (주말 및 공휴일 제외)</p>
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

          <div className="bg-primary-50 dark:bg-primary-900/30 p-4 rounded-lg border border-primary-200 dark:border-primary-700 mt-8">
            <p className="font-medium text-primary-800 dark:text-primary-200">문의처</p>
            <p className="mt-2 text-primary-700 dark:text-primary-300">
              환불 관련 문의: <a href="mailto:admin@flow-coder.com" className="underline">admin@flow-coder.com</a>
            </p>
            <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
              운영시간: 평일 10:00 - 18:00 (주말 및 공휴일 제외)
            </p>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mt-6">
            <p className="font-medium">부칙</p>
            <ol className="list-decimal pl-6 space-y-2 mt-2">
              <li>본 약관은 2026년 1월 1일부터 시행됩니다.</li>
              <li>제14조(AI 생성물의 특성에 대한 이해)의 규정 중 「인공지능 발전과 신뢰 기반 조성 등에 관한 기본법」에 따른 사항은 해당 법률 시행일인 2026년 1월 22일부터 효력이 발생합니다.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
