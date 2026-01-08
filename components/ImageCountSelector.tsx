'use client';

import React from 'react';

interface ImageCountSelectorProps {
  value: number;
  onChange: (count: number) => void;
  disabled?: boolean;
}

const CREDITS_PER_IMAGE = 5;

export function ImageCountSelector({ value, onChange, disabled = false }: ImageCountSelectorProps) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4].map(num => (
        <button
          key={num}
          onClick={() => onChange(num)}
          disabled={disabled}
          className={`px-2.5 py-1 min-w-[36px] rounded-lg text-xs font-medium transition-all ${
            value === num
              ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm'
              : disabled
              ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          {num}장
        </button>
      ))}
    </div>
  );
}

export function getRequiredCredits(imageCount: number): number {
  return CREDITS_PER_IMAGE * imageCount;
}
