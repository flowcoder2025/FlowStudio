'use client';

/**
 * ResultGrid - Generated image results grid with save/upscale/download actions
 * Used by: Edit, Poster, Composite, Detail Page pages
 */

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  Download,
  Heart,
  ZoomIn,
  ArrowUpCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { saveImageToGallery, downloadImage, upscaleImage } from '@/lib/tools/generateClient';
import type { ToolGeneratedImage, ToolGenerateResponse } from '@/lib/tools/types';
import { UpscaleModal } from './UpscaleModal';

export interface ResultGridProps {
  result: ToolGenerateResponse;
  onRegenerate?: () => void;
  className?: string;
}

export function ResultGrid({ result, onRegenerate, className }: ResultGridProps) {
  const t = useTranslations('tools');
  const [lightboxImage, setLightboxImage] = useState<ToolGeneratedImage | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [upscaleTarget, setUpscaleTarget] = useState<ToolGeneratedImage | null>(null);

  const handleSave = useCallback(
    async (image: ToolGeneratedImage) => {
      setSavingIds((prev) => new Set(prev).add(image.id));
      try {
        const res = await saveImageToGallery({
          imageUrl: image.url,
          title: 'Generated Image',
          prompt: image.prompt,
          negativePrompt: image.negativePrompt,
          provider: image.provider,
          model: image.model,
        });
        if (!res.success) {
          console.error('Save failed:', res.error);
        }
      } catch (err) {
        console.error('Save error:', err);
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(image.id);
          return next;
        });
      }
    },
    []
  );

  const handleDownload = useCallback(async (image: ToolGeneratedImage) => {
    await downloadImage(image.url, `flowstudio_${image.id}.png`);
  }, []);

  if (!result.success) {
    return (
      <div className={cn('text-center py-12', className)}>
        <p className="text-zinc-500 dark:text-zinc-400 mb-4">
          {result.error || t('common.error')}
        </p>
        {result.retryable && onRegenerate && (
          <Button variant="outline" onClick={onRegenerate}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('common.retry')}
          </Button>
        )}
      </div>
    );
  }

  if (result.images.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <p className="text-zinc-500 dark:text-zinc-400">{t('common.noResults')}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {t('result.title')}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t('result.imagesGenerated', { count: result.images.length })}
            {' • '}
            {t('common.creditsUsed', { credits: result.creditsUsed })}
          </p>
        </div>
        {onRegenerate && (
          <Button variant="outline" size="sm" onClick={onRegenerate}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('common.regenerate')}
          </Button>
        )}
      </div>

      {/* Image Grid */}
      <div
        className={cn(
          'grid gap-4',
          result.images.length === 1
            ? 'grid-cols-1 max-w-lg mx-auto'
            : result.images.length === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-2'
        )}
      >
        {result.images.map((image) => (
          <Card key={image.id} className="overflow-hidden group">
            <CardContent className="p-0 relative">
              {/* Image */}
              <div
                className="relative aspect-square cursor-pointer"
                onClick={() => setLightboxImage(image)}
              >
                <Image
                  src={image.url}
                  alt={image.prompt}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <ZoomIn className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Action Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleSave(image);
                    }}
                    disabled={savingIds.has(image.id)}
                  >
                    {savingIds.has(image.id) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Heart className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setUpscaleTarget(image);
                    }}
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleDownload(image);
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('result.title')}</DialogTitle>
          </DialogHeader>
          {lightboxImage && (
            <div className="space-y-4">
              <div className="relative aspect-square w-full">
                <Image
                  src={lightboxImage.url}
                  alt={lightboxImage.prompt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 80vw"
                />
              </div>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={() => handleSave(lightboxImage)}>
                  <Heart className="w-4 h-4 mr-2" />
                  {t('common.save')}
                </Button>
                <Button variant="outline" onClick={() => setUpscaleTarget(lightboxImage)}>
                  <ArrowUpCircle className="w-4 h-4 mr-2" />
                  {t('common.upscale')}
                </Button>
                <Button variant="outline" onClick={() => handleDownload(lightboxImage)}>
                  <Download className="w-4 h-4 mr-2" />
                  {t('common.download')}
                </Button>
              </div>
              {/* Prompt info */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">{t('result.promptUsed')}</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{lightboxImage.prompt}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upscale Modal */}
      <UpscaleModal
        image={upscaleTarget}
        onClose={() => setUpscaleTarget(null)}
      />
    </div>
  );
}
