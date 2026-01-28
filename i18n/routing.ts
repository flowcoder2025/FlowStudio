/**
 * i18n Routing Configuration
 * Defines supported locales and routing behavior
 */

import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ko', 'en'],
  defaultLocale: 'ko',
  localePrefix: 'as-needed' // ko: /, en: /en
});

export type Locale = (typeof routing.locales)[number];
