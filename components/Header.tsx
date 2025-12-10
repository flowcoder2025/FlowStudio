'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Sparkles, Wand2, Layout, FilePenLine, LogIn, Megaphone, SlidersHorizontal, Menu, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { AppMode } from '@/types';
import { useNavigation } from '@/hooks/useNavigation';
import { ProfileDropdown } from './ProfileDropdown';
import { CreditBalance } from './CreditBalance';

interface HeaderProps {
  currentMode: AppMode;
}

export const Header: React.FC<HeaderProps> = ({ currentMode }) => {
  const { navigateToMode, navigateTo } = useNavigation();
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { mode: AppMode.CREATE, icon: Sparkles, label: '생성', color: 'indigo' },
    { mode: AppMode.EDIT, icon: Wand2, label: '편집', color: 'emerald' },
    { mode: AppMode.DETAIL_PAGE, icon: Layout, label: '상세페이지', color: 'blue' },
    { mode: AppMode.DETAIL_EDIT, icon: FilePenLine, label: '상세 편집', color: 'violet' },
    { mode: AppMode.POSTER, icon: Megaphone, label: '포스터', color: 'rose' },
    { mode: AppMode.COLOR_CORRECTION, icon: SlidersHorizontal, label: '색감', color: 'amber' },
  ];

  const handleNavigation = (mode: AppMode) => {
    navigateToMode(mode);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 transition-colors">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer min-h-[44px] flex-shrink-0"
            onClick={() => navigateToMode(AppMode.HOME)}
          >
            <Image
              src="/FlowStudio_icon-removebg.png"
              alt="FlowStudio"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg leading-tight text-slate-800 dark:text-slate-100">FlowStudio</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">AI 이미지 생성</p>
            </div>
          </div>

          {/* Desktop Navigation (hidden on mobile) */}
          <nav className="hidden lg:flex gap-1 flex-1 justify-center">
            {navigationItems.map(({ mode, icon: Icon, label, color }) => (
              <button
                key={mode}
                onClick={() => navigateToMode(mode)}
                className={`px-4 py-2 min-h-[44px] rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  currentMode === mode
                    ? `bg-${color}-600 dark:bg-${color}-500 text-white shadow-md`
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                style={currentMode === mode ? {
                  backgroundColor: `var(--${color}-600)`,
                } : undefined}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="메뉴 열기"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Authentication UI */}
            {status === 'loading' ? (
              <div className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500">로딩 중...</div>
            ) : session ? (
              // Logged in state - Credit Balance + Profile Dropdown
              <div className="flex items-center gap-2">
                <CreditBalance />
                <ProfileDropdown />
              </div>
            ) : (
              // Not logged in state - Login Button
              <button
                onClick={() => navigateTo('/login')}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] rounded-full bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all text-sm font-medium"
                title="로그인"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">로그인</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 dark:bg-black/70 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {/* Mobile Menu Panel */}
          <div
            className="absolute top-16 left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex flex-col p-4 gap-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {navigationItems.map(({ mode, icon: Icon, label, color }) => (
                <button
                  key={mode}
                  onClick={() => handleNavigation(mode)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3 ${
                    currentMode === mode
                      ? `bg-${color}-600 dark:bg-${color}-500 text-white shadow-md`
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  style={currentMode === mode ? {
                    backgroundColor: `var(--${color}-600)`,
                  } : undefined}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
