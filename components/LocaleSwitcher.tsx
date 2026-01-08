'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';

type Locale = 'ko' | 'en';

const LOCALE_LABELS: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
};

const LOCALE_SHORT: Record<Locale, string> = {
  ko: 'KO',
  en: 'EN',
};

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  
  const currentLocale = (params.locale as Locale) || detectLocaleFromPath(pathname);

  function detectLocaleFromPath(path: string): Locale {
    if (path.startsWith('/en')) return 'en';
    if (path.startsWith('/ko')) return 'ko';
    return 'ko';
  }

  function switchLocale(newLocale: Locale) {
    if (newLocale === currentLocale) return;

    let newPath = pathname;
    
    if (pathname.startsWith('/ko') || pathname.startsWith('/en')) {
      newPath = pathname.replace(/^\/(ko|en)/, `/${newLocale}`);
    } else {
      newPath = `/${newLocale}${pathname}`;
    }

    router.push(newPath);
  }

  const otherLocale: Locale = currentLocale === 'ko' ? 'en' : 'ko';

  return (
    <button
      onClick={() => switchLocale(otherLocale)}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[36px]"
      title={`Switch to ${LOCALE_LABELS[otherLocale]}`}
    >
      <Globe className="w-4 h-4" />
      <span className="hidden sm:inline">{LOCALE_SHORT[otherLocale]}</span>
    </button>
  );
}
