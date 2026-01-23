/**
 * Industry Actions Page
 * 업종별 액션(스타일) 선택 - 몰입형 UI
 */

"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Maximize2 } from "lucide-react";
import { getIndustryInfo, isValidIndustry, type Industry } from "@/lib/workflow/industries";
import { getIndustryActions, type Action } from "@/lib/workflow/actions";
import { useWorkflowStore } from "@/lib/workflow/store";
import { ImmersiveActionSelect } from "@/components/workflow/ImmersiveActionSelect";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ industry: string }>;
}

export default function IndustryPage({ params }: Props) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { industry } = resolvedParams;
  const [isImmersiveMode, setIsImmersiveMode] = useState(true);
  const { selectIndustry, selectAction } = useWorkflowStore();

  // 업종 유효성 검사
  const isValid = isValidIndustry(industry);
  const typedIndustry = industry as Industry;
  const industryInfo = isValid ? getIndustryInfo(typedIndustry) : null;
  const actions = isValid ? getIndustryActions(typedIndustry) : [];

  // 업종 선택 상태 업데이트
  useEffect(() => {
    if (isValid) {
      selectIndustry(typedIndustry);
    }
  }, [isValid, typedIndustry, selectIndustry]);

  // 액션 선택 핸들러
  const handleActionSelect = useCallback(
    (action: Action) => {
      selectAction(action.id);
    },
    [selectAction]
  );

  // 일반 리스트 모드로 전환
  const handleSwitchToList = useCallback(() => {
    setIsImmersiveMode(false);
  }, []);

  // 몰입 모드로 전환
  const handleSwitchToImmersive = useCallback(() => {
    setIsImmersiveMode(true);
  }, []);

  // 몰입 모드 닫기 (뒤로가기)
  const handleCloseImmersive = useCallback(() => {
    router.push("/");
  }, [router]);

  // 유효하지 않은 업종
  if (!isValid || !industryInfo) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-zinc-500 dark:text-zinc-400">존재하지 않는 업종입니다.</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-primary-600 dark:text-primary-400 hover:underline"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <>
      {/* 몰입형 모드 */}
      <ImmersiveActionSelect
        industry={typedIndustry}
        isOpen={isImmersiveMode}
        onClose={handleCloseImmersive}
        onSelect={handleActionSelect}
        onSwitchToList={handleSwitchToList}
      />

      {/* 일반 리스트 모드 (몰입 모드 비활성화 시) */}
      {!isImmersiveMode && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* 상단 네비게이션 */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>업종 선택으로 돌아가기</span>
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSwitchToImmersive}
              className="flex items-center gap-2"
            >
              <Maximize2 className="w-4 h-4" />
              몰입 모드
            </Button>
          </div>

          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{industryInfo.icon}</span>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{industryInfo.nameKo}</h1>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">{industryInfo.description}</p>
          </div>

          {/* 액션 선택 */}
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            어떤 스타일의 이미지를 만드시겠어요?
          </h2>

          <div className="grid gap-4">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  handleActionSelect(action);
                  router.push(`/workflow/${industry}/${action.id}`);
                }}
                className="group flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md dark:hover:shadow-zinc-900/50 transition-all text-left active:scale-[0.98]"
              >
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {action.nameKo}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{action.description}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500">
                    <span>{action.creditCost} 크레딧</span>
                    <span>{action.inputs.length}개 입력 항목</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400 dark:text-zinc-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
              </button>
            ))}
          </div>

          {/* 몰입 모드 안내 */}
          <div className="mt-8 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
              더 몰입감 있는 경험을 원하시나요?
            </p>
            <Button
              variant="outline"
              onClick={handleSwitchToImmersive}
              className="inline-flex items-center gap-2"
            >
              <Maximize2 className="w-4 h-4" />
              몰입 모드로 보기
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
