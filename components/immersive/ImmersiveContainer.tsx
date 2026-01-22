/**
 * ImmersiveContainer Component - 풀스크린 오버레이 래퍼
 * 몰입형 UI의 기본 컨테이너
 */

"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { FocusTrap } from "@/components/a11y/FocusTrap";
import { useImmersiveKeyboard } from "./hooks/useImmersiveKeyboard";

// ============================================================
// Types
// ============================================================

export interface ImmersiveContainerProps {
  /** 오버레이 표시 여부 */
  isOpen: boolean;
  /** 닫기 핸들러 */
  onClose: () => void;
  /** 자식 요소 */
  children: ReactNode;
  /** 닫기 버튼 표시 여부 */
  showCloseButton?: boolean;
  /** 배경 블러 강도 */
  backdropBlur?: "none" | "sm" | "md" | "lg";
  /** 배경 어둡기 */
  backdropOpacity?: number;
  /** 배경 클릭으로 닫기 */
  closeOnBackdropClick?: boolean;
  /** 포커스 트랩 활성화 */
  trapFocus?: boolean;
  /** ESC 키로 닫기 */
  closeOnEscape?: boolean;
  /** 컨테이너 추가 className */
  className?: string;
  /** 콘텐츠 추가 className */
  contentClassName?: string;
  /** 접근성 라벨 */
  ariaLabel?: string;
  /** z-index */
  zIndex?: number;
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

const contentVariants = {
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

// ============================================================
// Constants
// ============================================================

const blurConfig = {
  none: "",
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-md",
  lg: "backdrop-blur-lg",
};

// ============================================================
// Component
// ============================================================

export function ImmersiveContainer({
  isOpen,
  onClose,
  children,
  showCloseButton = true,
  backdropBlur = "sm",
  backdropOpacity = 0.6,
  closeOnBackdropClick = true,
  trapFocus = true,
  closeOnEscape = true,
  className,
  contentClassName,
  ariaLabel = "몰입형 뷰",
  zIndex = 50,
}: ImmersiveContainerProps) {
  // 키보드 네비게이션
  useImmersiveKeyboard({
    enabled: isOpen && closeOnEscape,
    onEscape: onClose,
  });

  // 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // 배경 클릭 핸들러
  const handleBackdropClick = () => {
    if (closeOnBackdropClick) {
      onClose();
    }
  };

  // 콘텐츠 클릭 전파 방지
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={cn(
            "fixed inset-0 flex items-center justify-center",
            className
          )}
          style={{ zIndex }}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
        >
          {/* 배경 오버레이 */}
          <div
            className={cn(
              "absolute inset-0",
              blurConfig[backdropBlur],
              closeOnBackdropClick && "cursor-pointer"
            )}
            style={{ backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})` }}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* 닫기 버튼 */}
          {showCloseButton && (
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
          )}

          {/* 콘텐츠 */}
          <motion.div
            className={cn("relative", contentClassName)}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleContentClick}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // 포커스 트랩 적용
  if (trapFocus && isOpen) {
    return (
      <FocusTrap
        active={isOpen}
        closeOnEscape={closeOnEscape}
        onEscape={onClose}
      >
        {content}
      </FocusTrap>
    );
  }

  return content;
}

// ============================================================
// Simple Overlay (포커스 트랩 없는 간단한 버전)
// ============================================================

export interface SimpleOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function SimpleOverlay({
  isOpen,
  onClose,
  children,
  className,
}: SimpleOverlayProps) {
  return (
    <ImmersiveContainer
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={true}
      trapFocus={false}
      className={className}
    >
      {children}
    </ImmersiveContainer>
  );
}

export default ImmersiveContainer;
