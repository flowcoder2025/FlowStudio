import { defineRouting } from 'next-intl/routing';

export const locales = ['ko', 'en'] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: 'ko',
  localeDetection: true,
  localePrefix: 'always',
});

export const countryToLocale: Record<string, Locale> = {
  'KR': 'ko',
  'US': 'en',
  'GB': 'en',
  'CA': 'en',
  'AU': 'en',
  'NZ': 'en',
  'IE': 'en',
  'SG': 'en',
  'PH': 'en',
  'IN': 'en',
};

export function getLocaleFromCountry(countryCode: string | null): Locale {
  if (!countryCode) return 'en';
  return countryToLocale[countryCode] || 'en';
}
