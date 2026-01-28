/**
 * Language Toggle Component
 * Dropdown for switching between languages
 * Design matches ThemeToggle component
 */

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect, useTransition } from "react";
import { routing, type Locale } from "@/i18n/routing";

const localeFlags: Record<Locale, string> = {
  ko: "🇰🇷",
  en: "🇺🇸",
};

export function LanguageToggle() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("language");
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchLocale = (newLocale: Locale) => {
    setIsOpen(false);

    startTransition(() => {
      // Remove current locale prefix from pathname
      let newPathname = pathname;

      // Handle locale prefix removal
      for (const loc of routing.locales) {
        if (pathname.startsWith(`/${loc}/`)) {
          newPathname = pathname.slice(loc.length + 1);
          break;
        } else if (pathname === `/${loc}`) {
          newPathname = '/';
          break;
        }
      }

      // Add new locale prefix if not default
      if (newLocale === routing.defaultLocale) {
        router.push(newPathname);
      } else {
        router.push(`/${newLocale}${newPathname === '/' ? '' : newPathname}`);
      }
    });
  };

  // SSR placeholder
  if (!mounted) {
    return (
      <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 w-9 h-9" />
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors touch-target active:scale-95 disabled:opacity-50"
        aria-label={t("changeLanguage")}
      >
        {isPending ? (
          <div className="w-5 h-5 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <span className="text-base leading-none">{localeFlags[locale]}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50 animate-fade-in">
          {routing.locales.map((loc) => (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              disabled={isPending}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors touch-target active:scale-95
                ${
                  locale === loc
                    ? "bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                }`}
            >
              <span className="text-base">{localeFlags[loc]}</span>
              {t(loc)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
