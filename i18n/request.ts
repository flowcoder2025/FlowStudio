import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  
  if (!locale || !routing.locales.includes(locale as typeof routing.locales[number])) {
    locale = routing.defaultLocale;
  }

  const messages = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    timeZone: locale === 'ko' ? 'Asia/Seoul' : 'UTC',
    formats: {
      number: {
        currency: {
          style: 'currency',
          currency: locale === 'ko' ? 'KRW' : 'USD',
        },
      },
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        },
      },
    },
  };
});
