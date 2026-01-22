/**
 * Immersive Components - 몰입형 UI 컴포넌트 모음
 * 워크플로우 전체에서 일관된 몰입형 경험 제공
 */

// ============================================================
// Components
// ============================================================

export { ImmersiveContainer, SimpleOverlay } from "./ImmersiveContainer";
export type { ImmersiveContainerProps, SimpleOverlayProps } from "./ImmersiveContainer";

export { ImmersiveCard, CompactCard } from "./ImmersiveCard";
export type { ImmersiveCardProps, CompactCardProps } from "./ImmersiveCard";

export { ImmersiveNavigation, InlineNavigation } from "./ImmersiveNavigation";
export type { ImmersiveNavigationProps, InlineNavigationProps } from "./ImmersiveNavigation";

// ============================================================
// Hooks
// ============================================================

export { useOnboarding, useSwipeHintOnboarding, useKeyboardHintOnboarding, useActionSelectHintOnboarding } from "./hooks/useOnboarding";
export type { UseOnboardingOptions, UseOnboardingReturn, OnboardingKey } from "./hooks/useOnboarding";

export { useSwipeNavigation } from "./hooks/useSwipeNavigation";
export type { UseSwipeNavigationOptions, UseSwipeNavigationReturn } from "./hooks/useSwipeNavigation";

export { useImmersiveKeyboard, useSimpleKeyboardNav } from "./hooks/useImmersiveKeyboard";
export type { UseImmersiveKeyboardOptions, UseImmersiveKeyboardReturn } from "./hooks/useImmersiveKeyboard";
