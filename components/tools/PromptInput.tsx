'use client';

/**
 * PromptInput - Prompt textarea with character counter and suggested tags
 * Used by: Edit, Poster, Composite, Detail Edit pages
 */

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { SUGGESTED_TAGS } from '@/lib/tools/constants';

const MAX_PROMPT_LENGTH = 4000;

export interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  /** Show suggested tags */
  showTags?: boolean;
  /** Custom placeholder override */
  placeholder?: string;
}

export function PromptInput({
  value,
  onChange,
  disabled = false,
  className,
  showTags = true,
  placeholder,
}: PromptInputProps) {
  const t = useTranslations();

  const handleTagClick = useCallback(
    (tagValue: string) => {
      if (disabled) return;
      const separator = value.trim() ? ', ' : '';
      const newValue = value + separator + tagValue;
      if (newValue.length <= MAX_PROMPT_LENGTH) {
        onChange(newValue);
      }
    },
    [value, onChange, disabled]
  );

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t('tools.prompt.title')}
        </label>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {t('tools.prompt.charCount', { count: value.length })}
        </span>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_PROMPT_LENGTH))}
        placeholder={placeholder || t('tools.prompt.placeholder')}
        disabled={disabled}
        rows={4}
        className={cn(
          'w-full px-3 py-2 rounded-lg border text-sm resize-none transition-colors',
          'border-zinc-200 dark:border-zinc-700',
          'bg-white dark:bg-zinc-800',
          'text-zinc-900 dark:text-zinc-100',
          'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />

      {/* Suggested tags */}
      {showTags && (
        <div className="space-y-1.5">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {t('tools.prompt.suggestedTags')}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_TAGS.map((tag) => (
              <button
                key={tag.value}
                type="button"
                onClick={() => handleTagClick(tag.value)}
                disabled={disabled}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                  'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
                  'hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-200',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {t(tag.labelKey)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
