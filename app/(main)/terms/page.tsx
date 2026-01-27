/**
 * Terms of Service Page
 * 서비스 이용약관 - 원본 FlowStudio에서 가져옴
 */

"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

function Chapter({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-6 pb-2 border-b-2 border-primary-500">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-200 mb-3">
        {title}
      </h3>
      <div className="text-zinc-600 dark:text-zinc-300 space-y-3">{children}</div>
    </section>
  );
}

export default function TermsOfServicePage() {
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
          FlowStudio 서비스 이용약관
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">시행일: 2026년 1월 1일</p>

        <div className="space-y-6">
          <Chapter title="제1장 총칙">
            <Section title="제1조 (목적)">
              <p>
                이 약관은 플로우코더(FlowCoder)(이하 &quot;회사&quot;)가 제공하는 FlowStudio 서비스(이하 &quot;서비스&quot;)를
                이용함에 있어 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>
            </Section>

            <Section title="제2조 (정의)">
              <ol className="list-decimal pl-6 space-y-2">
                <li><strong>&quot;서비스&quot;</strong>란 회사가 제공하는 AI 기반 이미지 생성 플랫폼 및 관련 제반 서비스를 의미합니다.</li>
                <li><strong>&quot;이용자&quot;</strong>란 이 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
                <li><strong>&quot;회원&quot;</strong>이란 서비스에 가입하여 이용자 아이디를 부여받은 자를 말합니다.</li>
                <li><strong>&quot;콘텐츠&quot;</strong>란 서비스를 통해 생성된 이미지, 텍스트 및 기타 창작물을 말합니다.</li>
                <li><strong>&quot;크레딧&quot;</strong>이란 서비스 내에서 이미지 생성에 사용되는 가상의 재화를 말합니다.</li>
                <li><strong>&quot;AI 생성물&quot;</strong>이란 본 서비스의 인공지능 기술을 활용하여 생성된 이미지, 텍스트 및 기타 결과물을 말합니다.</li>
                <li><strong>&quot;AI 표시&quot;</strong>란 「인공지능 발전과 신뢰 기반 조성 등에 관한 기본법」에 따라 AI 생성물에 부착되는 워터마크, 메타데이터 또는 기타 식별 표시를 말합니다.</li>
              </ol>
            </Section>

            <Section title="제3조 (약관의 효력 및 변경)">
              <ol className="list-decimal pl-6 space-y-2">
                <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 공지함으로써 효력이 발생합니다.</li>
                <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.</li>
                <li>약관이 변경되는 경우 회사는 변경 약관의 적용일자 및 변경사유를 명시하여 적용일 7일 전부터 공지합니다. 다만, 이용자에게 불리한 약관의 변경인 경우에는 30일 전부터 공지합니다.</li>
                <li>이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
              </ol>
            </Section>
          </Chapter>

          <Chapter title="제2장 서비스 이용계약">
            <Section title="제4조 (이용계약의 성립)">
              <ol className="list-decimal pl-6 space-y-2">
                <li>이용계약은 이용자가 본 약관에 동의하고 회원가입 신청을 한 후 회사가 이를 승낙함으로써 성립합니다.</li>
                <li>회사는 다음 각 호에 해당하는 경우 승낙을 거부하거나 유보할 수 있습니다:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>실명이 아니거나 타인의 명의를 도용한 경우</li>
                    <li>허위 정보를 기재하거나 필수 정보를 기재하지 않은 경우</li>
                    <li>만 14세 미만인 경우</li>
                    <li>이전에 회원자격을 상실한 적이 있는 경우</li>
                  </ul>
                </li>
              </ol>
            </Section>

            <Section title="제5조 (이용자 정보의 변경)">
              <p>회원은 개인정보 관리화면을 통하여 언제든지 자신의 개인정보를 열람하고 수정할 수 있습니다.</p>
            </Section>

            <Section title="제6조 (이용계약의 종료)">
              <ol className="list-decimal pl-6 space-y-2">
                <li>회원은 언제든지 서비스 내 탈퇴 기능을 통해 탈퇴를 요청할 수 있습니다.</li>
                <li>회사는 다음 각 호에 해당하는 경우 사전 통지 없이 이용계약을 해지할 수 있습니다:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>타인의 정보를 도용한 경우</li>
                    <li>서비스 운영을 방해한 경우</li>
                    <li>관련 법령이나 본 약관을 위반한 경우</li>
                  </ul>
                </li>
              </ol>
            </Section>
          </Chapter>

          <Chapter title="제3장 계약 당사자의 의무">
            <Section title="제7조 (회사의 의무)">
              <ol className="list-decimal pl-6 space-y-2">
                <li>회사는 관련 법령과 본 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며, 지속적이고 안정적으로 서비스를 제공하기 위해 노력합니다.</li>
                <li>회사는 이용자의 개인정보를 보호하며, 개인정보처리방침을 공시하고 준수합니다.</li>
                <li>회사는 이용자로부터 제기되는 의견이나 불만이 정당하다고 인정할 경우 적절한 절차를 거쳐 처리합니다.</li>
              </ol>
            </Section>

            <Section title="제8조 (이용자의 의무)">
              <p>이용자는 다음 행위를 하여서는 안 됩니다:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>신청 또는 변경 시 허위내용의 등록</li>
                <li>타인의 정보 도용</li>
                <li>회사가 게시한 정보의 변경</li>
                <li>회사가 정한 정보 이외의 정보 등의 송신 또는 게시</li>
                <li>회사 및 기타 제3자의 저작권 등 지적재산권 침해</li>
                <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                <li>음란물, 폭력적 콘텐츠, 불법 콘텐츠 생성</li>
                <li>서비스를 이용한 불법 행위</li>
              </ul>
            </Section>
          </Chapter>

          <Chapter title="제4장 서비스 이용">
            <Section title="제9조 (서비스의 제공)">
              <ol className="list-decimal pl-6 space-y-2">
                <li>서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.</li>
                <li>회사는 서비스 제공을 위해 필요한 정기점검을 실시할 수 있으며, 점검시간은 사전에 공지합니다.</li>
              </ol>
            </Section>

            <Section title="제10조 (서비스의 변경 및 중단)">
              <ol className="list-decimal pl-6 space-y-2">
                <li>회사는 운영상, 기술상의 필요에 따라 서비스의 전부 또는 일부를 변경할 수 있습니다.</li>
                <li>서비스 내용, 이용방법, 이용시간의 변경이 있는 경우에는 변경사유, 변경될 서비스의 내용 및 제공일자 등을 변경 전 7일 이상 공지합니다.</li>
              </ol>
            </Section>

            <Section title="제11조 (광고 및 마케팅)">
              <div className="bg-primary-50 dark:bg-primary-900/30 p-4 rounded-lg border border-primary-200 dark:border-primary-700">
                <p className="font-medium mb-2">마케팅 정보 활용 동의</p>
                <p>회사는 서비스 제공과 관련하여 다음과 같은 마케팅 활동을 수행할 수 있습니다:</p>
              </div>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>이용자가 입력한 이메일 주소로 서비스 관련 정보, 이벤트, 프로모션 등 광고성 정보를 전송할 수 있습니다.</li>
                <li>이용자가 생성한 콘텐츠(이미지)를 서비스 홍보, 마케팅, 포트폴리오 등의 목적으로 활용할 수 있습니다. 이 경우 개인을 식별할 수 있는 정보는 제거됩니다.</li>
                <li>이용자는 언제든지 마케팅 수신에 대한 동의를 철회할 수 있습니다.</li>
              </ul>
            </Section>
          </Chapter>

          <Chapter title="제5장 크레딧 및 결제">
            <Section title="제12조 (크레딧)">
              <ol className="list-decimal pl-6 space-y-2">
                <li>크레딧은 서비스 내에서 이미지 생성에 사용되는 가상의 재화입니다.</li>
                <li>크레딧은 유료 구매 또는 회사가 제공하는 보너스로 획득할 수 있습니다.</li>
                <li>보너스 크레딧은 지급일로부터 30일 이내에 사용해야 하며, 기간 경과 시 소멸됩니다.</li>
                <li>유료 구매 크레딧은 별도의 유효기간이 없습니다.</li>
              </ol>
            </Section>

            <Section title="제13조 (결제)">
              <ol className="list-decimal pl-6 space-y-2">
                <li>크레딧 구매 시 회사가 제공하는 결제 수단을 통해 결제할 수 있습니다.</li>
                <li>결제 관련 세부 사항은 별도의 환불약관에 따릅니다.</li>
              </ol>
            </Section>
          </Chapter>

          <Chapter title="제6장 저작권 및 콘텐츠">
            <Section title="제14조 (저작권의 귀속)">
              <ol className="list-decimal pl-6 space-y-2">
                <li>서비스에 관한 저작권 및 지적재산권은 회사에 귀속됩니다.</li>
                <li>이용자가 서비스를 통해 생성한 콘텐츠의 저작권은 이용자에게 귀속됩니다.</li>
                <li>단, 이용자는 회사가 서비스 홍보 및 마케팅 목적으로 생성 콘텐츠를 활용하는 것에 동의합니다.</li>
              </ol>
            </Section>

            <Section title="제15조 (이용자 생성 콘텐츠)">
              <ol className="list-decimal pl-6 space-y-2">
                <li>이용자는 생성한 콘텐츠에 대해 자유롭게 사용, 수정, 배포할 권리를 가집니다.</li>
                <li>이용자는 생성한 콘텐츠가 타인의 저작권을 침해하지 않도록 주의해야 합니다.</li>
                <li>불법적이거나 부적절한 콘텐츠 생성 시 회사는 해당 콘텐츠를 삭제하고 서비스 이용을 제한할 수 있습니다.</li>
              </ol>
            </Section>
          </Chapter>

          <Chapter title="제7장 손해배상 등">
            <Section title="제16조 (책임의 제한)">
              <ol className="list-decimal pl-6 space-y-2">
                <li>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
                <li>회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.</li>
                <li>회사는 이용자가 서비스를 통해 얻은 정보 또는 자료의 신뢰성, 정확성 등에 대해서는 책임을 지지 않습니다.</li>
              </ol>
            </Section>

            <Section title="제17조 (손해배상)">
              <p>회사 또는 이용자가 본 약관을 위반하여 상대방에게 손해를 입힌 경우에는 그 손해를 배상할 책임이 있습니다.</p>
            </Section>
          </Chapter>

          <Chapter title="제8장 기타">
            <Section title="제18조 (개인정보보호)">
              <p>회사는 관련 법령이 정하는 바에 따라 이용자의 개인정보를 보호하기 위해 노력합니다. 개인정보의 보호 및 사용에 대해서는 관련 법령 및 회사의 개인정보처리방침이 적용됩니다.</p>
            </Section>

            <Section title="제19조 (분쟁해결)">
              <ol className="list-decimal pl-6 space-y-2">
                <li>회사와 이용자 간에 발생한 분쟁에 관한 소송은 대한민국 의정부지방법원을 전속 관할법원으로 합니다.</li>
                <li>회사와 이용자 간에 제기된 소송에는 대한민국 법을 적용합니다.</li>
              </ol>
            </Section>
          </Chapter>

          <Chapter title="제9장 AI 생성물 및 법령 준수">
            <Section title="제20조 (AI 생성물의 특성 및 표시)">
              <ol className="list-decimal pl-6 space-y-2">
                <li>본 서비스를 통해 생성되는 모든 콘텐츠는 인공지능 기술에 의해 생성된 AI 생성물입니다.</li>
                <li>회사는 「인공지능 발전과 신뢰 기반 조성 등에 관한 기본법」(이하 &quot;AI 기본법&quot;) 제31조에 따라 AI 생성물에 다음과 같은 표시를 할 수 있습니다:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>워터마크 또는 시각적 식별 표시</li>
                    <li>메타데이터 삽입</li>
                    <li>기타 대통령령이 정하는 방식의 표시</li>
                  </ul>
                </li>
                <li>이용자는 회사가 부착한 AI 표시를 임의로 제거, 변경 또는 훼손해서는 안 됩니다.</li>
                <li>AI 표시가 제거된 콘텐츠의 유통 및 이로 인해 발생하는 법적 책임은 전적으로 해당 이용자에게 있습니다.</li>
              </ol>
            </Section>

            <Section title="제21조 (AI 생성물의 저작권 및 이용자 책임)">
              <ol className="list-decimal pl-6 space-y-2">
                <li>AI 생성물은 현행 저작권법상 인간의 창작적 기여가 없는 경우 저작권 보호 대상이 되지 않을 수 있습니다. 이용자는 이러한 법적 특성을 이해하고 서비스를 이용합니다.</li>
                <li>이용자가 AI 생성물을 상업적 또는 비상업적으로 이용하는 경우, 관련 법령 준수 여부에 대한 책임은 이용자에게 있습니다.</li>
                <li>이용자는 AI 생성물을 이용함에 있어 다음 사항을 준수해야 합니다:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>AI 기본법 및 관련 법령에서 정한 표시 의무 준수</li>
                    <li>제3자의 지식재산권 침해 금지</li>
                    <li>허위정보 유포 또는 사회적 혼란 야기 목적의 사용 금지</li>
                    <li>타인의 초상권, 명예권 등 인격권 침해 금지</li>
                  </ul>
                </li>
              </ol>
            </Section>

            <Section title="제22조 (AI 생성물 관련 면책)">
              <ol className="list-decimal pl-6 space-y-2">
                <li>회사는 AI 기술의 특성상 생성 결과물이 이용자의 기대와 다를 수 있으며, 결과물의 품질, 정확성, 적합성에 대해 보증하지 않습니다.</li>
                <li>회사는 이용자가 AI 표시를 제거하거나 변경하여 발생한 법적 분쟁에 대해 책임을 지지 않습니다.</li>
                <li>회사는 이용자의 AI 생성물 사용으로 발생하는 제3자와의 분쟁(저작권, 초상권, 명예훼손 등)에 대해 책임을 지지 않습니다.</li>
                <li>이용자가 AI 생성물을 이용하여 법령을 위반하거나 제3자에게 손해를 입힌 경우, 그에 대한 모든 책임은 이용자에게 있습니다.</li>
              </ol>
            </Section>
          </Chapter>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mt-8">
            <p className="font-medium">부칙</p>
            <ol className="list-decimal pl-6 space-y-2 mt-2">
              <li>본 약관은 2026년 1월 1일부터 시행됩니다.</li>
              <li>제9장(AI 생성물 및 법령 준수)의 규정 중 「인공지능 발전과 신뢰 기반 조성 등에 관한 기본법」에 따른 의무 조항은 해당 법률 시행일인 2026년 1월 22일부터 효력이 발생합니다.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
