/**
 * Keyboard Navigation Component
 * Contract: A11Y_DESIGN_KEYBOARD_NAV
 *
 * 기능:
 * - 키보드 네비게이션 지원
 * - 포커스 관리
 * - 방향키 네비게이션
 * - 단축키 지원
 */

'use client';

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useEffect,
  useState,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { cn } from '@/lib/utils';

// =====================================================
// Types
// =====================================================

export type NavigationDirection = 'horizontal' | 'vertical' | 'both' | 'grid';

export interface KeyboardNavContextValue {
  registerItem: (id: string, ref: HTMLElement) => void;
  unregisterItem: (id: string) => void;
  focusItem: (id: string) => void;
  focusNext: () => void;
  focusPrev: () => void;
  focusFirst: () => void;
  focusLast: () => void;
  currentFocusId: string | null;
}

export interface KeyboardNavProps {
  children: ReactNode;
  /** 네비게이션 방향 */
  direction?: NavigationDirection;
  /** 루프 네비게이션 활성화 */
  loop?: boolean;
  /** 자동 포커스 */
  autoFocus?: boolean;
  /** 그리드 열 개수 (direction='grid' 일 때) */
  columns?: number;
  /** 비활성화된 아이템 건너뛰기 */
  skipDisabled?: boolean;
  /** 컨테이너 className */
  className?: string;
  /** 포커스 변경 콜백 */
  onFocusChange?: (id: string | null) => void;
  /** ARIA role */
  role?: string;
  /** ARIA label */
  ariaLabel?: string;
}

export interface KeyboardNavItemProps {
  children: ReactNode;
  id: string;
  disabled?: boolean;
  className?: string;
  onSelect?: () => void;
}

// =====================================================
// Context
// =====================================================

const KeyboardNavContext = createContext<KeyboardNavContextValue | null>(null);

export function useKeyboardNav(): KeyboardNavContextValue {
  const context = useContext(KeyboardNavContext);
  if (!context) {
    throw new Error('useKeyboardNav must be used within KeyboardNav');
  }
  return context;
}

// =====================================================
// KeyboardNav Component
// =====================================================

export function KeyboardNav({
  children,
  direction = 'vertical',
  loop = true,
  autoFocus = false,
  columns = 1,
  skipDisabled = true,
  className,
  onFocusChange,
  role = 'menu',
  ariaLabel,
}: KeyboardNavProps) {
  const [currentFocusId, setCurrentFocusId] = useState<string | null>(null);
  const itemsRef = useRef<Map<string, HTMLElement>>(new Map());
  const orderRef = useRef<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Register item
  const registerItem = useCallback((id: string, ref: HTMLElement) => {
    itemsRef.current.set(id, ref);
    if (!orderRef.current.includes(id)) {
      orderRef.current.push(id);
    }
  }, []);

  // Unregister item
  const unregisterItem = useCallback((id: string) => {
    itemsRef.current.delete(id);
    orderRef.current = orderRef.current.filter((i) => i !== id);
  }, []);

  // Focus item
  const focusItem = useCallback(
    (id: string) => {
      const element = itemsRef.current.get(id);
      if (element) {
        element.focus();
        setCurrentFocusId(id);
        onFocusChange?.(id);
      }
    },
    [onFocusChange]
  );

  // Get focusable items (filter disabled)
  const getFocusableItems = useCallback((): string[] => {
    if (!skipDisabled) return orderRef.current;

    return orderRef.current.filter((id) => {
      const element = itemsRef.current.get(id);
      return element && !element.hasAttribute('data-disabled');
    });
  }, [skipDisabled]);

  // Focus next item
  const focusNext = useCallback(() => {
    const items = getFocusableItems();
    if (items.length === 0) return;

    const currentIndex = currentFocusId ? items.indexOf(currentFocusId) : -1;
    let nextIndex = currentIndex + 1;

    if (nextIndex >= items.length) {
      nextIndex = loop ? 0 : items.length - 1;
    }

    focusItem(items[nextIndex]);
  }, [currentFocusId, getFocusableItems, focusItem, loop]);

  // Focus previous item
  const focusPrev = useCallback(() => {
    const items = getFocusableItems();
    if (items.length === 0) return;

    const currentIndex = currentFocusId ? items.indexOf(currentFocusId) : items.length;
    let prevIndex = currentIndex - 1;

    if (prevIndex < 0) {
      prevIndex = loop ? items.length - 1 : 0;
    }

    focusItem(items[prevIndex]);
  }, [currentFocusId, getFocusableItems, focusItem, loop]);

  // Focus first item
  const focusFirst = useCallback(() => {
    const items = getFocusableItems();
    if (items.length > 0) {
      focusItem(items[0]);
    }
  }, [getFocusableItems, focusItem]);

  // Focus last item
  const focusLast = useCallback(() => {
    const items = getFocusableItems();
    if (items.length > 0) {
      focusItem(items[items.length - 1]);
    }
  }, [getFocusableItems, focusItem]);

  // Grid navigation
  const focusUp = useCallback(() => {
    const items = getFocusableItems();
    if (items.length === 0 || !currentFocusId) return;

    const currentIndex = items.indexOf(currentFocusId);
    const targetIndex = currentIndex - columns;

    if (targetIndex >= 0) {
      focusItem(items[targetIndex]);
    } else if (loop) {
      const lastRowStart = Math.floor((items.length - 1) / columns) * columns;
      const targetInLastRow = lastRowStart + (currentIndex % columns);
      focusItem(items[Math.min(targetInLastRow, items.length - 1)]);
    }
  }, [currentFocusId, getFocusableItems, focusItem, columns, loop]);

  const focusDown = useCallback(() => {
    const items = getFocusableItems();
    if (items.length === 0 || !currentFocusId) return;

    const currentIndex = items.indexOf(currentFocusId);
    const targetIndex = currentIndex + columns;

    if (targetIndex < items.length) {
      focusItem(items[targetIndex]);
    } else if (loop) {
      const targetInFirstRow = currentIndex % columns;
      focusItem(items[Math.min(targetInFirstRow, items.length - 1)]);
    }
  }, [currentFocusId, getFocusableItems, focusItem, columns, loop]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const { key } = event;

      let handled = false;

      switch (key) {
        case 'ArrowDown':
          if (direction === 'vertical' || direction === 'both') {
            focusNext();
            handled = true;
          } else if (direction === 'grid') {
            focusDown();
            handled = true;
          }
          break;

        case 'ArrowUp':
          if (direction === 'vertical' || direction === 'both') {
            focusPrev();
            handled = true;
          } else if (direction === 'grid') {
            focusUp();
            handled = true;
          }
          break;

        case 'ArrowRight':
          if (direction === 'horizontal' || direction === 'both' || direction === 'grid') {
            focusNext();
            handled = true;
          }
          break;

        case 'ArrowLeft':
          if (direction === 'horizontal' || direction === 'both' || direction === 'grid') {
            focusPrev();
            handled = true;
          }
          break;

        case 'Home':
          focusFirst();
          handled = true;
          break;

        case 'End':
          focusLast();
          handled = true;
          break;
      }

      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    [direction, focusNext, focusPrev, focusFirst, focusLast, focusUp, focusDown]
  );

  // Auto focus on mount
  useEffect(() => {
    if (autoFocus) {
      requestAnimationFrame(() => {
        focusFirst();
      });
    }
  }, [autoFocus, focusFirst]);

  const contextValue: KeyboardNavContextValue = {
    registerItem,
    unregisterItem,
    focusItem,
    focusNext,
    focusPrev,
    focusFirst,
    focusLast,
    currentFocusId,
  };

  return (
    <KeyboardNavContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={cn('outline-none', className)}
        role={role}
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </KeyboardNavContext.Provider>
  );
}

// =====================================================
// KeyboardNavItem Component
// =====================================================

export function KeyboardNavItem({
  children,
  id,
  disabled = false,
  className,
  onSelect,
}: KeyboardNavItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const { registerItem, unregisterItem, currentFocusId } = useKeyboardNav();
  const isFocused = currentFocusId === id;

  useEffect(() => {
    if (itemRef.current) {
      registerItem(id, itemRef.current);
    }
    return () => unregisterItem(id);
  }, [id, registerItem, unregisterItem]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect?.();
      }
    },
    [disabled, onSelect]
  );

  const handleClick = useCallback(() => {
    if (!disabled) {
      onSelect?.();
    }
  }, [disabled, onSelect]);

  return (
    <div
      ref={itemRef}
      role="menuitem"
      tabIndex={isFocused ? 0 : -1}
      aria-disabled={disabled}
      data-disabled={disabled || undefined}
      data-focused={isFocused || undefined}
      className={cn(
        'outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}

// =====================================================
// Skip Link Component
// =====================================================

export interface SkipLinkProps {
  href: string;
  children?: ReactNode;
  className?: string;
}

export function SkipLink({
  href,
  children = '본문으로 건너뛰기',
  className,
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only',
        'focus:absolute focus:z-50 focus:top-4 focus:left-4',
        'focus:bg-background focus:text-foreground',
        'focus:px-4 focus:py-2 focus:rounded-md',
        'focus:ring-2 focus:ring-primary',
        'focus:outline-none',
        className
      )}
    >
      {children}
    </a>
  );
}

// =====================================================
// Roving TabIndex Hook
// =====================================================

export function useRovingTabIndex<T extends HTMLElement>(
  itemRefs: React.RefObject<(T | null)[]>,
  options: {
    direction?: 'horizontal' | 'vertical';
    loop?: boolean;
    initialIndex?: number;
  } = {}
) {
  const { direction = 'horizontal', loop = true, initialIndex = 0 } = options;
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const items = itemRefs.current;
      if (!items) return;

      const length = items.filter(Boolean).length;
      let newIndex = activeIndex;

      const isNext =
        (direction === 'horizontal' && event.key === 'ArrowRight') ||
        (direction === 'vertical' && event.key === 'ArrowDown');

      const isPrev =
        (direction === 'horizontal' && event.key === 'ArrowLeft') ||
        (direction === 'vertical' && event.key === 'ArrowUp');

      if (isNext) {
        newIndex = loop
          ? (activeIndex + 1) % length
          : Math.min(activeIndex + 1, length - 1);
      } else if (isPrev) {
        newIndex = loop
          ? (activeIndex - 1 + length) % length
          : Math.max(activeIndex - 1, 0);
      } else if (event.key === 'Home') {
        newIndex = 0;
      } else if (event.key === 'End') {
        newIndex = length - 1;
      }

      if (newIndex !== activeIndex) {
        event.preventDefault();
        setActiveIndex(newIndex);
        items[newIndex]?.focus();
      }
    },
    [activeIndex, direction, loop, itemRefs]
  );

  return {
    activeIndex,
    setActiveIndex,
    getTabIndex: (index: number) => (index === activeIndex ? 0 : -1),
    handleKeyDown,
  };
}

export default KeyboardNav;
