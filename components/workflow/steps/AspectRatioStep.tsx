'use client';

/**
 * AspectRatioStep - Immersive step card wrapping AspectRatioSelector
 */

import { useTranslations } from 'next-intl';
import { RatioIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { AspectRatioSelector } from '@/components/tools/AspectRatioSelector';
import type { AspectRatio } from '@/lib/imageProvider/types';
import type { AspectRatioStep as AspectRatioStepDef } from '@/lib/workflow/actions/tools';

interface AspectRatioStepProps {
  step: AspectRatioStepDef;
  value: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
  stepIndex: number;
  totalSteps: number;
  toolTitle: string;
}

export function AspectRatioStep({
  step,
  value,
  onChange,
  stepIndex,
  totalSteps,
  toolTitle,
}: AspectRatioStepProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <RatioIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {toolTitle}
          </span>
        </div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
          {stepIndex + 1} / {totalSteps}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8">
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm"
        >
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6 text-center">
            {t('tools.aspectRatio.title')}
          </h3>

          <AspectRatioSelector
            value={value}
            onChange={onChange}
          />
        </motion.div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center">
          {t('workflow.ui.swipeToSkip')} →
        </p>
      </div>
    </div>
  );
}
