'use client';

import React from 'react';
import Image from 'next/image';
import { Sparkles, Wand2, Layout, FilePenLine, User, LogIn, LogOut, Moon, Sun } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { AppMode } from '@/types';
import { useNavigation } from '@/hooks/useNavigation';

interface HeaderProps {
  currentMode: AppMode;
}

export const Header: React.FC<HeaderProps> = ({ currentMode }) => {
  const { navigateToMode, navigateTo } = useNavigation();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

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
              <span className="hidden md:inline">편집</span>
            </button>
          </nav>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 min-w-[44px] min-h-[44px] rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center"
            title="테마 전환"
            aria-label="테마 전환"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Authentication UI */}
          {status === 'loading' ? (
            <div className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500">로딩 중...</div>
          ) : session ? (
            // Logged in state
            <>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-full">
                <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                  {session.user?.name || session.user?.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2.5 min-w-[44px] min-h-[44px] rounded-full text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all flex items-center justify-center"
                title="로그아웃"
                aria-label="로그아웃"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            // Not logged in state
            <button
              onClick={() => navigateTo('/login')}
              className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-full bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all text-sm font-medium"
              title="로그인"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">로그인</span>
            </button>
          )}

          <button
            onClick={() => navigateToMode(AppMode.PROFILE)}
            className={`p-2.5 min-w-[44px] min-h-[44px] rounded-full transition-all flex items-center justify-center ${
              currentMode === AppMode.PROFILE
                ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-md'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="프로필 및 설정"
            aria-label="프로필 및 설정"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
