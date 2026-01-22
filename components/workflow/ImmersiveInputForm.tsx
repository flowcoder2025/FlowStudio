/**
 * ImmersiveInputForm Component - 몰입형 입력 폼
 * Contract: IMMERSIVE_DESIGN_INPUT_FORM
 * Evidence: Phase D - 입력 폼 몰입형 전환
 *
 * 특징:
 * - 각 입력 필드를 개별 스텝 카드로 표시
 * - 스와이프 네비게이션 지원
 * - 프롬프트 미리보기 제외
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, Loader2, Upload, Check } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import { ImmersiveNavigation } from "@/components/immersive/ImmersiveNavigation";
import { ImageUpload, UploadedImage } from "@/components/workflow/ImageUpload";
import { Button } from "@/components/ui/button";
import { Action, ActionInput } from "@/lib/workflow/actions";
import { getActionsForIntent } from "@/lib/workflow/intents";
import { getIndustryInfo, Industry } from "@/lib/workflow/industries";
import { ExpressionIntent, EXPRESSION_INTENT_INFO } from "@/lib/workflow/intents";
import { useWorkflowStore } from "@/lib/workflow/store";

// ============================================================
// 타입 정의
// ============================================================

export interface ImmersiveInputFormProps {
  isOpen: boolean;
  onClose: () => void;
  industry: Industry;
  intent: ExpressionIntent;
  onGenerate?: (sessionId: string) => void;
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

type Step = InputStep | ImageStep | ConfirmStep;

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
  referenceImages: UploadedImage[];
  onImageChange: (images: UploadedImage[]) => void;
  action: Action;
  inputs: Record<string, string>;
  isGenerating: boolean;
  onGenerate: () => void;
  industryInfo: ReturnType<typeof getIndustryInfo>;
  intentInfo: (typeof EXPRESSION_INTENT_INFO)[ExpressionIntent];
}

function InputCard({
  step,
  stepIndex,
  totalSteps,
  value,
  onChange,
  referenceImages,
  onImageChange,
  action,
  inputs,
  isGenerating,
  onGenerate,
  industryInfo,
  intentInfo,
}: InputCardProps) {
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(URL.createObjectURL(file));
      }, 500);
    });
  }, []);

  // 입력 필드 렌더링
  if (step.type === "input") {
    const input = step.input;
    return (
      <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{industryInfo?.icon}</span>
            <span className="text-sm font-medium text-gray-600">
              {intentInfo?.nameKo}
            </span>
          </div>
          <div className="text-sm text-gray-500 font-medium">
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
            <label className="block text-lg font-semibold text-gray-900 mb-2">
              {input.label}
              {input.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {input.type === "textarea" ? (
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={input.placeholder || `${input.label}을(를) 입력해주세요`}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-base"
                autoFocus
              />
            ) : input.type === "select" ? (
              <div className="grid grid-cols-2 gap-3">
                {input.options?.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all",
                      value === opt.value
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-200 hover:border-gray-300"
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
                placeholder={input.placeholder || `${input.label}을(를) 입력해주세요`}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                autoFocus
              />
            )}
          </motion.div>
        </div>

        {/* 하단 힌트 */}
        <div className="px-6 pb-6 text-center">
          <p className="text-sm text-gray-400">
            ← 스와이프하여 이동 →
          </p>
        </div>
      </div>
    );
  }

  // 이미지 업로드 카드
  if (step.type === "image") {
    return (
      <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-600">참조 이미지</span>
          </div>
          <div className="text-sm text-gray-500 font-medium">
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              참조 이미지 (선택)
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              비슷한 스타일의 이미지를 업로드하면 더 정확한 결과를 얻을 수 있습니다.
            </p>

            <ImageUpload
              value={referenceImages}
              onChange={onImageChange}
              onUpload={handleImageUpload}
              maxFiles={3}
              maxFileSize={5 * 1024 * 1024}
            />
          </motion.div>
        </div>

        {/* 하단 힌트 */}
        <div className="px-6 pb-6 text-center">
          <p className="text-sm text-gray-400">
            스킵하려면 다음으로 스와이프 →
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
      <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-primary-600">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">이미지 생성</span>
          </div>
          <div className="text-sm text-gray-500 font-medium">
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
            className="text-2xl font-bold text-gray-900 mb-3"
          >
            {isValid ? "준비 완료!" : "입력을 완료해주세요"}
          </motion.h2>

          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="text-gray-600 mb-6"
          >
            {isValid
              ? "아래 버튼을 눌러 이미지를 생성하세요"
              : `${requiredInputs.length - filledInputs.length}개 항목이 비어있습니다`}
          </motion.p>

          {/* 입력 요약 */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="w-full max-w-sm text-left space-y-2 mb-6"
          >
            {action.inputs.map((input) => {
              const val = inputs[input.id];
              const isFilled = val?.trim();
              return (
                <div
                  key={input.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg text-sm",
                    isFilled ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"
                  )}
                >
                  {isFilled ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span>{input.label}</span>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-5 md:p-6 bg-gray-50">
          <Button
            onClick={onGenerate}
            disabled={!isValid || isGenerating}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                생성 중...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                이미지 생성하기 ({action.creditCost} 크레딧)
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
// 메인 컴포넌트
// ============================================================

export function ImmersiveInputForm({
  isOpen,
  onClose,
  industry,
  intent,
  onGenerate,
}: ImmersiveInputFormProps) {
  const router = useRouter();
  const [[currentIndex, direction], setPage] = useState<[number, number]>([0, 0]);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [referenceImages, setReferenceImages] = useState<UploadedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Zustand store
  const addToHistory = useWorkflowStore((state) => state.addToHistory);

  // intent에서 적합한 action 가져오기
  const action = useMemo(() => {
    const actions = getActionsForIntent(industry, intent);
    return actions[0] || null;
  }, [industry, intent]);

  const industryInfo = useMemo(() => getIndustryInfo(industry), [industry]);
  const intentInfo = useMemo(() => EXPRESSION_INTENT_INFO[intent], [intent]);

  // 스텝 구성: 입력 필드들 + 이미지 업로드 + 확인
  const steps: Step[] = useMemo(() => {
    if (!action) return [];

    const inputSteps: InputStep[] = action.inputs.map((input) => ({
      type: "input" as const,
      input,
    }));

    const imageStep: ImageStep = { type: "image" };
    const confirmStep: ConfirmStep = { type: "confirm" };

    return [...inputSteps, imageStep, confirmStep];
  }, [action]);

  // 인덱스 초기화
  useEffect(() => {
    if (isOpen) {
      setPage([0, 0]);
      setInputs({});
      setReferenceImages([]);
      setError(null);
    }
  }, [isOpen]);

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

  // 이미지 생성
  const handleGenerate = useCallback(async () => {
    if (!action) return;

    setIsGenerating(true);
    setError(null);

    try {
      // 세션 생성
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

      // 히스토리에 추가
      addToHistory({
        industry,
        action: action.id,
        intent,
      });

      // 콜백 또는 결과 페이지로 이동
      if (onGenerate) {
        onGenerate(session.id);
      } else {
        router.push(`/result?sessionId=${session.id}`);
      }

      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "오류가 발생했습니다";
      setError(errorMessage);
      setIsGenerating(false);
    }
  }, [action, industry, intent, inputs, referenceImages, addToHistory, onGenerate, router, onClose]);

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
            className="relative w-full max-w-lg mx-4 md:mx-20 h-[600px] md:h-[650px]"
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
                  referenceImages={referenceImages}
                  onImageChange={setReferenceImages}
                  action={action}
                  inputs={inputs}
                  isGenerating={isGenerating}
                  onGenerate={handleGenerate}
                  industryInfo={industryInfo}
                  intentInfo={intentInfo}
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* 키보드 힌트 */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-4 text-white/60 text-sm">
            <span>← → 이동</span>
            <span>•</span>
            <span>ESC 닫기</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ImmersiveInputForm;
