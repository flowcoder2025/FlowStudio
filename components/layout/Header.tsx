/**
 * Header Component
 * Contract: AUTH_DESIGN_HEADER_STATE
 * Evidence: IMPLEMENTATION_PLAN.md Phase 1
 * Optimized: Hoisted JSX icons (Vercel Best Practice: rendering-hoist-jsx)
 */

"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu, X, User, LogOut, Settings, ImageIcon, ExternalLink,
  ChevronDown, Pencil, LayoutGrid, Layers, PenTool, FileImage,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { CreditBadge } from "./CreditBadge";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageToggle } from "@/components/theme/language-toggle";
import { useWorkflowStore } from "@/lib/workflow/store";
import type { ToolMode } from "@/lib/tools/types";

// Hoisted static JSX - prevents recreation on every render
const UserIconSmall = <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />;
const LogOutIcon = <LogOut className="w-4 h-4" />;
const SettingsIcon = <Settings className="w-4 h-4" />;
const GalleryIcon = <ImageIcon className="w-4 h-4" />;
const MenuIcon = <Menu className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />;
const CloseIcon = <X className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />;

// Tool navigation items with immersive mode mapping
const TOOL_NAV_ITEMS = [
  { toolMode: "EDIT" as ToolMode, labelKey: "nav.toolEdit" as const, icon: Pencil },
  { toolMode: "POSTER" as ToolMode, labelKey: "nav.toolPoster" as const, icon: FileImage },
  { toolMode: "COMPOSITE" as ToolMode, labelKey: "nav.toolComposite" as const, icon: LayoutGrid },
  { toolMode: "DETAIL_EDIT" as ToolMode, labelKey: "nav.toolDetailEdit" as const, icon: PenTool },
  { toolMode: "DETAIL_PAGE" as ToolMode, labelKey: "nav.toolDetailPage" as const, icon: Layers },
] as const;

export function Header() {
  const { data: session, status } = useSession();
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  const enterToolMode = useWorkflowStore((state) => state.enterToolMode);

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  // Handle tool click: enter immersive tool mode + navigate to home
  const handleToolClick = useCallback((mode: ToolMode) => {
    if (status !== "authenticated") {
      router.push("/login?callbackUrl=/");
      return;
    }
    enterToolMode(mode);
    // Navigate to home if not already there
    const isHome = pathname === "/" || /^\/[a-z]{2}\/?$/.test(pathname);
    if (!isHome) {
      router.push("/");
    }
    setIsToolsOpen(false);
    setIsMenuOpen(false);
  }, [status, enterToolMode, router, pathname]);

  return (
    <header className="sticky top-0 z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 z-10">
            <span className="text-xl font-bold text-primary-600 dark:text-primary-400">FlowStudio</span>
          </Link>

          {/* Desktop Navigation - absolute center */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            <Link
              href="/"
              className="px-4 py-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              {t("nav.home")}
            </Link>
            {/* Tools Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                className={cn(
                  "flex items-center gap-1 px-4 py-2 rounded-lg transition-colors",
                  isToolsOpen
                    ? "text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800"
                    : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
              >
                {t("nav.tools")}
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isToolsOpen && "rotate-180")} />
              </button>
              {isToolsOpen ? (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsToolsOpen(false)} />
                  <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 py-2 z-20 animate-fade-in">
                    {TOOL_NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.toolMode}
                          onClick={() => handleToolClick(item.toolMode)}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-left"
                        >
                          <Icon className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                          <span className="text-sm font-medium">{t(item.labelKey)}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>
            {isAuthenticated && (
              <Link
                href="/gallery"
                className="px-4 py-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                {t("nav.gallery")}
              </Link>
            )}
            <Link
              href="/pricing"
              className="px-4 py-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              {t("nav.pricing")}
            </Link>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2 z-10">
            {/* Previous Version */}
            <div className="relative hidden md:flex group">
              <a
                href="https://flow-studio-old.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors touch-target active:scale-95"
                aria-label={t("nav.previous")}
              >
                <ExternalLink className="w-5 h-5" />
              </a>
              <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2.5 py-1 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                {t("nav.previous")}
              </span>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Language Toggle */}
            <LanguageToggle />

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
                        alt={session.user.name || t("auth.profile")}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                        {UserIconSmall}
                      </div>
                    )}
                  </button>

                  {/* Conditional rendering with ternary (Vercel Best Practice: rendering-conditional-render) */}
                  {isProfileOpen ? (
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
                          {GalleryIcon}
                          {t("nav.myGallery")}
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center gap-2 px-4 py-3 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all touch-target"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          {SettingsIcon}
                          {t("nav.settings")}
                        </Link>
                        <button
                          onClick={() => signOut({ callbackUrl: "/login" })}
                          className="flex items-center gap-2 w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 active:scale-95 transition-all touch-target"
                        >
                          {LogOutIcon}
                          {t("nav.logout")}
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="btn-primary"
              >
                {t("nav.login")}
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 touch-target"
            >
              {isMenuOpen ? CloseIcon : MenuIcon}
            </button>
          </div>
        </div>

        {/* Mobile Navigation - ternary conditional (Vercel Best Practice: rendering-conditional-render) */}
        {isMenuOpen ? (
          <nav className="md:hidden py-4 border-t border-zinc-200 dark:border-zinc-700 animate-fade-in">
            <div className="space-y-1">
              <Link
                href="/"
                className="block px-4 py-3 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg active:scale-95 transition-all touch-target"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("nav.home")}
              </Link>
              {/* Tools Section */}
              <div className="px-4 pt-2 pb-1">
                <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase">
                  {t("nav.tools")}
                </p>
              </div>
              {TOOL_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.toolMode}
                    onClick={() => handleToolClick(item.toolMode)}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg active:scale-95 transition-all touch-target text-left"
                  >
                    <Icon className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                    <span className="text-sm">{t(item.labelKey)}</span>
                  </button>
                );
              })}
              {/* Divider */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />
              {isAuthenticated && (
                <Link
                  href="/gallery"
                  className="block px-4 py-3 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg active:scale-95 transition-all touch-target"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t("nav.gallery")}
                </Link>
              )}
              <Link
                href="/pricing"
                className="block px-4 py-3 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg active:scale-95 transition-all touch-target"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("nav.pricing")}
              </Link>
              <a
                href="https://flow-studio-old.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-4 py-3 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg active:scale-95 transition-all touch-target"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("nav.previous")}
                <ExternalLink className="w-3 h-3" />
              </a>
              {!isAuthenticated && (
                <>
                  <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />
                  <Link
                    href="/login"
                    className="block px-4 py-3 text-primary-600 dark:text-primary-400 font-medium active:scale-95 transition-all touch-target"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t("nav.login")}
                  </Link>
                </>
              )}
            </div>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
