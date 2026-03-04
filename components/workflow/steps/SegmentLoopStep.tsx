'use client';

/**
 * SegmentLoopStep - Iterative segment generation for Detail Page workflows
 *
 * Extracts the segment loop logic from detail-page/page.tsx into an
 * immersive step component. The user repeatedly:
 *   1. Enters a prompt for the next segment
 *   2. Generates 4 candidate images (9:16)
 *   3. Selects one to add to the segment list
 *   4. Manages segments (reorder / delete / replace)
 *   5. Downloads merged image or finishes
 *
 * State is stored in toolInputs via:
 *   - 'segments': string[]           (ordered segment URLs)
 *   - 'segmentPrompt': string        (current prompt)
 *   - 'segmentHistory': HistorySession[]
 */

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  Plus,
  Trash2,
  RefreshCw,
  Download,
  Loader2,
  Clock,
  Check,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PromptInput } from '@/components/tools/PromptInput';
import { generateFromTool, saveImageToGallery } from '@/lib/tools/generateClient';
import type { ToolGeneratedImage } from '@/lib/tools/types';

// =====================================================
// Types
// =====================================================

interface HistorySession {
  id: string;
  images: ToolGeneratedImage[];
  prompt: string;
  timestamp: number;
  usedIndex?: number;
}

// View modes within the step
type SegmentView = 'compose' | 'candidates' | 'history';

// =====================================================
// Props
// =====================================================

interface SegmentLoopStepProps {
  /** Segments already added (URL array) */
  segments: string[];
  /** Update segments */
  onSegmentsChange: (segments: string[]) => void;
  /** Source (product) image for API calls */
  sourceImage: string | null;
  /** Reference image for API calls */
  refImage: string | null;
  /** Selected style */
  style: string;
  /** Current step index */
  stepIndex: number;
  /** Total steps count */
  totalSteps: number;
  /** Tool title for header */
  toolTitle: string;
}

// =====================================================
// Component
// =====================================================

export function SegmentLoopStep({
  segments,
  onSegmentsChange,
  sourceImage,
  refImage,
  style,
  stepIndex,
  totalSteps,
  toolTitle,
}: SegmentLoopStepProps) {
  const t = useTranslations();

  // Local state
  const [prompt, setPrompt] = useState('');
  const [view, setView] = useState<SegmentView>('compose');
  const [isGenerating, setIsGenerating] = useState(false);
  const [candidates, setCandidates] = useState<ToolGeneratedImage[]>([]);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [sessionHistory, setSessionHistory] = useState<HistorySession[]>([]);

  const candidateRef = useRef<HTMLDivElement>(null);

  const canGenerate = !!sourceImage && prompt.trim().length > 0 && !isGenerating;
  const promptPlaceholder =
    segments.length === 0
      ? t('tools.detailPage.introPromptHint')
      : t('tools.detailPage.sectionPromptHint');

  // =====================================================
  // Handlers
  // =====================================================

  /** Generate 4 candidates */
  const handleGenerate = useCallback(async () => {
    if (!sourceImage || !prompt.trim()) return;

    setIsGenerating(true);
    setCandidates([]);
    setView('candidates');

    try {
      const response = await generateFromTool({
        prompt: prompt.trim(),
        aspectRatio: '9:16',
        count: 4,
        mode: 'DETAIL_PAGE',
        sourceImage,
        refImages: refImage ? [refImage] : undefined,
        style: style || undefined,
      });

      if (response.success && response.images.length > 0) {
        setCandidates(response.images);

        const session: HistorySession = {
          id: `session_${Date.now()}`,
          images: response.images,
          prompt: prompt.trim(),
          timestamp: Date.now(),
        };
        setSessionHistory((prev) => [session, ...prev]);
      }
    } catch (err) {
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [sourceImage, refImage, prompt, style]);

  /** Select a candidate */
  const handleSelectCandidate = useCallback(
    async (image: ToolGeneratedImage, sessionId?: string) => {
      // Save to gallery
      try {
        await saveImageToGallery({
          imageUrl: image.url,
          prompt: image.prompt,
          provider: image.provider,
          model: image.model,
        });
      } catch {
        // continue
      }

      if (replaceIndex !== null) {
        const next = [...segments];
        next[replaceIndex] = image.url;
        onSegmentsChange(next);
        setReplaceIndex(null);
      } else {
        onSegmentsChange([...segments, image.url]);
      }

      // Mark used in history
      if (sessionId) {
        setSessionHistory((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? { ...s, usedIndex: s.images.findIndex((i) => i.id === image.id) }
              : s
          )
        );
      }

      setCandidates([]);
      setPrompt('');
      setView('compose');
    },
    [replaceIndex, segments, onSegmentsChange]
  );

  /** Remove a segment */
  const handleRemoveSegment = useCallback(
    (index: number) => {
      onSegmentsChange(segments.filter((_, i) => i !== index));
    },
    [segments, onSegmentsChange]
  );

  /** Start replacing a segment */
  const handleStartReplace = useCallback(
    (index: number) => {
      setReplaceIndex(index);
      if (sessionHistory.length > 0) {
        setView('history');
      }
    },
    [sessionHistory.length]
  );

  /** Move segment */
  const handleMoveSegment = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const next = [...segments];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return;
      [next[index], next[target]] = [next[target], next[index]];
      onSegmentsChange(next);
    },
    [segments, onSegmentsChange]
  );

  /** Merge & download */
  const handleMergeDownload = useCallback(async () => {
    if (segments.length === 0) return;

    try {
      const images = await Promise.all(
        segments.map(
          (url) =>
            new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new window.Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => resolve(img);
              img.onerror = reject;
              img.src = url;
            })
        )
      );

      const maxWidth = Math.max(...images.map((img) => img.naturalWidth));
      const totalHeight = images.reduce((sum, img) => {
        const scale = maxWidth / img.naturalWidth;
        return sum + img.naturalHeight * scale;
      }, 0);

      const canvas = document.createElement('canvas');
      canvas.width = maxWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d')!;

      let y = 0;
      for (const img of images) {
        const scale = maxWidth / img.naturalWidth;
        const h = img.naturalHeight * scale;
        ctx.drawImage(img, 0, y, maxWidth, h);
        y += h;
      }

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `detail-page-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Merge download error:', err);
    }
  }, [segments]);

  // =====================================================
  // Render
  // =====================================================

  return (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {toolTitle}
          </span>
        </div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
          {stepIndex + 1} / {totalSteps}
        </div>
      </div>

      {/* Main scrollable area */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* ============== COMPOSE VIEW ============== */}
          {view === 'compose' && (
            <motion.div
              key="compose"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="p-5 space-y-4"
            >
              {/* Segment Preview */}
              {segments.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      {t('tools.detailPage.preview')} ({segments.length})
                    </span>
                    <button
                      onClick={handleMergeDownload}
                      className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t('tools.detailPage.mergeDownload')}
                    </button>
                  </div>

                  {/* Horizontal segment thumbnails */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {segments.map((url, idx) => (
                      <div
                        key={`seg-${idx}-${url.slice(-8)}`}
                        className="relative flex-shrink-0 w-16 group"
                      >
                        <div className="relative aspect-[9/16] rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                          <Image
                            src={url}
                            alt={`Segment ${idx + 1}`}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                          {/* Badge */}
                          <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-black/60 text-white text-[9px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </div>
                        </div>
                        {/* Actions on hover */}
                        <div className="absolute -top-1 -right-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          {idx > 0 && (
                            <button
                              onClick={() => handleMoveSegment(idx, 'up')}
                              className="w-5 h-5 rounded-full bg-zinc-700 text-white flex items-center justify-center text-[10px]"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                          )}
                          {idx < segments.length - 1 && (
                            <button
                              onClick={() => handleMoveSegment(idx, 'down')}
                              className="w-5 h-5 rounded-full bg-zinc-700 text-white flex items-center justify-center text-[10px]"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          )}
                          {sessionHistory.length > 0 && (
                            <button
                              onClick={() => handleStartReplace(idx)}
                              className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveSegment(idx)}
                            className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add more indicator */}
                    <div className="flex-shrink-0 w-16 aspect-[9/16] rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-zinc-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {segments.length === 0 && (
                <div className="text-center py-6">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                    <Layers className="w-7 h-7 text-zinc-400" />
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {t('tools.detailPage.emptyPreview')}
                  </p>
                </div>
              )}

              {/* Prompt Input */}
              <div className="space-y-2">
                <PromptInput
                  value={prompt}
                  onChange={setPrompt}
                  disabled={isGenerating}
                  showTags
                  placeholder={promptPlaceholder}
                />
              </div>

              {/* Generate + History buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="flex-1 h-11"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('tools.common.generating')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {t('tools.detailPage.generateSegment')}
                    </>
                  )}
                </Button>
                {sessionHistory.length > 0 && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-11"
                    onClick={() => {
                      setReplaceIndex(null);
                      setView('history');
                    }}
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    {sessionHistory.reduce((sum, s) => sum + s.images.length, 0)}
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* ============== CANDIDATES VIEW ============== */}
          {view === 'candidates' && (
            <motion.div
              key="candidates"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              ref={candidateRef}
              className="p-5 space-y-4"
            >
              {/* Back button */}
              <button
                onClick={() => { setCandidates([]); setView('compose'); }}
                className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                <X className="w-4 h-4" />
                {t('tools.detailPage.preview')}
              </button>

              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {t('tools.common.generating')}
                  </p>
                </div>
              ) : candidates.length > 0 ? (
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      {t('tools.detailPage.candidateImages')}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {t('tools.detailPage.selectToAdd')}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {candidates.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => handleSelectCandidate(img, sessionHistory[0]?.id)}
                        className="relative group rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all"
                      >
                        <div className="aspect-[9/16]">
                          <Image
                            src={img.url}
                            alt={img.prompt}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 200px"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Check className="w-5 h-5" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </motion.div>
          )}

          {/* ============== HISTORY VIEW ============== */}
          {view === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-5 space-y-4"
            >
              {/* Back + title */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => { setView('compose'); setReplaceIndex(null); }}
                  className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                  {replaceIndex !== null
                    ? `${t('tools.detailPage.replaceSegment')} #${replaceIndex + 1}`
                    : t('tools.detailPage.history')}
                </button>
              </div>

              {sessionHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {t('tools.detailPage.historyEmpty')}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {sessionHistory.map((session) => (
                    <div key={session.id} className="space-y-2">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {session.prompt}
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {session.images.map((img, imgIdx) => (
                          <button
                            key={img.id}
                            onClick={() => handleSelectCandidate(img, session.id)}
                            className={cn(
                              'relative rounded-lg overflow-hidden border-2 transition-all',
                              session.usedIndex === imgIdx
                                ? 'border-green-500 opacity-60'
                                : 'border-transparent hover:border-blue-500'
                            )}
                          >
                            <div className="aspect-[9/16]">
                              <Image
                                src={img.url}
                                alt={img.prompt}
                                fill
                                className="object-cover"
                                sizes="80px"
                              />
                            </div>
                            {session.usedIndex === imgIdx && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <Check className="w-4 h-4 text-green-400" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer - only in compose view */}
      {view === 'compose' && segments.length > 0 && (
        <div className="px-5 pb-5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            onClick={handleMergeDownload}
            className="w-full h-11 text-base font-semibold"
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            {t('tools.detailPage.mergeDownload')} ({segments.length} {t('tools.detailPage.segment')})
          </Button>
        </div>
      )}
    </div>
  );
}
