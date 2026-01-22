/**
 * ImmersiveNavigation Component - 몰입형 네비게이션 컴포넌트
 * 좌우 버튼, 도트 인디케이터, 온보딩 힌트 포함
 */

"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Hand } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSwipeHintOnboarding } from "./hooks/useOnboarding";

// ============================================================
// Types
// ============================================================

export interface ImmersiveNavigationProps {
  /** 현재 인덱스 */
  currentIndex: number;
  /** 전체 아이템 수 */
  total: number;
  /** 이전으로 이동 */
  onPrevious: () => void;
  /** 다음으로 이동 */
  onNext: () => void;
  /** 특정 인덱스로 이동 */
  onGoTo?: (index: number) => void;
  /** 버튼 스타일 변형 */
  variant?: "light" | "dark";
  /** 버튼 크기 */
  size?: "sm" | "md" | "lg";
  /** 온보딩 힌트 표시 여부 */
  showOnboardingHint?: boolean;
  /** 온보딩 힌트 메시지 (모바일) */
  mobileHintMessage?: string;
  /** 온보딩 힌트 메시지 (데스크톱) */
  desktopHintMessage?: string;
  /** 추가 className */
  className?: string;
  /** 레이아웃 모드: absolute(기본) 또는 inline */
  layout?: "absolute" | "inline";
}

// ============================================================
// Constants
// ============================================================

const sizeConfig = {
  sm: {
    button: "w-8 h-8",
    icon: "w-4 h-4",
    dot: "w-1.5 h-1.5",
  },
  md: {
    button: "w-10 h-10",
    icon: "w-5 h-5",
    dot: "w-2 h-2",
  },
  lg: {
    button: "w-12 h-12",
    icon: "w-6 h-6",
    dot: "w-2.5 h-2.5",
  },
};

const variantConfig = {
  light: {
    button: "bg-white/80 hover:bg-white text-gray-700",
    buttonDisabled: "bg-white/40 text-gray-300",
    dotActive: "bg-primary-600",
    dotInactive: "bg-gray-300",
    hint: "bg-white/90 text-gray-600",
  },
  dark: {
    button: "bg-black/40 hover:bg-black/60 text-white",
    buttonDisabled: "bg-black/20 text-white/40",
    dotActive: "bg-white",
    dotInactive: "bg-white/40",
    hint: "bg-black/70 text-white",
  },
};

// ============================================================
// Sub Components
// ============================================================

interface NavigationButtonProps {
  direction: "prev" | "next";
  onClick: () => void;
  disabled?: boolean;
  variant: "light" | "dark";
  size: "sm" | "md" | "lg";
  className?: string;
}

function NavigationButton({
  direction,
  onClick,
  disabled = false,
  variant,
  size,
  className,
}: NavigationButtonProps) {
  const config = sizeConfig[size];
  const colors = variantConfig[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center rounded-full",
        "transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary-500/50",
        "shadow-lg backdrop-blur-sm",
        config.button,
        disabled ? colors.buttonDisabled : colors.button,
        disabled && "cursor-not-allowed",
        className
      )}
      aria-label={direction === "prev" ? "이전" : "다음"}
    >
      {direction === "prev" ? (
        <ChevronLeft className={config.icon} />
      ) : (
        <ChevronRight className={config.icon} />
      )}
    </button>
  );
}

interface DotIndicatorProps {
  current: number;
  total: number;
  variant: "light" | "dark";
  size: "sm" | "md" | "lg";
  onGoTo?: (index: number) => void;
}

function DotIndicator({ current, total, variant, size, onGoTo }: DotIndicatorProps) {
  if (total <= 1) return null;

  const config = sizeConfig[size];
  const colors = variantConfig[variant];

  // 최대 7개까지만 표시
  const maxDots = 7;
  const displayDots = Math.min(total, maxDots);

  // 현재 인덱스가 중간에 오도록 오프셋 계산
  let startIndex = 0;
  if (total > maxDots) {
    const half = Math.floor(maxDots / 2);
    startIndex = Math.max(0, Math.min(current - half, total - maxDots));
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: displayDots }).map((_, i) => {
        const index = startIndex + i;
        const isActive = index === current;

        return (
          <button
            key={index}
            onClick={() => onGoTo?.(index)}
            disabled={!onGoTo}
            className={cn(
              "rounded-full transition-all duration-200",
              config.dot,
              isActive ? cn(colors.dotActive, "scale-125") : colors.dotInactive,
              onGoTo && "cursor-pointer hover:scale-110",
              !onGoTo && "cursor-default"
            )}
            aria-label={`${index + 1}번으로 이동`}
            aria-current={isActive ? "true" : "false"}
          />
        );
      })}
      {total > maxDots && (
        <span className={cn("text-xs ml-1", variant === "dark" ? "text-white/60" : "text-gray-400")}>
          +{total - maxDots}
        </span>
      )}
    </div>
  );
}

interface OnboardingHintProps {
  mobileMessage: string;
  desktopMessage: string;
  variant: "light" | "dark";
  onDismiss: () => void;
}

function OnboardingHint({
  mobileMessage,
  desktopMessage,
  variant,
  onDismiss,
}: OnboardingHintProps) {
  const colors = variantConfig[variant];
  const [isVisible, setIsVisible] = useState(true);

  // 5초 후 자동 숨김
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  // 클릭으로 즉시 숨김
  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          onClick={handleDismiss}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full",
            "backdrop-blur-sm shadow-lg",
            "text-sm font-medium",
            "cursor-pointer",
            colors.hint
          )}
        >
          <Hand className="w-4 h-4 animate-pulse" />
          {/* 모바일 메시지 */}
          <span className="md:hidden">{mobileMessage}</span>
          {/* 데스크톱 메시지 */}
          <span className="hidden md:inline">{desktopMessage}</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// Main Component
// ============================================================

export function ImmersiveNavigation({
  currentIndex,
  total,
  onPrevious,
  onNext,
  onGoTo,
  variant = "dark",
  size = "md",
  showOnboardingHint = true,
  mobileHintMessage = "스와이프해서 다른 추천 보기",
  desktopHintMessage = "← → 화살표 키로 탐색하세요",
  className,
  layout = "absolute",
}: ImmersiveNavigationProps) {
  const { shouldShow: shouldShowHint, dismiss: dismissHint } = useSwipeHintOnboarding();

  // 아이템이 1개 이하면 네비게이션 표시 안함
  if (total <= 1) return null;

  // 인라인 레이아웃
  if (layout === "inline") {
    return (
      <div className={cn("flex flex-col items-center gap-3", className)}>
        <div className="flex items-center gap-3">
          <NavigationButton
            direction="prev"
            onClick={onPrevious}
            variant={variant}
            size={size}
          />

          <DotIndicator
            current={currentIndex}
            total={total}
            variant={variant}
            size={size}
            onGoTo={onGoTo}
          />

          <NavigationButton
            direction="next"
            onClick={onNext}
            variant={variant}
            size={size}
          />
        </div>

        {showOnboardingHint && shouldShowHint && (
          <OnboardingHint
            mobileMessage={mobileHintMessage}
            desktopMessage={desktopHintMessage}
            variant={variant}
            onDismiss={dismissHint}
          />
        )}
      </div>
    );
  }

  // 절대 위치 레이아웃 (기본)
  return (
    <div className={cn("relative", className)}>
      {/* 좌우 네비게이션 버튼 */}
      <div className="absolute inset-y-0 left-0 flex items-center -ml-14 md:-ml-16">
        <NavigationButton
          direction="prev"
          onClick={onPrevious}
          variant={variant}
          size={size}
        />
      </div>

      <div className="absolute inset-y-0 right-0 flex items-center -mr-14 md:-mr-16">
        <NavigationButton
          direction="next"
          onClick={onNext}
          variant={variant}
          size={size}
        />
      </div>

      {/* 하단 도트 인디케이터 + 온보딩 힌트 */}
      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <DotIndicator
          current={currentIndex}
          total={total}
          variant={variant}
          size={size}
          onGoTo={onGoTo}
        />

        {/* 온보딩 힌트 */}
        {showOnboardingHint && shouldShowHint && (
          <OnboardingHint
            mobileMessage={mobileHintMessage}
            desktopMessage={desktopHintMessage}
            variant={variant}
            onDismiss={dismissHint}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================
// Inline Navigation (카드 내부용)
// ============================================================

export interface InlineNavigationProps {
  currentIndex: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
}

export function InlineNavigation({
  currentIndex,
  total,
  onPrevious,
  onNext,
  className,
}: InlineNavigationProps) {
  if (total <= 1) return null;

  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      <button
        onClick={onPrevious}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="이전"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600" />
      </button>

      <DotIndicator
        current={currentIndex}
        total={total}
        variant="light"
        size="sm"
      />

      <button
        onClick={onNext}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="다음"
      >
        <ChevronRight className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );
}

export default ImmersiveNavigation;
