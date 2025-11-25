'use client';

import React from 'react';
import { Wand2, User, FilePenLine } from 'lucide-react';
import { AppMode } from '@/types';

interface HeaderProps {
  currentMode: AppMode;
  onNavigate: (mode: AppMode) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentMode, onNavigate }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onNavigate(AppMode.HOME)}
        >
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Wand2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-slate-800">BizAI 스튜디오</h1>
            <p className="text-[10px] text-slate-500 font-medium">소상공인을 위한 스마트 디자인</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <nav className="flex gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => onNavigate(AppMode.CREATE)}
              className={`px-3 md:px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                currentMode === AppMode.CREATE
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              이미지 생성
            </button>
            <button
              onClick={() => onNavigate(AppMode.DETAIL_PAGE)}
              className={`px-3 md:px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                currentMode === AppMode.DETAIL_PAGE
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              상세페이지 제작
            </button>
            <button
              onClick={() => onNavigate(AppMode.DETAIL_EDIT)}
              className={`px-3 md:px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                currentMode === AppMode.DETAIL_EDIT
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FilePenLine className="w-4 h-4 hidden sm:block" />
              상세페이지 편집
            </button>
            <button
              onClick={() => onNavigate(AppMode.EDIT)}
              className={`px-3 md:px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                currentMode === AppMode.EDIT
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              간편 편집
            </button>
          </nav>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>

          <button
            onClick={() => onNavigate(AppMode.PROFILE)}
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
