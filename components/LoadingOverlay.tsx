'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, message = "AI가 이미지를 생성하고 있습니다..." }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[70] flex flex-col items-center justify-center text-white">
      <div className="bg-white/10 dark:bg-white/5 p-8 rounded-2xl flex flex-col items-center border border-white/20 dark:border-white/10 shadow-2xl">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-indigo-400 dark:text-indigo-300" />
        <h3 className="text-xl font-bold mb-2">잠시만 기다려주세요</h3>
        <p className="text-sm text-gray-200 dark:text-gray-300 text-center max-w-xs">{message}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">최대 60초 정도 소요될 수 있습니다.</p>
      </div>
    </div>
  );
};
