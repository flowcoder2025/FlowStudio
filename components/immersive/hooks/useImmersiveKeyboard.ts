/**
 * useImmersiveKeyboard Hook - 키보드 네비게이션 지원
 * 방향키, Enter, Escape 등 키보드 이벤트 처리
 */

"use client";

import { useEffect, useCallback, useRef } from "react";

// ============================================================
// Types
// ============================================================

export interface UseImmersiveKeyboardOptions {
  /** 활성화 여부 */
  enabled?: boolean;
  /** 왼쪽 화살표 핸들러 */
  onLeft?: () => void;
  /** 오른쪽 화살표 핸들러 */
  onRight?: () => void;
  /** 위쪽 화살표 핸들러 */
  onUp?: () => void;
  /** 아래쪽 화살표 핸들러 */
  onDown?: () => void;
  /** Enter 키 핸들러 */
  onEnter?: () => void;
  /** Escape 키 핸들러 */
  onEscape?: () => void;
  /** Space 키 핸들러 */
  onSpace?: () => void;
  /** Tab 키 핸들러 (기본 동작 방지됨) */
  onTab?: (shiftKey: boolean) => void;
  /** Home 키 핸들러 */
  onHome?: () => void;
  /** End 키 핸들러 */
  onEnd?: () => void;
  /** 숫자 키 핸들러 (0-9) */
  onNumber?: (num: number) => void;
  /** 입력 필드 내에서도 동작할지 */
  allowInInputs?: boolean;
}

export interface UseImmersiveKeyboardReturn {
  /** 현재 활성화 상태 */
  isEnabled: boolean;
}

// ============================================================
// Helper Functions
// ============================================================

function isInputElement(element: Element | null): boolean {
  if (!element) return false;
  const tagName = element.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    element.hasAttribute("contenteditable")
  );
}

// ============================================================
// Hook
// ============================================================

export function useImmersiveKeyboard(
  options: UseImmersiveKeyboardOptions
): UseImmersiveKeyboardReturn {
  const {
    enabled = true,
    onLeft,
    onRight,
    onUp,
    onDown,
    onEnter,
    onEscape,
    onSpace,
    onTab,
    onHome,
    onEnd,
    onNumber,
    allowInInputs = false,
  } = options;

  // 콜백 레퍼런스 유지
  const callbacksRef = useRef({
    onLeft,
    onRight,
    onUp,
    onDown,
    onEnter,
    onEscape,
    onSpace,
    onTab,
    onHome,
    onEnd,
    onNumber,
  });

  callbacksRef.current = {
    onLeft,
    onRight,
    onUp,
    onDown,
    onEnter,
    onEscape,
    onSpace,
    onTab,
    onHome,
    onEnd,
    onNumber,
  };

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // 입력 필드에서는 무시 (옵션에 따라)
      if (!allowInInputs && isInputElement(document.activeElement)) {
        // Escape는 항상 처리
        if (event.key === "Escape" && callbacksRef.current.onEscape) {
          event.preventDefault();
          callbacksRef.current.onEscape();
        }
        return;
      }

      const handlers = callbacksRef.current;

      switch (event.key) {
        case "ArrowLeft":
          if (handlers.onLeft) {
            event.preventDefault();
            handlers.onLeft();
          }
          break;

        case "ArrowRight":
          if (handlers.onRight) {
            event.preventDefault();
            handlers.onRight();
          }
          break;

        case "ArrowUp":
          if (handlers.onUp) {
            event.preventDefault();
            handlers.onUp();
          }
          break;

        case "ArrowDown":
          if (handlers.onDown) {
            event.preventDefault();
            handlers.onDown();
          }
          break;

        case "Enter":
          if (handlers.onEnter) {
            event.preventDefault();
            handlers.onEnter();
          }
          break;

        case "Escape":
          if (handlers.onEscape) {
            event.preventDefault();
            handlers.onEscape();
          }
          break;

        case " ": // Space
          if (handlers.onSpace) {
            event.preventDefault();
            handlers.onSpace();
          }
          break;

        case "Tab":
          if (handlers.onTab) {
            event.preventDefault();
            handlers.onTab(event.shiftKey);
          }
          break;

        case "Home":
          if (handlers.onHome) {
            event.preventDefault();
            handlers.onHome();
          }
          break;

        case "End":
          if (handlers.onEnd) {
            event.preventDefault();
            handlers.onEnd();
          }
          break;

        default:
          // 숫자 키 처리 (0-9)
          if (handlers.onNumber && /^[0-9]$/.test(event.key)) {
            event.preventDefault();
            handlers.onNumber(parseInt(event.key, 10));
          }
          break;
      }
    },
    [allowInInputs]
  );

  // 이벤트 리스너 등록
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);

  return {
    isEnabled: enabled,
  };
}

// ============================================================
// Convenience Hook
// ============================================================

/**
 * 간단한 좌우 + Enter + Escape 키보드 네비게이션
 */
export function useSimpleKeyboardNav(options: {
  enabled?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSelect?: () => void;
  onClose?: () => void;
}) {
  const { enabled = true, onPrev, onNext, onSelect, onClose } = options;

  return useImmersiveKeyboard({
    enabled,
    onLeft: onPrev,
    onRight: onNext,
    onEnter: onSelect,
    onEscape: onClose,
  });
}

export default useImmersiveKeyboard;
