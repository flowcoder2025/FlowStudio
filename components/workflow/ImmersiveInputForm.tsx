/**
 * ImmersiveInputForm Component - 몰입형 입력 폼
 * Contract: IMMERSIVE_DESIGN_INPUT_FORM
 * Evidence: Phase D - 입력 폼 몰입형 전환
 *
 * 특징:
 * - AI 추천 카드와 입력 필드를 통합 스와이프로 연결
 * - 각 입력 필드를 개별 스텝 카드로 표시
 * - 스와이프 네비게이션 지원
 * - AI 추천으로 돌아가기 가능
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { X, Sparkles, Loader2, Upload, Check, ArrowRight } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import { ImmersiveNavigation } from "@/components/immersive/ImmersiveNavigation";
import { ImageUpload, UploadedImage } from "@/components/workflow/ImageUpload";
import { Button } from "@/components/ui/button";
import { Action, ActionInput } from "@/lib/workflow/actions";
import { getActionsForIntent } from "@/lib/workflow/intents";
import { getIndustryInfo, Industry, INDUSTRY_INFO } from "@/lib/workflow/industries";
import { ExpressionIntent, EXPRESSION_INTENT_INFO } from "@/lib/workflow/intents";
import { useWorkflowStore } from "@/lib/workflow/store";
import { WorkflowRecommendation } from "@/lib/workflow/recommend";
import { TOOL_STEP_DEFINITIONS, TOOL_INFO } from "@/lib/workflow/actions/tools";
import type { ToolStep as ToolStepDef } from "@/lib/workflow/actions/tools";
import type { ToolMode, ToolGenerateRequest } from "@/lib/tools/types";
import type { AspectRatio } from "@/lib/imageProvider/types";
import { generateFromTool } from "@/lib/tools/generateClient";
import { ImmersiveResult } from "@/components/workflow/ImmersiveResult";
import {
  ImageUploadStep,
  AspectRatioStep,
  CategoryStyleStep,
  MultiImageStep,
  PromptStep,
  ConfirmationStep,
  CanvasMaskStep,
  SegmentLoopStep,
} from "@/components/workflow/steps";

// ============================================================
// 타입 정의
// ============================================================

export interface ImmersiveInputFormProps {
  isOpen: boolean;
  onClose: () => void;
  industry: Industry;
  intent: ExpressionIntent;
  onGenerate?: (sessionId: string) => void;
  /** AI 추천 목록 - 제공 시 첫 스텝으로 추천 카드 표시 */
  recommendations?: WorkflowRecommendation[];
  /** 추천 선택 시 콜백 - 다른 추천 선택 시 industry/intent 변경 */
  onRecommendationSelect?: (recommendation: WorkflowRecommendation) => void;
  /** 현재 선택된 추천의 인덱스 */
  currentRecommendationIndex?: number;
  /** 초기 검색 쿼리 (자동 입력용) */
  initialQuery?: string;
}

interface RecommendStep {
  type: "recommend";
}

interface InputStep {
  type: "input";
  input: ActionInput;
}

interface ImageStep {
  type: "image";
}

interface ConfirmStep {
  type: "confirm";
}

type Step = RecommendStep | InputStep | ImageStep | ConfirmStep;

// ============================================================
// 애니메이션 Variants
// ============================================================

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const cardContainerVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const },
  },
  exit: { scale: 0.95, opacity: 0, transition: { duration: 0.15 } },
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    transition: { duration: 0.25 },
  }),
};

// ============================================================
// 스와이프 설정
// ============================================================

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) =>
  Math.abs(offset) * velocity;

// ============================================================
// 입력 카드 컴포넌트
// ============================================================

interface InputCardProps {
  step: Step;
  stepIndex: number;
  totalSteps: number;
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  referenceImages: UploadedImage[];
  onImageChange: (images: UploadedImage[]) => void;
  action: Action;
  inputs: Record<string, string>;
  isGenerating: boolean;
  onGenerate: () => void;
  industryInfo: ReturnType<typeof getIndustryInfo>;
  intentInfo: (typeof EXPRESSION_INTENT_INFO)[ExpressionIntent];
  /** 추천 관련 props */
  recommendations?: WorkflowRecommendation[];
  currentRecommendationIndex?: number;
  onRecommendationChange?: (index: number) => void;
  onRecommendationAccept?: () => void;
  /** 이미지 장수 관련 props */
  imageCount: number;
  onImageCountChange: (count: number) => void;
  /** 참조 모드 관련 props */
  referenceMode: import("@/lib/imageProvider/types").ReferenceMode;
  onReferenceModeChange: (mode: import("@/lib/imageProvider/types").ReferenceMode) => void;
}

function InputCard({
  step,
  stepIndex,
  totalSteps,
  value,
  onChange,
  onNext,
  referenceImages,
  onImageChange,
  action,
  inputs,
  isGenerating,
  onGenerate,
  industryInfo,
  intentInfo,
  recommendations,
  currentRecommendationIndex = 0,
  onRecommendationChange,
  onRecommendationAccept,
  imageCount,
  onImageCountChange,
  referenceMode,
  onReferenceModeChange,
}: InputCardProps) {
  const t = useTranslations("workflow");
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(URL.createObjectURL(file));
      }, 500);
    });
  }, []);

  // AI 추천 카드 렌더링
  if (step.type === "recommend" && recommendations && recommendations.length > 0) {
    const currentRec = recommendations[currentRecommendationIndex];
    const recIndustryInfo = INDUSTRY_INFO[currentRec.industry];
    const recIntentInfo = EXPRESSION_INTENT_INFO[currentRec.intent];
    const percentage = Math.round(currentRec.score * 100);
    const colorClass =
      percentage >= 80
        ? "bg-green-500"
        : percentage >= 60
        ? "bg-yellow-500"
        : "bg-zinc-400 dark:bg-zinc-600";

    return (
      <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">{t("ui.aiRecommendation")}</span>
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            {currentRecommendationIndex + 1} / {recommendations.length}
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 text-center">
          {/* 업종 아이콘 */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center text-4xl md:text-5xl mb-4"
            style={{ backgroundColor: `${recIndustryInfo?.color || "#6366f1"}20` }}
          >
            {recIndustryInfo?.icon || "📦"}
          </motion.div>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-sm text-zinc-500 dark:text-zinc-400 mb-2"
          >
            {t(`industries.${currentRec.industry}.name`)}
          </motion.div>

          {/* 제목 */}
          <motion.h2
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-3"
          >
            {recIntentInfo?.nameKo || currentRec.intent}
          </motion.h2>

          {/* 설명 */}
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-sm leading-relaxed"
          >
            {recIntentInfo?.description || currentRec.reason}
          </motion.p>

          {/* 매칭률 */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="w-full max-w-xs"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">{t("ui.matchRate")}</span>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{percentage}%</span>
            </div>
            <div className="w-full h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", colorClass)}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              />
            </div>
          </motion.div>

          {/* 추천 네비게이션 도트 */}
          {recommendations.length > 1 && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="flex items-center gap-2 mt-6"
            >
              {recommendations.slice(0, 7).map((_, index) => (
                <button
                  key={index}
                  onClick={() => onRecommendationChange?.(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === currentRecommendationIndex
                      ? "bg-primary-600 scale-125"
                      : "bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400 dark:hover:bg-zinc-500"
                  )}
                />
              ))}
              {recommendations.length > 7 && (
                <span className="text-xs text-zinc-400 dark:text-zinc-500">+{recommendations.length - 7}</span>
              )}
            </motion.div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="p-5 md:p-6 bg-zinc-50 dark:bg-zinc-800/50 space-y-3">
          <Button
            onClick={onRecommendationAccept}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            {t("ui.startWithThisWorkflow")}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          {recommendations.length > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                onClick={() => onRecommendationChange?.(
                  currentRecommendationIndex <= 0
                    ? recommendations.length - 1
                    : currentRecommendationIndex - 1
                )}
                variant="ghost"
                size="sm"
                className="text-zinc-600 dark:text-zinc-400"
              >
                ← {t("ui.prevRecommendation")}
              </Button>
              <Button
                onClick={() => onRecommendationChange?.(
                  currentRecommendationIndex >= recommendations.length - 1
                    ? 0
                    : currentRecommendationIndex + 1
                )}
                variant="ghost"
                size="sm"
                className="text-zinc-600 dark:text-zinc-400"
              >
                {t("ui.nextRecommendation")} →
              </Button>
            </div>
          )}

          <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
            → {t("ui.swipeToStartInput")}
          </p>
        </div>
      </div>
    );
  }

  // 입력 필드 렌더링
  if (step.type === "input") {
    const input = step.input;
    const isSelect = input.type === "select";
    const isTextInput = input.type === "textarea" || input.type === "text" || (!isSelect);
    const hasValue = !!value?.trim();

    return (
      <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{industryInfo?.icon}</span>
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {intentInfo?.nameKo}
            </span>
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            {stepIndex + 1} / {totalSteps}
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 flex flex-col p-6 md:p-8">
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <label className="block text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              {input.label}
              {input.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {input.type === "textarea" ? (
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={input.placeholder || `${input.label}을(를) 입력해주세요`}
                rows={5}
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-base"
                autoFocus
              />
            ) : isSelect ? (
              <div className="grid grid-cols-2 gap-3">
                {input.options?.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      // 선택 즉시 다음 스텝으로 이동
                      setTimeout(() => onNext(), 200);
                    }}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all",
                      value === opt.value
                        ? "border-primary-500 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 shadow-md ring-2 ring-primary-500/20"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-900 dark:text-zinc-100"
                    )}
                  >
                    <span className="font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <input
                type={input.type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && hasValue) onNext();
                }}
                placeholder={input.placeholder || `${input.label}을(를) 입력해주세요`}
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                autoFocus
              />
            )}
          </motion.div>
        </div>

        {/* 하단: 텍스트 입력은 다음 버튼, 선택은 힌트만 */}
        <div className="px-6 pb-6">
          {isTextInput ? (
            <Button
              onClick={onNext}
              disabled={input.required && !hasValue}
              className="w-full h-11 text-base font-semibold"
              size="lg"
            >
              {t("ui.next")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center">
              {t("ui.selectToNext")}
            </p>
          )}
        </div>
      </div>
    );
  }

  // 이미지 업로드 카드
  if (step.type === "image") {
    return (
      <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t("ui.referenceImage")}</span>
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            {stepIndex + 1} / {totalSteps}
          </div>
        </div>

        {/* 메인 콘텐츠 - 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {t("ui.referenceImageOptional")}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t("ui.referenceImageDesc")}
              </p>
            </div>

            <ImageUpload
              value={referenceImages}
              onChange={onImageChange}
              onUpload={handleImageUpload}
              maxFiles={3}
              maxFileSize={5 * 1024 * 1024}
              showReferenceMode={true}
              referenceMode={referenceMode}
              onReferenceModeChange={onReferenceModeChange}
            />
          </motion.div>
        </div>

        {/* 하단 힌트 */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            {t("ui.swipeToSkip")} →
          </p>
        </div>
      </div>
    );
  }

  // 확인 카드
  if (step.type === "confirm") {
    const requiredInputs = action.inputs.filter((i) => i.required);
    const filledInputs = requiredInputs.filter((i) => inputs[i.id]?.trim());
    const isValid = filledInputs.length === requiredInputs.length;

    return (
      <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">{t("ui.generateImage")}</span>
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            {stepIndex + 1} / {totalSteps}
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-4 bg-primary-100"
          >
            {isValid ? "✨" : "📝"}
          </motion.div>

          <motion.h2
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-3"
          >
            {isValid ? t("ui.readyToGenerate") : t("ui.completeInputs")}
          </motion.h2>

          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="text-zinc-600 dark:text-zinc-400 mb-6"
          >
            {isValid
              ? t("ui.clickToGenerate")
              : t("ui.emptyFields", { count: requiredInputs.length - filledInputs.length })}
          </motion.p>

          {/* 입력 요약 */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="w-full max-w-sm text-left space-y-2 mb-4"
          >
            {action.inputs.map((input) => {
              const val = inputs[input.id];
              const isFilled = val?.trim();
              return (
                <div
                  key={input.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg text-sm",
                    isFilled ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  )}
                >
                  {isFilled ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />
                  )}
                  <span>{input.label}</span>
                </div>
              );
            })}
          </motion.div>

          {/* 이미지 장수 선택 */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="w-full max-w-sm"
          >
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block text-left">
              {t("ui.imageCount")}
            </label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => onImageCountChange(num)}
                  className={cn(
                    "w-12 h-12 rounded-lg border-2 font-semibold transition-all",
                    imageCount === num
                      ? "border-primary-500 bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 shadow-md ring-2 ring-primary-500/20"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 text-center">
              {t("ui.creditCalculation", { count: imageCount, cost: action.creditCost, total: imageCount * action.creditCost })}
            </p>
          </motion.div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-5 md:p-6 bg-zinc-50 dark:bg-zinc-800/50">
          <Button
            onClick={onGenerate}
            disabled={!isValid || isGenerating}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                {t("ui.generating")}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                {t("ui.generateNImages", { count: imageCount, credits: action.creditCost * imageCount })}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

// ============================================================
// 도구 모드 카드 렌더링
// ============================================================

interface ToolStepCardProps {
  step: ToolStepDef;
  stepIndex: number;
  totalSteps: number;
  toolMode: ToolMode;
  toolInputs: Record<string, unknown>;
  setToolInput: (key: string, value: unknown) => void;
  onNext: () => void;
  imageCount: number;
  onImageCountChange: (count: number) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  toolSteps: ToolStepDef[];
}

function ToolStepCard({
  step,
  stepIndex,
  totalSteps,
  toolMode,
  toolInputs,
  setToolInput,
  onNext,
  imageCount,
  onImageCountChange,
  isGenerating,
  onGenerate,
  toolSteps,
}: ToolStepCardProps) {
  const t = useTranslations();
  const info = TOOL_INFO[toolMode];
  const toolTitle = t(info.titleKey);

  switch (step.type) {
    case 'image-upload':
      return (
        <ImageUploadStep
          step={step}
          value={(toolInputs[step.key] as string | null) ?? null}
          onChange={(url) => setToolInput(step.key, url)}
          onNext={onNext}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          toolTitle={toolTitle}
        />
      );

    case 'aspect-ratio':
      return (
        <AspectRatioStep
          step={step}
          value={(toolInputs[step.key] as AspectRatio) ?? step.default}
          onChange={(ratio) => setToolInput(step.key, ratio)}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          toolTitle={toolTitle}
        />
      );

    case 'category-style':
      return (
        <CategoryStyleStep
          value={(toolInputs[step.key] as { category: string; style: string } | null) ?? null}
          onChange={(val) => setToolInput(step.key, val)}
          onNext={onNext}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          toolTitle={toolTitle}
        />
      );

    case 'multi-image':
      return (
        <MultiImageStep
          step={step}
          value={(toolInputs[step.key] as string[]) ?? []}
          onChange={(urls) => setToolInput(step.key, urls)}
          onNext={onNext}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          toolTitle={toolTitle}
        />
      );

    case 'prompt':
      return (
        <PromptStep
          step={step}
          value={(toolInputs[step.key] as string) ?? ''}
          onChange={(val) => setToolInput(step.key, val)}
          onNext={onNext}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          toolTitle={toolTitle}
        />
      );

    case 'confirmation':
      return (
        <ConfirmationStep
          toolMode={toolMode}
          toolSteps={toolSteps}
          toolInputs={toolInputs}
          imageCount={imageCount}
          onImageCountChange={onImageCountChange}
          isGenerating={isGenerating}
          onGenerate={onGenerate}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
        />
      );

    case 'canvas-mask':
      return (
        <CanvasMaskStep
          sourceImage={(toolInputs['sourceImage'] as string | null) ?? null}
          value={(toolInputs[step.key!] as string | null) ?? null}
          onChange={(maskUrl) => setToolInput(step.key!, maskUrl)}
          editMode={(toolInputs['editMode'] as 'ai' | 'text' | 'image') ?? 'ai'}
          onEditModeChange={(mode) => setToolInput('editMode', mode)}
          onNext={onNext}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          toolTitle={toolTitle}
        />
      );

    case 'segment-loop': {
      const categoryStyle = toolInputs['categoryStyle'] as { category?: string; style?: string } | null;
      return (
        <SegmentLoopStep
          segments={(toolInputs['segments'] as string[]) ?? []}
          onSegmentsChange={(segs) => setToolInput('segments', segs)}
          sourceImage={(toolInputs['sourceImage'] as string | null) ?? null}
          refImage={(toolInputs['refImage'] as string | null) ?? null}
          style={categoryStyle?.style ?? ''}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          toolTitle={toolTitle}
        />
      );
    }

    default:
      return null;
  }
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function ImmersiveInputForm({
  isOpen,
  onClose,
  industry,
  intent,
  onGenerate,
  recommendations,
  onRecommendationSelect,
  currentRecommendationIndex: initialRecommendationIndex = 0,
  initialQuery,
}: ImmersiveInputFormProps) {
  const router = useRouter();
  const t = useTranslations("common");
  const tWorkflow = useTranslations("workflow");
  const [[currentIndex, direction], setPage] = useState<[number, number]>([0, 0]);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [referenceImages, setReferenceImages] = useState<UploadedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendationIndex, setRecommendationIndex] = useState(initialRecommendationIndex);
  const [imageCount, setImageCount] = useState(1);

  // Zustand store
  const addToHistory = useWorkflowStore((state) => state.addToHistory);
  const storeInitialQuery = useWorkflowStore((state) => state.initialQuery);
  const storeImageCount = useWorkflowStore((state) => state.imageCount);
  const setStoreImageCount = useWorkflowStore((state) => state.setImageCount);
  const referenceMode = useWorkflowStore((state) => state.referenceMode);
  const setReferenceMode = useWorkflowStore((state) => state.setReferenceMode);

  // Tool mode store
  const toolMode = useWorkflowStore((state) => state.toolMode);
  const toolInputs = useWorkflowStore((state) => state.toolInputs);
  const toolStepIndex = useWorkflowStore((state) => state.toolStepIndex);
  const setToolInput = useWorkflowStore((state) => state.setToolInput);
  const setToolStepIndex = useWorkflowStore((state) => state.setToolStepIndex);
  const exitToolMode = useWorkflowStore((state) => state.exitToolMode);
  const generationResult = useWorkflowStore((state) => state.generationResult);

  // intent에서 적합한 action 가져오기
  const action = useMemo(() => {
    const actions = getActionsForIntent(industry, intent);
    return actions[0] || null;
  }, [industry, intent]);

  const industryInfo = useMemo(() => getIndustryInfo(industry), [industry]);
  const intentInfo = useMemo(() => EXPRESSION_INTENT_INFO[intent], [intent]);

  // 추천이 있는지 여부
  const hasRecommendations = recommendations && recommendations.length > 0;

  // 스텝 구성: [추천 카드] + 입력 필드들 + 이미지 업로드 + 확인
  const steps: Step[] = useMemo(() => {
    if (!action) return [];

    const stepList: Step[] = [];

    // 추천이 있으면 첫 번째 스텝으로 추가
    if (hasRecommendations) {
      stepList.push({ type: "recommend" as const });
    }

    const inputSteps: InputStep[] = action.inputs.map((input) => ({
      type: "input" as const,
      input,
    }));

    const imageStep: ImageStep = { type: "image" };
    const confirmStep: ConfirmStep = { type: "confirm" };

    return [...stepList, ...inputSteps, imageStep, confirmStep];
  }, [action, hasRecommendations]);

  // 모달 열릴 때 초기화 (isOpen 변경 시에만)
  useEffect(() => {
    if (isOpen) {
      // 모달이 열릴 때만 초기화
      setPage([0, 0]);
      setReferenceImages([]);
      setError(null);
      setRecommendationIndex(initialRecommendationIndex);
      setImageCount(storeImageCount || 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // 자동 입력 (action이나 initialQuery 변경 시)
  useEffect(() => {
    if (isOpen && action) {
      // initialQuery가 있으면 'product' 또는 '상품' 관련 필드에 자동 입력
      const queryToUse = initialQuery || storeInitialQuery;
      if (queryToUse) {
        const productInput = action.inputs.find(
          (i) => i.id === "product" || i.id === "products" || i.label.includes("상품") || i.label.includes("설명")
        );
        if (productInput) {
          // 기존 inputs 유지하면서 product 필드만 설정
          setInputs((prev) => ({ ...prev, [productInput.id]: queryToUse }));
        }
      }
    }
  }, [isOpen, action, initialQuery, storeInitialQuery]);

  // 네비게이션
  const handleNext = useCallback(() => {
    setPage(([prev]) => [
      prev >= steps.length - 1 ? prev : prev + 1,
      1,
    ]);
  }, [steps.length]);

  const handlePrev = useCallback(() => {
    setPage(([prev]) => [prev <= 0 ? 0 : prev - 1, -1]);
  }, []);

  const handleGoTo = useCallback((index: number) => {
    setPage(([prev]) => [index, index > prev ? 1 : -1]);
  }, []);

  // 키보드 네비게이션
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowRight":
          handleNext();
          break;
        case "ArrowLeft":
          handlePrev();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  // 스와이프 핸들러
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const swipe = swipePower(info.offset.x, info.velocity.x);

      if (swipe < -swipeConfidenceThreshold) {
        handleNext();
      } else if (swipe > swipeConfidenceThreshold) {
        handlePrev();
      }
    },
    [handleNext, handlePrev]
  );

  // 입력값 변경
  const handleInputChange = useCallback((inputId: string, value: string) => {
    setInputs((prev) => ({ ...prev, [inputId]: value }));
  }, []);

  // 추천 인덱스 변경
  const handleRecommendationChange = useCallback((index: number) => {
    setRecommendationIndex(index);
    if (recommendations && onRecommendationSelect) {
      onRecommendationSelect(recommendations[index]);
    }
  }, [recommendations, onRecommendationSelect]);

  // 추천 수락 (다음 스텝으로 이동)
  const handleRecommendationAccept = useCallback(() => {
    // 다음 스텝(입력 폼)으로 이동
    handleNext();
  }, [handleNext]);

  // 이미지 생성
  const handleGenerate = useCallback(async () => {
    if (!action) return;

    setIsGenerating(true);
    setError(null);

    try {
      // 1. 세션 생성
      const sessionRes = await fetch("/api/workflows/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry,
          action: action.id,
          inputs,
          referenceImages: referenceImages.map((img) => img.uploadedUrl || img.previewUrl),
        }),
      });

      if (!sessionRes.ok) {
        const data = await sessionRes.json();
        throw new Error(data.error || "세션 생성에 실패했습니다");
      }

      const session = await sessionRes.json();

      // 2. 프롬프트 생성
      const promptRes = await fetch("/api/workflows/session", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: session.id,
          generatePromptFlag: true,
        }),
      });

      if (!promptRes.ok) {
        const data = await promptRes.json();
        throw new Error(data.error || "프롬프트 생성에 실패했습니다");
      }

      const { prompt } = await promptRes.json();

      // 3. 이미지 생성 (참조 이미지 base64 사용)
      const refImagesBase64 = referenceImages
        .map((img) => img.base64Data || img.uploadedUrl)
        .filter((url): url is string => !!url);

      const generateRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          workflowSessionId: session.id,
          count: imageCount,
          refImages: refImagesBase64.length > 0 ? refImagesBase64 : undefined,
          referenceMode: refImagesBase64.length > 0 ? referenceMode : undefined,
        }),
      });

      if (!generateRes.ok) {
        const data = await generateRes.json();
        throw new Error(data.error || "이미지 생성에 실패했습니다");
      }

      const generateResult = await generateRes.json();

      // 4. 결과를 store에 저장
      const store = useWorkflowStore.getState();
      store.setGenerationResult({
        success: generateResult.success,
        images: generateResult.images || [],
        creditsUsed: generateResult.creditsUsed || action.creditCost * imageCount,
        provider: generateResult.provider || "unknown",
        model: generateResult.model || "unknown",
        duration: generateResult.duration,
        error: generateResult.error,
      });

      // 5. Store의 imageCount도 업데이트
      setStoreImageCount(imageCount);

      // 5. 히스토리에 추가
      addToHistory({
        industry,
        action: action.id,
        intent,
      });

      // 6. 콜백 또는 결과 페이지로 이동
      if (onGenerate) {
        onGenerate(session.id);
      } else {
        router.push(`/result?session=${session.id}`);
      }

      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "오류가 발생했습니다";
      setError(errorMessage);
      setIsGenerating(false);
    }
  }, [action, industry, intent, inputs, referenceImages, referenceMode, addToHistory, onGenerate, router, onClose, imageCount, setStoreImageCount]);

  // ============================================================
  // 도구 모드 전용 변수 + 핸들러
  // ============================================================
  const toolSteps = toolMode ? TOOL_STEP_DEFINITIONS[toolMode] : [];
  const currentToolStep = toolSteps[toolStepIndex] || null;

  const handleToolNext = useCallback(() => {
    if (toolStepIndex < toolSteps.length - 1) {
      setToolStepIndex(toolStepIndex + 1);
    }
  }, [toolStepIndex, toolSteps.length, setToolStepIndex]);

  const handleToolPrev = useCallback(() => {
    if (toolStepIndex > 0) {
      setToolStepIndex(toolStepIndex - 1);
    }
  }, [toolStepIndex, setToolStepIndex]);

  const handleToolGoTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < toolSteps.length) {
        setToolStepIndex(index);
      }
    },
    [toolSteps.length, setToolStepIndex]
  );

  const handleToolClose = useCallback(() => {
    exitToolMode();
    onClose();
  }, [exitToolMode, onClose]);

  // 도구 모드용 스와이프
  const handleToolDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const swipe = swipePower(info.offset.x, info.velocity.x);
      if (swipe < -swipeConfidenceThreshold) {
        handleToolNext();
      } else if (swipe > swipeConfidenceThreshold) {
        handleToolPrev();
      }
    },
    [handleToolNext, handleToolPrev]
  );

  // 도구 모드용 키보드
  useEffect(() => {
    if (!isOpen || !toolMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          handleToolClose();
          break;
        case "ArrowRight":
          handleToolNext();
          break;
        case "ArrowLeft":
          handleToolPrev();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, toolMode, handleToolClose, handleToolNext, handleToolPrev]);

  // 도구 모드용 결과 표시 상태
  const [showToolResult, setShowToolResult] = useState(false);

  // 도구 모드용 생성 핸들러
  const handleToolGenerate = useCallback(async () => {
    if (!toolMode) return;

    setIsGenerating(true);
    setError(null);

    try {
      // toolInputs → ToolGenerateRequest 매핑
      const prompt = (toolInputs.prompt as string) || "";
      const aspectRatio = (toolInputs.aspectRatio as AspectRatio) || "1:1";
      const categoryStyle = toolInputs.categoryStyle as { category?: string; style?: string } | undefined;

      const request: ToolGenerateRequest = {
        prompt,
        aspectRatio,
        count: imageCount,
        mode: toolMode,
      };

      // 스타일 추가 (POSTER, DETAIL_PAGE)
      if (categoryStyle?.style) {
        request.style = categoryStyle.style;
      }

      // sourceImage (EDIT, POSTER, DETAIL_EDIT, DETAIL_PAGE)
      if (toolInputs.sourceImage) {
        request.sourceImage = toolInputs.sourceImage as string;
      }

      // refImages: 단일 참조 이미지 (EDIT, DETAIL_PAGE)
      if (toolInputs.refImage) {
        request.refImages = [toolInputs.refImage as string];
        request.referenceMode = "style";
      }

      // refImages: 다중 이미지 (COMPOSITE)
      if (toolInputs.refImages && Array.isArray(toolInputs.refImages)) {
        request.refImages = toolInputs.refImages as string[];
        request.referenceMode = "full";
      }

      // logoImage (POSTER)
      if (toolInputs.logoImage) {
        request.logoImage = toolInputs.logoImage as string;
      }

      // maskImage (DETAIL_EDIT)
      if (toolInputs.maskImage) {
        request.maskImage = toolInputs.maskImage as string;
      }

      const result = await generateFromTool(request);

      // 결과를 store에 저장
      const store = useWorkflowStore.getState();
      store.setGenerationResult({
        success: result.success,
        images: result.images || [],
        creditsUsed: result.creditsUsed || 0,
        provider: result.provider || "unknown",
        model: result.model || "unknown",
        duration: result.duration,
        error: result.error,
      });

      if (result.success && result.images.length > 0) {
        setShowToolResult(true);
      } else {
        setError(result.error || "생성에 실패했습니다");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "생성 중 오류가 발생했습니다");
    } finally {
      setIsGenerating(false);
    }
  }, [toolMode, toolInputs, imageCount]);

  // 도구 모드 결과에서 재생성
  const handleToolRegenerate = useCallback(() => {
    setShowToolResult(false);
    // confirmation 스텝으로 돌아가기
    const confirmIdx = toolSteps.findIndex((s) => s.type === "confirmation");
    if (confirmIdx >= 0) {
      setToolStepIndex(confirmIdx);
    }
  }, [toolSteps, setToolStepIndex]);

  // 도구 모드 결과 닫기 → 입력 폼도 닫기
  const handleToolResultClose = useCallback(() => {
    setShowToolResult(false);
    handleToolClose();
  }, [handleToolClose]);

  // ============================================================
  // 도구 모드 렌더링
  // ============================================================
  if (toolMode && isOpen) {
    // 결과 표시 중이면 ImmersiveResult를 렌더링
    if (showToolResult && generationResult) {
      return (
        <ImmersiveResult
          isOpen={true}
          onClose={handleToolResultClose}
          result={generationResult}
          onRegenerate={handleToolRegenerate}
          onCreateNew={handleToolResultClose}
        />
      );
    }

    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-label={toolMode}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={handleToolClose}
          />

          <button
            onClick={handleToolClose}
            className={cn(
              "absolute top-4 right-4 z-10",
              "w-10 h-10 flex items-center justify-center",
              "bg-white/10 hover:bg-white/20 rounded-full",
              "text-white transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-white/50"
            )}
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>

          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-red-500 text-white rounded-lg text-sm">
              {error}
            </div>
          )}

          <motion.div
            className="relative w-full max-w-lg mx-4 md:mx-20 h-[calc(100vh-120px)] min-h-[500px] max-h-[700px]"
            variants={cardContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <ImmersiveNavigation
              currentIndex={toolStepIndex}
              total={toolSteps.length}
              onPrevious={handleToolPrev}
              onNext={handleToolNext}
              onGoTo={handleToolGoTo}
              variant="dark"
              size="lg"
              showOnboardingHint={false}
            />

            <AnimatePresence initial={false} custom={1} mode="wait">
              <motion.div
                key={toolStepIndex}
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={handleToolDragEnd}
                style={{ cursor: toolSteps.length > 1 ? "grab" : "default" }}
              >
                {currentToolStep && (
                  <ToolStepCard
                    step={currentToolStep}
                    stepIndex={toolStepIndex}
                    totalSteps={toolSteps.length}
                    toolMode={toolMode}
                    toolInputs={toolInputs}
                    setToolInput={setToolInput}
                    onNext={handleToolNext}
                    imageCount={imageCount}
                    onImageCountChange={setImageCount}
                    isGenerating={isGenerating}
                    onGenerate={handleToolGenerate}
                    toolSteps={toolSteps}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-4 text-white/60 text-sm">
            <span>← → {tWorkflow("ui.navigate")}</span>
            <span>•</span>
            <span>ESC {tWorkflow("ui.close")}</span>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // action이 없으면 렌더링하지 않음
  if (!action || !steps.length) return null;

  const currentStep = steps[currentIndex];
  const currentInputId = currentStep?.type === "input" ? currentStep.input.id : "";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-label="워크플로우 입력"
        >
          {/* 배경 블러 오버레이 */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
          />

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className={cn(
              "absolute top-4 right-4 z-10",
              "w-10 h-10 flex items-center justify-center",
              "bg-white/10 hover:bg-white/20 rounded-full",
              "text-white transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-white/50"
            )}
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 에러 표시 */}
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-red-500 text-white rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 카드 컨테이너 */}
          <motion.div
            className="relative w-full max-w-lg mx-4 md:mx-20 h-[calc(100vh-120px)] min-h-[500px] max-h-[700px]"
            variants={cardContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* 네비게이션 */}
            <ImmersiveNavigation
              currentIndex={currentIndex}
              total={steps.length}
              onPrevious={handlePrev}
              onNext={handleNext}
              onGoTo={handleGoTo}
              variant="dark"
              size="lg"
              showOnboardingHint={false}
            />

            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={handleDragEnd}
                style={{ cursor: steps.length > 1 ? "grab" : "default" }}
              >
                <InputCard
                  step={currentStep}
                  stepIndex={currentIndex}
                  totalSteps={steps.length}
                  value={inputs[currentInputId] || ""}
                  onChange={(v) => handleInputChange(currentInputId, v)}
                  onNext={handleNext}
                  referenceImages={referenceImages}
                  onImageChange={setReferenceImages}
                  action={action}
                  inputs={inputs}
                  isGenerating={isGenerating}
                  onGenerate={handleGenerate}
                  industryInfo={industryInfo}
                  recommendations={recommendations}
                  currentRecommendationIndex={recommendationIndex}
                  onRecommendationChange={handleRecommendationChange}
                  onRecommendationAccept={handleRecommendationAccept}
                  intentInfo={intentInfo}
                  imageCount={imageCount}
                  onImageCountChange={setImageCount}
                  referenceMode={referenceMode}
                  onReferenceModeChange={setReferenceMode}
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* 키보드 힌트 */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-4 text-white/60 text-sm">
            <span>← → {tWorkflow("ui.navigate")}</span>
            <span>•</span>
            <span>ESC {tWorkflow("ui.close")}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ImmersiveInputForm;
