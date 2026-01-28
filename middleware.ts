/**
 * i18n Middleware
 * Handles locale detection and routing with geo-based detection
 * - Korea (KR): Korean (ko)
 * - All other countries: English (en)
 */

import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware({
  ...routing,
  localeDetection: false, // Disable Accept-Language header detection
});

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if URL already has locale prefix
  const hasExplicitLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Check for locale cookie (set when user manually switches language)
  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value as 'ko' | 'en' | undefined;
  const isValidCookie = localeCookie && routing.locales.includes(localeCookie);

  // If user has a valid cookie preference and URL doesn't match, redirect
  if (isValidCookie && !hasExplicitLocale) {
    // Cookie says 'en' but URL has no prefix -> redirect to /en/...
    if (localeCookie !== routing.defaultLocale) {
      const url = request.nextUrl.clone();
      url.pathname = `/${localeCookie}${pathname}`;
      return NextResponse.redirect(url);
    }
    // Cookie says 'ko' (default) - continue without redirect
  }

  // If URL has locale prefix, just process normally
  if (hasExplicitLocale) {
    return intlMiddleware(request);
  }

  // No cookie and no URL locale -> geo-based detection for first-time visitors
  if (!isValidCookie) {
    // x-vercel-ip-country is provided by Vercel's Edge Network
    // Fallback to Korea for local development
    const country = request.headers.get('x-vercel-ip-country') || 'KR';

    // Korea gets Korean, all others get English
    const detectedLocale = country === 'KR' ? 'ko' : 'en';

    // If detected locale is not default (ko), redirect to locale-prefixed URL
    if (detectedLocale !== routing.defaultLocale) {
      const url = request.nextUrl.clone();
      url.pathname = `/${detectedLocale}${pathname}`;

      const response = NextResponse.redirect(url);
      response.cookies.set('NEXT_LOCALE', detectedLocale, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      });
      return response;
    }
  }

  // Default locale (ko) - no redirect needed
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - api routes
  // - _next (Next.js internals)
  // - static files (images, etc.)
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
