'use client';

import React from 'react';
import Image from 'next/image';
import { Sparkles, Wand2, Layout, FilePenLine, LogIn, Megaphone, SlidersHorizontal } from 'lucide-react';
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

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer min-h-[44px] -ml-2 pl-2"
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
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">AI 이미지 생성 플랫폼</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <nav className="flex gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => navigateToMode(AppMode.CREATE)}
              className={`px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                currentMode === AppMode.CREATE
                  ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">생성</span>
            </button>
            <button
              onClick={() => navigateToMode(AppMode.EDIT)}
              className={`px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                currentMode === AppMode.EDIT
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Wand2 className="w-4 h-4" />
              <span className="hidden sm:inline">편집</span>
            </button>
            <button
              onClick={() => navigateToMode(AppMode.DETAIL_PAGE)}
              className={`px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                currentMode === AppMode.DETAIL_PAGE
                  ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Layout className="w-4 h-4" />
              <span className="hidden md:inline">상세페이지</span>
            </button>
            <button
              onClick={() => navigateToMode(AppMode.DETAIL_EDIT)}
              className={`px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                currentMode === AppMode.DETAIL_EDIT
                  ? 'bg-violet-600 dark:bg-violet-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FilePenLine className="w-4 h-4" />
              <span className="hidden md:inline">상세 편집</span>
            </button>
            <button
              onClick={() => navigateToMode(AppMode.POSTER)}
              className={`px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                currentMode === AppMode.POSTER
                  ? 'bg-rose-600 dark:bg-rose-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span className="hidden md:inline">포스터</span>
            </button>
            <button
              onClick={() => navigateToMode(AppMode.COLOR_CORRECTION)}
              className={`px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                currentMode === AppMode.COLOR_CORRECTION
                  ? 'bg-amber-600 dark:bg-amber-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden md:inline">색감</span>
            </button>
          </nav>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

          {/* Authentication UI */}
          {status === 'loading' ? (
            <div className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500">로딩 중...</div>
          ) : session ? (
            // Logged in state - Credit Balance + Profile Dropdown
            <div className="flex items-center gap-3">
              <CreditBalance />
              <ProfileDropdown />
            </div>
          ) : (
            // Not logged in state - Login Button
            <button
              onClick={() => navigateTo('/login')}
              className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-full bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all text-sm font-medium"
              title="로그인"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">로그인</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
