'use client';

/**
 * PromptStep - Immersive step card wrapping PromptInput
 */

import { useTranslations } from 'next-intl';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PromptInput } from '@/components/tools/PromptInput';
import type { PromptStep as PromptStepDef } from '@/lib/workflow/actions/tools';

interface PromptStepProps {
  step: PromptStepDef;
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  stepIndex: number;
  totalSteps: number;
  toolTitle: string;
}

export function PromptStep({
  step,
  value,
  onChange,
  onNext,
  stepIndex,
  totalSteps,
  toolTitle,
}: PromptStepProps) {
  const t = useTranslations();
  const tW = useTranslations('workflow');
  const hasValue = !!value.trim();

  return (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {toolTitle}
          </span>
        </div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
          {stepIndex + 1} / {totalSteps}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <PromptInput
            value={value}
            onChange={onChange}
            showTags={step.showTags}
          />
        </motion.div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <Button
          onClick={onNext}
          disabled={!hasValue}
          className="w-full h-11 text-base font-semibold"
          size="lg"
        >
          {tW('ui.next')}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
