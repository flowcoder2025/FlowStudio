/**
 * useOnboarding Hook - 온보딩 상태 관리
 * 사용자가 스와이프 힌트 등을 이미 봤는지 localStorage에 저장
 */

"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================================
// Types
// ============================================================

export type OnboardingKey =
  | "immersive-swipe-hint"
  | "immersive-keyboard-hint"
  | "action-select-hint"
  | "input-form-hint"
  | "result-hint";

export interface UseOnboardingOptions {
  /** 온보딩 식별 키 */
  key: OnboardingKey;
  /** 표시 횟수 제한 (기본 1회) */
  maxShowCount?: number;
  /** 일정 기간 후 다시 표시 (밀리초, 기본 null = 영구 숨김) */
  resetAfter?: number | null;
  /** SSR 안전 초기값 */
  defaultDismissed?: boolean;
}

export interface UseOnboardingReturn {
  /** 온보딩을 표시해야 하는지 */
  shouldShow: boolean;
  /** 온보딩 표시 횟수 */
  showCount: number;
  /** 온보딩 숨기기 (dismiss) */
  dismiss: () => void;
  /** 온보딩 리셋 (다시 표시) */
  reset: () => void;
  /** 하이드레이션 완료 여부 */
  isHydrated: boolean;
}

// ============================================================
// Constants
// ============================================================

const STORAGE_PREFIX = "flowstudio-onboarding:";

interface StoredOnboarding {
  dismissed: boolean;
  showCount: number;
  lastDismissedAt: number | null;
}

// ============================================================
// Helper Functions
// ============================================================

function getStorageKey(key: OnboardingKey): string {
  return `${STORAGE_PREFIX}${key}`;
}

function getStoredValue(key: OnboardingKey): StoredOnboarding | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(getStorageKey(key));
    if (!stored) return null;
    return JSON.parse(stored) as StoredOnboarding;
  } catch {
    return null;
  }
}

function setStoredValue(key: OnboardingKey, value: StoredOnboarding): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(getStorageKey(key), JSON.stringify(value));
  } catch {
    // localStorage가 가득 찼거나 비활성화된 경우 무시
  }
}

function removeStoredValue(key: OnboardingKey): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(getStorageKey(key));
  } catch {
    // 무시
  }
}

// ============================================================
// Hook
// ============================================================

export function useOnboarding(options: UseOnboardingOptions): UseOnboardingReturn {
  const {
    key,
    maxShowCount = 1,
    resetAfter = null,
    defaultDismissed = false,
  } = options;

  const [isHydrated, setIsHydrated] = useState(false);
  const [state, setState] = useState<StoredOnboarding>({
    dismissed: defaultDismissed,
    showCount: 0,
    lastDismissedAt: null,
  });

  // 하이드레이션 시 localStorage에서 상태 복원
  useEffect(() => {
    const stored = getStoredValue(key);

    if (stored) {
      // resetAfter 체크: 일정 기간이 지났으면 리셋
      if (
        resetAfter !== null &&
        stored.lastDismissedAt !== null &&
        Date.now() - stored.lastDismissedAt > resetAfter
      ) {
        const resetState: StoredOnboarding = {
          dismissed: false,
          showCount: 0,
          lastDismissedAt: null,
        };
        setStoredValue(key, resetState);
        setState(resetState);
      } else {
        setState(stored);
      }
    }

    setIsHydrated(true);
  }, [key, resetAfter]);

  // shouldShow 계산
  const shouldShow = isHydrated && !state.dismissed && state.showCount < maxShowCount;

  // dismiss 함수
  const dismiss = useCallback(() => {
    const newState: StoredOnboarding = {
      dismissed: true,
      showCount: state.showCount + 1,
      lastDismissedAt: Date.now(),
    };
    setState(newState);
    setStoredValue(key, newState);
  }, [key, state.showCount]);

  // reset 함수
  const reset = useCallback(() => {
    const resetState: StoredOnboarding = {
      dismissed: false,
      showCount: 0,
      lastDismissedAt: null,
    };
    setState(resetState);
    removeStoredValue(key);
  }, [key]);

  return {
    shouldShow,
    showCount: state.showCount,
    dismiss,
    reset,
    isHydrated,
  };
}

// ============================================================
// Convenience Hooks
// ============================================================

/**
 * 스와이프 힌트 온보딩
 */
export function useSwipeHintOnboarding() {
  return useOnboarding({
    key: "immersive-swipe-hint",
    maxShowCount: 1,
  });
}

/**
 * 키보드 힌트 온보딩
 */
export function useKeyboardHintOnboarding() {
  return useOnboarding({
    key: "immersive-keyboard-hint",
    maxShowCount: 2, // 데스크톱에서 2번까지 표시
  });
}

/**
 * 액션 선택 힌트 온보딩
 */
export function useActionSelectHintOnboarding() {
  return useOnboarding({
    key: "action-select-hint",
    maxShowCount: 1,
  });
}

export default useOnboarding;
