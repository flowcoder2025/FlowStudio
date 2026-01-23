/**
 * ImmersiveResult Component - 몰입형 결과 화면
 * Contract: IMMERSIVE_DESIGN_RESULT
 * Evidence: Phase E - 결과 화면 몰입형
 *
 * 특징:
 * - 생성된 이미지 대형 풀스크린 표시
 * - 스와이프로 이미지 간 이동
 * - 저장/공유/재생성/다운로드 버튼
 * - 키보드 네비게이션 지원
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  X,
  Download,
  Share2,
  RefreshCw,
  Heart,
  Sparkles,
  Check,
  Copy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import { ImmersiveNavigation } from "@/components/immersive/ImmersiveNavigation";
import { Button } from "@/components/ui/button";
import { useWorkflowStore, GenerationResult } from "@/lib/workflow/store";

// ============================================================
// 타입 정의
// ============================================================

export interface GeneratedImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  provider: string;
  model: string;
}

export interface ImmersiveResultProps {
  isOpen: boolean;
  onClose: () => void;
  result: GenerationResult;
  onRegenerate?: () => void;
  onCreateNew?: () => void;
}

// ============================================================
// 애니메이션 Variants
// ============================================================

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const contentVariants = {
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
    x: direction > 0 ? 500 : -500,
    opacity: 0,
    scale: 0.9,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 500 : -500,
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.25 },
  }),
};

const buttonVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 + i * 0.05, duration: 0.3 },
  }),
};

// ============================================================
// 스와이프 설정
// ============================================================

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) =>
  Math.abs(offset) * velocity;

// ============================================================
// 액션 버튼 컴포넌트
// ============================================================

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "success";
  disabled?: boolean;
  loading?: boolean;
  index: number;
}

function ActionButton({
  icon,
  label,
  onClick,
  variant = "secondary",
  disabled,
  loading,
  index,
}: ActionButtonProps) {
  const variantStyles = {
    primary: "bg-primary-500 hover:bg-primary-600 text-white",
    secondary: "bg-white/10 hover:bg-white/20 text-white",
    success: "bg-green-500 hover:bg-green-600 text-white",
  };

  return (
    <motion.button
      custom={index}
      variants={buttonVariants}
      initial="hidden"
      animate="visible"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "flex flex-col items-center gap-2 px-4 py-3 rounded-xl transition-all",
        "focus:outline-none focus:ring-2 focus:ring-white/50",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant]
      )}
    >
      <span className="w-6 h-6">{loading ? <LoadingSpinner /> : icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </motion.button>
  );
}

function LoadingSpinner() {
  return (
    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
  );
}

// ============================================================
// 이미지 카드 컴포넌트
// ============================================================

interface ImageCardProps {
  image: GeneratedImage;
  index: number;
  total: number;
  onDownload: () => void;
  onSave: () => void;
  onShare: () => void;
  saving: boolean;
  saved: boolean;
}

function ImageCard({
  image,
  index,
  total,
  onDownload,
  onSave,
  onShare,
  saving,
  saved,
}: ImageCardProps) {
  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
      {/* 이미지 카운터 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full text-white text-sm font-medium">
          {index + 1} / {total}
        </div>
      </div>

      {/* 메인 이미지 */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-2xl aspect-square rounded-2xl overflow-hidden shadow-2xl bg-gray-900"
        >
          <Image
            src={image.url}
            alt={image.prompt}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 80vw"
            priority
          />
        </motion.div>
      </div>

      {/* 하단 액션 버튼 */}
      <div className="flex justify-center gap-4 px-4 pb-8 md:pb-12">
        <ActionButton
          icon={<Download className="w-full h-full" />}
          label="다운로드"
          onClick={onDownload}
          index={0}
        />
        <ActionButton
          icon={saved ? <Check className="w-full h-full" /> : <Heart className="w-full h-full" />}
          label={saved ? "저장됨" : "저장"}
          onClick={onSave}
          variant={saved ? "success" : "secondary"}
          loading={saving}
          disabled={saved}
          index={1}
        />
        <ActionButton
          icon={<Share2 className="w-full h-full" />}
          label="공유"
          onClick={onShare}
          index={2}
        />
      </div>

      {/* 프롬프트 정보 (토글 가능) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-24 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-lg"
      >
        <div className="px-4 py-3 bg-black/40 backdrop-blur-sm rounded-xl text-white/80 text-sm line-clamp-2 text-center">
          {image.prompt}
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function ImmersiveResult({
  isOpen,
  onClose,
  result,
  onRegenerate,
  onCreateNew,
}: ImmersiveResultProps) {
  const router = useRouter();
  const [[currentIndex, direction], setPage] = useState<[number, number]>([0, 0]);
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [savedStates, setSavedStates] = useState<Record<string, boolean>>({});
  const [shareSuccess, setShareSuccess] = useState(false);

  // Zustand store
  const resetWorkflow = useWorkflowStore((state) => state.resetWorkflow);

  const images = result.images || [];

  // 인덱스 초기화
  useEffect(() => {
    if (isOpen) {
      setPage([0, 0]);
      setShareSuccess(false);
    }
  }, [isOpen]);

  // 네비게이션
  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setPage(([prev]) => [
      prev >= images.length - 1 ? 0 : prev + 1,
      1,
    ]);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setPage(([prev]) => [prev <= 0 ? images.length - 1 : prev - 1, -1]);
  }, [images.length]);

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

  // 다운로드
  const handleDownload = useCallback(async (image: GeneratedImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `flowstudio_${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  }, []);

  // 갤러리에 저장
  const handleSave = useCallback(async (image: GeneratedImage) => {
    if (savedStates[image.id]) return;

    setSavingStates((prev) => ({ ...prev, [image.id]: true }));

    try {
      const response = await fetch("/api/images/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: image.url,
          title: "Generated Image",
          prompt: image.prompt,
          negativePrompt: image.negativePrompt,
          provider: image.provider,
          model: image.model,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSavedStates((prev) => ({ ...prev, [image.id]: true }));
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setSavingStates((prev) => ({ ...prev, [image.id]: false }));
    }
  }, [savedStates]);

  // 공유
  const handleShare = useCallback(async (image: GeneratedImage) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "FlowStudio 이미지",
          text: image.prompt,
          url: image.url,
        });
      } else {
        // Fallback: 클립보드에 URL 복사
        await navigator.clipboard.writeText(image.url);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      }
    } catch (error) {
      // 사용자가 공유 취소한 경우 무시
      if ((error as Error).name !== "AbortError") {
        console.error("Share failed:", error);
      }
    }
  }, []);

  // 다시 생성
  const handleRegenerate = useCallback(() => {
    onClose();
    if (onRegenerate) {
      onRegenerate();
    } else {
      router.back();
    }
  }, [onClose, onRegenerate, router]);

  // 새로 만들기
  const handleCreateNew = useCallback(() => {
    onClose();
    if (onCreateNew) {
      onCreateNew();
    } else {
      resetWorkflow();
      router.push("/");
    }
  }, [onClose, onCreateNew, resetWorkflow, router]);

  // 결과가 없거나 실패한 경우
  if (!result.success || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-label="생성 결과"
        >
          {/* 배경 */}
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={onClose}
          />

          {/* 헤더 */}
          <motion.div
            variants={contentVariants}
            className="relative z-10 flex items-center justify-between px-4 py-3 md:px-6 md:py-4"
          >
            {/* 왼쪽: 정보 */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full">
                <Sparkles className="w-4 h-4 text-primary-400" />
                <span className="text-white text-sm font-medium">
                  {images.length}장 생성됨
                </span>
              </div>
              <span className="text-white/60 text-sm hidden md:inline">
                {result.creditsUsed} 크레딧 사용
              </span>
            </div>

            {/* 오른쪽: 액션 버튼 */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCreateNew}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">새로 만들기</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">다시 생성</span>
              </Button>
              <button
                onClick={onClose}
                className={cn(
                  "w-10 h-10 flex items-center justify-center",
                  "bg-white/10 hover:bg-white/20 rounded-full",
                  "text-white transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-white/50"
                )}
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* 공유 성공 토스트 */}
          <AnimatePresence>
            {shareSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-20 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-green-500 text-white rounded-lg text-sm flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                URL이 클립보드에 복사되었습니다
              </motion.div>
            )}
          </AnimatePresence>

          {/* 메인 콘텐츠 */}
          <motion.div
            variants={contentVariants}
            className="relative flex-1 flex items-center justify-center overflow-hidden"
          >
            {/* 좌우 화살표 (데스크톱) */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className={cn(
                    "absolute left-4 z-10 hidden md:flex",
                    "w-12 h-12 items-center justify-center",
                    "bg-white/10 hover:bg-white/20 rounded-full",
                    "text-white transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-white/50"
                  )}
                  aria-label="이전 이미지"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className={cn(
                    "absolute right-4 z-10 hidden md:flex",
                    "w-12 h-12 items-center justify-center",
                    "bg-white/10 hover:bg-white/20 rounded-full",
                    "text-white transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-white/50"
                  )}
                  aria-label="다음 이미지"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* 이미지 슬라이더 */}
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 flex items-center justify-center"
                drag={images.length > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={handleDragEnd}
                style={{ cursor: images.length > 1 ? "grab" : "default" }}
              >
                <ImageCard
                  image={currentImage}
                  index={currentIndex}
                  total={images.length}
                  onDownload={() => handleDownload(currentImage)}
                  onSave={() => handleSave(currentImage)}
                  onShare={() => handleShare(currentImage)}
                  saving={savingStates[currentImage.id] || false}
                  saved={savedStates[currentImage.id] || false}
                />
              </motion.div>
            </AnimatePresence>

            {/* 네비게이션 도트 (다중 이미지일 때만) */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                <ImmersiveNavigation
                  currentIndex={currentIndex}
                  total={images.length}
                  onPrevious={handlePrev}
                  onNext={handleNext}
                  onGoTo={handleGoTo}
                  variant="dark"
                  size="md"
                  showOnboardingHint={false}
                />
              </div>
            )}
          </motion.div>

          {/* 하단 힌트 */}
          <motion.div
            variants={contentVariants}
            className="relative z-10 pb-4 text-center"
          >
            {images.length > 1 && (
              <p className="text-white/40 text-sm hidden md:block">
                ← → 키보드 또는 스와이프로 이동 • ESC로 닫기
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ImmersiveResult;
