/**
 * Focus Trap Component
 * Contract: A11Y_DESIGN_FOCUS_TRAP
 *
 * 기능:
 * - 모달 포커스 트랩
 * - 초기 포커스 관리
 * - 포커스 복원
 * - Escape 키 처리
 */

'use client';

import {
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { cn } from '@/lib/utils';

// =====================================================
// Types
// =====================================================

export interface FocusTrapProps {
  children: ReactNode;
  /** 포커스 트랩 활성화 여부 */
  active?: boolean;
  /** 초기 포커스 대상 선택자 */
  initialFocus?: string | React.RefObject<HTMLElement | null>;
  /** 마지막 포커스 복원 */
  restoreFocus?: boolean;
  /** Escape 키로 닫기 */
  closeOnEscape?: boolean;
  /** Escape 키 콜백 */
  onEscape?: () => void;
  /** 외부 클릭으로 닫기 */
  closeOnClickOutside?: boolean;
  /** 외부 클릭 콜백 */
  onClickOutside?: () => void;
  /** 컨테이너 className */
  className?: string;
  /** 비활성화된 요소도 포커스 가능 */
  includeDisabled?: boolean;
  /** 추가 포커스 가능한 선택자 */
  additionalFocusable?: string;
}

// =====================================================
// Constants
// =====================================================

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

// =====================================================
// FocusTrap Component
// =====================================================

export function FocusTrap({
  children,
  active = true,
  initialFocus,
  restoreFocus = true,
  closeOnEscape = true,
  onEscape,
  closeOnClickOutside = false,
  onClickOutside,
  className,
  includeDisabled = false,
  additionalFocusable,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Build focusable selector
  const focusableSelector = additionalFocusable
    ? `${FOCUSABLE_SELECTOR}, ${additionalFocusable}`
    : FOCUSABLE_SELECTOR;

  // Get all focusable elements
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];

    const elements = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(focusableSelector)
    );

    return elements.filter((el) => {
      // Filter out hidden elements
      if (el.offsetParent === null) return false;

      // Filter out disabled unless includeDisabled
      if (!includeDisabled && el.hasAttribute('disabled')) return false;

      // Filter out negative tabindex (unless explicitly included)
      const tabIndex = el.getAttribute('tabindex');
      if (tabIndex === '-1' && !additionalFocusable?.includes('[tabindex="-1"]')) {
        return false;
      }

      return true;
    });
  }, [focusableSelector, includeDisabled, additionalFocusable]);

  // Save previous active element and set initial focus
  useEffect(() => {
    if (!active) return;

    // Save current active element
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Set initial focus
    const setInitialFocus = () => {
      if (!containerRef.current) return;

      let targetElement: HTMLElement | null = null;

      if (initialFocus) {
        if (typeof initialFocus === 'string') {
          targetElement = containerRef.current.querySelector<HTMLElement>(initialFocus);
        } else if (initialFocus.current) {
          targetElement = initialFocus.current;
        }
      }

      // Fallback to first focusable element
      if (!targetElement) {
        const focusable = getFocusableElements();
        targetElement = focusable[0] || containerRef.current;
      }

      // Ensure container is focusable
      if (targetElement === containerRef.current && !containerRef.current.hasAttribute('tabindex')) {
        containerRef.current.setAttribute('tabindex', '-1');
      }

      targetElement?.focus();
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(setInitialFocus);

    // Restore focus on cleanup
    return () => {
      if (restoreFocus && previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [active, initialFocus, restoreFocus, getFocusableElements]);

  // Handle Tab key for focus trap
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!active) return;

      // Handle Escape
      if (closeOnEscape && event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onEscape?.();
        return;
      }

      // Handle Tab
      if (event.key === 'Tab') {
        const focusable = getFocusableElements();

        if (focusable.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        // Shift+Tab from first element -> go to last
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
          return;
        }

        // Tab from last element -> go to first
        if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
          return;
        }

        // If active element is not in focusable list, focus first
        if (!focusable.includes(document.activeElement as HTMLElement)) {
          event.preventDefault();
          (event.shiftKey ? lastElement : firstElement).focus();
        }
      }
    },
    [active, closeOnEscape, onEscape, getFocusableElements]
  );

  // Handle click outside
  useEffect(() => {
    if (!active || !closeOnClickOutside) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClickOutside?.();
      }
    };

    // Use mousedown for better UX
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [active, closeOnClickOutside, onClickOutside]);

  // Prevent focus from leaving the trap
  useEffect(() => {
    if (!active) return;

    const handleFocusIn = (event: FocusEvent) => {
      if (!containerRef.current) return;

      const target = event.target as HTMLElement;

      // If focus moved outside the trap, bring it back
      if (!containerRef.current.contains(target)) {
        event.preventDefault();
        const focusable = getFocusableElements();
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          containerRef.current.focus();
        }
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, [active, getFocusableElements]);

  return (
    <div
      ref={containerRef}
      className={cn('outline-none', className)}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {children}
    </div>
  );
}

// =====================================================
// Focus Guard Component
// =====================================================

export interface FocusGuardProps {
  onFocus: () => void;
}

/**
 * Invisible element that catches focus at boundaries
 */
export function FocusGuard({ onFocus }: FocusGuardProps) {
  return (
    <span
      tabIndex={0}
      onFocus={onFocus}
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
      aria-hidden="true"
    />
  );
}

// =====================================================
// Hook: useFocusTrap
// =====================================================

export interface UseFocusTrapOptions {
  active?: boolean;
  initialFocus?: string | React.RefObject<HTMLElement | null>;
  restoreFocus?: boolean;
  onEscape?: () => void;
}

export function useFocusTrap<T extends HTMLElement>(
  options: UseFocusTrapOptions = {}
) {
  const {
    active = true,
    initialFocus,
    restoreFocus = true,
    onEscape,
  } = options;

  const containerRef = useRef<T>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Get focusable elements
  const getFocusable = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter((el) => el.offsetParent !== null);
  }, []);

  // Focus first element
  const focusFirst = useCallback(() => {
    const elements = getFocusable();
    if (elements.length > 0) {
      elements[0].focus();
    }
  }, [getFocusable]);

  // Focus last element
  const focusLast = useCallback(() => {
    const elements = getFocusable();
    if (elements.length > 0) {
      elements[elements.length - 1].focus();
    }
  }, [getFocusable]);

  // Initialize focus trap
  useEffect(() => {
    if (!active || !containerRef.current) return;

    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Set initial focus
    requestAnimationFrame(() => {
      if (typeof initialFocus === 'string' && containerRef.current) {
        const target = containerRef.current.querySelector<HTMLElement>(initialFocus);
        target?.focus();
      } else if (initialFocus && typeof initialFocus === 'object' && 'current' in initialFocus && initialFocus.current) {
        initialFocus.current.focus();
      } else {
        focusFirst();
      }
    });

    return () => {
      if (restoreFocus && previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [active, initialFocus, restoreFocus, focusFirst]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<T>) => {
      if (!active) return;

      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      if (event.key === 'Tab') {
        const elements = getFocusable();
        if (elements.length === 0) {
          event.preventDefault();
          return;
        }

        const first = elements[0];
        const last = elements[elements.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    },
    [active, onEscape, getFocusable]
  );

  return {
    containerRef,
    handleKeyDown,
    focusFirst,
    focusLast,
    getFocusable,
  };
}

// =====================================================
// Hook: useFocusReturn
// =====================================================

/**
 * Hook to restore focus when component unmounts
 */
export function useFocusReturn(shouldRestore: boolean = true) {
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    return () => {
      if (shouldRestore && previousActiveElementRef.current) {
        requestAnimationFrame(() => {
          previousActiveElementRef.current?.focus();
        });
      }
    };
  }, [shouldRestore]);

  return previousActiveElementRef;
}

export default FocusTrap;
