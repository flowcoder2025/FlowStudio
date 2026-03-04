'use client';

/**
 * AspectRatioSelector - Visual aspect ratio selection grid
 * Used by: Edit, Poster, Composite pages
 */

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ASPECT_RATIOS } from '@/lib/tools/constants';
import type { AspectRatio } from '@/lib/imageProvider/types';

export interface AspectRatioSelectorProps {
  value: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
  disabled?: boolean;
  className?: string;
}

export function AspectRatioSelector({
  value,
  onChange,
  disabled = false,
  className,
}: AspectRatioSelectorProps) {
  const t = useTranslations();

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {t('tools.aspectRatio.title')}
      </label>
      <div className="grid grid-cols-5 gap-2">
        {ASPECT_RATIOS.map((ratio) => {
          const isSelected = value === ratio.value;
          // Normalize for visual representation (max 32px)
          const scale = 28 / Math.max(ratio.width, ratio.height);
          const w = Math.round(ratio.width * scale);
          const h = Math.round(ratio.height * scale);

          return (
            <button
              key={ratio.value}
              type="button"
              onClick={() => !disabled && onChange(ratio.value)}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all',
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {/* Visual ratio box */}
              <div className="flex items-center justify-center h-9">
                <div
                  className={cn(
                    'rounded-sm border',
                    isSelected
                      ? 'border-blue-500 bg-blue-200 dark:bg-blue-800'
                      : 'border-zinc-300 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-700'
                  )}
                  style={{ width: `${w}px`, height: `${h}px` }}
                />
              </div>
              {/* Label */}
              <span className={cn(
                'text-xs font-medium',
                isSelected
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-zinc-500 dark:text-zinc-400'
              )}>
                {ratio.value}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
