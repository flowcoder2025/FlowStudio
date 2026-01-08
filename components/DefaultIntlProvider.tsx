'use client';

import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/messages/ko.json';

interface DefaultIntlProviderProps {
  children: React.ReactNode;
}

export function DefaultIntlProvider({ children }: DefaultIntlProviderProps) {
  return (
    <NextIntlClientProvider locale="ko" messages={koMessages}>
      {children}
    </NextIntlClientProvider>
  );
}
