'use client';

/**
 * CategoryStyleStep - Two-tier category → style selection card
 */

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Palette, ArrowRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CATEGORIES, getStylesForCategory } from '@/lib/tools/constants';

interface CategoryStyleStepProps {
  /** { category: string; style: string } */
  value: { category: string; style: string } | null;
  onChange: (val: { category: string; style: string }) => void;
  onNext: () => void;
  stepIndex: number;
  totalSteps: number;
  toolTitle: string;
}

export function CategoryStyleStep({
  value,
  onChange,
  onNext,
  stepIndex,
  totalSteps,
  toolTitle,
}: CategoryStyleStepProps) {
  const t = useTranslations();
  const tW = useTranslations('workflow');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    value?.category || null
  );

  const styles = selectedCategory ? getStylesForCategory(selectedCategory) : [];
  const hasSelection = !!value?.category && !!value?.style;

  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
  }, []);

  const handleStyleSelect = useCallback(
    (styleId: string) => {
      if (!selectedCategory) return;
      onChange({ category: selectedCategory, style: styleId });
      setTimeout(() => onNext(), 300);
    },
    [selectedCategory, onChange, onNext]
  );

  const handleBack = useCallback(() => {
    setSelectedCategory(null);
  }, []);

  return (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
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
        <AnimatePresence mode="wait">
          {!selectedCategory ? (
            <motion.div
              key="categories"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                {t('tools.category.title')}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={cn(
                      'p-4 rounded-xl border-2 text-left transition-all',
                      value?.category === cat.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                    )}
                  >
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {t(cat.labelKey)}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="styles"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={handleBack}
                  className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-zinc-500" />
                </button>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {t('tools.style.title')} — {t(CATEGORIES.find((c) => c.id === selectedCategory)?.labelKey || '')}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {styles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => handleStyleSelect(style.id)}
                    className={cn(
                      'p-4 rounded-xl border-2 text-left transition-all',
                      value?.style === style.id && value?.category === selectedCategory
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-md ring-2 ring-primary-500/20'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                    )}
                  >
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {t(style.labelKey)}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        {hasSelection ? (
          <Button
            onClick={onNext}
            className="w-full h-11 text-base font-semibold"
            size="lg"
          >
            {tW('ui.next')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center">
            {tW('ui.selectToNext')}
          </p>
        )}
      </div>
    </div>
  );
}
