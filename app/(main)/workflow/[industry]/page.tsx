/**
 * Industry Actions Page
 * Lists available actions for selected industry
 */

"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getIndustryInfo, isValidIndustry } from "@/lib/workflow/industries";
import { getIndustryActions } from "@/lib/workflow/actions";

interface Props {
  params: Promise<{ industry: string }>;
}

export default function IndustryPage({ params }: Props) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { industry } = resolvedParams;

  if (!isValidIndustry(industry)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">존재하지 않는 업종입니다.</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-primary-600 hover:underline"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const industryInfo = getIndustryInfo(industry);
  const actions = getIndustryActions(industry);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>업종 선택으로 돌아가기</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{industryInfo.icon}</span>
          <h1 className="text-2xl font-bold text-gray-900">{industryInfo.nameKo}</h1>
        </div>
        <p className="text-gray-600">{industryInfo.description}</p>
      </div>

      {/* Action Selection */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        어떤 스타일의 이미지를 만드시겠어요?
      </h2>

      <div className="grid gap-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => router.push(`/workflow/${industry}/${action.id}`)}
            className="group flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all text-left"
          >
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {action.nameKo}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{action.description}</p>
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                <span>{action.creditCost} 크레딧</span>
                <span>{action.inputs.length}개 입력 항목</span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
