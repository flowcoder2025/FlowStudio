/**
 * Edge Auth + i18n Middleware (v2)
 * - NextAuth Edge-safe auth wrapper (auth.config.ts)
 * - CVE-2025-29927 방어 (x-middleware-subrequest 차단)
 * - 기존 i18n 로직 보존 (geo-based locale detection)
 */

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const { auth } = NextAuth(authConfig);

const intlMiddleware = createMiddleware({
  ...routing,
  localeDetection: false,
});

const publicPatterns = [
  /^\/(ko|en)?\/?$/, // 홈 화면
  /^\/(ko|en)?\/?(login|pricing|api\/auth|api\/webhooks)(\/|$)/,
];

function isPublicRoute(pathname: string): boolean {
  return publicPatterns.some((p) => p.test(pathname));
}

export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  // CVE-2025-29927 방어
  if (req.headers.get("x-middleware-subrequest")) {
    return new NextResponse(null, { status: 403 });
  }

  // 보호 라우트 auth 체크
  if (!isPublicRoute(pathname) && !req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // === 기존 i18n 로직 그대로 ===
  const hasExplicitLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  const localeCookie = req.cookies.get("NEXT_LOCALE")?.value as "ko" | "en" | undefined;
  const isValidCookie = localeCookie && routing.locales.includes(localeCookie);

  if (isValidCookie && !hasExplicitLocale) {
    if (localeCookie !== routing.defaultLocale) {
      const url = req.nextUrl.clone();
      url.pathname = `/${localeCookie}${pathname}`;
      return NextResponse.redirect(url);
    }
  }
  if (hasExplicitLocale) return intlMiddleware(req as unknown as NextRequest);
  if (!isValidCookie) {
    const country = req.headers.get("x-vercel-ip-country") || "KR";
    const detectedLocale = country === "KR" ? "ko" : "en";
    if (detectedLocale !== routing.defaultLocale) {
      const url = req.nextUrl.clone();
      url.pathname = `/${detectedLocale}${pathname}`;
      const response = NextResponse.redirect(url);
      response.cookies.set("NEXT_LOCALE", detectedLocale, {
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
      return response;
    }
  }

  // 기본 로케일 + 접두사 없는 경로 → 직접 rewrite
  // (intlMiddleware가 auth() 래퍼 안에서 rewrite+location 동시 반환하여 루프 발생 방지)
  const url = req.nextUrl.clone();
  url.pathname = `/${routing.defaultLocale}${pathname}`;
  return NextResponse.rewrite(url);
});

export const config = {
  matcher: ["/((?!api|admin|_next|.*\\..*).*)"],
};
