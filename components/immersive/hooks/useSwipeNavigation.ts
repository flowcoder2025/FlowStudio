/**
 * useSwipeNavigation Hook - 스와이프 네비게이션 로직
 * 터치/드래그 기반 네비게이션 지원
 */

"use client";

import { useState, useCallback, useRef } from "react";
import type { PanInfo } from "framer-motion";

// ============================================================
// Types
// ============================================================

export interface UseSwipeNavigationOptions {
  /** 전체 아이템 수 */
  total: number;
  /** 초기 인덱스 */
  initialIndex?: number;
  /** 순환 네비게이션 여부 */
  loop?: boolean;
  /** 스와이프 감도 (기본 10000) */
  swipeThreshold?: number;
  /** 스와이프 완료 콜백 */
  onSwipe?: (direction: "left" | "right", newIndex: number) => void;
  /** 인덱스 변경 콜백 */
  onChange?: (index: number, direction: number) => void;
}

export interface UseSwipeNavigationReturn {
  /** 현재 인덱스 */
  currentIndex: number;
  /** 애니메이션 방향 (1: 오른쪽에서, -1: 왼쪽에서) */
  direction: number;
  /** 다음으로 이동 */
  goNext: () => void;
  /** 이전으로 이동 */
  goPrev: () => void;
  /** 특정 인덱스로 이동 */
  goTo: (index: number) => void;
  /** framer-motion onDragEnd 핸들러 */
  handleDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  /** 페이지 상태 직접 설정 (direction 포함) */
  setPage: (value: [number, number]) => void;
  /** 첫 번째 아이템인지 */
  isFirst: boolean;
  /** 마지막 아이템인지 */
  isLast: boolean;
  /** 스와이프 가능 여부 */
  canSwipe: boolean;
}

// ============================================================
// Helper Functions
// ============================================================

function swipePower(offset: number, velocity: number): number {
  return Math.abs(offset) * velocity;
}

// ============================================================
// Hook
// ============================================================

export function useSwipeNavigation(
  options: UseSwipeNavigationOptions
): UseSwipeNavigationReturn {
  const {
    total,
    initialIndex = 0,
    loop = true,
    swipeThreshold = 10000,
    onSwipe,
    onChange,
  } = options;

  // [index, direction] 튜플로 상태 관리
  const [[currentIndex, direction], setPage] = useState<[number, number]>([
    initialIndex,
    0,
  ]);

  // 콜백 레퍼런스 유지 (의존성 문제 방지)
  const callbacksRef = useRef({ onSwipe, onChange });
  callbacksRef.current = { onSwipe, onChange };

  // 다음으로 이동
  const goNext = useCallback(() => {
    setPage(([prev]) => {
      let next: number;
      if (prev >= total - 1) {
        next = loop ? 0 : prev;
      } else {
        next = prev + 1;
      }

      if (next !== prev) {
        callbacksRef.current.onChange?.(next, 1);
        callbacksRef.current.onSwipe?.("left", next);
      }

      return [next, 1];
    });
  }, [total, loop]);

  // 이전으로 이동
  const goPrev = useCallback(() => {
    setPage(([prev]) => {
      let next: number;
      if (prev <= 0) {
        next = loop ? total - 1 : prev;
      } else {
        next = prev - 1;
      }

      if (next !== prev) {
        callbacksRef.current.onChange?.(next, -1);
        callbacksRef.current.onSwipe?.("right", next);
      }

      return [next, -1];
    });
  }, [total, loop]);

  // 특정 인덱스로 이동
  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= total) return;

      setPage(([prev]) => {
        const dir = index > prev ? 1 : index < prev ? -1 : 0;
        if (dir !== 0) {
          callbacksRef.current.onChange?.(index, dir);
        }
        return [index, dir];
      });
    },
    [total]
  );

  // 드래그 종료 핸들러
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const swipe = swipePower(info.offset.x, info.velocity.x);

      if (swipe < -swipeThreshold) {
        // 왼쪽으로 스와이프 → 다음
        goNext();
      } else if (swipe > swipeThreshold) {
        // 오른쪽으로 스와이프 → 이전
        goPrev();
      }
    },
    [swipeThreshold, goNext, goPrev]
  );

  // 계산된 상태
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;
  const canSwipe = total > 1;

  return {
    currentIndex,
    direction,
    goNext,
    goPrev,
    goTo,
    handleDragEnd,
    setPage,
    isFirst,
    isLast,
    canSwipe,
  };
}

export default useSwipeNavigation;
