/**
 * ImmersiveActionSelect Component - 몰입형 액션 선택
 * 업종 선택 후 액션(스타일)을 카드 스와이프로 선택
 */

"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Industry, getIndustryInfo } from "@/lib/workflow/industries";
import { Action, getIndustryActions } from "@/lib/workflow/actions";
import {
  ImmersiveNavigation,
  useSwipeNavigation,
  useImmersiveKeyboard,
  useActionSelectHintOnboarding,
} from "@/components/immersive";

// ============================================================
// Types
// ============================================================

export interface ImmersiveActionSelectProps {
  /** 선택된 업종 */
  industry: Industry;
  /** 오버레이 표시 여부 */
  isOpen: boolean;
  /** 닫기 핸들러 */
  onClose: () => void;
  /** 액션 선택 핸들러 */
  onSelect: (action: Action) => void;
  /** 일반 모드로 전환 */
  onSwitchToList?: () => void;
}

// ============================================================
// Animation Variants
// ============================================================

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

const cardContainerVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const },
  },
  exit: {
    scale: 0.95,
    opacity: 0,
    transition: { duration: 0.15 },
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
// Swipe Config
// ============================================================

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) =>
  Math.abs(offset) * velocity;

// ============================================================
// Action Card Component
// ============================================================

interface ActionCardProps {
  action: Action;
  industryInfo: ReturnType<typeof getIndustryInfo>;
  currentIndex: number;
  total: number;
  onSelect: () => void;
  onNext: () => void;
}

function ActionCard({
  action,
  industryInfo,
  currentIndex,
  total,
  onSelect,
  onNext,
}: ActionCardProps) {
  // 액션에 대한 추가 정보 생성
  const actionMeta = {
    icon: getActionIcon(action.id),
    features: getActionFeatures(action),
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full w-full max-w-lg mx-auto",
        "bg-white rounded-2xl shadow-2xl overflow-hidden"
      )}
    >
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 text-primary-600">
          <span className="text-xl">{industryInfo.icon}</span>
          <span className="text-sm font-medium">{industryInfo.nameKo}</span>
        </div>
        <div className="text-sm text-gray-500 font-medium">
          {currentIndex + 1} / {total}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 text-center">
        {/* 액션 아이콘 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center text-4xl md:text-5xl mb-4 bg-gradient-to-br from-primary-50 to-primary-100"
        >
          {actionMeta.icon}
        </motion.div>

        {/* 액션 타이틀 */}
        <motion.h2
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="text-2xl md:text-3xl font-bold text-gray-900 mb-3"
        >
          {action.nameKo}
        </motion.h2>

        {/* 설명 */}
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="text-gray-600 mb-6 max-w-sm leading-relaxed"
        >
          {action.description}
        </motion.p>

        {/* 기능 태그 */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="flex flex-wrap justify-center gap-2 mb-6"
        >
          {actionMeta.features.map((feature, index) => (
            <span
              key={`${feature}-${index}`}
              className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
            >
              {feature}
            </span>
          ))}
        </motion.div>

        {/* 크레딧 정보 */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="flex items-center gap-2 text-sm text-gray-500"
        >
          <Sparkles className="w-4 h-4 text-yellow-500" />
          <span>{action.creditCost} 크레딧</span>
          <span className="text-gray-300">•</span>
          <span>{action.inputs.length}개 입력 항목</span>
        </motion.div>
      </div>

      {/* 하단 버튼 영역 */}
      <div className="p-5 md:p-6 bg-gray-50 space-y-3">
        <Button
          onClick={onSelect}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          이 스타일로 시작하기
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        {total > 1 && (
          <Button
            onClick={onNext}
            variant="ghost"
            className="w-full h-10 text-gray-600 hover:text-gray-900"
          >
            다른 스타일 보기
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}

        {/* 도트 인디케이터 */}
        <DotIndicator current={currentIndex} total={total} />
      </div>
    </div>
  );
}

// ============================================================
// Dot Indicator
// ============================================================

function DotIndicator({ current, total }: { current: number; total: number }) {
  if (total <= 1) return null;

  const maxDots = 7;
  const showDots = Math.min(total, maxDots);

  return (
    <div className="flex items-center justify-center gap-1.5 pt-2">
      {Array.from({ length: showDots }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "w-2 h-2 rounded-full transition-all duration-200",
            index === current % showDots
              ? "bg-primary-600 scale-125"
              : "bg-gray-300"
          )}
        />
      ))}
      {total > maxDots && (
        <span className="text-xs text-gray-400 ml-1">+{total - maxDots}</span>
      )}
    </div>
  );
}

// ============================================================
// Helper Functions
// ============================================================

function getActionIcon(actionId: string): string {
  const iconMap: Record<string, string> = {
    // Fashion
    "fashion-model-shot": "👗",
    "fashion-flatlay": "📸",
    "fashion-lookbook": "📖",
    "fashion-detail": "🔍",
    // Food
    "food-hero": "🍽️",
    "food-menu": "📋",
    "food-lifestyle": "☕",
    // Beauty
    "beauty-product": "💄",
    "beauty-lifestyle": "✨",
    "beauty-swatch": "🎨",
    // Interior
    "interior-room-scene": "🛋️",
    // Electronics
    "electronics-product": "📱",
    // Jewelry
    "jewelry-glamour": "💎",
    // Sports
    "sports-action": "🏃",
    // Pet
    "pet-product": "🐾",
    // Kids
    "kids-playful": "🎈",
  };

  return iconMap[actionId] || "📷";
}

function getActionFeatures(action: Action): string[] {
  const features: string[] = [];

  // 입력 필드 기반 기능 추출
  const inputTypes = action.inputs.map((i) => i.type);
  if (inputTypes.includes("image")) features.push("이미지 업로드");
  if (inputTypes.includes("color")) features.push("색상 선택");
  if (inputTypes.includes("select")) features.push("스타일 선택");

  // 기본 기능 추가
  features.push("AI 생성");
  if (action.creditCost <= 3) features.push("저렴한 가격");
  if (action.creditCost >= 8) features.push("고품질");

  return features.slice(0, 4);
}

// ============================================================
// Main Component
// ============================================================

export function ImmersiveActionSelect({
  industry,
  isOpen,
  onClose,
  onSelect,
  onSwitchToList,
}: ImmersiveActionSelectProps) {
  const router = useRouter();
  const industryInfo = getIndustryInfo(industry);
  const actions = getIndustryActions(industry);
  const { shouldShow: showHint } = useActionSelectHintOnboarding();

  // 스와이프 네비게이션
  const {
    currentIndex,
    direction,
    goNext,
    goPrev,
    goTo,
    setPage,
  } = useSwipeNavigation({
    total: actions.length,
    initialIndex: 0,
    loop: true,
  });

  // 현재 액션 선택
  const handleSelect = useCallback(() => {
    const currentAction = actions[currentIndex];
    if (currentAction) {
      onSelect(currentAction);
      onClose();
      router.push(`/workflow/${industry}/${currentAction.id}`);
    }
  }, [actions, currentIndex, onSelect, onClose, router, industry]);

  // 키보드 네비게이션
  useImmersiveKeyboard({
    enabled: isOpen,
    onLeft: goPrev,
    onRight: goNext,
    onEnter: handleSelect,
    onEscape: onClose,
  });

  // 인덱스 초기화 (오버레이 열릴 때)
  useEffect(() => {
    if (isOpen) {
      setPage([0, 0]);
    }
  }, [isOpen, setPage]);

  // 스와이프 핸들러
  const onDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const swipe = swipePower(info.offset.x, info.velocity.x);

      if (swipe < -swipeConfidenceThreshold) {
        goNext();
      } else if (swipe > swipeConfidenceThreshold) {
        goPrev();
      }
    },
    [goNext, goPrev]
  );

  if (!actions.length) return null;

  const currentAction = actions[currentIndex];

  return (
    <AnimatePresence>
      {isOpen && currentAction && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-label="액션 선택"
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

          {/* 리스트 모드 전환 버튼 */}
          {onSwitchToList && (
            <button
              onClick={onSwitchToList}
              className={cn(
                "absolute top-4 left-4 z-10",
                "px-4 py-2 rounded-full",
                "bg-white/10 hover:bg-white/20",
                "text-white text-sm font-medium",
                "transition-colors"
              )}
            >
              리스트로 보기
            </button>
          )}

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
              total={actions.length}
              onPrevious={goPrev}
              onNext={goNext}
              onGoTo={goTo}
              variant="dark"
              size="lg"
              showOnboardingHint={showHint && actions.length > 1}
              mobileHintMessage="스와이프해서 다른 스타일 보기"
              desktopHintMessage="← → 화살표 키로 스타일 탐색"
            />

            {/* 카드 슬라이드 */}
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
                onDragEnd={onDragEnd}
                style={{ cursor: actions.length > 1 ? "grab" : "default" }}
              >
                <ActionCard
                  action={currentAction}
                  industryInfo={industryInfo}
                  currentIndex={currentIndex}
                  total={actions.length}
                  onSelect={handleSelect}
                  onNext={goNext}
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* 하단 키보드 힌트 */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-4 text-white/60 text-sm whitespace-nowrap">
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

export default ImmersiveActionSelect;
