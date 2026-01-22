/**
 * Accessibility Components
 *
 * 접근성 관련 컴포넌트 및 훅 모음:
 * - KeyboardNav: 키보드 네비게이션 지원
 * - ScreenReader: 스크린 리더 지원
 * - FocusTrap: 모달 포커스 트랩
 */

// Keyboard Navigation
export {
  KeyboardNav,
  KeyboardNavItem,
  SkipLink,
  useKeyboardNav,
  useRovingTabIndex,
  type KeyboardNavProps,
  type KeyboardNavItemProps,
  type KeyboardNavContextValue,
  type NavigationDirection,
  type SkipLinkProps,
} from './KeyboardNav';

// Screen Reader
export {
  ScreenReaderProvider,
  ScreenReaderAnnounce,
  VisuallyHidden,
  LiveRegion,
  StatusMessage,
  LoadingIndicator,
  AccessibleCounter,
  useScreenReader,
  useAnnounce,
  useAnnounceOnChange,
  type ScreenReaderProviderProps,
  type ScreenReaderAnnounceProps,
  type ScreenReaderContextValue,
  type VisuallyHiddenProps,
  type LiveRegionProps,
  type StatusMessageProps,
  type LoadingIndicatorProps,
  type AccessibleCounterProps,
  type Politeness,
} from './ScreenReader';

// Focus Trap
export {
  FocusTrap,
  FocusGuard,
  useFocusTrap,
  useFocusReturn,
  type FocusTrapProps,
  type FocusGuardProps,
  type UseFocusTrapOptions,
} from './FocusTrap';
