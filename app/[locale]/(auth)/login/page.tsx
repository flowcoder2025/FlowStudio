/**
 * Login Page
 * Contract: AUTH_DESIGN_LOGIN_PAGE
 * Evidence: IMPLEMENTATION_PLAN.md Phase 1
 */

"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");
  const t = useTranslations();

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl });
  };

  const handleKakaoLogin = () => {
    signIn("kakao", { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-lg dark:shadow-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
        {/* Logo & Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{t("login.title")}</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {t("login.subtitle")}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400 text-sm">
            {t("login.error")}
          </div>
        )}

        {/* Login Buttons */}
        <div className="space-y-4">
          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors touch-target"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">{t("login.continueWithGoogle")}</span>
          </button>

          {/* Kakao Login */}
          <button
            onClick={handleKakaoLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-transparent rounded-lg bg-[#FEE500] hover:bg-[#FDD835] transition-colors touch-target"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#000000"
                d="M12 3c-5.52 0-10 3.59-10 8 0 2.82 1.88 5.29 4.69 6.69-.21.77-.77 2.8-.88 3.24-.14.55.2.54.42.39.17-.12 2.69-1.83 3.77-2.57.65.09 1.32.14 2 .14 5.52 0 10-3.59 10-8s-4.48-8-10-8z"
              />
            </svg>
            <span className="text-zinc-900 font-medium">{t("login.continueWithKakao")}</span>
          </button>
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-8">
          {t.rich("auth.termsAgreement", {
            terms: (chunks) => (
              <Link href="/terms" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link href="/privacy" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
