/**
 * Navigation Hook
 *
 * Centralized navigation logic using Next.js useRouter
 * Replaces scattered window.location.href usage across pages
 */

'use client'

import { useRouter } from 'next/navigation'
import { AppMode } from '@/types'

export function useNavigation() {
  const router = useRouter()

  const navigateToMode = (mode: AppMode) => {
    const routes: Record<AppMode, string> = {
      [AppMode.HOME]: '/',
      [AppMode.CREATE]: '/create',
      [AppMode.EDIT]: '/edit',
      [AppMode.DETAIL_PAGE]: '/detail-page',
      [AppMode.DETAIL_EDIT]: '/detail-edit',
      [AppMode.POSTER]: '/poster',
      [AppMode.COLOR_CORRECTION]: '/color-correction',
      [AppMode.PROFILE]: '/profile',
    }

    const path = routes[mode]
    if (path) {
      router.push(path)
    }
  }

  const navigateTo = (path: string) => {
    router.push(path)
  }

  const navigateBack = () => {
    router.back()
  }

  return {
    navigateToMode,
    navigateTo,
    navigateBack,
    router,
  }
}
