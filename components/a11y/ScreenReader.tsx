/**
 * Screen Reader Support Components
 * Contract: A11Y_DESIGN_SCREEN_READER
 *
 * 기능:
 * - ARIA live regions
 * - 동적 알림 (announcements)
 * - 시각적으로 숨겨진 텍스트
 * - 상태 변경 알림
 */

'use client';

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

// =====================================================
// Types
// =====================================================

export type Politeness = 'polite' | 'assertive' | 'off';

export interface Announcement {
  id: string;
  message: string;
  politeness: Politeness;
  timestamp: number;
}

export interface ScreenReaderContextValue {
  announce: (message: string, politeness?: Politeness) => void;
  clearAnnouncements: () => void;
}

export interface ScreenReaderProviderProps {
  children: ReactNode;
  /** 알림 자동 삭제 시간 (ms) */
  clearDelay?: number;
}

// =====================================================
// Context
// =====================================================

const ScreenReaderContext = createContext<ScreenReaderContextValue | null>(null);

export function useScreenReader(): ScreenReaderContextValue {
  const context = useContext(ScreenReaderContext);
  if (!context) {
    throw new Error('useScreenReader must be used within ScreenReaderProvider');
  }
  return context;
}

// =====================================================
// ScreenReaderProvider Component
// =====================================================

export function ScreenReaderProvider({
  children,
  clearDelay = 5000,
}: ScreenReaderProviderProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const timeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Announce message
  const announce = useCallback(
    (message: string, politeness: Politeness = 'polite') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      setAnnouncements((prev) => [
        ...prev,
        {
          id,
          message,
          politeness,
          timestamp: Date.now(),
        },
      ]);

      // Auto-clear after delay
      const timeout = setTimeout(() => {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        timeoutRef.current.delete(id);
      }, clearDelay);

      timeoutRef.current.set(id, timeout);
    },
    [clearDelay]
  );

  // Clear all announcements
  const clearAnnouncements = useCallback(() => {
    setAnnouncements([]);
    timeoutRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const timeouts = timeoutRef.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  // Group announcements by politeness
  const politeAnnouncements = announcements.filter((a) => a.politeness === 'polite');
  const assertiveAnnouncements = announcements.filter((a) => a.politeness === 'assertive');

  return (
    <ScreenReaderContext.Provider value={{ announce, clearAnnouncements }}>
      {children}

      {/* ARIA Live Regions */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {politeAnnouncements.map((a) => (
          <p key={a.id}>{a.message}</p>
        ))}
      </div>

      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {assertiveAnnouncements.map((a) => (
          <p key={a.id}>{a.message}</p>
        ))}
      </div>
    </ScreenReaderContext.Provider>
  );
}

// =====================================================
// ScreenReaderAnnounce Component
// =====================================================

export interface ScreenReaderAnnounceProps {
  message: string;
  politeness?: Politeness;
  /** 메시지 표시 여부 (true일 때만 알림) */
  when?: boolean;
}

export function ScreenReaderAnnounce({
  message,
  politeness = 'polite',
  when = true,
}: ScreenReaderAnnounceProps) {
  const { announce } = useScreenReader();
  const prevMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (when && message && message !== prevMessageRef.current) {
      announce(message, politeness);
      prevMessageRef.current = message;
    }
  }, [message, politeness, when, announce]);

  return null;
}

// =====================================================
// VisuallyHidden Component
// =====================================================

export interface VisuallyHiddenProps {
  children: ReactNode;
  /** 포커스 시 표시 */
  focusable?: boolean;
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  className?: string;
}

export function VisuallyHidden({
  children,
  focusable = false,
  as = 'span',
  className,
}: VisuallyHiddenProps) {
  const Tag = as;
  return (
    <Tag
      className={cn(
        'sr-only',
        focusable && 'focus:not-sr-only focus:absolute',
        className
      )}
    >
      {children}
    </Tag>
  );
}

// =====================================================
// Live Region Component
// =====================================================

export interface LiveRegionProps {
  children: ReactNode;
  politeness?: Politeness;
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  busy?: boolean;
  className?: string;
  visuallyHidden?: boolean;
}

export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
  relevant,
  busy = false,
  className,
  visuallyHidden = false,
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      aria-busy={busy}
      className={cn(visuallyHidden && 'sr-only', className)}
    >
      {children}
    </div>
  );
}

// =====================================================
// Status Message Component
// =====================================================

export interface StatusMessageProps {
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  message: string;
  visuallyHidden?: boolean;
  className?: string;
}

export function StatusMessage({
  type,
  message,
  visuallyHidden = false,
  className,
}: StatusMessageProps) {
  const politeness: Politeness = type === 'error' ? 'assertive' : 'polite';
  const role = type === 'error' ? 'alert' : 'status';

  const prefixes: Record<typeof type, string> = {
    success: '성공: ',
    error: '오류: ',
    warning: '경고: ',
    info: '정보: ',
    loading: '로딩 중: ',
  };

  return (
    <div
      role={role}
      aria-live={politeness}
      aria-atomic="true"
      className={cn(visuallyHidden && 'sr-only', className)}
    >
      <VisuallyHidden>{prefixes[type]}</VisuallyHidden>
      {message}
    </div>
  );
}

// =====================================================
// Loading Indicator Component
// =====================================================

export interface LoadingIndicatorProps {
  isLoading: boolean;
  loadingMessage?: string;
  loadedMessage?: string;
  className?: string;
}

export function LoadingIndicator({
  isLoading,
  loadingMessage = '로딩 중...',
  loadedMessage = '로딩 완료',
  className,
}: LoadingIndicatorProps) {
  const [showLoaded, setShowLoaded] = useState(false);
  const wasLoadingRef = useRef(false);

  useEffect(() => {
    if (wasLoadingRef.current && !isLoading) {
      setShowLoaded(true);
      const timeout = setTimeout(() => setShowLoaded(false), 1000);
      return () => clearTimeout(timeout);
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading]);

  return (
    <>
      <LiveRegion
        politeness="polite"
        visuallyHidden
        className={className}
      >
        {isLoading && loadingMessage}
        {showLoaded && loadedMessage}
      </LiveRegion>

      {/* Visual indicator (if needed) */}
      {isLoading && (
        <div
          role="progressbar"
          aria-valuetext={loadingMessage}
          aria-busy="true"
          className={className}
        />
      )}
    </>
  );
}

// =====================================================
// Accessible Counter Component
// =====================================================

export interface AccessibleCounterProps {
  count: number;
  label: string;
  announceChange?: boolean;
  className?: string;
}

export function AccessibleCounter({
  count,
  label,
  announceChange = true,
  className,
}: AccessibleCounterProps) {
  const prevCountRef = useRef(count);
  const { announce } = useScreenReader();

  useEffect(() => {
    if (announceChange && prevCountRef.current !== count) {
      announce(`${label}: ${count}`);
      prevCountRef.current = count;
    }
  }, [count, label, announceChange, announce]);

  return (
    <span className={className} aria-label={`${label}: ${count}`}>
      {count}
    </span>
  );
}

// =====================================================
// Hooks
// =====================================================

/**
 * Hook for announcing messages to screen readers
 */
export function useAnnounce() {
  const { announce } = useScreenReader();

  const announcePolite = useCallback(
    (message: string) => announce(message, 'polite'),
    [announce]
  );

  const announceAssertive = useCallback(
    (message: string) => announce(message, 'assertive'),
    [announce]
  );

  return { announce, announcePolite, announceAssertive };
}

/**
 * Hook for announcing on value change
 */
export function useAnnounceOnChange<T>(
  value: T,
  getMessage: (value: T) => string,
  politeness: Politeness = 'polite'
) {
  const { announce } = useScreenReader();
  const prevValueRef = useRef<T>(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      announce(getMessage(value), politeness);
      prevValueRef.current = value;
    }
  }, [value, getMessage, politeness, announce]);
}

export default ScreenReaderProvider;
