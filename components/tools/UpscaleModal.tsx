'use client';

/**
 * UpscaleModal - Upscale result dialog
 * Used by: ResultGrid
 */

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Loader2, Download, Check, ArrowUpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { upscaleImage, downloadImage } from '@/lib/tools/generateClient';
import type { ToolGeneratedImage } from '@/lib/tools/types';
import type { UpscaleMode } from '@/lib/imageProvider/types';

const UPSCALE_MODES: { value: UpscaleMode; labelKey: string }[] = [
  { value: '2x', labelKey: 'tools.upscaleModal.mode2x' },
  { value: '4x', labelKey: 'tools.upscaleModal.mode4x' },
  { value: 'enhance', labelKey: 'tools.upscaleModal.modeEnhance' },
];

export interface UpscaleModalProps {
  image: ToolGeneratedImage | null;
  onClose: () => void;
}

export function UpscaleModal({ image, onClose }: UpscaleModalProps) {
  const t = useTranslations();
  const [selectedMode, setSelectedMode] = useState<UpscaleMode>('2x');
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpscale = useCallback(async () => {
    if (!image) return;
    setIsUpscaling(true);
    setError(null);

    try {
      const result = await upscaleImage({
        imageUrl: image.url,
        mode: selectedMode,
      });
      if (result.success && result.url) {
        setUpscaledUrl(result.url);
      } else {
        setError(result.error || 'Upscale failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upscale failed');
    } finally {
      setIsUpscaling(false);
    }
  }, [image, selectedMode]);

  const handleDownload = useCallback(async () => {
    if (upscaledUrl) {
      await downloadImage(upscaledUrl, `flowstudio_upscaled_${image?.id}.png`);
    }
  }, [upscaledUrl, image]);

  const handleClose = useCallback(() => {
    setUpscaledUrl(null);
    setError(null);
    setSelectedMode('2x');
    onClose();
  }, [onClose]);

  return (
    <Dialog open={!!image} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('tools.upscaleModal.title')}</DialogTitle>
        </DialogHeader>

        {image && (
          <div className="space-y-4">
            {/* Preview */}
            <div className="relative aspect-square w-full max-h-[300px] bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
              <Image
                src={upscaledUrl || image.url}
                alt="Upscale preview"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 500px"
              />
              {upscaledUrl && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {t('tools.common.upscaleComplete')}
                </div>
              )}
            </div>

            {/* Mode Selection */}
            {!upscaledUrl && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t('tools.upscaleModal.selectMode')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {UPSCALE_MODES.map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setSelectedMode(mode.value)}
                      disabled={isUpscaling}
                      className={cn(
                        'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                        selectedMode === mode.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300',
                        isUpscaling && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {t(mode.labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                {t('tools.common.close')}
              </Button>
              {upscaledUrl ? (
                <Button onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  {t('tools.common.download')}
                </Button>
              ) : (
                <Button onClick={handleUpscale} disabled={isUpscaling}>
                  {isUpscaling ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('tools.common.upscaling')}
                    </>
                  ) : (
                    <>
                      <ArrowUpCircle className="w-4 h-4 mr-2" />
                      {t('tools.common.upscale')}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
