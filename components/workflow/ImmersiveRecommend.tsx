/**
 * ImmersiveRecommend Component - 몰입형 추천 오버레이
 * Contract: Immersive Recommendation UX
 * Evidence: 검색 추천 몰입형 UX 개선 계획
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import { WorkflowRecommendation } from "@/lib/workflow/recommend";
import { RecommendHero } from "./RecommendHero";
import { ImmersiveNavigation } from "@/components/immersive/ImmersiveNavigation";

// ============================================================
// 타입 정의
// ============================================================

export interface ImmersiveRecommendProps {
  isOpen: boolean;
  onClose: () => void;
  recommendations: WorkflowRecommendation[];
  onSelect: (recommendation: WorkflowRecommendation) => void;
}

// ============================================================
// 애니메이션 Variants
// ============================================================

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 }
  },
};

const cardContainerVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const }
  },
  exit: {
    scale: 0.95,
    opacity: 0,
    transition: { duration: 0.15 }
  },
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
// 메인 컴포넌트
// ============================================================

export function ImmersiveRecommend({
  isOpen,
  onClose,
  recommendations,
  onSelect,
}: ImmersiveRecommendProps) {
  const [[currentIndex, direction], setPage] = useState<[number, number]>([0, 0]);

  // 인덱스 초기화 (오버레이 열릴 때)
  useEffect(() => {
    if (isOpen) {
      setPage([0, 0]);
    }
  }, [isOpen]);

  // 다음 추천으로 이동 (순환)
  const handleNext = useCallback(() => {
    setPage(([prev]) => [
      prev >= recommendations.length - 1 ? 0 : prev + 1,
      1, // direction: 오른쪽에서 들어옴
    ]);
  }, [recommendations.length]);

  // 이전 추천으로 이동 (순환)
  const handlePrev = useCallback(() => {
    setPage(([prev]) => [
      prev <= 0 ? recommendations.length - 1 : prev - 1,
      -1, // direction: 왼쪽에서 들어옴
    ]);
  }, [recommendations.length]);

  // 현재 추천 선택
  const handleAccept = useCallback(() => {
    const currentRec = recommendations[currentIndex];
    if (currentRec) {
      onSelect(currentRec);
      onClose();
    }
  }, [recommendations, currentIndex, onSelect, onClose]);

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
        case "Enter":
          handleAccept();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev, handleAccept]);

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

  // 빈 추천 또는 닫힘 상태면 렌더링하지 않음
  if (!recommendations.length) return null;

  const currentRecommendation = recommendations[currentIndex];

  return (
    <AnimatePresence>
      {isOpen && currentRecommendation && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-label="워크플로우 추천"
        >
          {/* 배경 블러 오버레이 */}
          <div
            className={cn(
              "absolute inset-0 bg-black/60 backdrop-blur-sm",
              "cursor-pointer"
            )}
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

          {/* 카드 컨테이너 */}
          <motion.div
            className="relative w-full max-w-lg mx-4 md:mx-20 h-[600px] md:h-[650px]"
            variants={cardContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* 좌우 네비게이션 버튼 - 카드 외부 */}
            <ImmersiveNavigation
              currentIndex={currentIndex}
              total={recommendations.length}
              onPrevious={handlePrev}
              onNext={handleNext}
              onGoTo={(index) => setPage([index, index > currentIndex ? 1 : -1])}
              variant="dark"
              size="lg"
              showOnboardingHint={recommendations.length > 1}
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
                style={{ cursor: recommendations.length > 1 ? "grab" : "default" }}
              >
                <RecommendHero
                  recommendation={currentRecommendation}
                  onAccept={handleAccept}
                  onReject={handleNext}
                  currentIndex={currentIndex}
                  total={recommendations.length}
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* 키보드 힌트 (데스크톱) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-4 text-white/60 text-sm">
            <span>← → 이동</span>
            <span>•</span>
            <span>Enter 선택</span>
            <span>•</span>
            <span>ESC 닫기</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ImmersiveRecommend;
