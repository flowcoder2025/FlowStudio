'use client';

/**
 * GenerationBar - Bottom sticky bar with image count selector + generate button
 * Used by: Edit, Poster, Composite pages
 */

import { useTranslations } from 'next-intl';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { IMAGE_COUNT_OPTIONS } from '@/lib/tools/constants';
import type { ImageCount } from '@/lib/tools/constants';

export interface GenerationBarProps {
  imageCount: ImageCount;
  onImageCountChange: (count: ImageCount) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  disabled?: boolean;
  className?: string;
}

export function GenerationBar({
  imageCount,
  onImageCountChange,
  onGenerate,
  isGenerating,
  disabled = false,
  className,
}: GenerationBarProps) {
  const t = useTranslations('tools.common');

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg',
        'border-t border-zinc-200 dark:border-zinc-800',
        'px-4 py-3',
        className
      )}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        {/* Image count selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400 hidden sm:inline">
            {t('imageCount')}
          </span>
          <div className="flex gap-1">
            {IMAGE_COUNT_OPTIONS.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => onImageCountChange(count)}
                disabled={disabled || isGenerating}
                className={cn(
                  'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                  imageCount === count
                    ? 'bg-blue-500 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700',
                  (disabled || isGenerating) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <Button
          onClick={onGenerate}
          disabled={disabled || isGenerating}
          size="lg"
          className="min-w-[140px]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('generating')}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              {t('generate')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
