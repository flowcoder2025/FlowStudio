'use client';

/**
 * ConfirmationStep - Summary + image count + generate button
 */

import { useTranslations } from 'next-intl';
import { Sparkles, Loader2, Check, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TOOL_INFO } from '@/lib/workflow/actions/tools';
import type { ToolMode } from '@/lib/tools/types';
import type { ToolStep } from '@/lib/workflow/actions/tools';

interface ConfirmationStepProps {
  toolMode: ToolMode;
  toolSteps: ToolStep[];
  toolInputs: Record<string, unknown>;
  imageCount: number;
  onImageCountChange: (count: number) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  stepIndex: number;
  totalSteps: number;
}

export function ConfirmationStep({
  toolMode,
  toolSteps,
  toolInputs,
  imageCount,
  onImageCountChange,
  isGenerating,
  onGenerate,
  stepIndex,
  totalSteps,
}: ConfirmationStepProps) {
  const t = useTranslations();
  const info = TOOL_INFO[toolMode];

  // Check which required steps are filled
  const requiredSteps = toolSteps.filter((s) => {
    if (s.type === 'image-upload') return s.required;
    if (s.type === 'multi-image') return true;
    if (s.type === 'prompt') return true;
    if (s.type === 'canvas-mask') return true;
    return false;
  });

  const filledSteps = requiredSteps.filter((s) => {
    if (!s.key) return false;
    const val = toolInputs[s.key];
    if (s.type === 'multi-image') return Array.isArray(val) && val.length >= s.min;
    if (s.type === 'prompt') return typeof val === 'string' && val.trim().length > 0;
    return !!val;
  });

  const isValid = filledSteps.length === requiredSteps.length;

  // Summary items
  const summaryItems = toolSteps
    .filter((s): s is ToolStep & { key: string } => !!s.key && s.type !== 'confirmation' && s.type !== 'segment-loop')
    .map((s) => {
      const val = toolInputs[s.key];
      let filled = false;
      let label = s.key;

      if (s.type === 'image-upload') {
        filled = !!val;
        label = t(s.labelKey);
      } else if (s.type === 'multi-image') {
        filled = Array.isArray(val) && val.length >= s.min;
        label = t('tools.composite.uploadImages');
      } else if (s.type === 'prompt') {
        filled = typeof val === 'string' && val.trim().length > 0;
        label = t('tools.prompt.title');
      } else if (s.type === 'aspect-ratio') {
        filled = !!val;
        label = t('tools.aspectRatio.title');
      } else if (s.type === 'category-style') {
        const csVal = val as { category?: string; style?: string } | null;
        filled = !!csVal?.category && !!csVal?.style;
        label = t('tools.category.title') + ' / ' + t('tools.style.title');
      } else if (s.type === 'canvas-mask') {
        filled = !!val;
        label = t('tools.detailEdit.selectArea');
      }

      return { key: s.key, label, filled };
    });

  return (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">{t(info.titleKey)}</span>
        </div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
          {stepIndex + 1} / {totalSteps}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-4 bg-primary-100 dark:bg-primary-900/30"
        >
          {isValid ? '✨' : '📝'}
        </motion.div>

        <motion.h2
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-3"
        >
          {isValid ? t('workflow.ui.readyToGenerate') : t('workflow.ui.completeInputs')}
        </motion.h2>

        {/* Summary */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="w-full max-w-sm text-left space-y-2 mb-4"
        >
          {summaryItems.map((item) => (
            <div
              key={item.key}
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg text-sm',
                item.filled
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
              )}
            >
              {item.filled ? (
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-600 flex-shrink-0" />
              )}
              <span>{item.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Image count */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="w-full max-w-sm"
        >
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block text-left">
            <ImageIcon className="w-4 h-4 inline mr-1" />
            {t('tools.common.imageCount')}
          </label>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={() => onImageCountChange(num)}
                className={cn(
                  'w-12 h-12 rounded-lg border-2 font-semibold transition-all',
                  imageCount === num
                    ? 'border-primary-500 bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 shadow-md ring-2 ring-primary-500/20'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                )}
              >
                {num}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="p-5 md:p-6 bg-zinc-50 dark:bg-zinc-800/50">
        <Button
          onClick={onGenerate}
          disabled={!isValid || isGenerating}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              {t('tools.common.generating')}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              {t('tools.common.generate')} ({imageCount}{t('tools.common.imageCountLabel', { count: imageCount }).replace(String(imageCount), '')})
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
