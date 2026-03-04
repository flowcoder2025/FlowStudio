'use client';

/**
 * ImageUploadStep - Immersive step card wrapping ImageDropzone
 * Renders a single image upload area within an ImmersiveCard-style layout
 */

import { useTranslations } from 'next-intl';
import { Upload, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ImageDropzone } from '@/components/tools/ImageDropzone';
import type { ImageUploadStep as ImageUploadStepDef } from '@/lib/workflow/actions/tools';

interface ImageUploadStepProps {
  step: ImageUploadStepDef;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  onNext: () => void;
  stepIndex: number;
  totalSteps: number;
  toolTitle: string;
}

export function ImageUploadStep({
  step,
  value,
  onChange,
  onNext,
  stepIndex,
  totalSteps,
  toolTitle,
}: ImageUploadStepProps) {
  const t = useTranslations();
  const tW = useTranslations('workflow');
  const hasValue = !!value;

  return (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
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
          className="space-y-4"
        >
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              {t(step.labelKey)}
              {step.required && <span className="text-red-500 ml-1">*</span>}
            </h3>
          </div>

          <ImageDropzone
            value={value}
            onChange={onChange}
            required={step.required}
            previewAspect={step.previewAspect === 'square' ? 'square' : 'auto'}
            showGalleryPicker={true}
          />
        </motion.div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        {step.required ? (
          <Button
            onClick={onNext}
            disabled={!hasValue}
            className="w-full h-11 text-base font-semibold"
            size="lg"
          >
            {tW('ui.next')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <div className="space-y-2">
            {hasValue && (
              <Button
                onClick={onNext}
                className="w-full h-11 text-base font-semibold"
                size="lg"
              >
                {tW('ui.next')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center">
              {tW('ui.swipeToSkip')} →
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
