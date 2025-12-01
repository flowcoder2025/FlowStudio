'use client';

import React from 'react';
import { Sparkles, Wand2, Layout, FilePenLine, User, LogIn, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { AppMode } from '@/types';
import { useNavigation } from '@/hooks/useNavigation';

interface HeaderProps {
  currentMode: AppMode;
}

export const Header: React.FC<HeaderProps> = ({ currentMode }) => {
  const { navigateToMode, navigateTo } = useNavigation();
  const { data: session, status } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigateToMode(AppMode.HOME)}
        >
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Wand2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-slate-800">FlowStudio</h1>
            <p className="text-[10px] text-slate-500 font-medium">AI 이미지 생성 플랫폼</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <nav className="flex gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => navigateToMode(AppMode.CREATE)}
              className={`px-3 md:px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                currentMode === AppMode.CREATE
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4 h-4 hidden sm:block" />
              이미지 생성
            </button>
            <button
              onClick={() => navigateToMode(AppMode.EDIT)}
              className={`px-3 md:px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                currentMode === AppMode.EDIT
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Wand2 className="w-4 h-4 hidden sm:block" />
              이미지 편집
            </button>
            <button
              onClick={() => navigateToMode(AppMode.DETAIL_PAGE)}
              className={`px-3 md:px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                currentMode === AppMode.DETAIL_PAGE
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layout className="w-4 h-4 hidden sm:block" />
              상세페이지 제작
            </button>
            <button
              onClick={() => navigateToMode(AppMode.DETAIL_EDIT)}
              className={`px-3 md:px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                currentMode === AppMode.DETAIL_EDIT
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FilePenLine className="w-4 h-4 hidden sm:block" />
              상세페이지 편집
            </button>
          </nav>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>

          {/* Authentication UI */}
          {status === 'loading' ? (
            <div className="px-3 py-2 text-sm text-slate-400">로딩 중...</div>
          ) : session ? (
            // Logged in state
            <>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full">
                <span className="text-sm text-slate-700 font-medium">
                  {session.user?.name || session.user?.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
                title="로그아웃"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            // Not logged in state
            <button
              onClick={() => navigateTo('/login')}
              className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-all text-sm font-medium"
              title="로그인"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">로그인</span>
            </button>
          )}

          <button
            onClick={() => navigateToMode(AppMode.PROFILE)}
            className={`p-2 rounded-full transition-all ${
              currentMode === AppMode.PROFILE
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="프로필 및 설정"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
