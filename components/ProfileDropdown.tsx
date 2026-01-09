'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  User,
  LogOut,
  Settings,
  Moon,
  Sun,
  ChevronDown,
  ImageIcon,
  Sparkles,
  Wand2,
  Layers,
  Layout,
  FilePenLine,
  Megaphone,
  SlidersHorizontal
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { AppMode } from '@/types';
import { useNavigation } from '@/hooks/useNavigation';

export const ProfileDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { navigateToMode, navigateTo } = useNavigation();

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut({ callbackUrl: '/' });
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const modeButtons = [
    { mode: AppMode.CREATE, label: '생성', icon: Sparkles, color: 'indigo' },
    { mode: AppMode.EDIT, label: '편집', icon: Wand2, color: 'emerald' },
    { mode: AppMode.COMPOSITE, label: '연출', icon: Layers, color: 'cyan' },
    { mode: AppMode.DETAIL_PAGE, label: '상세페이지', icon: Layout, color: 'blue' },
    { mode: AppMode.DETAIL_EDIT, label: '상세 편집', icon: FilePenLine, color: 'violet' },
    { mode: AppMode.POSTER, label: '포스터', icon: Megaphone, color: 'rose' },
    { mode: AppMode.COLOR_CORRECTION, label: '색감 보정', icon: SlidersHorizontal, color: 'amber' },
  ];

  if (!session) {
    return null;
  }

  const userImage = session.user?.image;
  const userName = session.user?.name || session.user?.email || '사용자';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 프로필 트리거 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="프로필 메뉴"
      >
        {userImage ? (
          <Image
            src={userImage}
            alt={userName}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        )}
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden md:inline">
          {userName}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50 transition-colors">
          {/* 사용자 정보 */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {userName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {session.user?.email}
            </p>
          </div>

          {/* 모드 전환 섹션 */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase">
              모드 전환
            </p>
            <div className="grid grid-cols-2 gap-2">
              {modeButtons.map(({ mode, label, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => {
                    navigateToMode(mode);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-left"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 설정 섹션 */}
          <div className="py-2">
            {/* 크레딧 받기 (레퍼럴) - 임시 비활성화 */}
            {/* <button
              onClick={() => {
                navigateTo('/profile/referral');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-700 dark:text-purple-300 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-colors"
            >
              <Gift className="w-5 h-5" />
              <span className="flex-1 text-left">친구 초대로 크래딧 받기</span>
              <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">+150</span>
            </button> */}

            {/* 다크모드 토글 */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-5 h-5" />
                  <span>라이트 모드</span>
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5" />
                  <span>다크 모드</span>
                </>
              )}
            </button>

            {/* 이미지 저장소 */}
            <button
              onClick={() => {
                navigateTo('/gallery');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ImageIcon className="w-5 h-5" />
              <span>이미지 저장소</span>
            </button>

            {/* 프로필 설정 */}
            <button
              onClick={() => {
                navigateToMode(AppMode.PROFILE);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>프로필 설정</span>
            </button>
          </div>

          {/* 로그아웃 */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
