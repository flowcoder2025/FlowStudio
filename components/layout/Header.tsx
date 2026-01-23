/**
 * Header Component
 * Contract: AUTH_DESIGN_HEADER_STATE
 * Evidence: IMPLEMENTATION_PLAN.md Phase 1
 */

"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X, User, LogOut, Settings, ImageIcon } from "lucide-react";
import { CreditBadge } from "./CreditBadge";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function Header() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  return (
    <header className="sticky top-0 z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary-600 dark:text-primary-400">FlowStudio</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {isAuthenticated && (
              <>
                <Link
                  href="/"
                  className="px-4 py-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  홈
                </Link>
                <Link
                  href="/gallery"
                  className="px-4 py-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  갤러리
                </Link>
                <Link
                  href="/color-correction"
                  className="px-4 py-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  색상 보정
                </Link>
              </>
            )}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            ) : isAuthenticated ? (
              <>
                {/* Credit Badge */}
                <CreditBadge />

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors touch-target"
                  >
                    {session?.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "프로필"}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      </div>
                    )}
                  </button>

                  {isProfileOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsProfileOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-20 animate-fade-in">
                        <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-700">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {session?.user?.name}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                            {session?.user?.email}
                          </p>
                        </div>
                        <Link
                          href="/gallery"
                          className="flex items-center gap-2 px-4 py-3 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all touch-target"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <ImageIcon className="w-4 h-4" />
                          내 갤러리
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center gap-2 px-4 py-3 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all touch-target"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          설정
                        </Link>
                        <button
                          onClick={() => signOut({ callbackUrl: "/login" })}
                          className="flex items-center gap-2 w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 active:scale-95 transition-all touch-target"
                        >
                          <LogOut className="w-4 h-4" />
                          로그아웃
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="btn-primary"
              >
                로그인
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 touch-target"
            >
              {isMenuOpen ? <X className="w-5 h-5 text-zinc-700 dark:text-zinc-300" /> : <Menu className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-zinc-200 dark:border-zinc-700 animate-fade-in">
            {isAuthenticated ? (
              <div className="space-y-1">
                <Link
                  href="/"
                  className="block px-4 py-3 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg active:scale-95 transition-all touch-target"
                  onClick={() => setIsMenuOpen(false)}
                >
                  홈
                </Link>
                <Link
                  href="/gallery"
                  className="block px-4 py-3 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg active:scale-95 transition-all touch-target"
                  onClick={() => setIsMenuOpen(false)}
                >
                  갤러리
                </Link>
                <Link
                  href="/color-correction"
                  className="block px-4 py-3 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg active:scale-95 transition-all touch-target"
                  onClick={() => setIsMenuOpen(false)}
                >
                  색상 보정
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className="block px-4 py-3 text-primary-600 dark:text-primary-400 font-medium active:scale-95 transition-all touch-target"
                onClick={() => setIsMenuOpen(false)}
              >
                로그인
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
