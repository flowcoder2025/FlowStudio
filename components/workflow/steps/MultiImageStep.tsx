'use client';

/**
 * MultiImageStep - Multiple image upload step (drag & drop + gallery)
 * Used by COMPOSITE tool
 */

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Images, X, Upload, FolderOpen, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GalleryPicker } from '@/components/tools/GalleryPicker';
import { UPLOAD_LIMITS } from '@/lib/tools/constants';
import type { MultiImageStep as MultiImageStepDef } from '@/lib/workflow/actions/tools';

interface MultiImageStepProps {
  step: MultiImageStepDef;
  /** Array of data URLs */
  value: string[];
  onChange: (urls: string[]) => void;
  onNext: () => void;
  stepIndex: number;
  totalSteps: number;
  toolTitle: string;
}

export function MultiImageStep({
  step,
  value,
  onChange,
  onNext,
  stepIndex,
  totalSteps,
  toolTitle,
}: MultiImageStepProps) {
  const t = useTranslations();
  const tW = useTranslations('workflow');
  const [isDragging, setIsDragging] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAdd = value.length < step.max;
  const hasEnough = value.length >= step.min;

  const handleFiles = useCallback(
    (files: FileList) => {
      const remaining = step.max - value.length;
      const toProcess = Array.from(files).slice(0, remaining);

      toProcess.forEach((file) => {
        if (!(UPLOAD_LIMITS.acceptedFormats as readonly string[]).includes(file.type)) return;
        if (file.size > UPLOAD_LIMITS.maxFileSize) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          onChange([...value, dataUrl]);
        };
        reader.readAsDataURL(file);
      });
    },
    [value, onChange, step.max]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) handleFiles(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [handleFiles]
  );

  const handleRemove = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange]
  );

  const handleGalleryMultiSelect = useCallback(
    (urls: string[]) => {
      const remaining = step.max - value.length;
      onChange([...value, ...urls.slice(0, remaining)]);
      setShowGallery(false);
    },
    [value, onChange, step.max]
  );

  return (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Images className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
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
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {t('tools.composite.uploadImages')}
            </h3>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {t('tools.composite.imageCount', { count: value.length })} / {step.max}
            </span>
          </div>

          {/* Uploaded images grid */}
          {value.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {value.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemove(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload area */}
          {canAdd && (
            <div className="grid grid-cols-2 gap-3">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[100px]',
                  isDragging
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500'
                )}
              >
                <Upload className={cn('w-5 h-5 mb-1', isDragging ? 'text-blue-500' : 'text-zinc-400')} />
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  {t('tools.dropzone.dragOrClick')}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={UPLOAD_LIMITS.acceptedFormats.join(',')}
                  onChange={handleInputChange}
                  multiple
                  className="hidden"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowGallery(true)}
                className="border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[100px] border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500"
              >
                <FolderOpen className="w-5 h-5 mb-1 text-zinc-400" />
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  {t('tools.dropzone.selectFromGallery')}
                </p>
              </button>
            </div>
          )}

          {!hasEnough && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {t('tools.composite.uploadImagesDesc')} ({step.min}~{step.max})
            </p>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <Button
          onClick={onNext}
          disabled={!hasEnough}
          className="w-full h-11 text-base font-semibold"
          size="lg"
        >
          {tW('ui.next')}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Gallery Picker */}
      <GalleryPicker
        isOpen={showGallery}
        onOpenChange={setShowGallery}
        onSelect={() => {}}
        onMultiSelect={handleGalleryMultiSelect}
        maxSelectable={Math.min(step.max - value.length, 10)}
      />
    </div>
  );
}
