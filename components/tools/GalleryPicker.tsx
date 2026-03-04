'use client';

/**
 * GalleryPicker - Dialog for selecting images from gallery
 * Used by: ImageDropzone, MultiImageUpload
 */

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, AlertCircle, Image as ImageIcon, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import useSWR from 'swr';
import type { ImageListItem } from '@/lib/images/list';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface GalleryPickerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** For single select mode, returns the URL string */
  onSelect: (imageUrl: string) => void;
  /** For multi-select mode, returns array of URLs */
  onMultiSelect?: (imageUrls: string[]) => void;
  maxSelectable?: number;
}

export function GalleryPicker({
  isOpen,
  onOpenChange,
  onSelect,
  onMultiSelect,
  maxSelectable = 1,
}: GalleryPickerProps) {
  const t = useTranslations('tools.galleryPicker');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useSWR<{
    success: boolean;
    images: ImageListItem[];
    total: number;
  }>(
    isOpen ? '/api/images/list?limit=50&sortBy=createdAt&sortOrder=desc' : null,
    fetcher
  );

  const images = data?.images || [];

  const toggleSelect = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else if (newSet.size < maxSelectable) {
          newSet.add(id);
        }
        return newSet;
      });
    },
    [maxSelectable]
  );

  const handleConfirm = useCallback(() => {
    const selectedImages = images.filter((img) => selectedIds.has(img.id));
    const urls = selectedImages.map((img) => img.imageUrl || '').filter(Boolean);

    if (onMultiSelect && maxSelectable > 1) {
      onMultiSelect(urls);
    } else if (urls.length > 0) {
      onSelect(urls[0]);
    }

    setSelectedIds(new Set());
    onOpenChange(false);
  }, [images, selectedIds, onSelect, onMultiSelect, maxSelectable, onOpenChange]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) setSelectedIds(new Set());
      onOpenChange(open);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{t('title')}</DialogTitle>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('description')}</p>
        </DialogHeader>

        {/* Selection status */}
        <div className="flex items-center justify-between px-1 py-2 border-b border-zinc-100 dark:border-zinc-800">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {t('selected', { count: selectedIds.size })}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {t('maxSelect', { count: maxSelectable })}
          </span>
        </div>

        {/* Image grid */}
        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : error || !data?.success ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p>{t('error')}</p>
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
              <ImageIcon className="w-12 h-12 mb-2" />
              <p>{t('empty')}</p>
              <p className="text-sm mt-1">{t('emptyDesc')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-1">
              {images.map((img) => {
                const isSelected = selectedIds.has(img.id);
                const canSelect = isSelected || selectedIds.size < maxSelectable;
                return (
                  <button
                    key={img.id}
                    onClick={() => toggleSelect(img.id)}
                    disabled={!canSelect && !isSelected}
                    className={cn(
                      'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/30'
                        : canSelect
                        ? 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-600'
                        : 'border-transparent opacity-50 cursor-not-allowed'
                    )}
                  >
                    <img
                      src={img.thumbnailUrl || img.imageUrl || ''}
                      alt={img.title || 'Gallery image'}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
            {t('confirm')} {selectedIds.size > 0 && `(${selectedIds.size})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
