/**
 * i18n Request Configuration
 * Server-side locale detection and message loading
 * Supports merging multiple JSON message files
 */

import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as 'ko' | 'en')) {
    locale = routing.defaultLocale;
  }

  // Load multiple message files and merge
  const [common, tools] = await Promise.all([
    import(`../messages/${locale}/common.json`).then((m) => m.default),
    import(`../messages/${locale}/tools.json`).then((m) => m.default),
  ]);

  return {
    locale,
    messages: {
      ...common,
      ...tools,
    },
  };
});
