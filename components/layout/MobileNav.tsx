/**
 * Mobile Navigation Component
 * Contract: INTEGRATION_DESIGN_MOBILE_NAV
 * Evidence: Phase 10 Page Integration
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Home,
  Sparkles,
  Image,
  Settings,
  CreditCard,
  User,
  Menu,
  X,
  ChevronRight,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWorkflowStore } from "@/lib/workflow/store";
import { getAllIndustries, Industry } from "@/lib/workflow/industries";

// ============================================================
// Types
// ============================================================

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  requireAuth?: boolean;
}

// ============================================================
// Navigation Items
// ============================================================

const MAIN_NAV_ITEMS: NavItem[] = [
  { label: "홈", href: "/", icon: Home },
  { label: "갤러리", href: "/gallery", icon: Image, requireAuth: true },
  { label: "요금제", href: "/pricing", icon: CreditCard },
  { label: "설정", href: "/settings", icon: Settings, requireAuth: true },
];

// ============================================================
// Bottom Navigation (Mobile Only)
// ============================================================

export function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Filter items based on auth
  const visibleItems = MAIN_NAV_ITEMS.filter(
    (item) => !item.requireAuth || session
  );

  // If user is not logged in, show login button
  const navItems = session
    ? visibleItems
    : [...visibleItems, { label: "로그인", href: "/login", icon: LogIn }];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1",
                "transition-colors",
                isActive
                  ? "text-primary-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ============================================================
// Mobile Menu (Slide-out)
// ============================================================

export function MobileMenu() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const industries = getAllIndustries();

  // Zustand store
  const recentWorkflows = useWorkflowStore((state) => state.recentWorkflows);
  const selectIndustry = useWorkflowStore((state) => state.selectIndustry);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Menu Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="md:hidden"
        aria-label="메뉴 열기"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div
        className={cn(
          "md:hidden fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white z-50",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Link href="/" className="font-bold text-lg text-primary-600">
            FlowStudio
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            aria-label="메뉴 닫기"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100vh-64px)] pb-safe">
          {/* User Section */}
          {status === "loading" ? (
            <div className="p-4 border-b">
              <div className="h-10 bg-gray-100 animate-pulse rounded" />
            </div>
          ) : session ? (
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{session.user?.name}</p>
                  <p className="text-xs text-gray-500">{session.user?.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 border-b">
              <Link href="/login">
                <Button className="w-full">
                  <LogIn className="w-4 h-4 mr-2" />
                  로그인
                </Button>
              </Link>
            </div>
          )}

          {/* Quick Start Section */}
          <div className="p-4 border-b">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
              빠른 시작
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {industries.slice(0, 4).map((industry) => (
                <Link
                  key={industry.id}
                  href={`/workflow/${industry.id}`}
                  onClick={() => {
                    selectIndustry(industry.id as Industry);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-lg">{industry.icon}</span>
                  <span className="text-sm font-medium truncate">
                    {industry.nameKo}
                  </span>
                </Link>
              ))}
            </div>
            <Link
              href="/"
              className="flex items-center justify-center gap-1 mt-3 text-sm text-primary-600 hover:text-primary-700"
            >
              <Sparkles className="w-4 h-4" />
              <span>모든 업종 보기</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Recent Workflows */}
          {recentWorkflows.length > 0 && (
            <div className="p-4 border-b">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                최근 작업
              </h3>
              <div className="space-y-2">
                {recentWorkflows.slice(0, 3).map((workflow, index) => {
                  const industryInfo = industries.find(
                    (i) => i.id === workflow.industry
                  );
                  return (
                    <Link
                      key={index}
                      href={`/workflow/${workflow.industry}/${workflow.action}`}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <span>{industryInfo?.icon}</span>
                      <span className="text-sm flex-1 truncate">
                        {industryInfo?.nameKo} - {workflow.action}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Navigation */}
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
              메뉴
            </h3>
            <nav className="space-y-1">
              {MAIN_NAV_ITEMS.map((item) => {
                if (item.requireAuth && !session) return null;

                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary-50 text-primary-600"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto px-2 py-0.5 bg-primary-100 text-primary-600 text-xs rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================
// Combined Export
// ============================================================

export default function MobileNav() {
  return (
    <>
      <MobileBottomNav />
    </>
  );
}
