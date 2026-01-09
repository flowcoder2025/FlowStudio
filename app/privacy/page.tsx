'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PrivacyPolicyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          뒤로가기
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            개인정보 처리방침
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            시행일: 2026년 1월 1일 | 최종 업데이트: 2026년 1월 9일
          </p>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              플로우코더(FlowCoder)(이하 &quot;회사&quot;)는 FlowStudio 서비스(이하 &quot;서비스&quot;) 이용자의 개인정보를 중요시하며,
              「개인정보 보호법」 및 관계 법령이 정한 바를 준수하여 개인정보를 보호하고 있습니다.
            </p>

            <Section title="제1조 (개인정보의 처리 목적)">
              <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리한 개인정보는 다음의 목적 이외의 용도로는 사용되지 않으며, 이용 목적이 변경될 시에는 사전 동의를 구할 예정입니다.</p>
              <ol className="list-decimal pl-6 space-y-2 mt-4">
                <li><strong>회원 가입 및 관리</strong>: 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지</li>
                <li><strong>서비스 제공</strong>: AI 이미지 생성 서비스 제공, 맞춤형 서비스 제공, 콘텐츠 제공, 본인인증</li>
                <li><strong>마케팅 및 광고</strong>: 신규 서비스 개발 및 맞춤형 서비스 제공, 이벤트 및 광고성 정보 제공 및 참여기회 제공, 서비스의 유효성 확인</li>
                <li><strong>고충처리</strong>: 민원인의 신원 확인, 민원사항 확인, 처리결과 통보</li>
              </ol>
            </Section>

            <Section title="제2조 (개인정보의 보유 및 이용 기간)">
              <p>회사는 법령에 따른 개인정보 보유·이용 기간 또는 정보주체로부터 개인정보 수집 시에 동의 받은 개인정보 보유·이용 기간 내에서 개인정보를 처리·보유합니다.</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>회원 정보</strong>: 회원 탈퇴 시까지</li>
                <li><strong>생성된 이미지 및 콘텐츠</strong>: 삭제 요청 시 또는 회원 탈퇴 시까지</li>
                <li><strong>서비스 이용 기록</strong>: 3개월</li>
                <li><strong>결제 기록</strong>: 전자상거래법에 따라 5년</li>
              </ul>
            </Section>

            <Section title="제3조 (처리하는 개인정보 항목)">
              <p><strong>필수 항목</strong></p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>이메일 주소</li>
                <li>비밀번호 (암호화 저장)</li>
                <li>이름 또는 닉네임</li>
                <li>접속 로그, IP 주소, 쿠키, 서비스 이용 기록</li>
              </ul>
              <p className="mt-4"><strong>선택 항목</strong></p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>프로필 이미지</li>
                <li>사업자등록번호 (사업자 인증 시)</li>
                <li>연락처</li>
              </ul>
              <p className="mt-4"><strong>자동 수집 항목</strong></p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>서비스 이용 시 생성되는 이미지 및 프롬프트 데이터</li>
                <li>기기 정보, 브라우저 정보</li>
              </ul>
            </Section>

            <Section title="제4조 (개인정보의 제3자 제공)">
              <p>회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              </ul>
              <p className="mt-4"><strong>서비스 제공을 위한 제3자 제공</strong></p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Google LLC (Vertex AI)</strong>: AI 이미지 생성을 위한 API 서비스 제공</li>
              </ul>
            </Section>

            <Section title="제5조 (개인정보 처리의 위탁)">
              <p>회사는 서비스 향상을 위해 다음과 같이 개인정보 처리업무를 외부에 위탁하고 있습니다:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Vercel Inc.</strong>: 웹 호스팅 및 서버 운영</li>
                <li><strong>Supabase Inc.</strong>: 데이터베이스 관리 및 파일 저장</li>
              </ul>
            </Section>

            <Section title="제6조 (정보주체의 권리·의무 및 행사방법)">
              <p>이용자는 개인정보 주체로서 다음과 같은 권리를 행사할 수 있습니다:</p>
              <ol className="list-decimal pl-6 space-y-2 mt-4">
                <li>개인정보 열람 요구</li>
                <li>오류 등이 있을 경우 정정 요구</li>
                <li>삭제 요구</li>
                <li>처리정지 요구</li>
              </ol>
              <p className="mt-4">위 권리 행사는 회사에 대해 서면, 전화, 이메일 등을 통하여 하실 수 있으며 회사는 이에 대해 지체 없이 조치하겠습니다.</p>
            </Section>

            <Section title="제7조 (마케팅 활용 및 광고성 정보 전송)">
              <p className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg border border-indigo-200 dark:border-indigo-700">
                회사는 이용자의 동의를 받아 다음과 같은 목적으로 개인정보를 마케팅에 활용할 수 있습니다:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>이용자가 생성한 이미지를 서비스 홍보 및 마케팅 자료로 활용 (비식별화 처리 후)</li>
                <li>이용자의 이메일 주소로 신규 서비스 안내, 이벤트 정보, 프로모션 등 광고성 정보 전송</li>
                <li>서비스 개선을 위한 이용 패턴 분석</li>
              </ul>
              <p className="mt-4">이용자는 언제든지 마케팅 수신에 대한 동의를 철회할 수 있으며, 동의 철회 시 관련 정보의 마케팅 활용이 즉시 중단됩니다.</p>
            </Section>

            <Section title="제8조 (개인정보의 안전성 확보 조치)">
              <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
              <ol className="list-decimal pl-6 space-y-2 mt-4">
                <li><strong>관리적 조치</strong>: 내부관리계획 수립·시행, 직원 교육</li>
                <li><strong>기술적 조치</strong>: 개인정보 암호화, 보안프로그램 설치, 접근권한 관리</li>
                <li><strong>물리적 조치</strong>: 클라우드 서비스 이용으로 물리적 접근 제한</li>
              </ol>
            </Section>

            <Section title="제9조 (개인정보 보호책임자)">
              <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg mt-4">
                <p><strong>개인정보 보호책임자</strong></p>
                <ul className="mt-2 space-y-1">
                  <li>성명: 조용현, 박현일</li>
                  <li>직위: 공동대표</li>
                  <li>이메일: flowcoder25@gmail.com</li>
                </ul>
              </div>
            </Section>

            <Section title="제10조 (개인정보 처리방침의 변경)">
              <p>이 개인정보 처리방침은 법령, 정책 또는 보안기술의 변경에 따라 내용의 추가, 삭제 및 수정이 있을 수 있으며, 변경 시에는 시행 7일 전부터 서비스 내 공지사항을 통해 공지할 것입니다.</p>
            </Section>

            <Section title="제11조 (AI 서비스 이용 시 데이터 처리)">
              <p className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg border border-amber-200 dark:border-amber-700">
                본 서비스는 인공지능 기반 이미지 생성 서비스로서, 「인공지능 발전과 신뢰 기반 조성 등에 관한 기본법」에 따른 데이터 처리 사항을 고지합니다.
              </p>
              <ol className="list-decimal pl-6 space-y-2 mt-4">
                <li><strong>AI 처리를 위한 데이터 전송</strong>: 이용자가 서비스 이용 시 입력하는 프롬프트(텍스트), 참조 이미지 등의 데이터는 AI 이미지 생성을 위해 외부 AI 서비스 제공자(Google Vertex AI)에게 전송됩니다.</li>
                <li><strong>데이터 활용 범위</strong>: 전송된 데이터는 이미지 생성 목적으로만 사용되며, AI 모델 학습에는 사용되지 않습니다.</li>
                <li><strong>AI 생성물 표시 정보</strong>: 회사는 관련 법령에 따라 AI 생성물에 다음 정보를 포함할 수 있습니다:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>AI 생성 여부를 나타내는 워터마크</li>
                    <li>생성 일시, 서비스명 등의 메타데이터</li>
                  </ul>
                </li>
                <li><strong>비식별 정보</strong>: AI 생성물에 포함되는 표시 정보는 개인을 식별하지 않으며, 법령 준수를 위해 포함됩니다.</li>
              </ol>
            </Section>

            <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg mt-6">
              <p className="font-medium">부칙</p>
              <ol className="list-decimal pl-6 space-y-2 mt-2">
                <li>본 개인정보 처리방침은 2026년 1월 1일부터 시행됩니다.</li>
                <li>제11조(AI 서비스 이용 시 데이터 처리)의 규정 중 「인공지능 발전과 신뢰 기반 조성 등에 관한 기본법」에 따른 사항은 해당 법률 시행일인 2026년 1월 22일부터 효력이 발생합니다.</li>
              </ol>
            </div>
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
